const mongoose = require('mongoose');

// WhatsApp-specific state for a phone number. Contacts themselves are derived
// from customers, staff, bookings, sales and passes; this collection only holds
// what none of those know: consent, and when the person last wrote to us (a
// free-form or audio message is only allowed within 24h of that).
const whatsAppContactPrefSchema = new mongoose.Schema(
  {
    // Digits only, country code included: "919876543210".
    phone: { type: String, required: true, unique: true, index: true },
    optIn: { type: Boolean, default: false },
    optInAt: { type: Date, default: null },
    optInSource: { type: String, default: '' },
    optedOut: { type: Boolean, default: false },
    optedOutAt: { type: Date, default: null },
    profileName: { type: String, default: '' },
    lastInboundAt: { type: Date, default: null },
    lastInboundText: { type: String, default: '' },
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('WhatsAppContactPref', whatsAppContactPrefSchema, 'whatsapp_contact_prefs');
