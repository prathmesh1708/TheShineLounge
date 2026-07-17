import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const TEAM = [
  {
    name: "Vikram Rathore",
    role: "Master Coating Installer",
    bio: "Certified 9H nanoshield curator with 8+ years correction experience. Specializes in exotic clear coats.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
  },
  {
    name: "Priya Nair",
    role: "Interior Restorer Specialist",
    bio: "Dry steam sanitization expert. Deep knowledge of fine leather restoration, dye fix, and odor extraction.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
  },
  {
    name: "Kabir Mehta",
    role: "Paint Protection Film Lead",
    bio: "Military-grade PPF cutting & heating expert. Wraps bumpers and door sills seamlessly.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
  }
];

export default function CarDetailingAboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-12 max-w-4xl mx-auto text-zinc-800"
    >
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-850">About DetailPro</h1>
        <p className="text-xs md:text-sm text-zinc-555 font-semibold mt-1">Our story, mission, and the master detailers behind the gloss.</p>
      </div>

      {/* Narrative block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-800">The Passion for Perfection</h2>
          <p className="text-xs md:text-sm text-zinc-600 leading-relaxed font-semibold">
            Founded in 2024 by a group of performance car enthusiasts in Indore, DetailPro was born out of dissatisfaction with automated tunnel car washes that damaged clear coats. We wanted to create an elite, client-centric service engineered around chemistry and luxury care.
          </p>
          <p className="text-xs md:text-sm text-zinc-600 leading-relaxed font-semibold">
            Today, our specialized, self-contained detailing trucks deliver showroom restoration straight to your driveway. We use custom pH-neutral active foam, deionized water tanks, and advanced curing heaters to ensure paint perfection.
          </p>
        </div>

        <div className="rounded-24 overflow-hidden border border-zinc-200 shadow-premium h-64 bg-zinc-50">
          <img
            src="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=800"
            alt="About us detail work"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Statistics board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white border border-zinc-200/80 rounded-24 p-6 text-center space-y-1 shadow-sm">
          <span className="text-3xl md:text-4xl font-extrabold text-luxury-emerald">15k+</span>
          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Cars Detailed</span>
        </div>
        <div className="bg-white border border-zinc-200/80 rounded-24 p-6 text-center space-y-1 shadow-sm">
          <span className="text-3xl md:text-4xl font-extrabold text-luxury-emerald">4.95</span>
          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Average Star Rating</span>
        </div>
        <div className="bg-white border border-zinc-200/80 rounded-24 p-6 text-center space-y-1 shadow-sm">
          <span className="text-3xl md:text-4xl font-extrabold text-luxury-emerald">25+</span>
          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Certified Detailers</span>
        </div>
        <div className="bg-white border border-zinc-200/80 rounded-24 p-6 text-center space-y-1 shadow-sm">
          <span className="text-3xl md:text-4xl font-extrabold text-luxury-emerald">100%</span>
          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Deionized Water</span>
        </div>
      </div>

      {/* Team profiles */}
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-800">Our Master Detailers</h2>
          <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1">Specialists trained to diagnose paint thickness and interior leather requirements.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEAM.map((member, idx) => (
            <div key={idx} className="bg-white border border-zinc-200/80 rounded-24 p-6 text-center space-y-4 hover:border-zinc-300 transition-all shadow-sm">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-luxury-emerald shadow-sm"
              />
              <div className="space-y-0.5">
                <h4 className="font-bold text-base text-zinc-800">{member.name}</h4>
                <span className="text-[10px] text-luxury-emerald uppercase font-bold tracking-wider">{member.role}</span>
              </div>
              <p className="text-xs text-zinc-550 leading-relaxed px-2 font-medium">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Core mission block */}
      <div className="bg-luxury-emerald/5 border border-luxury-emerald/20 rounded-24 p-8 text-center space-y-3 max-w-2xl mx-auto shadow-sm">
        <Sparkles className="w-8 h-8 text-luxury-emerald mx-auto fill-current" />
        <h3 className="font-extrabold text-lg text-zinc-850">Our Mission</h3>
        <p className="text-xs md:text-sm text-zinc-650 leading-relaxed font-semibold">
          To provide precision aesthetic preservation for performance, luxury, and daily vehicles. We reject corner-cutting and cheap alkaline detergents. Our detail shop represents paint correction craftsmanship and nanotech clear-coat shield systems.
        </p>
      </div>

    </motion.div>
  );
}
