import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, Calendar } from 'lucide-react';

// Primary Button (Emerald Green background)
export function PrimaryButton({ children, onClick, type = "button", disabled = false, className = "", icon }) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`w-full py-4 px-6 bg-luxury-emerald hover:bg-luxury-emeraldHover disabled:bg-zinc-350 text-white font-semibold rounded-24 shadow-premium hover:shadow-premium-hover transition-colors flex items-center justify-center gap-2 text-base ${className}`}
    >
      {children}
      {icon && <span className="w-5 h-5 flex items-center justify-center">{icon}</span>}
    </motion.button>
  );
}

// Secondary Button (Light background, gray border)
export function SecondaryButton({ children, onClick, type = "button", disabled = false, className = "" }) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`w-full py-4 px-6 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-semibold rounded-24 transition-all shadow-sm flex items-center justify-center gap-2 text-base ${className}`}
    >
      {children}
    </motion.button>
  );
}

// Form Input
export function FormInput({ label, name, type = "text", register, errors, placeholder = "", required = false, ...props }) {
  return (
    <div className="flex flex-col gap-1.5 w-full text-zinc-800">
      {label && (
        <label className="text-xs md:text-sm font-semibold text-zinc-650 ml-1">
          {label} {required && <span className="text-luxury-emerald">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        {...(register ? register(name, { required }) : {})}
        className={`w-full py-3.5 px-5 bg-white border ${
          errors?.[name] ? 'border-red-500' : 'border-zinc-200 focus:border-luxury-emerald'
        } text-zinc-800 placeholder-zinc-400 rounded-20 outline-none transition-all shadow-sm`}
        {...props}
      />
      {errors?.[name] && (
        <span className="text-xs text-red-500 mt-1 ml-1">This field is required</span>
      )}
    </div>
  );
}

// Form Textarea
export function FormTextarea({ label, name, register, errors, placeholder = "", required = false, rows = 3, ...props }) {
  return (
    <div className="flex flex-col gap-1.5 w-full text-zinc-800">
      {label && (
        <label className="text-xs md:text-sm font-semibold text-zinc-650 ml-1">
          {label} {required && <span className="text-luxury-emerald">*</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        rows={rows}
        {...(register ? register(name, { required }) : {})}
        className={`w-full py-3.5 px-5 bg-white border ${
          errors?.[name] ? 'border-red-500' : 'border-zinc-200 focus:border-luxury-emerald'
        } text-zinc-800 placeholder-zinc-400 rounded-20 outline-none transition-all resize-none shadow-sm`}
        {...props}
      />
      {errors?.[name] && (
        <span className="text-xs text-red-500 mt-1 ml-1">This field is required</span>
      )}
    </div>
  );
}

// Form Select
export function FormSelect({ label, name, register, errors, options = [], required = false, ...props }) {
  return (
    <div className="flex flex-col gap-1.5 w-full text-zinc-800">
      {label && (
        <label className="text-xs md:text-sm font-semibold text-zinc-650 ml-1">
          {label} {required && <span className="text-luxury-emerald">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          {...(register ? register(name, { required }) : {})}
          className="w-full py-3.5 px-5 bg-white border border-zinc-200 text-zinc-800 rounded-20 outline-none focus:border-luxury-emerald appearance-none cursor-pointer transition-all shadow-sm"
          style={{
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234A5568' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1.25rem center',
            backgroundSize: '1.25rem'
          }}
          {...props}
        >
          {options.map((opt, idx) => (
            <option key={idx} value={typeof opt === 'object' ? opt.value : opt} className="bg-white text-zinc-850">
              {typeof opt === 'object' ? opt.label : opt}
            </option>
          ))}
        </select>
      </div>
      {errors?.[name] && (
        <span className="text-xs text-red-500 mt-1 ml-1">This field is required</span>
      )}
    </div>
  );
}

// Custom Date Picker component (UI)
export function DatePicker({ value, onChange }) {
  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDayNum = (date) => {
    return date.getDate();
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const formatDateString = (date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3 text-zinc-650 text-xs md:text-sm font-semibold ml-1">
        <Calendar className="w-4 h-4 text-luxury-emerald" />
        <span>Select Appointment Date</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
        {dates.map((date, idx) => {
          const formatted = formatDateString(date);
          const isSelected = value === formatted;
          return (
            <motion.button
              key={idx}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(formatted)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-20 border transition-all ${
                isSelected
                  ? 'bg-luxury-emerald border-luxury-emerald text-white shadow-premium'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 shadow-sm'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider font-bold opacity-60">
                {getDayName(date)}
              </span>
              <span className="text-lg font-bold my-0.5">
                {getDayNum(date)}
              </span>
              <span className="text-[10px] uppercase font-bold opacity-60">
                {getMonthName(date)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Modal Component
export function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-24 shadow-premium overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-150">
              <h3 className="text-xl font-bold text-zinc-800">{title}</h3>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Drawer / Bottom Sheet Component
export function Drawer({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full max-w-xl bg-white border-t border-zinc-200 rounded-t-24 shadow-premium overflow-hidden z-10"
          >
            {/* Grabber bar for mobile feel */}
            <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto my-3" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-zinc-150">
              <h3 className="text-xl font-bold text-zinc-800">{title}</h3>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[80vh] overflow-y-auto pb-10 scrollbar-thin scrollbar-thumb-zinc-200">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Toast Notification
export function Toast({ message, type = "success", isOpen, onClose, duration = 3000 }) {
  useEffect(() => {
    if (isOpen && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-8 z-50 flex justify-center"
        >
          <div className="flex items-center gap-3 py-3.5 px-5 bg-white border border-zinc-200 rounded-20 shadow-premium backdrop-blur-md max-w-sm w-full text-zinc-800">
            {type === "success" && <CheckCircle className="w-5 h-5 text-luxury-emerald flex-shrink-0" />}
            {type === "warning" && <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />}
            {type === "info" && <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />}

            <span className="text-zinc-800 text-xs md:text-sm font-semibold mr-2 flex-grow">{message}</span>

            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Skeleton Loader
export function SkeletonLoader({ type = "card", count = 1 }) {
  const items = Array.from({ length: count });

  if (type === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {items.map((_, i) => (
          <div key={i} className="animate-pulse bg-zinc-50 border border-zinc-200 rounded-24 p-6 h-64 flex flex-col justify-between shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-zinc-200 rounded-20 flex-shrink-0" />
              <div className="flex-grow space-y-2.5">
                <div className="h-5 bg-zinc-200 rounded w-1/2" />
                <div className="h-4 bg-zinc-200 rounded w-3/4" />
                <div className="h-4 bg-zinc-200 rounded w-full" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
              <div className="h-6 bg-zinc-200 rounded w-20" />
              <div className="h-10 bg-zinc-200 rounded-20 w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "banner") {
    return (
      <div className="animate-pulse bg-zinc-100 border border-zinc-200 rounded-24 w-full h-[400px]" />
    );
  }

  if (type === "list") {
    return (
      <div className="space-y-4 w-full">
        {items.map((_, i) => (
          <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-zinc-50 rounded-20 border border-zinc-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-200 rounded-full" />
              <div className="space-y-1.5">
                <div className="h-4 bg-zinc-200 rounded w-24" />
                <div className="h-3 bg-zinc-200 rounded w-16" />
              </div>
            </div>
            <div className="h-8 bg-zinc-200 rounded-20 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return null;
}
