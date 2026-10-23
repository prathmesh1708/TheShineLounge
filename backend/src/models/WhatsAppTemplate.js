const mongoose = require('mongoose');

// A reusable message format. Locally the body uses named placeholders
// ({{name}}, {{vehicle}} ...) so admins can read it; when submitted to Meta the
// placeholders are rewritten to the positional {{1}}, {{2}} form Meta requires
// and `variableMap` remembers which contact field fills each position.
const buttonSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['QUICK_REPLY', 'URL', 'PHONE_NUMBER'], default: 'QUICK_REPLY' },
    text: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, default: '' },
    phoneNumber: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const whatsAppTemplateSchema = new mongoose.Schema(
  {
    // Meta template name: lowercase letters, digits and underscores only.
    name: { type: String, required: true, trim: true, unique: true },
    displayName: { type: String, trim: true, default: '' },
    language: { type: String, default: 'en' },
    category: { type: String, enum: ['MARKETING', 'UTILITY'], default: 'MARKETING' },
    headerType: { type: String, enum: ['none', 'text', 'image', 'video', 'document'], default: 'none' },
    headerText: { type: String, default: '' },
    // Sample media submitted with the template; campaigns may swap in their own.
    headerMediaUrl: { type: String, default: '' },
    body: { type: String, required: [true, 'Template body is required'] },
    footer: { type: String, default: '' },
    buttons: { type: [buttonSchema], default: [] },
    variableMap: { type: [String], default: [] },
    // 'invoice' = the template staff billing sends receipts with (one at a time).
    purpose: { type: String, enum: ['campaign', 'invoice'], default: 'campaign' },
    // Which service the template is approved on.
    provider: { type: String, enum: ['meta', 'bhashsms'], default: 'meta' },
    metaTemplateId: { type: String, default: '' },
    metaStatus: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED', 'IN_APPEAL'],
      default: 'DRAFT'
    },
    rejectedReason: { type: String, default: '' },
    lastSyncedAt: { type: Date, default: null },
    createdBy: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('WhatsAppTemplate', whatsAppTemplateSchema, 'whatsapp_templates');
