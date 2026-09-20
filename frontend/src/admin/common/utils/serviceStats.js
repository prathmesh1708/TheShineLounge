// Per-service header stats for the admin hub pages.
//
// These figures used to come from a hardcoded demo map, which meant every hub
// page showed the same invented revenue whatever the database actually held.
// Labels now come from the real service record; the numbers stay at zero until
// an endpoint supplies them, so the UI is empty rather than wrong.

const TITLE_CASE_FROM_KEY = (key) =>
  String(key || '')
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

/**
 * Builds the stats object an admin hub page renders in its header.
 *
 * @param {string} serviceKey  the hub's service slug, e.g. 'car-wash'
 * @param {Array}  services    the live service catalog from AdminContext
 */
export const buildServiceStats = (serviceKey, services = []) => {
  const record = (services || []).find(
    s => s.key === serviceKey || s.slug === serviceKey
  );

  return {
    serviceKey,
    serviceName: record?.name || TITLE_CASE_FROM_KEY(serviceKey),
    category: record?.category || 'General',
    tagline: record?.tagline || record?.description || '',
    heroImage: record?.image || record?.heroImage || '',

    // No endpoint reports these yet. Zero is the honest answer.
    totalRevenue: 0,
    monthlySales: 0,
    todaySales: 0,
    activeBookings: 0,
    completedToday: 0,
    activeMembers: 0,
    satisfactionScore: 0,
    trendData: []
  };
};

export default buildServiceStats;
