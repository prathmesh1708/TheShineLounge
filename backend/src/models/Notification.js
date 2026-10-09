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
    deletedBy: [
      {
        type: String,
        trim: true
      }
    ],
    actionUrl: {
      type: String,
      default: ''
    },
    // Optional machine-readable event name sent as the push `type` (e.g. break_due)
    pushType: {
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

// Single choke point for push: every in-app notification created anywhere in
// the backend (bookings, breaks, leave, salary, feedback, admin broadcasts...)
// is also delivered as an FCM push, so callers never push separately.
notificationSchema.pre('save', function markNew() {
  this.$locals.wasNew = this.isNew;
});

notificationSchema.post('save', function pushOnCreate(doc) {
  if (!doc.$locals || !doc.$locals.wasNew) return;
  // Lazy require: the push helper pulls in the account models.
  const push = require('../common/services/pushNotificationHelper');
  const link = doc.actionUrl || '/';
  const payload = {
    title: doc.title,
    body: doc.message,
    data: {
      type: doc.pushType || doc.category || 'system_announcement',
      category: doc.category || '',
      serviceKey: doc.serviceKey || '',
      notificationId: String(doc._id),
      link,
      url: link
    }
  };

  let job;
  switch (doc.recipientType) {
    case 'user':
    case 'single_user':
      job = doc.targetUserId ? push.sendNotificationToUser(doc.targetUserId, payload) : null;
      break;
    case 'staff':
      job = doc.targetUserId
        ? push.sendNotificationToUser(doc.targetUserId, payload)
        : push.sendNotificationToRole('staff', payload);
      break;
    case 'all_staff':
    case 'staff_only':
      job = push.sendNotificationToRole('staff', payload);
      break;
    default: // all_users, segment
      job = push.sendNotificationToAll(payload);
  }
  if (job) job.catch((err) => console.warn('Notification push failed:', err.message));
});

module.exports = mongoose.model('Notification', notificationSchema);
