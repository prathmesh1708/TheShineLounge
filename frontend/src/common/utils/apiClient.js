import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Collapse identical GETs that are in flight at the same moment.
//
// The admin dashboard mounts a dozen widgets at once and several want the same
// endpoint; React StrictMode then fires every effect twice in dev. The network
// panel showed the result plainly -- /auth/me, /notifications/admin, /vehicles,
// /vehicles/deregistered and /salary/overview each requested twice, seconds
// apart, for byte-identical answers. Every duplicate cost a full round trip to
// Atlas and held one of the browser's six connections to the origin, which is
// what pushed the later rows of the waterfall past two seconds: they were
// queued behind the duplicates, not slow in themselves.
//
// This shares a flight already under way; it is not a cache. Nothing is
// retained once a request settles, so no response can ever be served stale.
// Callers that de-duplicate already (AdminContext keeps its own in-flight map)
// are simply unaffected.
const inFlightGets = new Map();

const flightKey = (url, config) =>
  `${url}?${config.params ? JSON.stringify(config.params) : ''}`;

// apiClient.get is replaced rather than wrapped in an interceptor: by the time
// an interceptor runs, the second request has already been created.
apiClient.get = (url, config = {}) => {
  const key = flightKey(url, config);
  const pending = inFlightGets.get(key);
  if (pending) return pending;

  const request = apiClient
    .request({ ...config, method: 'get', url })
    .finally(() => { inFlightGets.delete(key); });

  inFlightGets.set(key, request);
  return request;
};

// Request interceptor - attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const isPathAdmin = window.location.pathname.startsWith('/admin');
    const isPathStaff = window.location.pathname.startsWith('/staff');
    const adminToken = localStorage.getItem('tsl_admin_token');
    const staffToken = localStorage.getItem('tsl_staff_token');
    const customerToken = localStorage.getItem('tsl_customer_token');
    const genericToken = localStorage.getItem('tsl_token');

    let token = null;
    if (isPathAdmin) {
      token = adminToken || genericToken;
    } else if (isPathStaff) {
      token = staffToken || adminToken || genericToken;
    } else {
      token = customerToken || genericToken;
    }

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
      if (path.startsWith('/admin') && path !== '/admin/login') {
        localStorage.removeItem('tsl_admin_token');
        localStorage.removeItem('tsl_admin_user');
        window.location.href = `/admin/login?redirect=${encodeURIComponent(path)}`;
      } else if (path.startsWith('/staff') && path !== '/staff/login') {
        localStorage.removeItem('tsl_staff_token');
        localStorage.removeItem('tsl_staff_user');
        window.location.href = `/staff/login?redirect=${encodeURIComponent(path)}`;
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient };
export default apiClient;
