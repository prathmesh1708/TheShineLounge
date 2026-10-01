import React from 'react';
import { Coffee, CheckCircle2, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useStaff } from '../context/StaffContext';

export default function StaffBreakAlertModal() {
  const { breakStatus, startStaffBreak, isStartingBreak, breakAlertModal, dismissBreakAlertModal } = useStaff();

  // An admin-assigned break waiting for the staff member takes priority and can't be dismissed
  const isPending = breakStatus?.status === 'pending';
  const isCompleted = !isPending && breakAlertModal?.isOpen && breakAlertModal.type === 'completed';

  if (!isPending && !isCompleted) {
    return null;
  }

  const duration = breakStatus?.breakDuration || 30;
  const reason = breakStatus?.breakReason || 'Rest / Lunch Break';

  const title = isPending
    ? `☕ ${duration}-Minute Break Assigned`
    : breakAlertModal.title || '⏰ Break Over! Time to Get Back to Work';
  const message = isPending
    ? `Admin has assigned you a ${duration}-minute break (${reason}). Click below when you are ready to start.`
    : breakAlertModal.message || 'Your break time has finished. Please return to your workstation and resume pending service tasks.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 text-center overflow-hidden animate-scale-up">
        {/* Glow Header */}
        <div
          className={`absolute -top-12 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full blur-3xl opacity-30 pointer-events-none ${
            isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />

        {/* Icon */}
        <div className="relative mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
          {isCompleted ? (
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-9 h-9 animate-bounce" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner">
              <Coffee className="w-9 h-9 animate-pulse" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>

        {/* Message */}
        <p className="text-sm font-medium text-gray-600 mb-5 leading-relaxed px-2">{message}</p>

        {isCompleted && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-5 text-xs text-emerald-900 font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Workstation is ready for duty. Have a productive shift!</span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          disabled={isPending && isStartingBreak}
          onClick={isPending ? startStaffBreak : dismissBreakAlertModal}
          className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider ${
            isCompleted
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20'
              : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/20'
          }`}
        >
          {isPending ? (
            <>
              <span>{isStartingBreak ? 'Starting Break...' : 'Got It, Start Break'}</span>
              {isStartingBreak ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </>
          ) : (
            <>
              <span>Got it, I'm Back at Work!</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
