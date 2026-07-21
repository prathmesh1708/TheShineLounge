import React from 'react';
import { CupSoda, Flame, PackageCheck, Check } from 'lucide-react';

export const EXPRESS_ORDER_STEPS = [
  { id: 'arrival', label: 'Bay Arrival', icon: CupSoda },
  { id: 'preparing', label: 'Preparing (90s)', icon: Flame },
  { id: 'packaged', label: 'Packaged', icon: PackageCheck },
  { id: 'delivered', label: 'Car Handover', icon: Check }
];

export default function ExpressOrderStepper({ currentStepIndex, onStepChange }) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-4 right-4 h-1 bg-gray-200 -z-0">
          <div
            className="h-full transition-all duration-300"
            style={{
              backgroundColor: '#3b82f6',
              width: `${(currentStepIndex / (EXPRESS_ORDER_STEPS.length - 1)) * 100}%`
            }}
          />
        </div>

        {EXPRESS_ORDER_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isDone = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <button
              key={step.id}
              onClick={() => onStepChange && onStepChange(index, step.label)}
              className="flex flex-col items-center gap-1 z-10 group"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? 'text-white'
                    : isCurrent
                    ? 'text-white scale-110 ring-4 ring-blue-100'
                    : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}
                style={isDone || isCurrent ? { backgroundColor: '#3b82f6' } : {}}
              >
                {isDone ? <Check className="w-4 h-4 text-white" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[9px] font-bold text-center max-w-[60px] ${isCurrent ? 'text-blue-600 font-extrabold' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
