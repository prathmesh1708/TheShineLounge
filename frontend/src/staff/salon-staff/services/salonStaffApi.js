import { mockAssignedJobs } from '../../common/data/staffMockData';

export const getSalonAppointments = () => {
  return mockAssignedJobs.filter(j => j.serviceKey === 'salon');
};
