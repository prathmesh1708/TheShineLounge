import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Edit3 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import CarDetailingReviewCard from '../components/carDetailingReviewCard';
import { REVIEWS } from '../services/carDetailingApi';
import { Modal, Toast, FormInput, FormTextarea, FormSelect, PrimaryButton } from '../components/carDetailingUI';

export default function CarDetailingReviewsPage() {
  const [reviewsList, setReviewsList] = useState(REVIEWS);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      rating: 5,
      service: "Full Detailing",
      vehicle: "",
      comment: ""
    }
  });

  const handleCreateReview = (data) => {
    const newRev = {
      id: reviewsList.length + 1,
      name: data.name,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100", // generic avatar
      rating: Number(data.rating),
      date: new Date().toISOString().split('T')[0],
      service: data.service,
      vehicle: data.vehicle || "Premium Sedan",
      comment: data.comment
    };

    setReviewsList(prev => [newRev, ...prev]);
    setShowReviewModal(false);
    reset();
    setToastOpen(true);
  };

  // Rating metrics calculations
  const totalReviews = reviewsList.length;
  const averageRating = (reviewsList.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1);

  // Distribution
  const starsDistribution = [
    { stars: 5, count: reviewsList.filter(r => r.rating === 5).length },
    { stars: 4, count: reviewsList.filter(r => r.rating === 4).length },
    { stars: 3, count: reviewsList.filter(r => r.rating === 3).length },
    { stars: 2, count: reviewsList.filter(r => r.rating === 2).length },
    { stars: 1, count: reviewsList.filter(r => r.rating === 1).length }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 md:space-y-10 max-w-4xl mx-auto text-zinc-800"
    >
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-850">Customer Reviews</h1>
          <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1">Read honest feedback from performance and premium luxury owners.</p>
        </div>
        <button
          onClick={() => setShowReviewModal(true)}
          className="py-3.5 px-6 bg-luxury-emerald hover:bg-luxury-emeraldHover text-white text-xs font-bold rounded-20 shadow-premium transition-all flex items-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Ratings distribution metrics card */}
      <div className="grid grid-cols-1 md:grid-cols-3 bg-white border border-zinc-200/80 rounded-24 p-6 md:p-8 gap-8 items-center shadow-premium">
        
        {/* Overall score */}
        <div className="text-center space-y-2 border-b md:border-b-0 md:border-r border-zinc-150 pb-6 md:pb-0 md:pr-6">
          <span className="text-5xl md:text-6xl font-extrabold text-zinc-800">{averageRating}</span>
          <div className="flex justify-center gap-0.5 text-yellow-600">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-5 h-5 ${i < Math.round(averageRating) ? 'fill-current' : 'text-zinc-200'}`} />
            ))}
          </div>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Based on {totalReviews} Reviews</p>
        </div>

        {/* Stars bars list */}
        <div className="md:col-span-2 space-y-2 text-xs text-zinc-600 font-semibold">
          {starsDistribution.map((dist, idx) => {
            const percentage = Math.round((dist.count / totalReviews) * 100) || 0;
            return (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-12 text-right font-bold">{dist.stars} Star</span>
                
                {/* Horizontal Progress bar */}
                <div className="flex-grow h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                  <div
                    className="bg-luxury-emerald h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-10 text-zinc-400 text-right font-bold">{percentage}%</span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Reviews list grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviewsList.map((review) => (
          <CarDetailingReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Write review Modal Sheet */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Write DetailPro Review"
      >
        <form onSubmit={handleSubmit(handleCreateReview)} className="space-y-4">
          <FormInput
            label="Your Name"
            name="name"
            placeholder="e.g. Ramesh Singh"
            register={register}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Rating (1-5)"
              name="rating"
              register={register}
              options={["5", "4", "3", "2", "1"]}
              required
            />
            <FormInput
              label="Vehicle Model"
              name="vehicle"
              placeholder="e.g. BMW M3, Fortuner"
              register={register}
              required
            />
          </div>

          <FormSelect
            label="Service Booked"
            name="service"
            register={register}
            options={["Full Detailing", "Ceramic Coating", "Exterior Wash", "Interior Cleaning", "Engine Bay Cleaning", "Paint Protection (PPF)", "Steam Cleaning", "Headlight Restoration"]}
            required
          />

          <FormTextarea
            label="Review Comment"
            name="comment"
            placeholder="Tell us about the paint correction, gloss finish, and service quality..."
            register={register}
            required
          />

          <PrimaryButton type="submit">Submit Review</PrimaryButton>
        </form>
      </Modal>

      {/* Toast Feedback */}
      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message="Thank you! Your review was posted successfully."
        type="success"
      />

    </motion.div>
  );
}
