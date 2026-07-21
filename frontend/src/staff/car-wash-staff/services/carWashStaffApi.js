// Car Wash Staff API Mock Service
import { mockAssignedJobs } from '../../common/data/staffMockData';

export const getCarWashJobs = () => {
  return mockAssignedJobs.filter(j => j.serviceKey === 'car-wash');
};

export const updateCarWashJobStep = (jobId, stepIndex, statusLabel) => {
  const job = mockAssignedJobs.find(j => j.id === jobId);
  if (job) {
    job.stepIndex = stepIndex;
    job.status = statusLabel;
  }
  return job;
};
