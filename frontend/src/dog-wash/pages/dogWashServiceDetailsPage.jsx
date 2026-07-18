import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Star, ArrowLeft, ShieldCheck, HelpCircle, Check, ArrowRight } from 'lucide-react';

import { getServiceById, REVIEWS, FAQS } from '../services/dogWashApi';
import { PrimaryButton, SkeletonLoader } from '../components/dogWashUI';

export default function DogWashServiceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeImg, setActiveImg] = useState("");
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    getServiceById(id).then(res => {
      if (res) {
        setService(res);
        setActiveImg(res.image);
        setGallery([
          res.image,
          "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=600",
          "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=600",
          "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600"
        ]);
      }
      setLoading(false);
    });
  }, [id]);

  const handleBook = () => {
    navigate(`/dog-wash/booking?service=${service.id}`);
  };

  if (loading) {
    return <SkeletonLoader type="card" count={1} />;
  }

  if (!service) {
    return (
      <div className="bg-white border border-zinc-200 rounded-24 p-12 text-center max-w-md mx-auto space-y-4 shadow-premium">
        <h3 className="text-xl font-bold">Service Not Found</h3>
        <p className="text-sm text-zinc-500 font-semibold">The grooming service you requested does not exist.</p>
        <button onClick={() => navigate('/dog-wash/services')} className="py-2.5 px-5 bg-grooming-primary text-white rounded-20">
          Back to Menu
        </button>
      </div>
    );
  }

  const matchingReviews = REVIEWS.filter((r, idx) => r.service.toLowerCase().includes(service.category.toLowerCase()) || r.service.toLowerCase().includes(service.name.toLowerCase()) || idx < 2);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 md:space-y-10 text-zinc-800"
    >
      <button
        onClick={() => navigate('/dog-wash/services')}
        className="flex items-center gap-2 text-sm text-zinc-450 hover:text-zinc-800 transition-colors font-bold"
      >
        <ArrowLeft className="w-4.5 h-4.5" />
        <span>Back to Services Menu</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Photos & Descriptions */}
        <div className="lg:col-span-7 space-y-8">
          
          <div className="space-y-4">
            <div className="h-[360px] md:h-[420px] rounded-24 overflow-hidden border border-zinc-200 shadow-premium bg-zinc-100">
              <img
                src={activeImg}
                alt={service.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-1.5">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(img)}
                  className={`relative flex-shrink-0 w-24 h-16 rounded-16 overflow-hidden border transition-all ${
                    activeImg === img ? 'border-grooming-primary ring-2 ring-grooming-primary/20' : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-850">{service.name}</h1>
            <p className="text-zinc-600 text-sm md:text-base leading-relaxed font-semibold">{service.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {service.features.map((feat, idx) => (
                <div key={idx} className="flex gap-3 p-4 bg-white border border-zinc-200/85 rounded-20 items-start shadow-sm">
                  <Check className="w-4.5 h-4.5 text-grooming-primary flex-shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-zinc-700 font-bold">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-xl font-bold tracking-tight text-zinc-800">What's Included</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm text-zinc-550 font-bold">
              {service.inclusions.map((inc, idx) => (
                <li key={idx} className="flex gap-2.5 items-center">
                  <span className="w-1.5 h-1.5 bg-grooming-primary rounded-full" />
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Right Widget */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          <div className="bg-white border border-zinc-200 rounded-24 p-6 md:p-8 space-y-6 shadow-premium">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Est. Duration</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="w-4.5 h-4.5 text-grooming-primary" />
                  <span className="text-base font-bold text-zinc-850">{service.duration}</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Price Starts At</span>
                <span className="text-3xl font-extrabold text-zinc-855 mt-0.5">${service.price}</span>
              </div>
            </div>

            <div className="flex gap-3 p-4 bg-grooming-primary/5 border border-grooming-primary/20 rounded-20 items-start text-xs text-zinc-600 font-medium leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-grooming-primary flex-shrink-0 mt-0.5" />
              <span>
                Includes <strong>100% Gentle Handling Guarantee</strong>. Safe pH-balanced medicated shampoos, silent low-stress blowing, and certified experts.
              </span>
            </div>

            <PrimaryButton onClick={handleBook} icon={<ArrowRight className="w-5 h-5" />}>
              Book Grooming Slot
            </PrimaryButton>
          </div>

          <div className="bg-white border border-zinc-200 rounded-24 p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-zinc-800">Pet Rating</h3>
              <div className="flex items-center gap-1 text-sm font-bold text-yellow-600 bg-yellow-400/10 px-2.5 py-0.5 rounded-md border border-yellow-400/20">
                <Star className="w-4.5 h-4.5 fill-current" />
                <span>{service.rating} / 5.0</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
              Based on {service.reviewsCount} verified pet spa visits.
            </p>
          </div>

        </div>

      </div>

      {/* Reviews */}
      {matchingReviews.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-zinc-150">
          <h3 className="text-2xl font-bold tracking-tight text-zinc-800">Owner Feedback</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matchingReviews.map((rev) => (
              <div key={rev.id} className="bg-white border border-zinc-200 rounded-24 p-6 space-y-4 shadow-sm text-zinc-850">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img src={rev.avatar} alt={rev.name} className="w-10 h-10 rounded-full object-cover border border-zinc-150" />
                    <div>
                      <h4 className="font-bold text-sm text-zinc-800">{rev.name}</h4>
                      <span className="text-[10px] text-zinc-450 block">{rev.date}</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-yellow-600 bg-yellow-400/10 border border-yellow-400/15 py-1 px-2.5 rounded-full">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-zinc-200'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-zinc-600 italic leading-relaxed font-medium">"{rev.comment}"</p>
                <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  <span>{rev.vehicle}</span>
                  <span className="text-grooming-primary bg-grooming-primary/10 px-2 py-0.5 rounded-full border border-grooming-primary/15">Verified Spa Trip</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relevant FAQs */}
      <div className="space-y-6 pt-6 border-t border-zinc-150">
        <h3 className="text-xl font-bold tracking-tight">Relevant FAQs</h3>
        <div className="max-w-3xl">
          <FAQAccordionItem faq={FAQS[0]} />
          <FAQAccordionItem faq={FAQS[1]} className="mt-3" />
        </div>
      </div>

    </motion.div>
  );
}

function FAQAccordionItem({ faq, className = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`bg-white border border-zinc-200 rounded-20 overflow-hidden shadow-sm ${className}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4.5 text-left text-sm font-bold text-zinc-805 hover:text-grooming-primary">
        <span>{faq.q}</span>
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="p-4.5 text-xs text-zinc-550 leading-relaxed border-t border-zinc-100 pt-3 font-semibold">
          {faq.a}
        </div>
      )}
    </div>
  );
}
