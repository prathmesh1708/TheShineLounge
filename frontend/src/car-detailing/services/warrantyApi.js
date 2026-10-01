import apiClient from '../../common/utils/apiClient';

// Car detailing warranties. Everything lives under /api/car-detailing, so no
// other service module is affected.

const unwrap = (res, key) => (res && res.data && res.data[key]) || null;

export const WARRANTY_PERIODS = [
  { years: 0.5, label: '6 Months' },
  { years: 1, label: '1 Year' },
  { years: 2, label: '2 Years' },
  { years: 3, label: '3 Years' },
  { years: 4, label: '4 Years' },
  { years: 5, label: '5 Years' },
  { years: 7, label: '7 Years' },
  { years: 10, label: '10 Years' }
];

export const getWarrantyPeriods = async () => {
  const res = await apiClient.get('/car-detailing/warranty-periods');
  return unwrap(res, 'periods') || [];
};

export const createWarrantyPeriod = async (years, label) => {
  const res = await apiClient.post('/car-detailing/warranty-periods', { years, label });
  return unwrap(res, 'period');
};

export const deleteWarrantyPeriod = async (id) => {
  const res = await apiClient.delete(`/car-detailing/warranty-periods/${id}`);
  return res && res.data;
};

export const getWarranties = async (params = {}) => {
  const res = await apiClient.get('/car-detailing/warranties', { params });
  return unwrap(res, 'warranties') || [];
};

export const getMyWarranties = async () => {
  const res = await apiClient.get('/car-detailing/warranties/mine');
  return unwrap(res, 'warranties') || [];
};

export const getWarrantiesByVehicle = async (plate) => {
  const res = await apiClient.get(`/car-detailing/warranties/vehicle/${encodeURIComponent(plate)}`);
  return unwrap(res, 'warranties') || [];
};

export const issueWarranty = async (payload) => {
  const res = await apiClient.post('/car-detailing/warranties', payload);
  return unwrap(res, 'warranty');
};

export const voidWarranty = async (id, reason) => {
  const res = await apiClient.patch(`/car-detailing/warranties/${id}/void`, { reason });
  return unwrap(res, 'warranty');
};

// Mirrors the backend's calendar arithmetic so the staff form can preview the
// expiry date before anything is saved.
export const previewExpiry = (startDate, years) => {
  const d = new Date(startDate || Date.now());
  if (isNaN(d.getTime())) return null;
  const whole = Math.floor(Number(years) || 0);
  const months = Math.round(((Number(years) || 0) - whole) * 12);
  d.setFullYear(d.getFullYear() + whole);
  if (months) d.setMonth(d.getMonth() + months);
  return d;
};

export const formatWarrantyDate = (value) => {
  const d = value ? new Date(value) : null;
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default {
  WARRANTY_PERIODS,
  getWarrantyPeriods,
  createWarrantyPeriod,
  deleteWarrantyPeriod,
  getWarranties,
  getMyWarranties,
  getWarrantiesByVehicle,
  issueWarranty,
  voidWarranty,
  previewExpiry,
  formatWarrantyDate
};
