import { mockAssignedJobs } from '../../common/data/staffMockData';

export const getCarDetailingJobs = () => {
  return mockAssignedJobs.filter(j => j.serviceKey === 'car-detailing');
};

export const updateCarDetailingJobStep = (jobId, stepIndex, statusLabel) => {
  const job = mockAssignedJobs.find(j => j.id === jobId);
  if (job) {
    job.stepIndex = stepIndex;
    job.status = statusLabel;
  }
  return job;
};
