import React, { useState } from 'react';
import { useStaff } from '../../common/context/StaffContext';
import DogWashStaffCard from '../components/dogWashStaffCard';
import { Dog } from 'lucide-react';

export default function DogWashStaffJobsPage() {
  const { jobs, updateJobStatus, setIsCameraOpen, setCameraPurpose, setOnCaptureCallback } = useStaff();
  const [filter, setFilter] = useState('all');

  const dogJobs = jobs.filter(j => j.serviceKey === 'dog-wash');

  const filteredJobs = dogJobs.filter(j => {
    if (filter === 'in-progress') return j.stepIndex > 0 && j.stepIndex < 4;
    if (filter === 'completed') return j.stepIndex >= 4;
    return true;
  });

  const handleAddPhoto = (jobId) => {
    setOnCaptureCallback(() => (photoUrl) => {
      updateJobStatus(jobId, jobs.find(j => j.id === jobId)?.status || 'Updated', jobs.find(j => j.id === jobId)?.stepIndex || 0, 'Pet photo attached', photoUrl);
    });
    setCameraPurpose('job-photo');
    setIsCameraOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Dog className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-gray-900">Dog Spa Queue</h2>
            <p className="text-xs text-gray-500">{dogJobs.length} Pet Grooming Appointments</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {['all', 'in-progress', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
                filter === f ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
              }`}
            >
              {f.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <DogWashStaffCard
              key={job.id}
              job={job}
              onUpdateStatus={updateJobStatus}
              onAddPhoto={handleAddPhoto}
            />
          ))
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <p className="text-xs font-bold text-gray-400">No Dog Spa Appointments in this Filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
