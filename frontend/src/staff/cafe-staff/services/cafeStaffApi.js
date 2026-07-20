import { mockAssignedJobs } from '../../common/data/staffMockData';

export const getCafeOrders = () => {
  return mockAssignedJobs.filter(j => j.serviceKey === 'cafe');
};
