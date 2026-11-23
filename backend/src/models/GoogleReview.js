const mongoose = require('mongoose');

// Local copy of a Google Business Profile review, kept in sync by
// google-reviews/sync.js so the admin page can search, filter and count fast.
const googleReviewSchema = new mongoose.Schema(
  {
    reviewId: { type: String, required: true, unique: true },
    // Full GBP resource name: accounts/x/locations/y/reviews/z
    name: { type: String, default: '' },
    locationName: { type: String, default: '' },
    reviewerName: { type: String, default: 'Google user' },
    reviewerPhotoUrl: { type: String, default: '' },
    isAnonymous: { type: Boolean, default: false },
    starRating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
    createTime: { type: Date, required: true },
    updateTime: { type: Date, required: true },
    reply: {
      comment: { type: String, default: '' },
      updateTime: { type: Date, default: null },
      // Admin who replied from this panel; empty when replied elsewhere.
      repliedBy: { type: String, default: '' }
    },
    // Set when Google stops returning the review (deleted by the reviewer or Google).
    removedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

googleReviewSchema.index({ createTime: -1 });
googleReviewSchema.index({ starRating: 1, createTime: -1 });

module.exports = mongoose.models.GoogleReview || mongoose.model('GoogleReview', googleReviewSchema);
