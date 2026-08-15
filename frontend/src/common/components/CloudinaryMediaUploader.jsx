import React, { useState, useRef } from 'react';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

/**
 * Cloudinary Media Uploader Component for Images and Videos
 */
export default function CloudinaryMediaUploader({
  value = '',
  onChange,
  folder = 'shine-lounge/uploads',
  accept = 'image/*,video/*',
  label = 'Upload Media Asset',
  helperText = 'Supports PNG, JPG, WEBP images and MP4, WEBM videos (Up to 100MB)',
  className = ''
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [inputMode, setInputMode] = useState('file'); // 'file' | 'url'
  const fileInputRef = useRef(null);

  const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|mov|mkv)$/i) || url.includes('/video/upload/');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const res = await uploadToCloudinary(file, folder, (percent) => setProgress(percent));
      if (res && res.url) {
        onChange(res.url);
      }
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      setError(err.message || 'Failed to upload media asset to Cloudinary');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const res = await uploadToCloudinary(file, folder, (percent) => setProgress(percent));
      if (res && res.url) {
        onChange(res.url);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload media asset');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
          {label}
        </label>

        <button
          type="button"
          onClick={() => setInputMode(inputMode === 'file' ? 'url' : 'file')}
          className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 underline cursor-pointer"
        >
          {inputMode === 'file' ? 'Paste Direct URL' : 'Upload File'}
        </button>
      </div>

      {inputMode === 'url' ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://res.cloudinary.com/... or image/video URL"
            className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="px-3 py-2 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      ) : (
        <div>
          {value ? (
            /* Media Preview Card */
            <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-slate-900 shadow-sm">
              {isVideo(value) ? (
                <video
                  src={value}
                  controls
                  className="w-full max-h-56 object-contain bg-black"
                />
              ) : (
                <img
                  src={value}
                  alt="Media asset preview"
                  className="w-full max-h-56 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600';
                  }}
                />
              )}

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow cursor-pointer transition-transform hover:scale-105"
                >
                  🔄 Replace File
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow cursor-pointer transition-transform hover:scale-105"
                >
                  🗑️ Remove
                </button>
              </div>

              {/* Tag Indicator */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-md rounded text-[10px] text-emerald-400 font-mono">
                ☁️ Cloudinary Asset
              </div>
            </div>
          ) : (
            /* File Dropzone Area */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                isUploading
                  ? 'border-amber-500 bg-amber-50/40'
                  : 'border-gray-300 hover:border-amber-500 hover:bg-amber-50/20 bg-gray-50'
              }`}
            >
              {isUploading ? (
                <div className="space-y-3 py-2">
                  <div className="inline-block animate-spin text-2xl">⏳</div>
                  <p className="text-xs font-bold text-amber-700">Uploading to Cloudinary CDN...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono">{progress}% Complete</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-3xl text-gray-400">☁️</div>
                  <p className="text-xs font-bold text-gray-700">
                    Click to upload or drag & drop file here
                  </p>
                  <p className="text-[11px] text-gray-500">{helperText}</p>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="text-[11px] font-semibold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
