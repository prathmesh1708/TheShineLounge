require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { MONGO_URI, CLOUDINARY_CLOUD_NAME } = require('../common/config/env');
const cloudinaryService = require('../common/services/cloudinaryService');
const Service = require('../models/Service');
const Booking = require('../models/Booking');

const UPLOADS_DIR = path.resolve(__dirname, '../../../frontend/public/uploads');

async function migrateMedia() {
  console.log('🚀 Starting Cloudinary Media Migration Script...');

  if (!CLOUDINARY_CLOUD_NAME) {
    console.error('❌ Error: CLOUDINARY_CLOUD_NAME is not set in environment variables. Aborting migration.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    let updatedServicesCount = 0;
    let updatedBookingsCount = 0;
    let uploadedFilesCount = 0;

    /**
     * Helper to process a single URL or base64 string
     */
    async function processMediaItem(str, folder = 'shine-lounge/migrated') {
      if (!str || typeof str !== 'string') return str;
      if (str.includes('cloudinary.com')) return str; // Already on Cloudinary

      try {
        // 1. Handle Base64 Data URI
        if (str.startsWith('data:')) {
          console.log('  ↳ Uploading base64 string to Cloudinary...');
          const res = await cloudinaryService.uploadBase64(str, { folder });
          uploadedFilesCount++;
          return res.secure_url;
        }

        // 2. Handle Local /uploads/ Relative Path
        if (str.startsWith('/uploads/')) {
          const filename = str.replace('/uploads/', '');
          const localPath = path.join(UPLOADS_DIR, filename);

          if (fs.existsSync(localPath)) {
            console.log(`  ↳ Uploading local file ${filename} to Cloudinary...`);
            const buffer = fs.readFileSync(localPath);
            const isVideo = filename.match(/\.(mp4|webm|mov|avi|mkv)$/i);
            const res = await cloudinaryService.uploadStream(buffer, {
              folder,
              resource_type: isVideo ? 'video' : 'image'
            });
            uploadedFilesCount++;
            return res.secure_url;
          } else {
            console.warn(`  ⚠️ Local file not found: ${localPath}`);
          }
        }
      } catch (err) {
        console.error(`  ❌ Error uploading media item: ${err.message}`);
      }

      return str;
    }

    // ── 1. Migrate Services Collection ─────────────────────────────────────────
    console.log('\n📦 Checking Services Collection...');
    const services = await Service.find({ isDeleted: false });

    for (const service of services) {
      let modified = false;

      // Top level fields
      const fieldsToMigrate = ['bannerImage', 'heroVideo', 'bannerVideo', 'thumbnail', 'coverImage', 'mobileBanner'];
      for (const field of fieldsToMigrate) {
        if (service[field]) {
          const newUrl = await processMediaItem(service[field], `shine-lounge/services/${service.slug}`);
          if (newUrl !== service[field]) {
            service[field] = newUrl;
            modified = true;
          }
        }
      }

      // Gallery array
      if (Array.isArray(service.gallery) && service.gallery.length > 0) {
        const newGallery = [];
        for (const item of service.gallery) {
          const newUrl = await processMediaItem(item, `shine-lounge/services/${service.slug}/gallery`);
          newGallery.push(newUrl);
          if (newUrl !== item) modified = true;
        }
        service.gallery = newGallery;
      }

      // Service Plans
      if (Array.isArray(service.plans) && service.plans.length > 0) {
        for (const plan of service.plans) {
          if (plan.image) {
            const newUrl = await processMediaItem(plan.image, `shine-lounge/services/${service.slug}/plans`);
            if (newUrl !== plan.image) {
              plan.image = newUrl;
              modified = true;
            }
          }
          if (Array.isArray(plan.images) && plan.images.length > 0) {
            const newPlanImages = [];
            for (const img of plan.images) {
              const newUrl = await processMediaItem(img, `shine-lounge/services/${service.slug}/plans`);
              newPlanImages.push(newUrl);
              if (newUrl !== img) modified = true;
            }
            plan.images = newPlanImages;
          }
        }
      }

      // Menu Sections
      if (Array.isArray(service.menuSections) && service.menuSections.length > 0) {
        for (const sec of service.menuSections) {
          if (sec.image) {
            const newUrl = await processMediaItem(sec.image, `shine-lounge/services/${service.slug}/menu`);
            if (newUrl !== sec.image) {
              sec.image = newUrl;
              modified = true;
            }
          }
        }
      }

      if (modified) {
        await service.save();
        updatedServicesCount++;
        console.log(`  ✅ Updated Service: ${service.serviceName}`);
      }
    }

    // ── 2. Migrate Bookings Collection ─────────────────────────────────────────
    console.log('\n📅 Checking Bookings Collection...');
    const bookings = await Booking.find({ 'photos.0': { $exists: true } });

    for (const booking of bookings) {
      let modified = false;
      const newPhotos = [];

      for (const photo of booking.photos) {
        const newUrl = await processMediaItem(photo, 'shine-lounge/bookings/photos');
        newPhotos.push(newUrl);
        if (newUrl !== photo) modified = true;
      }

      if (modified) {
        booking.photos = newPhotos;
        await booking.save();
        updatedBookingsCount++;
        console.log(`  ✅ Updated Booking ID: ${booking.bookingId}`);
      }
    }

    console.log('\n🎉 Migration Summary:');
    console.log(` - Services Updated: ${updatedServicesCount}`);
    console.log(` - Bookings Updated: ${updatedBookingsCount}`);
    console.log(` - Total Assets Uploaded to Cloudinary: ${uploadedFilesCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration Error:', error);
    process.exit(1);
  }
}

migrateMedia();
