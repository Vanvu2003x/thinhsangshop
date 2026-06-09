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

export const adminApi = {
  // Authentication
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token && isBrowser) {
        setCookie('adminToken', data.token);
      }
      
      // Fetch profile immediately to store clean adminUser details in cookies
      let user = data.user || data;
      if (data.token) {
        const profileRes = await fetch(`${API_URL}/users`, {
          headers: { 'Authorization': `Bearer ${data.token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          user = profileData.user;
          if (isBrowser && user) {
            setCookie('adminUser', JSON.stringify(user));
            setCookie('clientToken', data.token);
            setCookie('clientUser', JSON.stringify(user));
          }
        }
      }
      return data;
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Sai tài khoản hoặc mật khẩu!");
  },

  checkAuth: () => {
    if (!isBrowser) return null;
    const token = getCookie('adminToken');
    const user = getCookie('adminUser');
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
      eraseCookie('adminToken');
      eraseCookie('adminUser');
      eraseCookie('clientToken');
      eraseCookie('clientUser');
    }
  },

  // Games
  getGames: async () => {
    const res = await fetch(`${API_URL}/games`);
    if (res.ok) {
      const data = await res.json();
      return data.data || data;
    }
    return [];
  },

  saveGame: async (game: any) => {
    const token = isBrowser ? getCookie('adminToken') : null;
    const url = game.id ? `${API_URL}/games/${game.id}` : `${API_URL}/games`;
    const method = game.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(game)
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Lưu game thất bại!");
  },

  deleteGame: async (id: string) => {
    const token = isBrowser ? getCookie('adminToken') : null;
    const res = await fetch(`${API_URL}/games/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error("Xóa game thất bại!");
  },

  // Packages
  getPackages: async () => {
    const res = await fetch(`${API_URL}/toup-package`);
    if (res.ok) {
      const data = await res.json();
      return data.data || data;
    }
    return [];
  },

  savePackage: async (pkg: any) => {
    const token = isBrowser ? getCookie('adminToken') : null;
    const url = pkg.id ? `${API_URL}/toup-package/${pkg.id}` : `${API_URL}/toup-package`;
    const method = pkg.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(pkg)
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Lưu gói nạp thất bại!");
  },

  deletePackage: async (id: string) => {
    const token = isBrowser ? getCookie('adminToken') : null;
    const res = await fetch(`${API_URL}/toup-package/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error("Xóa gói nạp thất bại!");
  },

  // Orders
  getOrders: async () => {
    const token = isBrowser ? getCookie('adminToken') : null;
    const res = await fetch(`${API_URL}/order`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      return data.orders || data;
    }
    return [];
  },

  updateOrderStatus: async (id: number, status: string) => {
    const token = isBrowser ? getCookie('adminToken') : null;
    const res = await fetch(`${API_URL}/order/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error("Cập nhật trạng thái đơn thất bại!");
  },

  // Wallet Logs (Deposits)
  getWalletLogs: async () => {
    const token = isBrowser ? getCookie('adminToken') : null;
    const res = await fetch(`${API_URL}/toup-wallet-log`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      return data.data || data;
    }
    return [];
  },

  approveWalletLog: async (id: string, approve: boolean) => {
    const token = isBrowser ? getCookie('adminToken') : null;
    const res = await fetch(`${API_URL}/toup-wallet-log/${id}/approve`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ approve })
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error("Phê duyệt nạp tiền thất bại!");
  },

  // Customers
  getCustomers: async () => {
    const token = isBrowser ? getCookie('adminToken') : null;
    const res = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      return data.users || data;
    }
    return [];
  },

  updateCustomer: async (customer: any) => {
    const token = isBrowser ? getCookie('adminToken') : null;
    const res = await fetch(`${API_URL}/users/${customer.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(customer)
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error("Cập nhật thông tin khách hàng thất bại!");
  },

  // Accounts
  getAccounts: async (gameId: string) => {
    const token = isBrowser ? getCookie('adminToken') : null;
    const res = await fetch(`${API_URL}/acc/game?game_id=${gameId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.json();
    }
    return { total: 0, data: { data: [] } };
  },

  saveAccount: async (formData: FormData, id?: string) => {
    const token = isBrowser ? getCookie('adminToken') : null;
    const url = id ? `${API_URL}/acc/${id}` : `${API_URL}/acc`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error("Lưu tài khoản game thất bại!");
  },

  deleteAccount: async (id: string) => {
    const token = isBrowser ? getCookie('adminToken') : null;
    const res = await fetch(`${API_URL}/acc/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error("Xóa tài khoản game thất bại!");
  },

  getAccountOrders: async () => {
    const token = isBrowser ? getCookie('adminToken') : null;
    const res = await fetch(`${API_URL}/accOrder`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const responseData = await res.json();
      return responseData.data || responseData;
    }
    return [];
  },

  sendAccountInfo: async (orderId: string, accInfo: any) => {
    const token = isBrowser ? getCookie('adminToken') : null;
    const res = await fetch(`${API_URL}/accOrder/${orderId}/send`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(accInfo)
    });
    if (res.ok) {
      const data = await res.json();
      return data.data || data;
    }
    throw new Error("Gửi thông tin nick thất bại!");
  },

  cancelAccountOrder: async (orderId: string) => {
    const token = isBrowser ? getCookie('adminToken') : null;
    const res = await fetch(`${API_URL}/accOrder/${orderId}/cancel`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      return data.data || data;
    }
    throw new Error("Hủy đơn mua acc thất bại!");
  }
};
