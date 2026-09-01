import apiClient from '../utils/apiClient';

/**
 * The signed-in customer's own garage and membership.
 *
 * Every call here is scoped server-side by the bearer token — there is no
 * account selector to pass — so a guest gets a 401 rather than someone else's
 * cars. Callers must treat that 401 as "no garage yet", never as a reason to
 * show sample vehicles.
 */

// The API stores a plate plus brand/model/year; the booking screens work in
// terms of a single display name and a local id. Both directions of that
// mapping live here so the two shapes cannot drift apart per page.
export function toUiVehicle(v) {
  const brand = v.brand || '';
  const model = v.model || '';
  const name = [brand, model].filter(Boolean).join(' ').trim() || 'My Vehicle';

  return {
    id: v._id || v.plateNumber,
    _id: v._id,
    brand,
    name,
    year: v.year || '',
    plate: v.plateNumber || '',
    category: v.category || 'Car',
    isPrimary: Boolean(v.isPrimary),
    icon: '🚗'
  };
}

// `name` may already include the brand ("Hyundai Elite i20"); don't store it
// twice or the label reads "Hyundai Hyundai Elite i20".
export function toApiVehicle(v) {
  const brand = (v.brand || '').trim();
  const name = (v.name || '').trim();
  const model = brand && name.toLowerCase().startsWith(brand.toLowerCase())
    ? name.slice(brand.length).trim()
    : name;

  return {
    plateNumber: (v.plate || '').trim().toUpperCase(),
    brand,
    model,
    year: (v.year || '').trim()
  };
}

export const vehicleService = {
  getMyVehicles: async () => {
    const res = await apiClient.get('/users/vehicles');
    return (res.data?.vehicles || []).map(toUiVehicle);
  },

  addMyVehicle: async (vehicle) => {
    const res = await apiClient.post('/users/vehicles', toApiVehicle(vehicle));
    return (res.data?.vehicles || []).map(toUiVehicle);
  },

  deleteMyVehicle: async (vehicleId) => {
    const res = await apiClient.delete(`/users/vehicles/${vehicleId}`);
    return (res.data?.vehicles || []).map(toUiVehicle);
  },

  getMyMembership: async () => {
    const res = await apiClient.get('/users/membership');
    return res.data?.membership || null;
  }
};

export default vehicleService;
