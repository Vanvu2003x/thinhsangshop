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
  eraseCookie("adminToken");
  eraseCookie("clientToken");
};

type NormalizedAdminSessionUser = (Record<string, unknown> & {
  role?: string;
  balance: number;
}) | null;

const normalizeAdminSessionUser = (user: Record<string, unknown> | null): NormalizedAdminSessionUser => {
  if (!user) return user;
  return {
    ...user,
    balance: 1000000,
  };
};

type AdminWritableEntity = Record<string, unknown> & { id?: string };
type AdminCustomer = {
  id: string;
  level?: number;
  balance?: number;
  status?: string;
};
type AccountInfoPayload = Record<string, unknown>;
type AdminGame = {
  id: string;
  name: string;
  gamecode: string;
  thumbnail?: string;
  status?: string;
  api_source?: string;
  api_id?: string;
  origin_markup_percent?: number;
  [key: string]: unknown;
};
type AdminPackage = {
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

const appendFormValue = (formData: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null) return;
  if (value instanceof File) {
    formData.append(key, value);
    return;
  }
  if (typeof value === "boolean") {
    formData.append(key, value ? "true" : "false");
    return;
  }
  formData.append(key, String(value));
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
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Yêu cầu thất bại");
  }

  if (response.status === 204) return null;
  return response.json().catch(() => null);
};

const fetchAdminProfile = async () => {
  const data = await fetchJson(`${API_URL}/users`, {
    method: "GET",
    headers: {},
  });

  const user = normalizeAdminSessionUser(data?.user || null);
  if (!user || user.role !== "admin") {
    eraseCookie("adminUser");
    throw new Error("Tài khoản của bạn không có quyền truy cập trang quản trị!");
  }

  setCookie("adminUser", JSON.stringify(user));
  setCookie("clientUser", JSON.stringify(user));
  return user;
};

export const adminApi = {
  login: async (email: string, password: string) => {
    await fetchJson(`${API_URL}/users/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    clearLegacyAuthCookies();
    const user = await fetchAdminProfile();
    return { success: true, user };
  },

  checkAuth: () => {
    if (!isBrowser) return null;
    const user = getCookie("adminUser");
    if (!user) return null;
    try {
      return normalizeAdminSessionUser(JSON.parse(user));
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
      // Ignore logout failures and clear local cache anyway.
    }

    clearLegacyAuthCookies();
    eraseCookie("adminUser");
    eraseCookie("clientUser");
  },

  getGames: async (): Promise<AdminGame[]> => {
    const res = await fetch(`${API_URL}/games`, { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json();
    return pickArray<AdminGame>(data);
  },

  saveGame: async (game: AdminWritableEntity) => {
    const formData = new FormData();
    const file = game.thumbnailFile;
    const gameInfo = { ...game };
    delete gameInfo.thumbnailFile;

    formData.append("info", JSON.stringify(gameInfo));
    if (file instanceof File) {
      formData.append("thumbnail", file);
    }

    const url = game.id ? `${API_URL}/games/update?id=${encodeURIComponent(String(game.id))}` : `${API_URL}/games/upload`;
    const method = game.id ? "PATCH" : "POST";
    return fetchJson(url, {
      method,
      body: formData,
    });
  },

  deleteGame: async (id: string) => {
    return fetchJson(`${API_URL}/games/delete?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {},
    });
  },

  getPackages: async (): Promise<AdminPackage[]> => {
    const res = await fetch(`${API_URL}/toup-package`, { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json();
    return pickArray<AdminPackage>(data);
  },

  savePackage: async (pkg: AdminWritableEntity) => {
    const formData = new FormData();
    const file = pkg.thumbnailFile;

    Object.entries(pkg).forEach(([key, value]) => {
      if (key === "thumbnailFile") return;
      appendFormValue(formData, key, value);
    });

    if (file instanceof File) {
      formData.append("thumbnail", file);
    }

    const url = pkg.id ? `${API_URL}/toup-package?id=${encodeURIComponent(String(pkg.id))}` : `${API_URL}/toup-package`;
    const method = pkg.id ? "PUT" : "POST";
    return fetchJson(url, {
      method,
      body: formData,
    });
  },

  deletePackage: async (id: string) => {
    return fetchJson(`${API_URL}/toup-package/${id}`, {
      method: "DELETE",
      headers: {},
    });
  },

  getOrders: async () => {
    const data = await fetchJson(`${API_URL}/order`, {
      method: "GET",
      headers: {},
    });
    return pickArray(data, ["orders", "data"]);
  },

  updateOrderStatus: async (id: number, status: string) => {
    if (status === "success") {
      return fetchJson(`${API_URL}/order/${id}/complete`, {
        method: "POST",
        headers: {},
      });
    }

    if (status === "cancelled") {
      return fetchJson(`${API_URL}/order/cancel-refund/${id}`, {
        method: "POST",
        headers: {},
      });
    }

    return fetchJson(`${API_URL}/order/change-status/${id}`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  },

  getWalletLogs: async () => {
    const data = await fetchJson(`${API_URL}/toup-wallet-log`, {
      method: "GET",
      headers: {},
    });
    return pickArray(data);
  },

  getRevenueDashboard: async () => {
    const data = await fetchJson(`${API_URL}/statistics/revenue/dashboard`, {
      method: "GET",
      headers: {},
    });
    return data?.data || data;
  },

  getRevenueByPeriod: async (period: "daily" | "weekly" | "monthly" = "daily") => {
    const data = await fetchJson(`${API_URL}/statistics/revenue/by-period?period=${encodeURIComponent(period)}`, {
      method: "GET",
      headers: {},
    });
    return pickArray(data, ["data"]);
  },

  approveWalletLog: async (id: string, approve: boolean) => {
    return fetchJson(`${API_URL}/toup-wallet-log/manual-charge?id=${encodeURIComponent(id)}`, {
      method: "POST",
      body: JSON.stringify({ newStatus: approve ? "Thành Công" : "Đã Hủy" }),
    });
  },

  getCustomers: async () => {
    const data = await fetchJson(`${API_URL}/users/all`, {
      method: "GET",
      headers: {},
    });
    return pickArray(data, ["data", "users"]);
  },

  updateCustomer: async (customer: AdminCustomer) => {
    const original = await fetchJson(`${API_URL}/users/get-user?user_id=${encodeURIComponent(customer.id)}`, {
      method: "GET",
      headers: {},
    });

    if (!original?.id) {
      throw new Error("Không tìm thấy khách hàng");
    }

    if (Number(customer.level) !== Number(original.level)) {
      await fetchJson(`${API_URL}/users/${customer.id}/level`, {
        method: "PUT",
        body: JSON.stringify({ level: Number(customer.level) }),
      });
    }

    if ((customer.status || "active") !== (original.status || "active")) {
      await fetchJson(`${API_URL}/users/${customer.id}/toggle-lock`, {
        method: "PATCH",
        headers: {},
      });
    }

    const originalBalance = Number(original.balance || 0);
    const nextBalance = Number(customer.balance || 0);
    if (nextBalance !== originalBalance) {
      const delta = Math.abs(nextBalance - originalBalance);
      await fetchJson(`${API_URL}/users/balance`, {
        method: "PUT",
        body: JSON.stringify({
          userId: customer.id,
          amount: delta,
          type: nextBalance > originalBalance ? "credit" : "debit",
        }),
      });
    }

    return { success: true };
  },

  getAccounts: async (gameId: string) => {
    const data = await fetchJson(`${API_URL}/acc/game?game_id=${encodeURIComponent(gameId)}`, {
      method: "GET",
      headers: {},
    });
    return data || { total: 0, data: { data: [] } };
  },

  saveAccount: async (formData: FormData, id?: string) => {
    const url = id ? `${API_URL}/acc/${id}` : `${API_URL}/acc`;
    const method = id ? "PUT" : "POST";
    return fetchJson(url, {
      method,
      body: formData,
      headers: {},
    });
  },

  deleteAccount: async (id: string) => {
    return fetchJson(`${API_URL}/acc/${id}`, {
      method: "DELETE",
      headers: {},
    });
  },

  getAccountOrders: async () => {
    const data = await fetchJson(`${API_URL}/accOrder`, {
      method: "GET",
      headers: {},
    });
    return pickArray(data);
  },

  sendAccountInfo: async (orderId: string, accInfo: AccountInfoPayload) => {
    const data = await fetchJson(`${API_URL}/accOrder/${orderId}/send`, {
      method: "PUT",
      body: JSON.stringify(accInfo),
    });
    return data?.data || data;
  },

  cancelAccountOrder: async (orderId: string) => {
    const data = await fetchJson(`${API_URL}/accOrder/${orderId}/cancel`, {
      method: "PUT",
      headers: {},
    });
    return data?.data || data;
  },
};
