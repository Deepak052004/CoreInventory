import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
};

// Dashboard
export const dashboardApi = {
  getKpis: () => api.get('/dashboard/kpis'),
  getInventoryDistribution: () => api.get('/dashboard/inventory-distribution'),
  getCategoryStats: () => api.get('/dashboard/category-stats'),
  getStockMovement: (days = 30) => api.get('/dashboard/stock-movement', { params: { days } }),
  getFilters: () => api.get('/dashboard/filters'),
};

// Products
export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Categories
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Warehouses
export const warehousesApi = {
  getAll: () => api.get('/warehouses'),
  getOne: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`),
};

// Receipts
export const receiptsApi = {
  getAll: (params) => api.get('/receipts', { params }),
  getOne: (id) => api.get(`/receipts/${id}`),
  create: (data) => api.post('/receipts', data),
  update: (id, data) => api.put(`/receipts/${id}`, data),
  validate: (id) => api.post(`/receipts/${id}/validate`),
  delete: (id) => api.delete(`/receipts/${id}`),
};

// Deliveries
export const deliveriesApi = {
  getAll: (params) => api.get('/deliveries', { params }),
  getOne: (id) => api.get(`/deliveries/${id}`),
  create: (data) => api.post('/deliveries', data),
  update: (id, data) => api.put(`/deliveries/${id}`, data),
  validate: (id) => api.post(`/deliveries/${id}/validate`),
  delete: (id) => api.delete(`/deliveries/${id}`),
};

// Transfers
export const transfersApi = {
  getAll: (params) => api.get('/transfers', { params }),
  getOne: (id) => api.get(`/transfers/${id}`),
  create: (data) => api.post('/transfers', data),
  complete: (id) => api.post(`/transfers/${id}/complete`),
  delete: (id) => api.delete(`/transfers/${id}`),
};

// Adjustments
export const adjustmentsApi = {
  getAll: (params) => api.get('/adjustments', { params }),
  create: (data) => api.post('/adjustments', data),
};

// Stock Ledger
export const stockLedgerApi = {
  getAll: (params) => api.get('/stock-ledger', { params }),
};

// Alerts
export const alertsApi = {
  getAlerts: () => api.get('/alerts'),
};

// User
export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.patch('/users/profile', data),
};

export default api;
