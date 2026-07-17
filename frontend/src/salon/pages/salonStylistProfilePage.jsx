import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Award, Heart, Shield, ArrowLeft, Calendar as CalIcon, MessageSquare } from 'lucide-react';

import { getStylistById, REVIEWS } from '../services/salonApi';
import SalonReviewCard from '../components/salonReviewCard';

export default function SalonStylistProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stylist, setStylist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getStylistById(id).then(res => {
      setStylist(res);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-zinc-400 font-bold tracking-wider uppercase">Loading Profile...</span>
      </div>
    );
  }

  if (!stylist) {
    return (
      <div className="text-center py-16 space-y-4">
        <h3 className="text-xl font-bold">Stylist Not Found</h3>
        <p className="text-zinc-500 text-sm">The hair stylist or therapist profile you requested cannot be located.</p>
        <Link to="/salon" className="inline-block py-2.5 px-5 bg-primary text-white rounded-15 font-bold text-xs">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const stylistReviews = REVIEWS.filter(r => r.stylist === stylist.name);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-24 text-zinc-800"
    >
      {/* Back Link */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors uppercase tracking-wider ml-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Profile Card & Bio details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Info Box */}
          <div className="bg-white border border-zinc-200/80 rounded-24 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start shadow-sm">
            <img
              src={stylist.avatar}
              alt={stylist.name}
              className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-4 border-primary/10 shadow-sm flex-shrink-0"
            />
            
            <div className="space-y-4 text-center md:text-left flex-grow">
              <div className="space-y-1.5">
                <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-850 tracking-tight">{stylist.name}</h1>
                <p className="text-xs md:text-sm text-primary font-extrabold uppercase tracking-widest">{stylist.specialization}</p>
              </div>

              {/* Stats Row */}
              <div className="flex justify-center md:justify-start items-center gap-6 pt-1">
                <div className="text-center md:text-left">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wide block">Rating</span>
                  <div className="flex items-center gap-1 text-sm font-extrabold text-zinc-800 mt-0.5 justify-center md:justify-start">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>{stylist.rating}</span>
                  </div>
                </div>
                <div className="w-px h-6 bg-zinc-200" />
                <div className="text-center md:text-left">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wide block">Experience</span>
                  <span className="text-sm font-extrabold text-zinc-800 block mt-0.5">{stylist.experience}</span>
                </div>
                <div className="w-px h-6 bg-zinc-200" />
                <div className="text-center md:text-left">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wide block">Jobs Done</span>
                  <span className="text-sm font-extrabold text-zinc-800 block mt-0.5">380+ Visits</span>
                </div>
              </div>

              <hr className="border-zinc-100" />

              {/* Bio About */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-400">About Stylist</h3>
                <p className="text-xs md:text-sm text-zinc-550 leading-relaxed font-semibold">
                  {stylist.about}
                </p>
              </div>
            </div>
          </div>

          {/* Portfolio Grid */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-xl text-zinc-850">Portfolio Showcase</h3>
            <div className="grid grid-cols-3 gap-4">
              {stylist.portfolio.map((img, idx) => (
                <div key={idx} className="h-28 md:h-44 bg-zinc-100 rounded-20 overflow-hidden shadow-sm border border-zinc-200/50">
                  <img
                    src={img}
                    alt="Stylist work sample"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Time slots scheduling card */}
        <div className="space-y-6 lg:sticky lg:top-24">
          
          {/* Slots Card */}
          <div className="bg-gradient-to-b from-[#FDFCF7] to-white border border-zinc-200/80 rounded-24 p-6 shadow-premium space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                <CalIcon className="w-4 h-4 text-primary" />
                <span>Today's Available Slots</span>
              </div>
              <h3 className="text-lg font-extrabold text-zinc-850 pt-2">Schedule Time Slot</h3>
            </div>

            {/* Time Slot Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              {stylist.timeSlots.map((slot, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(`/salon/booking?stylist=${stylist.id}&time=${slot}`)}
                  className="py-3 px-4.5 bg-white border border-zinc-200 hover:border-primary text-zinc-700 hover:text-primary transition-all text-xs font-bold rounded-18 text-center hover:bg-primary/5"
                >
                  {slot}
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate(`/salon/booking?stylist=${stylist.id}`)}
              className="w-full py-4 bg-primary hover:bg-primary/95 text-white text-xs font-extrabold rounded-20 shadow-premium transition-all text-center block"
            >
              Configure Service Booking
            </button>
          </div>

          {/* Secure Shield Info */}
          <div className="bg-[#FAF9F6] border border-zinc-200 rounded-24 p-5 flex items-start gap-4 shadow-sm">
            <Shield className="w-8 h-8 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-sm text-zinc-800">Shine Lounge Protection</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold mt-1">
                Your styling visits are covered under our customer satisfaction shield. Reschedule or cancel with zero penalty up to 2 hours beforehand.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Reviews list for this stylist */}
      {stylistReviews.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-zinc-150 max-w-4xl">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-800">Guest Feedback ({stylistReviews.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stylistReviews.map((rev) => (
              <SalonReviewCard key={rev.id} review={rev} />
            ))}
          </div>
        </div>
      )}

    </motion.div>
  );
}
