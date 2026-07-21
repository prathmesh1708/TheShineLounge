import { mockAssignedJobs } from '../../common/data/staffMockData';

export const getDriveThroughOrders = () => {
  return mockAssignedJobs.filter(j => j.serviceKey === 'drive-through-cafe');
};
