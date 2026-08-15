/**
 * Cloudinary Upload Helper & URL Transformer
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Upload a File object or Base64 string to the backend Cloudinary endpoint
 * @param {File|string} fileOrBase64 - File object or Base64 data URI string
 * @param {string} folder - Target Cloudinary folder (e.g. 'shine-lounge/services')
 * @param {Function} [onProgress] - Optional upload progress callback (0-100)
 * @returns {Promise<{ url: string, public_id?: string, resource_type?: string, format?: string }>}
 */
export async function uploadToCloudinary(fileOrBase64, folder = 'shine-lounge/uploads', onProgress = null) {
  const targetUrl = `${API_BASE_URL}/api/upload?folder=${encodeURIComponent(folder)}`;

  // 1. Base64 Data URI Upload
  if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64: fileOrBase64, folder })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Base64 Cloudinary upload failed');
    }
    return data;
  }

  // 2. Binary File Upload via XMLHttpRequest for progress reporting
  if (fileOrBase64 instanceof File) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', fileOrBase64);
      formData.append('folder', folder);

      xhr.open('POST', targetUrl, true);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.success) {
            resolve(data);
          } else {
            reject(new Error(data.message || 'File upload failed'));
          }
        } catch (err) {
          reject(new Error('Invalid response from upload server'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  }

  // 3. Fallback: String is already a URL
  if (typeof fileOrBase64 === 'string') {
    return { url: fileOrBase64 };
  }

  throw new Error('Unsupported file or data type provided to uploadToCloudinary');
}

/**
 * Transforms a Cloudinary URL on the fly with responsive parameters
 * @param {string} url - Cloudinary URL
 * @param {Object} options - { width, height, crop, quality, format }
 * @returns {string} Transformed CDN URL
 */
export function getOptimizedCloudinaryUrl(url, options = {}) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return url || '';
  }

  const { width, height, crop = 'limit', quality = 'auto', format = 'auto' } = options;
  const parts = [];

  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (crop) parts.push(`c_${crop}`);
  if (quality) parts.push(`q_${quality}`);
  if (format) parts.push(`f_${format}`);

  const transformString = parts.join(',');

  // Insert transformation parameters right after '/upload/' in Cloudinary URL
  return url.replace('/upload/', `/upload/${transformString}/`);
}
