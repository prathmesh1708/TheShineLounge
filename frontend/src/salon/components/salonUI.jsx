import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

// Premium Primary Button
export const PrimaryButton = ({ children, onClick, className = "", disabled = false, type = "button" }) => (
  <motion.button
    whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
    whileTap={disabled ? {} : { scale: 0.98 }}
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={`w-full py-3.5 px-6 bg-primary hover:bg-primary/95 text-white font-bold rounded-20 shadow-premium transition-all select-none outline-none focus:ring-2 focus:ring-primary/20 ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    } ${className}`}
  >
    {children}
  </motion.button>
);

// Premium Secondary Button
export const SecondaryButton = ({ children, onClick, className = "", disabled = false, type = "button" }) => (
  <motion.button
    whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
    whileTap={disabled ? {} : { scale: 0.98 }}
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={`w-full py-3.5 px-6 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-800 font-bold rounded-20 shadow-sm transition-all select-none outline-none focus:ring-2 focus:ring-zinc-100 ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    } ${className}`}
  >
    {children}
  </motion.button>
);

// Form Input
export const FormInput = ({ label, id, type = "text", placeholder = "", value, onChange, className = "", required = false }) => (
  <div className="space-y-1.5 w-full">
    {label && (
      <label htmlFor={id} className="text-xs font-bold text-zinc-550 uppercase tracking-wider block ml-1 select-none">
        {label}
      </label>
    )}
    <input
      type={type}
      id={id}
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full py-3.5 px-4.5 bg-zinc-50 border border-zinc-200 focus:border-primary text-zinc-800 placeholder-zinc-400 rounded-20 outline-none text-sm transition-all shadow-sm font-semibold ${className}`}
    />
  </div>
);

// Standard Animated Modal
export const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Dialog body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-white border border-zinc-100 rounded-24 shadow-premium w-full max-w-lg p-6 overflow-hidden z-10 text-zinc-800 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <h3 className="text-lg font-extrabold text-zinc-850">{title}</h3>
            <button onClick={onClose} className="p-1 hover:bg-zinc-50 rounded-full transition-colors">
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto py-4 flex-grow pr-1 scrollbar-thin">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// Animated Bottom Sheet (App-style on mobile)
export const BottomSheet = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-55 flex items-end justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/35 backdrop-blur-xs"
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative bg-white border-t border-zinc-200/50 rounded-t-24 shadow-premium w-full max-w-xl max-h-[90vh] p-6 pb-8 overflow-hidden z-10 text-zinc-800 flex flex-col"
        >
          {/* Grab handle */}
          <div className="w-12 h-1 bg-zinc-200 rounded-full mx-auto mb-4.5 flex-shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <h3 className="text-lg font-extrabold text-zinc-850">{title}</h3>
            <button onClick={onClose} className="p-1 hover:bg-zinc-50 rounded-full transition-colors">
              <X className="w-5 h-5 text-zinc-550" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto py-4 flex-grow scrollbar-thin">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// Toast alert notification
export const Toast = ({ message, type = "success", show, onClose }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-80 z-55 flex items-center gap-3 bg-zinc-900 border border-zinc-800 text-white rounded-20 p-4.5 shadow-premium"
      >
        {type === "success" ? (
          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        )}
        <p className="text-xs font-semibold flex-grow">{message}</p>
        <button onClick={onClose} className="p-0.5 hover:bg-zinc-800 rounded-full text-zinc-400">
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

// Loading Skeleton Block
export const LoadingSkeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-zinc-150 rounded-20 ${className}`} />
);

// Empty state illustrator box
export const EmptyState = ({ title, desc, actionText, onAction }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-zinc-200 rounded-24 shadow-sm max-w-md mx-auto space-y-4">
    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
      <Sparkles className="w-8 h-8 text-primary" />
    </div>
    <div className="space-y-1.5">
      <h4 className="text-lg font-bold text-zinc-800">{title}</h4>
      <p className="text-xs md:text-sm text-zinc-450 leading-relaxed font-semibold">{desc}</p>
    </div>
    {actionText && (
      <PrimaryButton onClick={onAction} className="w-fit px-6 text-xs">
        {actionText}
      </PrimaryButton>
    )}
  </div>
);
