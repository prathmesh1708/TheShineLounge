import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ShieldAlert, Award, Star, Settings, Key, Phone, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { FormInput, PrimaryButton, Toast } from '../components/carDetailingUI';

export default function CarDetailingProfilePage() {
  const [activeTab, setActiveTab] = useState("info");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      fullName: "Ramesh Singh",
      email: "ramesh.singh@outlook.com",
      phone: "+91 98260 12345",
      alternatePhone: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const handleUpdateProfile = (data) => {
    setToastMsg("Profile details updated successfully!");
    setToastOpen(true);
  };

  const handleUpdatePassword = (data) => {
    if (data.newPassword !== data.confirmPassword) {
      setToastMsg("New passwords do not match!");
      setToastOpen(true);
      return;
    }
    setToastMsg("Security credentials updated successfully!");
    setToastOpen(true);
  };

  const sidebarLinks = [
    { id: "info", label: "Personal Information", icon: <User className="w-4 h-4" /> },
    { id: "security", label: "Security & Password", icon: <Key className="w-4 h-4" /> }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 max-w-4xl mx-auto text-zinc-800"
    >
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-850">My Profile</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1">Manage your detailing profile details and security settings.</p>
      </div>

      {/* Grid: Sidebar on Left, Content on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Sidebar profile summary (4 columns) */}
        <div className="lg:col-span-4 bg-white border border-zinc-200/80 rounded-24 p-6 space-y-6 shadow-premium flex flex-col justify-between">
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
                alt="Ramesh Singh profile avatar"
                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-luxury-emerald shadow-sm"
              />
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-zinc-800">Ramesh Singh</h3>
                <span className="text-[10px] text-zinc-450 block font-bold uppercase tracking-wider">MEMBER SINCE JULY 2024</span>
              </div>
            </div>

            {/* Loyalty tier badge */}
            <div className="bg-luxury-emerald/10 border border-luxury-emerald/20 rounded-20 p-4 flex items-center gap-3 shadow-sm">
              <Award className="w-7 h-7 text-luxury-emerald" />
              <div>
                <span className="text-[9px] text-zinc-450 font-bold block uppercase">Loyalty Tier</span>
                <strong className="text-sm font-extrabold text-luxury-emerald">Gloss Gold Member</strong>
              </div>
            </div>

            {/* Sidebar navigation list */}
            <div className="space-y-2 pt-2">
              {sidebarLinks.map((link) => {
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => setActiveTab(link.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-20 text-xs font-bold border transition-all ${
                      isActive
                        ? 'bg-luxury-emerald text-white border-luxury-emerald shadow-premium'
                        : 'bg-zinc-50 border-zinc-150 text-zinc-650 hover:bg-zinc-100'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick summary metrics */}
          <div className="border-t border-zinc-100 pt-5 text-center flex justify-around text-zinc-500 font-semibold text-xs">
            <div>
              <span className="text-base font-extrabold text-zinc-800 block">4</span>
              <span>Details</span>
            </div>
            <div className="border-r border-zinc-200 h-8 self-center" />
            <div>
              <span className="text-base font-extrabold text-zinc-800 block">Gold</span>
              <span>Tier</span>
            </div>
          </div>
        </div>

        {/* Right Side: Tab Forms (8 columns) */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-24 p-6 md:p-8 space-y-6 shadow-premium">
          
          {/* Tab 1: Personal Info */}
          {activeTab === "info" && (
            <form onSubmit={handleSubmit(handleUpdateProfile)} className="space-y-5">
              <h3 className="text-lg font-bold border-b border-zinc-100 pb-2 text-zinc-800">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Full Name"
                  name="fullName"
                  register={register}
                  errors={errors}
                  required
                />
                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  register={register}
                  errors={errors}
                  required
                  disabled
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Phone Number"
                  name="phone"
                  register={register}
                  errors={errors}
                  required
                />
                <FormInput
                  label="Alternate Number (Optional)"
                  name="alternatePhone"
                  placeholder="e.g. 98260XXXXX"
                  register={register}
                  errors={errors}
                />
              </div>

              <div className="pt-2">
                <PrimaryButton type="submit" icon={<Save className="w-4.5 h-4.5" />}>
                  Save Profile Changes
                </PrimaryButton>
              </div>
            </form>
          )}

          {/* Tab 2: Security & Password */}
          {activeTab === "security" && (
            <form onSubmit={handleSubmit(handleUpdatePassword)} className="space-y-5">
              <h3 className="text-lg font-bold border-b border-zinc-100 pb-2 text-zinc-800">
                Security Settings
              </h3>

              <FormInput
                label="Current Password"
                name="currentPassword"
                type="password"
                placeholder="••••••••"
                register={register}
                errors={errors}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="New Password"
                  name="newPassword"
                  type="password"
                  placeholder="••••••••"
                  register={register}
                  errors={errors}
                  required
                />
                <FormInput
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  register={register}
                  errors={errors}
                  required
                />
              </div>

              <div className="pt-2">
                <PrimaryButton type="submit" icon={<Key className="w-4.5 h-4.5" />}>
                  Update Password
                </PrimaryButton>
              </div>
            </form>
          )}

        </div>

      </div>

      {/* Toast Feedback */}
      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message={toastMsg}
        type={toastMsg.includes("match") ? "warning" : "success"}
      />

    </motion.div>
  );
}
