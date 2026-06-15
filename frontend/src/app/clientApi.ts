const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api";

const isBrowser = typeof window !== "undefined";

const setCookie = (name: string, value: string, days = 7) => {
  if (!isBrowser) return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  if (!isBrowser) return null;
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i += 1) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      } catch {
        return c.substring(nameEQ.length, c.length);
      }
    }
  }
  return null;
};

const eraseCookie = (name: string) => {
  if (!isBrowser) return;
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
};

const clearLegacyAuthCookies = () => {
  eraseCookie("clientToken");
  eraseCookie("adminToken");
};

const normalizeSessionUser = (user: any) => {
  if (!user) return user;
  if (user.role === "admin") {
    return {
      ...user,
      balance: 1000000,
    };
  }
  return user;
};

type ApiGamePackage = {
  id: string;
  game_id: string;
  package_name: string;
  package_type?: string;
  price?: number;
  price_basic?: number;
  price_pro?: number;
  price_plus?: number;
  api_id?: string;
  api_price?: number;
  thumbnail?: string;
  status?: string;
  [key: string]: unknown;
};

type AccountInfoPayload = Record<string, unknown>;
type ApiGame = {
  id: string;
  name: string;
  gamecode: string;
  thumbnail?: string;
  status?: string;
  api_source?: string;
  api_id?: string;
  origin_markup_percent?: number;
  sort_order?: number;
  [key: string]: unknown;
};

const pickArray = <T = unknown>(data: unknown, keys: string[] = ["data"]): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    for (const key of keys) {
      const candidate = (data as Record<string, unknown>)[key];
      if (Array.isArray(candidate)) {
        return candidate as T[];
      }
    }
  }
  return [] as T[];
};

const fetchJson = async (input: string, init: RequestInit = {}) => {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const error = new Error(errData.message || "Yêu cầu thất bại");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json().catch(() => null);
};

const fetchProfile = async () => {
  const data = await fetchJson(`${API_URL}/users`, {
    method: "GET",
    headers: {},
  });

  const user = normalizeSessionUser(data?.user || null);

  if (isBrowser && user) {
    setCookie("clientUser", JSON.stringify(user));
    if (user.role === "admin") {
      setCookie("adminUser", JSON.stringify(user));
    }
  }

  return user;
};

export const clientApi = {
  login: async (email: string, password: string) => {
    await fetchJson(`${API_URL}/users/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    clearLegacyAuthCookies();
    const user = await fetchProfile();
    return { success: true, user };
  },

  register: async (name: string, email: string, password: string) => {
    await fetchJson(`${API_URL}/users/register`, {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    return { success: true };
  },

  checkAuth: () => {
    if (!isBrowser) return null;
    const user = getCookie("clientUser");
    if (!user) return null;

    try {
      return normalizeSessionUser(JSON.parse(user));
    } catch {
      return null;
    }
  },

  logout: async () => {
    try {
      await fetchJson(`${API_URL}/users/logout`, {
        method: "POST",
        headers: {},
      });
    } catch {
      // Clear local user cache even if the server cookie is already gone.
    }

    clearLegacyAuthCookies();
    eraseCookie("clientUser");
    eraseCookie("adminUser");
  },

  getProfile: async () => fetchProfile(),

  getGames: async (): Promise<ApiGame[]> => {
    const res = await fetch(`${API_URL}/games`, { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json();
    return pickArray<ApiGame>(data);
  },

  getPackagesByGameId: async (gameId: string): Promise<ApiGamePackage[]> => {
    const res = await fetch(`${API_URL}/toup-package?game_id=${gameId}`, { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json();
    return pickArray<ApiGamePackage>(data).filter((p) => p.game_id === gameId);
  },

  createOrder: async (packageId: string, quantity: number, accountInfo: AccountInfoPayload) => {
    const data = await fetchJson(`${API_URL}/order`, {
      method: "POST",
      body: JSON.stringify({
        package_id: packageId,
        quantity,
        account_info: accountInfo,
      }),
    });

    return {
      success: true,
      message: "Tạo đơn hàng thành công!",
      order: data,
    };
  },

  getOrdersHistory: async () => {
    const endpoints = [`${API_URL}/order/history`, `${API_URL}/order/my-orders`, `${API_URL}/order/user`];

    for (const endpoint of endpoints) {
      try {
        const data = await fetchJson(endpoint, {
          method: "GET",
          headers: {},
        });
        return pickArray(data, ["orders", "data"]);
      } catch (error) {
        const status = typeof error === "object" && error && "status" in error ? (error as { status?: number }).status : undefined;
        if (status !== 404) {
          throw error;
        }
      }
    }

    return [];
  },

  submitWalletLog: async (amount: number, type: string, description: string) => {
    return fetchJson(`${API_URL}/toup-wallet-log`, {
      method: "POST",
      body: JSON.stringify({ amount, type, description }),
    });
  },

  getWalletLogs: async () => {
    const data = await fetchJson(`${API_URL}/toup-wallet-log/user-logs`, {
      method: "GET",
      headers: {},
    });
    return pickArray(data);
  },

  getAllAcc: async (game_id: string, keyword?: string, min?: number, max?: number, page = 1, limit = 10) => {
    let url = `${API_URL}/acc/game?game_id=${game_id}&page=${page}&limit=${limit}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    if (min !== undefined) url += `&min=${min}`;
    if (max !== undefined) url += `&max=${max}`;

    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      return { total: 0, data: { data: [] } };
    }
    return res.json();
  },

  buyAccount: async (orderInfo: { acc_id: string; contact_info: { phone: string; zalo: string; email: string } }) => {
    return fetchJson(`${API_URL}/accOrder`, {
      method: "POST",
      body: JSON.stringify(orderInfo),
    });
  },

  getMyAccountOrders: async () => {
    const data = await fetchJson(`${API_URL}/accOrder/my-orders`, {
      method: "GET",
      headers: {},
    });
    return pickArray(data);
  },
};
