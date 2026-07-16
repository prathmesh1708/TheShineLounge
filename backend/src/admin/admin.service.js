const fetchDashboardStats = async () => {
  return {
    totalBookings: 142,
    activeStaffCount: 24,
    revenueToday: 1845.50,
    serviceDistribution: {
      cafe: 42,
      driveThroughCafe: 30,
      carWash: 25,
      carDetailing: 15,
      dogWash: 18,
      salon: 12
    }
  };
};

const runSystemMaintenance = async () => {
  return {
    lastChecked: new Date().toISOString(),
    status: 'healthy',
    cacheCleared: true
  };
};

module.exports = {
  fetchDashboardStats,
  runSystemMaintenance
};
