import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Award, Sparkles, AlertCircle } from 'lucide-react';

import { REVIEWS } from '../services/salonApi';
import SalonReviewCard from '../components/salonReviewCard';
import { PrimaryButton, Modal, FormInput } from '../components/salonUI';

export default function SalonReviewsPage() {
  const [reviewsList, setReviewsList] = useState(REVIEWS);
  const [showAddReview, setShowAddReview] = useState(false);

  // Review Form state
  const [revName, setRevName] = useState("");
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState("");
  const [revService, setRevService] = useState("Premium Hair Cut");

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!revName.trim() || !revComment.trim()) return;

    const newRev = {
      id: reviewsList.length + 1,
      name: revName,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100",
      rating: Number(revRating),
      date: new Date().toISOString().split('T')[0],
      service: revService,
      comment: revComment
    };

    setReviewsList([newRev, ...reviewsList]);
    setRevName("");
    setRevRating(5);
    setRevComment("");
    setShowAddReview(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-12 md:space-y-10 md:pb-16 text-zinc-800"
    >
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-855">Guest Reviews</h1>
          <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1.5 font-sans">
            Read transparent styling feedback from customers who visited the Shine Lounge Salon.
          </p>
        </div>
        
        <button
          onClick={() => setShowAddReview(true)}
          className="py-3 px-5 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-15 transition-all shadow-premium"
        >
          Write Review
        </button>
      </div>

      {/* Ratings Meter Breakdown Dashboard */}
      <div className="bg-white border border-zinc-200/85 rounded-24 p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        
        {/* Overall Number */}
        <div className="text-center space-y-2 border-b md:border-b-0 md:border-r border-zinc-100 pb-6 md:pb-0 md:pr-8">
          <span className="text-5xl font-extrabold text-zinc-850">4.9</span>
          <div className="flex items-center justify-center gap-0.5 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4.5 h-4.5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Based on 643 guest visits</span>
        </div>

        {/* Horizontal bars */}
        <div className="md:col-span-2 space-y-2 text-xs font-semibold text-zinc-650">
          <div className="flex items-center gap-3">
            <span className="w-10">5 Star</span>
            <div className="flex-grow h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: "88%" }} />
            </div>
            <span className="w-8 text-right font-bold text-zinc-800">88%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-10">4 Star</span>
            <div className="flex-grow h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: "9%" }} />
            </div>
            <span className="w-8 text-right font-bold text-zinc-800">9%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-10">3 Star</span>
            <div className="flex-grow h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: "2%" }} />
            </div>
            <span className="w-8 text-right font-bold text-zinc-800">2%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-10">2 Star</span>
            <div className="flex-grow h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: "1%" }} />
            </div>
            <span className="w-8 text-right font-bold text-zinc-800">1%</span>
          </div>
        </div>

      </div>

      {/* Reviews feed */}
      <div className="space-y-6">
        <h3 className="font-extrabold text-xl text-zinc-800">Recent Testimonials</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviewsList.map((rev) => (
            <SalonReviewCard key={rev.id} review={rev} />
          ))}
        </div>
      </div>

      {/* Write review dialog modal */}
      <Modal isOpen={showAddReview} onClose={() => setShowAddReview(false)} title="Write Styling Review">
        <form onSubmit={handleSubmitReview} className="space-y-5 p-1 text-left text-zinc-800">
          
          <FormInput
            label="Your Full Name"
            id="rev_name"
            placeholder="John Doe"
            required
            value={revName}
            onChange={(e) => setRevName(e.target.value)}
          />

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-450 uppercase tracking-wider block ml-1 select-none">
              Treatment Received
            </label>
            <select
              value={revService}
              onChange={(e) => setRevService(e.target.value)}
              className="w-full py-3 px-4 bg-zinc-50 border border-zinc-200 focus:border-primary text-zinc-800 rounded-18 outline-none text-sm font-semibold shadow-sm"
            >
              <option>Premium Hair Cut</option>
              <option>Luxury Blowout & Style</option>
              <option>Signature Balayage & Gloss</option>
              <option>Ocean Glow Hydrating Facial</option>
              <option>Luxury Coconut Milk Body Spa</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-450 uppercase tracking-wider block ml-1 select-none">
              Give Rating Stars
            </label>
            <select
              value={revRating}
              onChange={(e) => setRevRating(Number(e.target.value))}
              className="w-full py-3 px-4 bg-zinc-50 border border-zinc-200 focus:border-primary text-zinc-800 rounded-18 outline-none text-sm font-semibold shadow-sm"
            >
              <option value={5}>5 Stars (Excellent)</option>
              <option value={4}>4 Stars (Good)</option>
              <option value={3}>3 Stars (Average)</option>
              <option value={2}>2 Stars (Fair)</option>
              <option value={1}>1 Star (Poor)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="comment" className="text-xs font-bold text-zinc-450 uppercase tracking-wider block ml-1">
              Your Feedback Comment
            </label>
            <textarea
              id="comment"
              required
              rows={4}
              placeholder="Tell other guests about your styling experience, cut precision, or spa comfort..."
              value={revComment}
              onChange={(e) => setRevComment(e.target.value)}
              className="w-full py-3 px-4 bg-zinc-50 border border-zinc-200 focus:border-primary text-zinc-800 placeholder-zinc-400 rounded-18 outline-none text-sm font-semibold shadow-sm resize-none"
            />
          </div>

          <PrimaryButton type="submit" className="w-full py-3.5 mt-2 font-extrabold text-sm">
            Publish Review Feedback
          </PrimaryButton>

        </form>
      </Modal>

    </motion.div>
  );
}
