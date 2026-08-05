import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const isPathAdminOrStaff = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/staff');
    const adminToken = localStorage.getItem('tsl_admin_token');
    const customerToken = localStorage.getItem('tsl_customer_token');
    const genericToken = localStorage.getItem('tsl_token');

    let token = isPathAdminOrStaff
      ? (adminToken || genericToken)
      : (customerToken || genericToken);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const path = window.location.pathname;
      // Only force redirect on protected admin/staff portal pages
      if (path.startsWith('/admin')) {
        localStorage.removeItem('tsl_admin_token');
        localStorage.removeItem('tsl_admin_user');
        window.location.href = '/admin/login';
      } else if (path.startsWith('/staff')) {
        localStorage.removeItem('tsl_admin_token');
        localStorage.removeItem('tsl_admin_user');
        window.location.href = '/staff/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
