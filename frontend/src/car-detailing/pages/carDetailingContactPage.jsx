import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, MessageSquare, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { FormInput, FormTextarea, PrimaryButton, Toast } from '../components/carDetailingUI';

export default function CarDetailingContactPage() {
  const [toastOpen, setToastOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "Detailing Inquiry",
      message: ""
    }
  });

  const onSubmit = (data) => {
    setToastOpen(true);
    reset();
  };

  const contactInfo = [
    {
      icon: <Phone className="w-5 h-5 text-luxury-emerald" />,
      label: "Call or WhatsApp",
      value: "+91 98765 43210",
      desc: "Instant booking support"
    },
    {
      icon: <Mail className="w-5 h-5 text-luxury-emerald" />,
      label: "Support Email",
      value: "support@detailpro.in",
      desc: "Response within 2 hours"
    },
    {
      icon: <MapPin className="w-5 h-5 text-luxury-emerald" />,
      label: "Certified Workshop",
      value: "Vijay Nagar Square, Indore",
      desc: "Open for walk-in inspections"
    },
    {
      icon: <Clock className="w-5 h-5 text-luxury-emerald" />,
      label: "Operations Hours",
      value: "07:30 AM - 08:30 PM",
      desc: "Open 7 Days a week"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 md:space-y-10 max-w-4xl mx-auto text-zinc-800"
    >
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-850">Contact Us</h1>
        <p className="text-xs md:text-sm text-zinc-555 font-semibold mt-1">Talk to our detailing consultants or schedule high-end paint correction.</p>
      </div>

      {/* Main Grid: Info on Left, Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Contact Info Panel (5 columns) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          <div className="grid grid-cols-1 gap-6 flex-grow">
            {contactInfo.map((info, idx) => (
              <div key={idx} className="bg-white border border-zinc-200/80 rounded-24 p-5 flex items-start gap-4 shadow-sm">
                <div className="p-3 bg-zinc-100 rounded-20 flex-shrink-0">
                  {info.icon}
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">{info.label}</span>
                  <strong className="text-sm md:text-base text-zinc-800 mt-1 block">{info.value}</strong>
                  <p className="text-[11px] text-zinc-500 font-semibold mt-0.5">{info.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social details in bottom */}
          <div className="bg-white border border-zinc-200/80 rounded-24 p-5 flex items-center justify-between shadow-sm">
            <span className="text-xs text-zinc-450 font-bold uppercase tracking-wider">Social Handles</span>
            <div className="flex gap-3">
              <a href="#" className="p-2 bg-zinc-100 hover:bg-luxury-emerald hover:text-white rounded-full transition-colors text-zinc-650">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4.5 h-4.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="p-2 bg-zinc-100 hover:bg-luxury-emerald hover:text-white rounded-full transition-colors text-zinc-650">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4.5 h-4.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel (7 columns) */}
        <div className="lg:col-span-7 bg-white border border-zinc-200/85 rounded-24 p-6 md:p-8 space-y-6 shadow-premium">
          <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
            <MessageSquare className="w-5 h-5 text-luxury-emerald" />
            <span>Send detailing Inquiry</span>
          </h3>

          <form onSubmit={onSubmit} className="space-y-4">
            <FormInput
              label="Your Full Name"
              name="name"
              placeholder="e.g. Anand Sharma"
              register={register}
              errors={errors}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Email Address"
                name="email"
                type="email"
                placeholder="e.g. anand@outlook.com"
                register={register}
                errors={errors}
                required
              />
              <FormInput
                label="Phone Number"
                name="phone"
                placeholder="e.g. 98260XXXXX"
                register={register}
                errors={errors}
                required
              />
            </div>

            <FormInput
              label="Subject"
              name="subject"
              placeholder="e.g. Audi A4 Ceramic Coating pricing"
              register={register}
              errors={errors}
              required
            />

            <FormTextarea
              label="Inquiry Message"
              name="message"
              placeholder="Mention vehicle type, paint condition (swirls, scratches), and preferred services..."
              rows={4}
              register={register}
              errors={errors}
              required
            />

            <PrimaryButton type="submit">Submit Inquiry</PrimaryButton>
          </form>
        </div>

      </div>

      {/* Certified Quality Shield */}
      <div className="bg-luxury-emerald/5 border border-luxury-emerald/20 rounded-24 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 text-zinc-800 max-w-3xl mx-auto shadow-sm">
        <ShieldCheck className="w-12 h-12 text-luxury-emerald flex-shrink-0" />
        <div className="space-y-1.5 text-center md:text-left">
          <h4 className="font-extrabold text-lg text-zinc-850">Certified Detail Shop Support</h4>
          <p className="text-xs md:text-sm text-zinc-550 leading-relaxed font-semibold">
            All inquiries are routed directly to Vikram Rathore (Coating Lead) or Priya Nair (Interior Specialist). We aim to respond with precise estimates and recommended clear-coat options within 2 business hours.
          </p>
        </div>
      </div>

      {/* Toast Feedback */}
      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message="Thank you! Detailing inquiry submitted successfully. We'll contact you shortly."
        type="success"
      />

    </motion.div>
  );
}
