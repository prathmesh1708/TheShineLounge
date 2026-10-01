import apiClient from '../utils/apiClient';

export const userService = {
  // ─── Staff Management (Admin Only) ──────────────────────

  createStaff: async (data) => {
    const response = await apiClient.post('/staff', data);
    return response.data;
  },

  getStaffList: async (params = {}) => {
    const response = await apiClient.get('/staff', { params });
    return response.data;
  },

  getStaffById: async (id) => {
    const response = await apiClient.get(`/staff/${id}`);
    return response.data;
  },

  updateStaff: async (id, data) => {
    const response = await apiClient.put(`/staff/${id}`, data);
    return response.data;
  },

  toggleStaffStatus: async (id) => {
    const response = await apiClient.patch(`/staff/${id}/status`);
    return response.data;
  },

  resetStaffPassword: async (id, newPassword) => {
    const response = await apiClient.patch(`/staff/${id}/reset-password`, { newPassword });
    return response.data;
  },

  deleteStaff: async (id) => {
    const response = await apiClient.delete(`/staff/${id}`);
    return response.data;
  },

  updateStaffBreak: async (id, data) => {
    const response = await apiClient.post(`/staff/${id}/break`, data);
    return response.data;
  },

  getStaffBreakStatus: async (id) => {
    const response = await apiClient.get(`/staff/${id}/break`);
    return response.data;
  },

  // breakSchedule: [{ slot, label, startTime: 'HH:mm', durationMinutes, enabled }]
  updateStaffBreakSchedule: async (id, breakSchedule) => {
    const response = await apiClient.put(`/staff/${id}/break-schedule`, { breakSchedule });
    return response.data;
  },

  // from/to: 'YYYY-MM-DD' (site timezone); omitted = last 7 days
  getStaffBreakLogs: async (id, { from, to } = {}) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await apiClient.get(`/staff/${id}/break-logs`, { params });
    return response.data;
  },

  // ─── Staff Leave ───────────────────────────────────────

  // Staff: apply, list own history + balance, cancel a pending request
  applyLeave: async (data) => {
    const response = await apiClient.post('/leaves', data);
    return response.data;
  },

  getMyLeaves: async () => {
    const response = await apiClient.get('/leaves/me');
    return response.data;
  },

  cancelLeave: async (id) => {
    const response = await apiClient.patch(`/leaves/${id}/cancel`);
    return response.data;
  },

  // Admin: list requests (filter by serviceKey/status/staff) and approve or reject
  getLeaveRequests: async (params = {}) => {
    const response = await apiClient.get('/leaves', { params });
    return response.data;
  },

  reviewLeave: async (id, decision, adminNote = '') => {
    const response = await apiClient.patch(`/leaves/${id}/review`, { decision, adminNote });
    return response.data;
  },

  // ─── Staff Salary (always read fresh from MongoDB, never cached) ─────

  getMySalary: async (month) => {
    const response = await apiClient.get('/salary/me', { params: month ? { month } : {} });
    return response.data;
  },

  getSalaryOverview: async (params = {}) => {
    const response = await apiClient.get('/salary/overview', { params });
    return response.data;
  },

  getStaffSalary: async (staffId, month) => {
    const response = await apiClient.get(`/salary/staff/${staffId}`, { params: month ? { month } : {} });
    return response.data;
  },

  addSalaryDeduction: async (staffId, data) => {
    const response = await apiClient.post(`/salary/staff/${staffId}/deductions`, data);
    return response.data;
  },

  reverseSalaryDeduction: async (deductionId, reason) => {
    const response = await apiClient.post(`/salary/deductions/${deductionId}/reverse`, { reason });
    return response.data;
  },

  changeBaseSalary: async (staffId, data) => {
    const response = await apiClient.put(`/salary/staff/${staffId}/base`, data);
    return response.data;
  },

  markSalaryPaid: async (staffId, month, data) => {
    const response = await apiClient.patch(`/salary/staff/${staffId}/statements/${month}/pay`, data);
    return response.data;
  },

  // ─── Customer Management (Admin Only) ──────────────────

  getCustomers: async (params = {}) => {
    const response = await apiClient.get('/customers', { params });
    return response.data;
  },

  getCustomerById: async (id) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  }
};


export default userService;
