import React, { useState } from 'react';
import { useStaff } from '../../common/context/StaffContext';
import SalonStaffCard from '../components/salonStaffCard';
import { Scissors } from 'lucide-react';
import { SALON_STEPS } from '../components/salonAppointmentStepper';

export default function SalonStaffAppointmentsPage() {
  const { jobs, updateJobStatus, currentStaff } = useStaff();
  const [filter, setFilter] = useState('all');

  // Only for matching free-text stylist names on legacy bookings that have no
  // staffId — never run an actual id through this, it strips digits.
  const normalizeName = (name) => {
    const clean = (name || '').toLowerCase().replace(/[^a-z]/gi, '').trim();
    if (clean === 'vikash' || clean === 'vikas') return 'vikas';
    return clean;
  };

  const salonJobs = jobs.filter(j => {
    if (j.serviceKey !== 'salon' && !(j.serviceName && j.serviceName.toLowerCase().includes('salon'))) return false;
    if (!currentStaff) return true;

    // Managers see all salon jobs
    const isManager = ['Super Admin', 'Branch Manager', 'Cashier'].includes(currentStaff.role);
    if (isManager) return true;

    // A real assigned staff id is the source of truth — compare it directly,
    // no normalization (stripping digits would corrupt Mongo ObjectId comparisons).
    const placeholderIds = ['stf-live', 'stf-05', 'stf-07'];
    const jobStaffId = String(j.staffId || '').trim().toLowerCase();
    if (jobStaffId && !placeholderIds.includes(jobStaffId)) {
      return jobStaffId === String(currentStaff.id || '').trim().toLowerCase();
    }

    // Fall back to free-text name matching for legacy bookings with no staffId
    const staffNameNorm = normalizeName(currentStaff.name);
    let reqStylist = j.staffName || j.assignedStaffName || j.stylist || '';
    const vehicleStr = (j.vehicleNo || '').toLowerCase();
    if (!reqStylist && vehicleStr.includes('stylist:')) {
      reqStylist = vehicleStr.split('stylist:')[1].trim();
    } else if (vehicleStr.includes('stylist:')) {
      const vStylist = vehicleStr.split('stylist:')[1].trim();
      if (vStylist && normalizeName(vStylist) !== 'anyspecialist') {
        reqStylist = vStylist;
      }
    }

    const normStylist = normalizeName(reqStylist);

    // Check if requested stylist matches my name
    if (normStylist && normStylist === staffNameNorm) return true;

    // If requested stylist specifically targets ANOTHER active staff member (e.g. Raasi, Tahir), hide
    const knownOtherStaff = ['raasi', 'tahir', 'tahirkhan', 'sameer', 'sameermerchant', 'vikash', 'vikas'];
    if (normStylist && knownOtherStaff.includes(normStylist) && normStylist !== staffNameNorm) {
      return false;
    }

    // Otherwise, show to all salon staff
    return true;
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
