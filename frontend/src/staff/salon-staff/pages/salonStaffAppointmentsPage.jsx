import React, { useState } from 'react';
import { useStaff } from '../../common/context/StaffContext';
import SalonStaffCard from '../components/salonStaffCard';
import { Scissors } from 'lucide-react';
import { SALON_STEPS } from '../components/salonAppointmentStepper';

export default function SalonStaffAppointmentsPage() {
  const { jobs, updateJobStatus, currentStaff } = useStaff();
  const [filter, setFilter] = useState('all');

  const normalizeName = (name) => {
    const clean = (name || '').toLowerCase().replace(/[^a-z]/gi, '').trim();
    if (clean === 'vikash' || clean === 'vikas') return 'vikas';
    return clean;
  };

  const salonJobs = jobs.filter(j => {
    if (j.serviceKey !== 'salon') return false;
    if (!currentStaff) return true;

    // Managers see all salon jobs
    const isManager = ['Super Admin', 'Branch Manager', 'Cashier'].includes(currentStaff.role);
    if (isManager) return true;

    const staffNameNorm = normalizeName(currentStaff.name);

    // Check if customer selected this stylist (stored in vehicleNo as "Stylist: <Name>")
    const selectedStylist = (j.vehicleNo || '').toLowerCase();
    if (selectedStylist.includes('stylist:')) {
      const stylistNameNorm = normalizeName(selectedStylist.split('stylist:')[1]);
      return stylistNameNorm === staffNameNorm;
    }

    // Check if explicitly assigned to this staff member
    if (j.staffName) {
      return normalizeName(j.staffName) === staffNameNorm || j.staffId === currentStaff.id;
    }

    return false;
  });

  const filteredJobs = salonJobs.filter(j => {
    if (filter === 'in-progress') return j.stepIndex > 0 && j.stepIndex < SALON_STEPS.length - 1;
    if (filter === 'completed') return j.stepIndex >= SALON_STEPS.length - 1;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-gray-900">Salon Appointments</h2>
            <p className="text-xs text-gray-500">{salonJobs.length} Grooming & Hair Sessions</p>
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
            <SalonStaffCard
              key={job.id}
              job={job}
              onUpdateStatus={updateJobStatus}
            />
          ))
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <p className="text-xs font-bold text-gray-400">No Salon Appointments in this Filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
