const cloudinary = require('../config/cloudinary');
const { CLOUDINARY_CLOUD_NAME } = require('../config/env');
const path = require('path');
const fs = require('fs');

/**
 * Upload a binary Buffer to Cloudinary via upload_stream
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Upload options (folder, resource_type, filename)
 * @returns {Promise<Object>} Cloudinary upload result object
 */
const uploadStream = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!CLOUDINARY_CLOUD_NAME) {
      return reject(new Error('CLOUDINARY_CLOUD_NAME is not configured in environment variables.'));
    }

    const defaultFolder = options.folder || 'shine-lounge/general';
    const resourceType = options.resource_type || 'auto';

    const uploadOptions = {
      folder: defaultFolder,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      ...options
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    stream.end(buffer);
  });
};

/**
 * Upload a Base64 data URI string to Cloudinary
 * @param {string} base64Data - Data URI string (data:image/png;base64,...)
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary result object
 */
const uploadBase64 = async (base64Data, options = {}) => {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('CLOUDINARY_CLOUD_NAME is not configured in environment variables.');
  }

  const defaultFolder = options.folder || 'shine-lounge/general';
  const resourceType = options.resource_type || 'auto';

  const uploadOptions = {
    folder: defaultFolder,
    resource_type: resourceType,
    ...options
  };

  return await cloudinary.uploader.upload(base64Data, uploadOptions);
};

/**
 * Delete a media file from Cloudinary by its public ID
 * @param {string} publicId - Cloudinary asset public ID
 * @param {string} resourceType - 'image' | 'video' | 'raw'
 * @returns {Promise<Object>}
 */
const deleteAsset = async (publicId, resourceType = 'image') => {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('CLOUDINARY_CLOUD_NAME is not configured in environment variables.');
  }

  return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

/**
 * Helper to construct Cloudinary optimized URLs dynamically
 * @param {string} publicIdOrUrl - Cloudinary public ID or full URL
 * @param {Object} transformations - e.g. { width: 800, quality: 'auto', format: 'auto' }
 * @returns {string} Optimized CDN URL
 */
const getOptimizedUrl = (publicIdOrUrl, transformations = {}) => {
  if (!publicIdOrUrl) return '';
  if (!CLOUDINARY_CLOUD_NAME || !publicIdOrUrl.includes('cloudinary.com')) {
    return publicIdOrUrl; // Return raw URL if not on Cloudinary
  }

  const { width, height, crop = 'limit', quality = 'auto', format = 'auto' } = transformations;
  return cloudinary.url(publicIdOrUrl, {
    transformation: [
      { width, height, crop, quality, fetch_format: format }
    ],
    secure: true
  });
};

module.exports = {
  uploadStream,
  uploadBase64,
  deleteAsset,
  getOptimizedUrl
};
