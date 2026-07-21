import React, { useState } from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import { useStaff } from '../common/context/StaffContext';

export default function StaffSchedulePage() {
  const { currentStaff, jobs } = useStaff();
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week'

  const scheduleSlots = [
    { time: '09:00 AM', task: 'Morning Equipment & Chemical Check-In', status: 'Completed' },
    { time: '11:00 AM', task: 'Car Wash Booking (Rahul Sharma - MH01AB1234)', status: 'Completed' },
    { time: '02:00 PM', task: 'Ceramic Coating Prep (Priya Patel - MH02CD5678)', status: 'In Progress' },
    { time: '04:30 PM', task: 'Executive Express Polish (Aditya Roy - MH04XY7788)', status: 'Upcoming' },
    { time: '06:00 PM', task: 'Shift Handover & Chemical Stock Restock', status: 'Upcoming' }
  ];

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-gray-900">Shift Schedule</h2>
            <p className="text-xs text-gray-500">{currentStaff?.name} • {currentStaff?.department}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1 rounded-lg transition-all ${viewMode === 'day' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
          >
            Day View
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 rounded-lg transition-all ${viewMode === 'week' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
          >
            Week View
          </button>
        </div>
      </div>

      {/* Timeline Schedule */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-500" /> Today's Shift Timeline
        </h3>

        <div className="relative pl-6 space-y-4 border-l-2 border-amber-500/40">
          {scheduleSlots.map((slot, index) => (
            <div key={index} className="relative">
              <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-xs" />
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                <span className="text-[10px] font-black text-amber-600 uppercase">{slot.time}</span>
                <p className="font-extrabold text-xs text-gray-900">{slot.task}</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                  slot.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                  slot.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {slot.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
