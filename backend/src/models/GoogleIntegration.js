const mongoose = require('mongoose');

// The single Google Business Profile connection. One document (key: 'default').
const googleIntegrationSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    status: {
      type: String,
      enum: ['disconnected', 'connected', 'needs_reconnect'],
      default: 'disconnected'
    },
    // AES-256-GCM ciphertext (see google-reviews/crypto.js). Never sent to clients.
    refreshTokenEnc: { type: String, default: '', select: false },
    connectedEmail: { type: String, default: '' },
    connectedBy: { type: String, default: '' },
    connectedAt: { type: Date, default: null },
    // GBP resource names, e.g. 'accounts/123' and 'locations/456'.
    accountName: { type: String, default: '' },
    locationName: { type: String, default: '' },
    locationTitle: { type: String, default: '' },
    mapsUri: { type: String, default: '' },
    averageRating: { type: Number, default: null },
    totalReviewCount: { type: Number, default: null },
    lastSyncAt: { type: Date, default: null },
    lastFullSyncAt: { type: Date, default: null },
    lastSyncError: { type: String, default: '' },
    // Lease so overlapping ticks (cron + interval + button) never sync twice.
    syncLeaseUntil: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.models.GoogleIntegration
  || mongoose.model('GoogleIntegration', googleIntegrationSchema);
