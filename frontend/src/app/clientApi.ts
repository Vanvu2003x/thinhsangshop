const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

const isBrowser = typeof window !== 'undefined';

const setCookie = (name: string, value: string, days = 7) => {
  if (!isBrowser) return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  if (!isBrowser) return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      } catch (e) {
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

export const clientApi = {
  // Client authentication
  login: async (email: string, password: any) => {
    const res = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      const data = await res.json();
      if (isBrowser) {
        setCookie('clientToken', data.token);
      }
      
      // Fetch user profile immediately to store in cookies
      const profileRes = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      let user = null;
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        user = profileData.user;
        if (isBrowser && user) {
          setCookie('clientUser', JSON.stringify(user));
          if (user.role === 'admin') {
            setCookie('adminToken', data.token);
            setCookie('adminUser', JSON.stringify(user));
          }
        }
      }
      return { success: true, user };
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Tài khoản hoặc mật khẩu không chính xác!");
  },

  register: async (name: string, email: string, password: any) => {
    const res = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    if (res.ok) {
      return { success: true };
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Đăng ký tài khoản thất bại. Email có thể đã được sử dụng!");
  },

  checkAuth: () => {
    if (!isBrowser) return null;
    const token = getCookie('clientToken');
    const user = getCookie('clientUser');
    if (token && user) {
      try {
        return JSON.parse(user);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  logout: () => {
    if (isBrowser) {
      eraseCookie('clientToken');
      eraseCookie('clientUser');
      eraseCookie('adminToken');
      eraseCookie('adminUser');
    }
  },

  getProfile: async () => {
    const token = isBrowser ? getCookie('clientToken') : null;
    if (!token) return null;
    const res = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (isBrowser && data.user) {
        setCookie('clientUser', JSON.stringify(data.user));
      }
      return data.user;
    }
    throw new Error("Không thể tải thông tin hồ sơ của bạn.");
  },

  // Game details
  getGames: async () => {
    const res = await fetch(`${API_URL}/games`);
    if (res.ok) {
      const data = await res.json();
      return data.data || data;
    }
    return [];
  },

  getPackagesByGameId: async (gameId: string) => {
    const res = await fetch(`${API_URL}/toup-package?game_id=${gameId}`);
    if (res.ok) {
      const data = await res.json();
      return (data.data || data).filter((p: any) => p.game_id === gameId);
    }
    return [];
  },

  // Orders
  createOrder: async (packageId: string, quantity: number, accountInfo: any) => {
    const token = isBrowser ? getCookie('clientToken') : null;
    const res = await fetch(`${API_URL}/order`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        package_id: packageId,
        quantity,
        account_info: accountInfo
      })
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: "Tạo đơn hàng thành công!",
        order: data
      };
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Giao dịch thất bại");
  },

  getOrdersHistory: async () => {
    const token = isBrowser ? getCookie('clientToken') : null;
    const res = await fetch(`${API_URL}/order/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      return data.orders || data;
    }
    return [];
  },

  // Deposit wallet logs (ATM bank / Card)
  submitWalletLog: async (amount: number, type: string, description: string) => {
    const token = isBrowser ? getCookie('clientToken') : null;
    const res = await fetch(`${API_URL}/toup-wallet-log`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount, type, description })
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Gửi yêu cầu nạp ví thất bại");
  },

  getWalletLogs: async () => {
    const token = isBrowser ? getCookie('clientToken') : null;
    const res = await fetch(`${API_URL}/toup-wallet-log/user-logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      return data.data || data;
    }
    return [];
  },

  // Client Accounts
  getAllAcc: async (game_id: string, keyword?: string, min?: number, max?: number, page = 1, limit = 10) => {
    let url = `${API_URL}/acc/game?game_id=${game_id}&page=${page}&limit=${limit}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    if (min !== undefined) url += `&min=${min}`;
    if (max !== undefined) url += `&max=${max}`;

    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
    return { total: 0, data: { data: [] } };
  },

  buyAccount: async (orderInfo: { acc_id: string; contact_info: { phone: string; zalo: string; email: string } }) => {
    const token = isBrowser ? getCookie('clientToken') : null;
    const res = await fetch(`${API_URL}/accOrder`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderInfo)
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Mua tài khoản thất bại");
  },

  getMyAccountOrders: async () => {
    const token = isBrowser ? getCookie('clientToken') : null;
    const res = await fetch(`${API_URL}/accOrder/my-orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const responseData = await res.json();
      return responseData.data || responseData;
    }
    return [];
  }
};
