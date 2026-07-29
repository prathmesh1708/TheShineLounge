import apiClient from '../utils/apiClient';

export const authService = {
  // Customer registration
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  // Login (all roles: admin, staff, user)
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  // Get current authenticated user
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Logout even if server call fails
    }
    localStorage.removeItem('tsl_token');
    localStorage.removeItem('tsl_user');
  },

  // Update own profile
  updateProfile: async (data) => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  }
};

export default authService;
