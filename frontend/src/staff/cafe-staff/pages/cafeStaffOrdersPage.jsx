import React, { useState } from 'react';
import { useStaff } from '../../common/context/StaffContext';
import CafeStaffCard from '../components/cafeStaffCard';
import { Coffee } from 'lucide-react';

export default function CafeStaffOrdersPage() {
  const { jobs, updateJobStatus } = useStaff();
  const [filter, setFilter] = useState('all');

  const cafeJobs = jobs.filter(j => j.serviceKey === 'cafe');

  const filteredJobs = cafeJobs.filter(j => {
    if (filter === 'in-progress') return j.stepIndex > 0 && j.stepIndex < 4;
    if (filter === 'completed') return j.stepIndex >= 4;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <Coffee className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-gray-900">Kitchen Display (KDS)</h2>
            <p className="text-xs text-gray-500">{cafeJobs.length} Live Orders</p>
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
            <CafeStaffCard
              key={job.id}
              job={job}
              onUpdateStatus={updateJobStatus}
            />
          ))
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <p className="text-xs font-bold text-gray-400">No Kitchen Orders in this Filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
