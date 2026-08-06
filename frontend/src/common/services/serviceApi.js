import apiClient from '../utils/apiClient';

export const serviceApi = {
  // Public - Get active homepage services
  getHomeServices: async () => {
    const response = await apiClient.get('/services/home');
    return response.data;
  },

  // Public/Admin - Get all services with filters & pagination
  getServices: async (params = {}) => {
    const response = await apiClient.get('/services', { params });
    return response.data;
  },

  // Public - Get service details by slug
  getServiceBySlug: async (slug) => {
    const response = await apiClient.get(`/services/${slug}`);
    return response.data;
  },

  // Admin - Get full details by ID
  getServiceById: async (id) => {
    const response = await apiClient.get(`/services/admin/${id}`);
    return response.data;
  },

  // Admin - Create service
  createService: async (data) => {
    const response = await apiClient.post('/services', data);
    return response.data;
  },

  // Admin - Update service
  updateService: async (id, data) => {
    const response = await apiClient.put(`/services/${id}`, data);
    return response.data;
  },

  // Admin - Toggle active status
  toggleServiceStatus: async (id) => {
    const response = await apiClient.patch(`/services/${id}/status`);
    return response.data;
  },

  // Admin - Soft delete
  deleteService: async (id) => {
    const response = await apiClient.delete(`/services/${id}`);
    return response.data;
  },

  // Admin - Reorder services
  reorderServices: async (orderedIds) => {
    const response = await apiClient.patch('/services/reorder', { orderedIds });
    return response.data;
  },

  // Admin - Sub-resources: Add Membership
  addMembership: async (serviceId, data) => {
    const response = await apiClient.post(`/services/${serviceId}/memberships`, data);
    return response.data;
  },

  // Admin - Sub-resources: Delete Membership
  deleteMembership: async (serviceId, memId) => {
    const response = await apiClient.delete(`/services/${serviceId}/memberships/${memId}`);
    return response.data;
  },

  // Admin - Sub-resources: Add Plan
  addPlan: async (serviceId, data) => {
    const response = await apiClient.post(`/services/${serviceId}/plans`, data);
    return response.data;
  },

  // Admin - Sub-resources: Update Plan
  updatePlan: async (serviceId, planId, data) => {
    const response = await apiClient.put(`/services/${serviceId}/plans/${planId}`, data);
    return response.data;
  },

  // Admin - Sub-resources: Delete Plan
  deletePlan: async (serviceId, planId) => {
    const response = await apiClient.delete(`/services/${serviceId}/plans/${planId}`);
    return response.data;
  },

  // Admin - Sub-resources: Add Menu Section
  addSection: async (serviceId, data) => {
    const response = await apiClient.post(`/services/${serviceId}/sections`, data);
    return response.data;
  },

  // Admin - Sub-resources: Delete Menu Section
  deleteSection: async (serviceId, sectionId) => {
    const response = await apiClient.delete(`/services/${serviceId}/sections/${sectionId}`);
    return response.data;
  }
};

export default serviceApi;
