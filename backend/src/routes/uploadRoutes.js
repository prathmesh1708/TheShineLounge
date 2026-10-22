const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinaryService = require('../common/services/cloudinaryService');
const { CLOUDINARY_CLOUD_NAME } = require('../common/config/env');
const authMiddleware = require('../middleware/authMiddleware');
const { staffOnly } = require('../middleware/roleMiddleware');

// Local fallback uploads directory — used only when Cloudinary env keys are omitted
const UPLOADS_DIR = path.resolve(__dirname, '../../../frontend/public/uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer memory storage for direct Cloudinary stream processing
const memoryStorage = multer.memoryStorage();

// Multer disk storage for local fallback
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').replace(ext, '');
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  // Audio and PDFs are for WhatsApp Hub voice notes and document messages.
  const allowed = /^(image|video|audio)\//;
  if (allowed.test(file.mimetype) || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only image, video, audio and PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: CLOUDINARY_CLOUD_NAME ? memoryStorage : diskStorage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB max
});

const VEHICLE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const isVehicleFolder = (folder) => String(folder || '').includes('/vehicles');

/**
 * POST /api/upload
 * Supports multipart file upload (req.file) OR JSON base64 upload (req.body.base64)
 * Returns Cloudinary secure CDN URL or local static URL fallback
 */
router.post('/', authMiddleware, staffOnly, upload.single('file'), async (req, res) => {
  try {
    const folder = req.query.folder || req.body.folder || 'shine-lounge/uploads';

    // 1. Base64 Upload Handling
    if (req.body && req.body.base64) {
      if (isVehicleFolder(folder) && (!/^data:image\//.test(req.body.base64) || req.body.base64.length > VEHICLE_IMAGE_MAX_BYTES * 1.4)) {
        return res.status(400).json({ success: false, message: 'Vehicle photos must be images up to 10 MB' });
      }
      if (CLOUDINARY_CLOUD_NAME) {
        const result = await cloudinaryService.uploadBase64(req.body.base64, { folder });
        return res.status(200).json({
          success: true,
          message: 'Base64 asset uploaded to Cloudinary successfully',
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          resource_type: result.resource_type,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          duration: result.duration || null
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Base64 upload requires Cloudinary environment keys to be set.'
        });
      }
    }

    // 2. Binary File Upload Handling
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }
    if (isVehicleFolder(folder) && (!req.file.mimetype.startsWith('image/') || req.file.size > VEHICLE_IMAGE_MAX_BYTES)) {
      return res.status(400).json({ success: false, message: 'Vehicle photos must be images up to 10 MB' });
    }

    if (CLOUDINARY_CLOUD_NAME) {
      // Direct stream to Cloudinary
      // Cloudinary stores audio under the "video" resource type, and serves
      // PDFs reliably only as "raw" (image-type PDFs are blocked by default).
      const { mimetype } = req.file;
      const resourceType = mimetype.startsWith('video/') || mimetype.startsWith('audio/')
        ? 'video'
        : (mimetype === 'application/pdf' ? 'raw' : 'image');
      const uploadOptions = { folder, resource_type: resourceType };
      if (resourceType === 'raw') {
        // Raw files keep their extension only through the public id; WhatsApp
        // shows this name on the document ("Invoice-TSL-1042.pdf").
        const base = path.basename(req.file.originalname || 'document', path.extname(req.file.originalname || ''))
          .replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || 'document';
        uploadOptions.public_id = `${base}-${Date.now().toString(36)}.pdf`;
      }
      const result = await cloudinaryService.uploadStream(req.file.buffer, uploadOptions);

      return res.status(200).json({
        success: true,
        message: 'File uploaded to Cloudinary successfully',
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration || null
      });
    } else {
      // Fallback local storage
      const publicUrl = `/uploads/${req.file.filename}`;
      return res.status(200).json({
        success: true,
        message: 'File uploaded to local storage successfully (Cloudinary keys not set)',
        url: publicUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    }
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/upload
 * Deletes asset from Cloudinary by publicId
 */
router.delete('/', authMiddleware, staffOnly, async (req, res) => {
  try {
    const { publicId, resourceType = 'image' } = req.body;
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'publicId is required' });
    }

    if (CLOUDINARY_CLOUD_NAME) {
      const result = await cloudinaryService.deleteAsset(publicId, resourceType);
      return res.status(200).json({ success: true, message: 'Asset deleted from Cloudinary', result });
    } else {
      return res.status(200).json({ success: true, message: 'Cloudinary not active, skipped deletion' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Error handling middleware for Multer errors
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `Multer Error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
