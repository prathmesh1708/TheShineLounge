const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    recipientType: {
      type: String,
      enum: ['all_users', 'all_staff', 'user', 'staff', 'segment'],
      default: 'all_users'
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    targetSegment: {
      type: String,
      enum: [
        'all',
        'active_members',
        'expired_members',
        'expiring_soon',
        'car_wash',
        'car_detailing',
        'dog_wash',
        'cafe',
        'salon'
      ],
      default: 'all'
    },
    serviceKey: {
      type: String,
      enum: ['car-wash', 'car-detailing', 'dog-wash', 'cafe', 'drive-through-cafe', 'salon', 'system'],
      default: 'system'
    },
    category: {
      type: String,
      enum: [
        'membership_expiry',
        'renewal_reminder',
        'order_status',
        'service_update',
        'promotional',
        'inventory_alert',
        'system_announcement'
      ],
      default: 'system_announcement'
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    readBy: [
      {
        type: String,
        trim: true
      }
    ],
    actionUrl: {
      type: String,
      default: ''
    },
    isEdited: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
