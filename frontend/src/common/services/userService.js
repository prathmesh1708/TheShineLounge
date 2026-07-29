import apiClient from '../utils/apiClient';

export const userService = {
  // ─── Staff Management (Admin Only) ──────────────────────

  createStaff: async (data) => {
    const response = await apiClient.post('/users/staff', data);
    return response.data;
  },

  getStaffList: async (params = {}) => {
    const response = await apiClient.get('/users/staff', { params });
    return response.data;
  },

  getStaffById: async (id) => {
    const response = await apiClient.get(`/users/staff/${id}`);
    return response.data;
  },

  updateStaff: async (id, data) => {
    const response = await apiClient.put(`/users/staff/${id}`, data);
    return response.data;
  },

  toggleStaffStatus: async (id) => {
    const response = await apiClient.patch(`/users/staff/${id}/status`);
    return response.data;
  },

  resetStaffPassword: async (id, newPassword) => {
    const response = await apiClient.patch(`/users/staff/${id}/reset-password`, { newPassword });
    return response.data;
  },

  deleteStaff: async (id) => {
    const response = await apiClient.delete(`/users/staff/${id}`);
    return response.data;
  },

  // ─── Customer Management (Admin Only) ──────────────────

  getCustomers: async (params = {}) => {
    const response = await apiClient.get('/users/customers', { params });
    return response.data;
  },

  getCustomerById: async (id) => {
    const response = await apiClient.get(`/users/customers/${id}`);
    return response.data;
  }
};

export default userService;
