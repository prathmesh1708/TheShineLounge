import { mockAssignedJobs } from '../../common/data/staffMockData';

export const getDogWashJobs = () => {
  return mockAssignedJobs.filter(j => j.serviceKey === 'dog-wash');
};
