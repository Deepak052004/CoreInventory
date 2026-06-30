import axios from 'axios';

// ─── Axios Instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Required for HttpOnly refresh token cookie
});

// ─── Token Storage Helpers ─────────────────────────────────────────────────────
export const tokenStorage = {
  get: () => localStorage.getItem('accessToken') || localStorage.getItem('token'),
  set: (token) => {
    localStorage.setItem('accessToken', token);
    localStorage.removeItem('token'); // Migrate old 'token' key
  },
  clear: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// ─── Request Interceptor: Attach Access Token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response Interceptor: Auto Refresh Token on 401 ──────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // If 401 and it's a TOKEN_EXPIRED error, try to refresh
    const isTokenExpired =
      err.response?.status === 401 &&
      (err.response?.data?.code === 'TOKEN_EXPIRED' || err.response?.data?.message?.includes('expired'));

    // Avoid infinite loops: don't retry refresh-token or login endpoints
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/refresh-token') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest._retry;

    if (isTokenExpired && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue this request while refresh is in flight
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((refreshErr) => Promise.reject(refreshErr));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token is sent automatically via HttpOnly cookie
        const { data } = await api.post('/auth/refresh-token');

        if (data.accessToken) {
          tokenStorage.set(data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          processQueue(null, data.accessToken);
          return api(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Refresh failed — force logout
        tokenStorage.clear();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Hard 401 (not expiry) — clear storage and redirect
    if (err.response?.status === 401 && !isAuthEndpoint) {
      tokenStorage.clear();
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

// ─── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: (refreshToken) => api.post('/auth/logout', refreshToken ? { refreshToken } : {}),
  refreshToken: () => api.post('/auth/refresh-token'),
  verifyEmail: ({ token, email }) => api.get(`/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Dashboard API ─────────────────────────────────────────────────────────────
export const dashboardApi = {
  getKpis: () => api.get('/dashboard/kpis'),
  getInventoryDistribution: () => api.get('/dashboard/inventory-distribution'),
  getCategoryStats: () => api.get('/dashboard/category-stats'),
  getStockMovement: (days) => api.get('/dashboard/stock-movement', { params: { days } }),
  getFilters: () => api.get('/dashboard/filters'),
  getTopSellingItems: (days) => api.get('/dashboard/top-selling', { params: { days } }),
  getLowStockAlerts: () => api.get('/dashboard/low-stock'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
};

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  uploadLogo: (formData) => api.post('/settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ─── Products API ──────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  importCSV: (formData) => api.post('/products/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ─── Categories API ────────────────────────────────────────────────────────────
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getTree: () => api.get('/categories/tree'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ─── Warehouses API ────────────────────────────────────────────────────────────
export const warehousesApi = {
  getAll: (params) => api.get('/warehouses', { params }),
  getOne: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`),
};

export const suppliersApi = {
  getAll: (params) => api.get('/suppliers', { params }),
  getOne: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

export const customersApi = {
  getAll: (params) => api.get('/customers', { params }),
  getOne: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const purchaseOrdersApi = {
  getAll: (params) => api.get('/purchase-orders', { params }),
  getOne: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  update: (id, data) => api.put(`/purchase-orders/${id}`, data),
  approve: (id) => api.patch(`/purchase-orders/${id}/approve`),
  cancel: (id) => api.patch(`/purchase-orders/${id}/cancel`),
};

export const salesOrdersApi = {
  getAll: (params) => api.get('/sales-orders', { params }),
  getOne: (id) => api.get(`/sales-orders/${id}`),
  create: (data) => api.post('/sales-orders', data),
  update: (id, data) => api.put(`/sales-orders/${id}`, data),
  approve: (id) => api.patch(`/sales-orders/${id}/approve`),
  cancel: (id) => api.patch(`/sales-orders/${id}/cancel`),
};

// ─── Receipts API ──────────────────────────────────────────────────────────────
export const receiptsApi = {
  getAll: (params) => api.get('/receipts', { params }),
  getOne: (id) => api.get(`/receipts/${id}`),
  create: (data) => api.post('/receipts', data),
  update: (id, data) => api.put(`/receipts/${id}`, data),
  validate: (id) => api.post(`/receipts/${id}/validate`),
  delete: (id) => api.delete(`/receipts/${id}`),
};

// ─── Deliveries API ────────────────────────────────────────────────────────────
export const deliveriesApi = {
  getAll: (params) => api.get('/deliveries', { params }),
  getOne: (id) => api.get(`/deliveries/${id}`),
  create: (data) => api.post('/deliveries', data),
  update: (id, data) => api.put(`/deliveries/${id}`, data),
  validate: (id) => api.post(`/deliveries/${id}/validate`),
  delete: (id) => api.delete(`/deliveries/${id}`),
};

// ─── Transfers API ─────────────────────────────────────────────────────────────
export const transfersApi = {
  getAll: (params) => api.get('/transfers', { params }),
  getOne: (id) => api.get(`/transfers/${id}`),
  create: (data) => api.post('/transfers', data),
  complete: (id) => api.post(`/transfers/${id}/complete`),
  delete: (id) => api.delete(`/transfers/${id}`),
};

// ─── Adjustments API ───────────────────────────────────────────────────────────
export const adjustmentsApi = {
  getAll: (params) => api.get('/adjustments', { params }),
  create: (data) => api.post('/adjustments', data),
};

// ─── Stock Ledger API ──────────────────────────────────────────────────────────
export const stockLedgerApi = {
  getAll: (params) => api.get('/stock-ledger', { params }),
};

// ─── Alerts API ────────────────────────────────────────────────────────────────
export const alertsApi = {
  getAlerts: () => api.get('/alerts'),
};

// ─── Audit API (admin/owner) ──────────────────────────────────────────────────
export const auditApi = {
  getLogs: (params) => api.get('/audit', { params }),
};

// ─── Returns API ───────────────────────────────────────────────────────────────
export const returnsApi = {
  getAll: (params) => api.get('/returns', { params }),
  getOne: (id) => api.get(`/returns/${id}`),
  create: (data) => api.post('/returns', data),
  update: (id, data) => api.put(`/returns/${id}`, data),
  process: (id) => api.post(`/returns/${id}/process`),
  cancel: (id) => api.patch(`/returns/${id}/cancel`),
};

// ─── Lots/Traceability API ─────────────────────────────────────────────────────
export const lotsApi = {
  getAll: (params) => api.get('/lots', { params }),
  getOne: (id) => api.get(`/lots/${id}`),
};

// ─── Users Management API (admin/owner) ───────────────────────────────────────
export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getPermissions: (id) => api.get(`/users/${id}/permissions`),
  updatePermissions: (id, data) => api.patch(`/users/${id}/permissions`, data),
  resetPermissions: (id) => api.delete(`/users/${id}/permissions`),
  getLoginHistory: (id, params) => api.get(`/users/${id}/login-history`, { params }),
};

// ─── User API ──────────────────────────────────────────────────────────────────
export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.patch('/users/profile', data),
};

export default api;
