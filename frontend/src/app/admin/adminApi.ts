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

type AdminWritableEntity = Record<string, unknown> & { id?: string };
type AdminCustomer = {
  id: string;
  level?: number;
  balance?: number;
  status?: string;
};
type AccountInfoPayload = Record<string, unknown>;

const pickArray = (data: unknown, keys: string[] = ["data"]): any[] => {
  if (Array.isArray(data)) return data as any[];
  if (data && typeof data === "object") {
    for (const key of keys) {
      const candidate = (data as Record<string, unknown>)[key];
      if (Array.isArray(candidate)) {
        return candidate as any[];
      }
    }
  }
  return [];
};

const fetchJson = async (input: string, init: RequestInit = {}) => {
  const token = isBrowser ? (getCookie("adminToken") || getCookie("clientToken")) : null;
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "YÃªu cáº§u tháº¥t báº¡i");
  }

  if (response.status === 204) return null;
  return response.json().catch(() => null);
};

const fetchAdminProfile = async () => {
  const data = await fetchJson(`${API_URL}/users`, {
    method: "GET",
    headers: {},
  });

  const user = data?.user || null;
  if (!user || user.role !== "admin") {
    eraseCookie("adminUser");
    throw new Error("TÃ i khoáº£n cá»§a báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p trang quáº£n trá»‹!");
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

    const user = await fetchAdminProfile();
    return { success: true, user };
  },

  checkAuth: () => {
    if (!isBrowser) return null;
    const user = getCookie("adminUser");
    if (!user) return null;
    try {
      return JSON.parse(user);
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

    eraseCookie("adminUser");
    eraseCookie("clientUser");
  },

  getGames: async () => {
    const res = await fetch(`${API_URL}/games`, { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json();
    return pickArray(data);
  },

  saveGame: async (game: AdminWritableEntity) => {
    const url = game.id ? `${API_URL}/games/${game.id}` : `${API_URL}/games`;
    const method = game.id ? "PUT" : "POST";
    return fetchJson(url, {
      method,
      body: JSON.stringify(game),
    });
  },

  deleteGame: async (id: string) => {
    return fetchJson(`${API_URL}/games/${id}`, {
      method: "DELETE",
      headers: {},
    });
  },

  getPackages: async () => {
    const res = await fetch(`${API_URL}/toup-package`, { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json();
    return pickArray(data);
  },

  savePackage: async (pkg: AdminWritableEntity) => {
    const url = pkg.id ? `${API_URL}/toup-package/${pkg.id}` : `${API_URL}/toup-package`;
    const method = pkg.id ? "PUT" : "POST";
    return fetchJson(url, {
      method,
      body: JSON.stringify(pkg),
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

  approveWalletLog: async (id: string, approve: boolean) => {
    return fetchJson(`${API_URL}/toup-wallet-log/manual-charge?id=${encodeURIComponent(id)}`, {
      method: "POST",
      body: JSON.stringify({ newStatus: approve ? "ThÃ nh CÃ´ng" : "ÄÃ£ Há»§y" }),
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
      throw new Error("KhÃ´ng tÃ¬m tháº¥y khÃ¡ch hÃ ng");
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
