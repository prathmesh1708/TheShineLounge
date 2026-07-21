import React, { useState } from 'react';
import { useStaff } from '../../common/context/StaffContext';
import CarDetailingStaffCard from '../components/carDetailingStaffCard';
import { ShieldCheck } from 'lucide-react';

export default function CarDetailingStaffJobsPage() {
  const { jobs, updateJobStatus, setIsCameraOpen, setCameraPurpose, setOnCaptureCallback } = useStaff();
  const [filter, setFilter] = useState('all');

  const detailingJobs = jobs.filter(j => j.serviceKey === 'car-detailing');

  const filteredJobs = detailingJobs.filter(j => {
    if (filter === 'in-progress') return j.stepIndex > 0 && j.stepIndex < 7;
    if (filter === 'completed') return j.stepIndex >= 7;
    return true;
  });

  const handleAddPhoto = (jobId) => {
    setOnCaptureCallback(() => (photoUrl) => {
      updateJobStatus(jobId, jobs.find(j => j.id === jobId)?.status || 'Updated', jobs.find(j => j.id === jobId)?.stepIndex || 0, 'Detailing inspection photo attached', photoUrl);
    });
    setCameraPurpose('inspection');
    setIsCameraOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-gray-900">Detailing Bay Jobs</h2>
            <p className="text-xs text-gray-500">{detailingJobs.length} Active Ceramic & Paint Jobs</p>
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

      {/* Jobs List */}
      <div className="space-y-3">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <CarDetailingStaffCard
              key={job.id}
              job={job}
              onUpdateStatus={updateJobStatus}
              onAddPhoto={handleAddPhoto}
            />
          ))
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <p className="text-xs font-bold text-gray-400">No Detailing Jobs Found in this Filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
