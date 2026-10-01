import apiClient from '../../common/utils/apiClient';

// Salon retail products + counter billing.
// Everything here lives under /api/salon, so no other module is touched.

const unwrap = (res, key) => (res && res.data && res.data[key]) || null;

export const getSalonProducts = async (params = {}) => {
  const res = await apiClient.get('/salon/products', { params });
  return unwrap(res, 'products') || [];
};

export const findSalonProductByCode = async (code) => {
  const res = await apiClient.get(`/salon/products/barcode/${encodeURIComponent(code)}`);
  return unwrap(res, 'product');
};

export const createSalonProduct = async (payload) => {
  const res = await apiClient.post('/salon/products', payload);
  return unwrap(res, 'product');
};

export const updateSalonProduct = async (id, payload) => {
  const res = await apiClient.put(`/salon/products/${id}`, payload);
  return unwrap(res, 'product');
};

export const adjustSalonProductStock = async (id, delta) => {
  const res = await apiClient.patch(`/salon/products/${id}/stock`, { delta });
  return unwrap(res, 'product');
};

export const deleteSalonProduct = async (id) => {
  const res = await apiClient.delete(`/salon/products/${id}`);
  return res && res.data;
};

export const getSalonProductOptions = async () => {
  const res = await apiClient.get('/salon/product-options');
  return unwrap(res, 'options') || { category: [], unit: [] };
};

export const createSalonProductOption = async (kind, value) => {
  const res = await apiClient.post('/salon/product-options', { kind, value });
  return unwrap(res, 'option');
};

export const deleteSalonProductOption = async (id) => {
  const res = await apiClient.delete(`/salon/product-options/${id}`);
  return res && res.data;
};

export const getSalonProductSales = async (params = {}) => {
  const res = await apiClient.get('/salon/product-sales', { params });
  return unwrap(res, 'sales') || [];
};

export const createSalonProductSale = async (payload) => {
  const res = await apiClient.post('/salon/product-sales', payload);
  return unwrap(res, 'sale');
};

export const deleteSalonProductSale = async (id) => {
  const res = await apiClient.delete(`/salon/product-sales/${id}`);
  return res && res.data;
};

// Percentage off MRP. Kept here so the table, the form preview and the cart all
// agree on the arithmetic instead of each rounding it their own way.
export const discountPercent = (mrp, sellPrice) => {
  const m = Number(mrp) || 0;
  const s = Number(sellPrice) || 0;
  if (m <= 0 || s > m) return 0;
  return Math.round(((m - s) / m) * 10000) / 100;
};

export default {
  getSalonProducts,
  findSalonProductByCode,
  createSalonProduct,
  updateSalonProduct,
  adjustSalonProductStock,
  deleteSalonProduct,
  getSalonProductOptions,
  createSalonProductOption,
  deleteSalonProductOption,
  getSalonProductSales,
  createSalonProductSale,
  deleteSalonProductSale,
  discountPercent
};
