import React from 'react';
import { Car, Clock, Phone, IndianRupee, ArrowRight, Camera } from 'lucide-react';
import CarWashJobStepper, { CAR_WASH_STEPS } from './carWashJobStepper';

export default function CarWashStaffCard({ job, onUpdateStatus, onAddPhoto }) {
  const currentStep = CAR_WASH_STEPS[job.stepIndex || 0] || CAR_WASH_STEPS[0];
  const isFinished = (job.stepIndex || 0) >= CAR_WASH_STEPS.length - 1;

  const handleNextStep = () => {
    const nextIdx = Math.min((job.stepIndex || 0) + 1, CAR_WASH_STEPS.length - 1);
    const nextLabel = CAR_WASH_STEPS[nextIdx].label;
    onUpdateStatus(job.id, nextLabel, nextIdx);
  };

  return (
    <div className="bg-white border-l-4 border-l-amber-500 border-t border-r border-b border-gray-200 rounded-2xl p-4 shadow-sm space-y-3 mb-3">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black text-amber-600 tracking-wider uppercase">{job.id}</span>
          <h3 className="font-extrabold text-sm text-gray-900">{job.customerName}</h3>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Phone className="w-3 h-3 text-gray-400" /> {job.phone}
          </p>
        </div>
        <div className="text-right">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            {job.planName}
          </span>
          <p className="text-xs font-black text-gray-900 mt-1 flex items-center justify-end">
            <IndianRupee className="w-3 h-3 text-amber-600" /> {job.total}
          </p>
        </div>
      </div>

      {/* Vehicle Info Badge */}
      <div className="bg-gray-50 rounded-xl p-2.5 flex items-center justify-between border border-gray-100">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-blue-900" />
          <span className="font-black text-xs text-gray-900">{job.vehicleNo}</span>
          <span className="text-xs text-gray-500">({job.vehicleModel})</span>
        </div>
        <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
          <Clock className="w-3 h-3" /> {job.timeSlot}
        </span>
      </div>

      {/* Workflow Stepper */}
      <CarWashJobStepper
        currentStepIndex={job.stepIndex || 0}
        onStepChange={(idx, label) => onUpdateStatus(job.id, label, idx)}
      />

      {/* Action Footer */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={() => onAddPhoto && onAddPhoto(job.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 flex items-center gap-1"
        >
          <Camera className="w-3.5 h-3.5 text-amber-600" />
          <span>Add Photo</span>
        </button>

        {!isFinished ? (
          <button
            onClick={handleNextStep}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-1 active:scale-95 transition-transform"
            style={{ backgroundColor: '#e07b2a' }}
          >
            <span>Advance to {CAR_WASH_STEPS[Math.min((job.stepIndex || 0) + 1, CAR_WASH_STEPS.length - 1)].label}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            ✓ Job Delivered
          </span>
        )}
      </div>
    </div>
  );
}
