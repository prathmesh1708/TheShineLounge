import apiClient from '../../common/utils/apiClient';

export const errorMessage = (err, fallback = 'Something went wrong') =>
  (err && err.response && err.response.data && err.response.data.message) || (err && err.message) || fallback;

export const getWhatsAppStatus = async () => {
  const res = await apiClient.get('/whatsapp/status');
  return res.data.status;
};

export const getWhatsAppContacts = async ({ refresh = false } = {}) => {
  const res = await apiClient.get('/whatsapp/contacts', { params: refresh ? { refresh: 1 } : {} });
  return res.data.contacts || [];
};

export const updateWhatsAppContact = async (phone, payload) => {
  const res = await apiClient.patch(`/whatsapp/contacts/${phone}`, payload);
  return res.data.pref;
};

export const bulkUpdateWhatsAppContacts = async (phones, payload) => {
  const res = await apiClient.post('/whatsapp/contacts/bulk', { phones, ...payload });
  return res.data;
};

export const getWhatsAppTemplates = async ({ refresh = false } = {}) => {
  const res = await apiClient.get('/whatsapp/templates', { params: refresh ? { refresh: 1 } : {} });
  return res.data.templates || [];
};

export const createWhatsAppTemplate = async (payload) => {
  const res = await apiClient.post('/whatsapp/templates', payload);
  return res.data.template;
};

export const updateWhatsAppTemplate = async (id, payload) => {
  const res = await apiClient.put(`/whatsapp/templates/${id}`, payload);
  return res.data.template;
};

export const submitWhatsAppTemplate = async (id) => {
  const res = await apiClient.post(`/whatsapp/templates/${id}/submit`);
  return res.data.template;
};

export const syncWhatsAppTemplates = async () => {
  const res = await apiClient.post('/whatsapp/templates/sync');
  return res.data;
};

export const deleteWhatsAppTemplate = async (id, { localOnly = false } = {}) => {
  const res = await apiClient.delete(`/whatsapp/templates/${id}`, { params: localOnly ? { local: 1 } : {} });
  return res.data;
};

export const getWhatsAppCampaigns = async () => {
  const res = await apiClient.get('/whatsapp/campaigns');
  return res.data.campaigns || [];
};

export const getWhatsAppCampaign = async (id) => {
  const res = await apiClient.get(`/whatsapp/campaigns/${id}`);
  return res.data.campaign;
};

export const createWhatsAppCampaign = async (payload) => {
  const res = await apiClient.post('/whatsapp/campaigns', payload);
  return res.data.campaign;
};

export const sendWhatsAppTest = async (payload) => {
  const res = await apiClient.post('/whatsapp/send-test', payload);
  return res.data.campaign;
};

export const cancelWhatsAppCampaign = async (id) => (await apiClient.post(`/whatsapp/campaigns/${id}/cancel`)).data;
export const retryWhatsAppCampaign = async (id) => (await apiClient.post(`/whatsapp/campaigns/${id}/retry`)).data;
export const deleteWhatsAppCampaign = async (id) => (await apiClient.delete(`/whatsapp/campaigns/${id}`)).data;
