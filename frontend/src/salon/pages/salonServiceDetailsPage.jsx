import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Star, ShieldCheck, CheckCircle2, ChevronRight, HelpCircle, ArrowLeft } from 'lucide-react';

import { getServiceById, SERVICES, REVIEWS, FAQS } from '../services/salonApi';
import SalonFAQAccordion from '../components/salonFAQAccordion';
import SalonReviewCard from '../components/salonReviewCard';
import SalonServiceCard from '../components/salonServiceCard';

export default function SalonServiceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getServiceById(id).then(res => {
      setService(res);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-zinc-400 font-bold tracking-wider uppercase">Loading Details...</span>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-16 space-y-4">
        <h3 className="text-xl font-bold">Service Not Found</h3>
        <p className="text-zinc-500 text-sm">The beauty treatment you are looking for does not exist or has been removed.</p>
        <Link to="/salon/services" className="inline-block py-2.5 px-5 bg-primary text-white rounded-15 font-bold text-xs">
          Back to Menu
        </Link>
      </div>
    );
  }

  const galleryImages = [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400"
  ];

  const serviceReviews = REVIEWS.filter(r => r.service.toLowerCase().includes(service.name.toLowerCase().split(' ')[0].toLowerCase()));
  const recommendedServices = SERVICES.filter(s => s.id !== service.id && s.category === service.category).slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-12 md:space-y-10 md:pb-16 text-zinc-800"
    >
      {/* Back Link */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors uppercase tracking-wider ml-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Menu</span>
      </button>

      {/* Main Grid: Banner Image & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left/Middle: Banner Image, What is Included & Benefits */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Banner Card */}
          <div className="relative h-[250px] md:h-[380px] rounded-24 overflow-hidden shadow-premium border border-zinc-200/50">
            <img
              src={service.image}
              alt={service.name}
              className="w-full h-full object-cover"
            />
            {/* Absolute pricing tag */}
            <span className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-xs py-2 px-4 rounded-full text-base md:text-lg font-extrabold text-zinc-850 shadow-premium border border-white/20">
              ${service.price}
            </span>
          </div>

          {/* Details Content Card */}
          <div className="bg-white border border-zinc-200/80 rounded-24 p-6 md:p-8 space-y-6 shadow-sm">
            <div className="space-y-3">
              <span className="text-xs text-primary font-extrabold uppercase tracking-wider">{service.category}</span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-850 tracking-tight">{service.name}</h1>
              
              <div className="flex items-center gap-4 text-xs font-semibold text-zinc-450 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span>{service.duration}</span>
                </span>
                <span className="text-zinc-200">|</span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{service.rating} ({service.reviewsCount} reviews)</span>
                </span>
              </div>
            </div>

            <hr className="border-zinc-100" />

            <div className="space-y-3">
              <h3 className="font-extrabold text-lg text-zinc-850">Description</h3>
              <p className="text-xs md:text-sm text-zinc-550 leading-relaxed font-semibold">
                {service.description}
              </p>
            </div>

            {/* Inclusions Check List */}
            <div className="space-y-4 pt-4 border-t border-zinc-50">
              <h3 className="font-extrabold text-lg text-zinc-850">What's Included</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {service.inclusions.map((incl, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start text-xs md:text-sm text-zinc-650 font-medium">
                    <CheckCircle2 className="w-4.5 h-4.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{incl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gallery Slider section */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-xl text-zinc-850">Treatment Gallery</h3>
            <div className="grid grid-cols-3 gap-4">
              {galleryImages.map((img, idx) => (
                <div key={idx} className="h-28 md:h-40 bg-zinc-100 rounded-20 overflow-hidden shadow-sm border border-zinc-200/50">
                  <img
                    src={img}
                    alt="Gallery item"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right: Booking Floating Card panel */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="bg-gradient-to-b from-[#FDFCF7] to-white border border-zinc-200/80 rounded-24 p-6 shadow-premium space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">Estimated Price</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-zinc-850">${service.price}</span>
                <span className="text-xs text-zinc-400 font-semibold uppercase">starting rate</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed pt-1">
                Tax and processing items included. Rescheduling is free of cost.
              </p>
            </div>

            <div className="border-t border-zinc-100 pt-5 space-y-3.5 text-xs text-zinc-600 font-semibold">
              <div className="flex justify-between items-center">
                <span>Duration</span>
                <span className="font-bold text-zinc-800">{service.duration}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Rating</span>
                <span className="font-bold text-zinc-800">{service.rating} ★</span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/salon/booking?service=${service.id}`)}
              className="w-full py-4 bg-primary hover:bg-primary/95 text-white text-sm font-extrabold rounded-20 shadow-premium transition-all text-center block"
            >
              Book Salon Appointment
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="bg-primary/5 border border-primary/20 rounded-24 p-5 flex items-start gap-4">
            <ShieldCheck className="w-8 h-8 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-sm text-zinc-800">Certified Stylist Guarantee</h4>
              <p className="text-[11px] text-zinc-550 leading-relaxed font-semibold mt-1">
                All beauty artists are licensed professionals trained in luxury styling treatments and sanitation protocols. Reschedule easily from your booking manager.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* FAQs Accordion */}
      <div className="space-y-6 pt-6 border-t border-zinc-150 max-w-4xl">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
        </div>
        <SalonFAQAccordion items={FAQS} />
      </div>

      {/* Service specific reviews */}
      {serviceReviews.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-zinc-150">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-850">Recent Reviews for {service.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {serviceReviews.map((rev) => (
              <SalonReviewCard key={rev.id} review={rev} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Services */}
      {recommendedServices.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-zinc-150">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-800">You May Also Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {recommendedServices.map((rec) => (
              <SalonServiceCard key={rec.id} service={rec} />
            ))}
          </div>
        </div>
      )}

    </motion.div>
  );
}
