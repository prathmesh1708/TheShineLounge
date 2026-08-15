import React from 'react';
import { Scissors, Clock, Phone, IndianRupee, ArrowRight } from 'lucide-react';
import SalonAppointmentStepper, { SALON_STEPS } from './salonAppointmentStepper';

export default function SalonStaffCard({ job, onUpdateStatus }) {
  const currentStep = SALON_STEPS[job.stepIndex || 0] || SALON_STEPS[0];
  const isFinished = (job.stepIndex || 0) >= SALON_STEPS.length - 1;

  const handleNextStep = () => {
    const nextIdx = Math.min((job.stepIndex || 0) + 1, SALON_STEPS.length - 1);
    const nextLabel = SALON_STEPS[nextIdx].label;
    onUpdateStatus(job.id, nextLabel, nextIdx);
  };

  return (
    <div className="bg-white border-l-4 border-l-purple-500 border-t border-r border-b border-gray-200 rounded-2xl p-4 shadow-sm space-y-3 mb-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black text-purple-600 tracking-wider uppercase">{job.id}</span>
          <h3 className="font-extrabold text-sm text-gray-900">{job.customerName || 'Salon Client'}</h3>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Phone className="w-3 h-3 text-gray-400" /> {job.phone}
          </p>
        </div>
        <div className="text-right">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            {job.planName || job.serviceName}
          </span>
          <p className="text-xs font-black text-gray-900 mt-1 flex items-center justify-end">
            <IndianRupee className="w-3 h-3 text-purple-600" /> {job.total || job.amount}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-2.5 flex items-center justify-between border border-gray-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-purple-600" />
          <span className="font-black text-xs text-gray-900">{job.vehicleNo || `Stylist: ${job.staffName || 'Any Specialist'}`}</span>
        </div>
        <div className="text-[10px] text-gray-700 font-bold flex items-center gap-2">
          {job.date && <span>📅 {job.date}</span>}
          <span className="flex items-center gap-1 text-purple-900">
            <Clock className="w-3 h-3 text-purple-600" /> {(job.timeSlot || '09:00 AM').replace(/^[0-9]{4}-[0-9]{2}-[0-9]{2}\s*\|\s*/, '')}
          </span>
        </div>
      </div>

      <SalonAppointmentStepper
        currentStepIndex={job.stepIndex || 0}
        onStepChange={(idx, label) => onUpdateStatus(job.id, label, idx)}
      />

      <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
        {!isFinished ? (
          <button
            onClick={handleNextStep}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-1 active:scale-95 transition-transform bg-purple-600"
          >
            <span>Advance to {SALON_STEPS[Math.min((job.stepIndex || 0) + 1, SALON_STEPS.length - 1)].label}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-xs font-extrabold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            ✓ Completed
          </span>
        )}
      </div>
    </div>
  );
}
