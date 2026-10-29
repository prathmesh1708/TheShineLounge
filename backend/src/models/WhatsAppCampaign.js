const mongoose = require('mongoose');

// One send to a selection of numbers. Recipients are snapshotted at creation
// (name + variable values) so a later CRM edit cannot change what a queued
// message says, and each one carries its own delivery status from the webhook.
const RECIPIENT_STATUSES = ['queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'skipped'];

const recipientSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  name: { type: String, default: '' },
  kind: { type: String, default: 'customer' },
  vars: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: RECIPIENT_STATUSES, default: 'queued' },
  waMessageId: { type: String, default: '', index: true },
  error: { type: String, default: '' },
  // Raw reply from the provider (BhashSMS answers in plain text).
  providerResponse: { type: String, default: '' },
  sentAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  readAt: { type: Date, default: null }
});

const whatsAppCampaignSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: 'Untitled campaign' },
    // 'hub' = sent from the admin WhatsApp Hub; 'invoice' = a receipt sent from billing;
    // 'reminder' = the automatic salon booking reminder.
    source: { type: String, enum: ['hub', 'invoice', 'reminder'], default: 'hub', index: true },
    invoiceNo: { type: String, default: '' },
    provider: { type: String, default: '' },
    // template = Meta-approved template (works any time);
    // freeform = plain text/media (only inside the 24h customer-service window).
    mode: { type: String, enum: ['template', 'freeform'], required: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppTemplate', default: null },
    templateName: { type: String, default: '' },
    templateCategory: { type: String, default: '' },
    templateLanguage: { type: String, default: 'en' },
    variableMap: { type: [String], default: [] },
    body: { type: String, default: '' },
    media: {
      type: { type: String, enum: ['none', 'image', 'video', 'audio', 'document'], default: 'none' },
      url: { type: String, default: '' },
      filename: { type: String, default: '' }
    },
    recipients: { type: [recipientSchema], default: [] },
    status: {
      type: String,
      enum: ['queued', 'sending', 'done', 'cancelled', 'failed'],
      default: 'queued',
      index: true
    },
    scheduledAt: { type: Date, default: Date.now },
    // Exactly one sender works a campaign at a time; the lock expires so a
    // crashed run does not strand it.
    lockedUntil: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    dryRun: { type: Boolean, default: false },
    createdBy: { type: String, default: '' }
  },
  { timestamps: true }
);

whatsAppCampaignSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('WhatsAppCampaign', whatsAppCampaignSchema, 'whatsapp_campaigns');
module.exports.RECIPIENT_STATUSES = RECIPIENT_STATUSES;
