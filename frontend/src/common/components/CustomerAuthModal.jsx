import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, Phone, LogIn, UserPlus, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
];

export default function CustomerAuthModal({ isOpen, onClose, onSuccess, initialMode = 'login', titlePrompt }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  
  const [countryCode, setCountryCode] = useState('+91');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    mobile: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    if (e.target.name === 'mobile') {
      const sanitized = e.target.value.replace(/\D/g, '').slice(0, 10);
      setForm({ ...form, mobile: sanitized });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!form.email || !form.password) {
          setError('Please enter your email and password');
          setLoading(false);
          return;
        }
        const res = await login(form.email, form.password);
        if (res.success) {
          setSuccessMsg('Signed in successfully!');
          setTimeout(() => {
            if (onSuccess) onSuccess(res.user);
            onClose();
          }, 600);
        } else {
          setError(res.message || 'Invalid email or password');
        }
      } else {
        if (!form.fullName || !form.email || !form.password || !form.mobile) {
          setError('Please fill in all required fields');
          setLoading(false);
          return;
        }
        if (form.mobile.length !== 10) {
          setError('Mobile phone number must be strictly 10 digits');
          setLoading(false);
          return;
        }
        const res = await register({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          mobile: `${countryCode} ${form.mobile}`,
          role: 'customer'
        });
        if (res.success) {
          setSuccessMsg('Account created successfully!');
          setTimeout(() => {
            if (onSuccess) onSuccess(res.user);
            onClose();
          }, 600);
        } else {
          setError(res.message || 'Registration failed');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden w-full max-w-md relative"
        >
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-amber-100 text-xs font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" /> The Shine Lounge Member Access
            </div>
            <h3 className="text-xl font-extrabold">{titlePrompt || (mode === 'login' ? 'Welcome Back!' : 'Create Your Account')}</h3>
            <p className="text-xs text-amber-100 mt-1">
              {mode === 'login' 
                ? 'Sign in to access your bookings, active passes, and VIP rewards.' 
                : 'Join The Shine Lounge to track orders, save favorite brews & book instantly.'}
            </p>

            {/* Mode Switch Tabs */}
            <div className="mt-4 grid grid-cols-2 p-1 bg-black/20 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'login' ? 'bg-white text-amber-900 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'register' ? 'bg-white text-amber-900 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> New Account
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
                ⚠️ {error}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> {successMsg}
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your.email@domain.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-1">
                  Mobile Number <span className="text-[10px] text-gray-400 font-normal">(10 digits required)</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative">
                    <select
                      value={countryCode}
                      onChange={e => setCountryCode(e.target.value)}
                      className="h-full pl-2 pr-6 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white appearance-none cursor-pointer"
                    >
                      {COUNTRY_CODES.map((item) => (
                        <option key={item.code + item.country} value={item.code}>
                          {item.flag} {item.code}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-gray-400">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      name="mobile"
                      value={form.mobile}
                      onChange={handleChange}
                      placeholder="9820012345"
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1 text-[10px]">
                  <span className={form.mobile.length === 10 ? "text-emerald-600 font-extrabold" : "text-gray-400 font-medium"}>
                    {form.mobile.length === 10 ? "✓ 10 digits entered" : "Enter 10 digits"}
                  </span>
                  <span className="text-gray-400 font-medium">{form.mobile.length}/10</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (mode === 'login' ? 'Sign In Now' : 'Create Customer Account')}
            </button>

            <div className="text-center pt-2 border-t border-gray-100">
              <span className="text-[11px] text-gray-500">
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                className="text-[11px] font-extrabold text-amber-600 hover:underline ml-1"
              >
                {mode === 'login' ? 'Create one here' : 'Sign in here'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
