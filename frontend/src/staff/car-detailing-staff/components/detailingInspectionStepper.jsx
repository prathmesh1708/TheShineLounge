import React from 'react';
import { CalendarCheck, Car, ClipboardCheck, Wrench, Play, CheckCircle2, ShieldCheck, Check } from 'lucide-react';

export const DETAILING_STEPS = [
  { id: 'confirmed', label: 'Confirmed', icon: CalendarCheck },
  { id: 'received', label: 'Received', icon: Car },
  { id: 'inspected', label: 'Inspected', icon: ClipboardCheck },
  { id: 'started', label: 'Started', icon: Play },
  { id: 'wip', label: 'In Progress', icon: Wrench },
  { id: 'qc', label: 'Quality Check', icon: ShieldCheck },
  { id: 'ready', label: 'Ready', icon: CheckCircle2 },
  { id: 'delivered', label: 'Delivered', icon: Check }
];

export default function DetailingInspectionStepper({ currentStepIndex, onStepChange }) {
  return (
    <div className="py-2 overflow-x-auto scrollbar-none">
      <div className="flex items-center justify-between min-w-[360px] relative px-1">
        {/* Progress Line */}
        <div className="absolute top-3.5 left-3 right-3 h-1 bg-gray-200 -z-0">
          <div
            className="h-full transition-all duration-300"
            style={{
              backgroundColor: '#e07b2a',
              width: `${(currentStepIndex / (DETAILING_STEPS.length - 1)) * 100}%`
            }}
          />
        </div>

        {DETAILING_STEPS.map((step, index) => {
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
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isDone
                    ? 'text-white'
                    : isCurrent
                    ? 'text-white scale-110 ring-2 ring-orange-200'
                    : 'bg-white border border-gray-300 text-gray-400'
                }`}
                style={isDone || isCurrent ? { backgroundColor: '#e07b2a' } : {}}
              >
                {isDone ? <Check className="w-3.5 h-3.5 text-white" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-[8px] font-bold text-center max-w-[42px] leading-tight ${isCurrent ? 'text-amber-600 font-extrabold' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
