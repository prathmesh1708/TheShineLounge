import React from 'react';
import { Dog, Clock, Phone, IndianRupee, ArrowRight, Camera } from 'lucide-react';
import DogSpaStepper, { DOG_SPA_STEPS } from './dogSpaStepper';

export default function DogWashStaffCard({ job, onUpdateStatus, onAddPhoto }) {
  const currentStep = DOG_SPA_STEPS[job.stepIndex || 0] || DOG_SPA_STEPS[0];
  const isFinished = (job.stepIndex || 0) >= DOG_SPA_STEPS.length - 1;

  const handleNextStep = () => {
    const nextIdx = Math.min((job.stepIndex || 0) + 1, DOG_SPA_STEPS.length - 1);
    const nextLabel = DOG_SPA_STEPS[nextIdx].label;
    onUpdateStatus(job.id, nextLabel, nextIdx);
  };

  return (
    <div className="bg-white border-l-4 border-l-emerald-500 border-t border-r border-b border-gray-200 rounded-2xl p-4 shadow-sm space-y-3 mb-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black text-emerald-600 tracking-wider uppercase">{job.id}</span>
          <h3 className="font-extrabold text-sm text-gray-900">{job.customerName}</h3>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Phone className="w-3 h-3 text-gray-400" /> {job.phone}
          </p>
        </div>
        <div className="text-right">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {job.planName}
          </span>
          <p className="text-xs font-black text-gray-900 mt-1 flex items-center justify-end">
            <IndianRupee className="w-3 h-3 text-amber-600" /> {job.total}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-2.5 flex items-center justify-between border border-gray-100">
        <div className="flex items-center gap-2">
          <Dog className="w-4 h-4 text-emerald-600" />
          <span className="font-black text-xs text-gray-900">{job.vehicleNo}</span>
        </div>
        <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
          <Clock className="w-3 h-3" /> {job.timeSlot}
        </span>
      </div>

      <DogSpaStepper
        currentStepIndex={job.stepIndex || 0}
        onStepChange={(idx, label) => onUpdateStatus(job.id, label, idx)}
      />

      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={() => onAddPhoto && onAddPhoto(job.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 flex items-center gap-1"
        >
          <Camera className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pet Photo</span>
        </button>

        {!isFinished ? (
          <button
            onClick={handleNextStep}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-1 active:scale-95 transition-transform"
            style={{ backgroundColor: '#10b981' }}
          >
            <span>Advance to {DOG_SPA_STEPS[Math.min((job.stepIndex || 0) + 1, DOG_SPA_STEPS.length - 1)].label}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            ✓ Ready for Owner
          </span>
        )}
      </div>
    </div>
  );
}
