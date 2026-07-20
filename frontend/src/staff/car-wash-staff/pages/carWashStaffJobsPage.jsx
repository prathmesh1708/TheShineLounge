import React, { useState } from 'react';
import { useStaff } from '../../common/context/StaffContext';
import CarWashStaffCard from '../components/carWashStaffCard';
import { Sparkles, Filter, Plus } from 'lucide-react';

export default function CarWashStaffJobsPage() {
  const { jobs, updateJobStatus, setIsCameraOpen, setCameraPurpose, setOnCaptureCallback } = useStaff();
  const [filter, setFilter] = useState('all'); // 'all' | 'in-progress' | 'completed'

  const carWashJobs = jobs.filter(j => j.serviceKey === 'car-wash');

  const filteredJobs = carWashJobs.filter(j => {
    if (filter === 'in-progress') return j.stepIndex > 0 && j.stepIndex < 4;
    if (filter === 'completed') return j.stepIndex >= 4;
    return true;
  });

  const handleAddPhoto = (jobId) => {
    setOnCaptureCallback(() => (photoUrl) => {
      updateJobStatus(jobId, jobs.find(j => j.id === jobId)?.status || 'Updated', jobs.find(j => j.id === jobId)?.stepIndex || 0, 'Photo attached', photoUrl);
    });
    setCameraPurpose('job-photo');
    setIsCameraOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Page Title & Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-gray-900">Car Wash Queue</h2>
            <p className="text-xs text-gray-500">{carWashJobs.length} Assigned Jobs Today</p>
          </div>
        </div>

        {/* Filter Pills */}
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
            <CarWashStaffCard
              key={job.id}
              job={job}
              onUpdateStatus={updateJobStatus}
              onAddPhoto={handleAddPhoto}
            />
          ))
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <p className="text-xs font-bold text-gray-400">No Car Wash Jobs Found in this Filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
