import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Upload, X, RefreshCw, Check, Loader2, Trash2, Eye, Receipt, FileImage } from 'lucide-react';
import { uploadToCloudinary } from '../../../common/utils/cloudinaryUpload';

const EXPENSES_FOLDER = 'shine-lounge/expenses';
const MAX_EDGE = 1440;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

// Downscales image on canvas to maintain sharp text while keeping payload compact
const resizeToDataUrl = (source, width, height) => {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.88);
};

const fileToResizedDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        resolve(resizeToDataUrl(img, img.naturalWidth, img.naturalHeight));
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image file'));
    };
    img.src = url;
  });

/**
 * Expense Receipt / Bill Image Picker:
 * Allows admin to either "Upload Image" from device or "Take Photo" with camera.
 * Uploads automatically to Cloudinary and saves URL in MongoDB.
 */
export default function ExpenseImagePicker({
  value = '',
  onChange,
  onBusy,
  label = 'Bill / Receipt Photo (Optional)'
}) {
  const fileRef = useRef(null);
  const captureRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [snapshot, setSnapshot] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const setBusy = (b) => {
    setUploading(b);
    if (onBusy) onBusy(b);
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  // Re-attach live stream when camera modal is active without snapshot
  useEffect(() => {
    if (cameraOpen && !snapshot && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOpen, snapshot]);

  const uploadAndSave = async (dataUrlOrFile) => {
    setBusy(true);
    setError('');
    try {
      const res = await uploadToCloudinary(dataUrlOrFile, EXPENSES_FOLDER);
      if (res?.url) {
        onChange(res.url);
      } else {
        throw new Error('Upload succeeded but no URL was returned');
      }
    } catch (err) {
      console.error('Expense image upload error:', err);
      setError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, WEBP, JPEG)');
      return;
    }
    if (file.size > MAX_BYTES * 3) {
      setError('Selected image is too large (max 30MB)');
      return;
    }

    try {
      const resized = await fileToResizedDataUrl(file);
      await uploadAndSave(resized);
    } catch (err) {
      setError(err.message || 'Could not process image');
    }
  };

  const handleTakePhoto = async () => {
    setError('');
    // Mobile / touch devices prefer native camera sheet via capture="environment"
    const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
    if (isTouch && captureRef.current) {
      captureRef.current.click();
      return;
    }

    // Desktop: WebRTC live webcam modal
    setCameraError('');
    setSnapshot('');
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraError('Webcam / camera is not available. Please allow camera access or use the Upload option.');
    }
  };

  const closeCamera = () => {
    stopStream();
    setCameraOpen(false);
    setSnapshot('');
  };

  const handleSnap = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setSnapshot(resizeToDataUrl(video, video.videoWidth, video.videoHeight));
  };

  const handleUseSnapshot = async () => {
    const data = snapshot;
    closeCamera();
    await uploadAndSave(data);
  };

  return (
    <div className="space-y-2 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 p-3.5 rounded-2xl border border-amber-200/80 shadow-xs">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-gray-800">
          <Receipt className="w-3.5 h-3.5 text-amber-500" />
          {label}
        </label>
        {value && (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            ✓ Attached
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {value ? (
          /* Receipt Thumbnail Preview */
          <div className="relative group w-20 h-20 rounded-xl overflow-hidden border border-amber-200 bg-gray-950 shrink-0 shadow-xs">
            <img
              src={value}
              alt="Receipt preview"
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => setPreviewModalOpen(true)}
            />
            <div
              onClick={() => setPreviewModalOpen(true)}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white"
            >
              <Eye className="w-5 h-5" />
            </div>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-amber-200/80 bg-amber-50/30 flex flex-col items-center justify-center text-amber-400 shrink-0">
            <FileImage className="w-6 h-6 mb-1 opacity-70" />
            <span className="text-[9px] font-bold text-amber-600/70">No Image</span>
          </div>
        )}

        <div className="flex-1 flex flex-col justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-amber-50/70 hover:border-amber-300 active:scale-95 transition-all shadow-xs disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" /> : <Upload className="w-3.5 h-3.5 text-amber-600" />}
              {value ? 'Replace Image' : 'Upload Image'}
            </button>

            <button
              type="button"
              disabled={uploading}
              onClick={handleTakePhoto}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-amber-50/70 hover:border-amber-300 active:scale-95 transition-all shadow-xs disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5 text-amber-600" /> Take Photo
            </button>

            {value && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => onChange('')}
                className="px-2.5 py-2 rounded-xl border border-rose-200 bg-rose-50/60 text-rose-600 hover:bg-rose-100 hover:text-rose-700 active:scale-95 transition-all"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-[10px] text-gray-500 font-medium">
            Take a live photo of the voucher, bill, or invoice, or select an existing image. Stored securely in MongoDB.
          </p>
        </div>
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-[11px] font-bold text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Uploading bill image to cloud storage...</span>
        </div>
      )}

      {error && (
        <p className="text-[11px] font-semibold text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-200">
          ⚠️ {error}
        </p>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={captureRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {/* Desktop Live Camera Modal */}
      {cameraOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100000] bg-black/90 backdrop-blur-md flex flex-col p-4">
            <div className="flex items-center justify-between text-white py-2 max-w-2xl mx-auto w-full">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" />
                <span className="font-black text-sm">Capture Expense Receipt / Bill</span>
              </div>
              <button
                type="button"
                onClick={closeCamera}
                className="p-2 rounded-full bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 my-3 max-w-2xl mx-auto w-full rounded-3xl overflow-hidden bg-gray-950 border-2 border-amber-500/40 flex items-center justify-center shadow-2xl relative">
              {cameraError ? (
                <div className="p-6 text-center text-xs font-bold text-gray-300 max-w-md">
                  <p className="mb-3 text-rose-400">⚠️ {cameraError}</p>
                  <button
                    type="button"
                    onClick={closeCamera}
                    className="px-4 py-2 bg-gray-800 text-white rounded-xl text-xs font-bold hover:bg-gray-700"
                  >
                    Close & Use Upload Instead
                  </button>
                </div>
              ) : snapshot ? (
                <img src={snapshot} alt="Captured receipt" className="w-full h-full object-contain" />
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
              )}
            </div>

            <div className="py-3 flex items-center justify-center gap-6 max-w-2xl mx-auto w-full">
              {!snapshot ? (
                <button
                  type="button"
                  onClick={handleSnap}
                  disabled={Boolean(cameraError)}
                  className="w-16 h-16 rounded-full border-4 border-white shadow-xl active:scale-90 transition disabled:opacity-40 flex items-center justify-center"
                  style={{ backgroundColor: '#e07b2a' }}
                  title="Capture Photo"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSnapshot('')}
                    className="px-5 py-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
                  >
                    <RefreshCw className="w-4 h-4" /> Retake
                  </button>
                  <button
                    type="button"
                    onClick={handleUseSnapshot}
                    className="px-6 py-3 rounded-full text-white font-black text-xs flex items-center gap-2 shadow-xl bg-emerald-600 hover:bg-emerald-500"
                  >
                    <Check className="w-4 h-4" /> Use This Photo
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Fullscreen Zoom Preview Modal */}
      {previewModalOpen &&
        value &&
        createPortal(
          <div
            className="fixed inset-0 z-[100000] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-pointer"
            onClick={() => setPreviewModalOpen(false)}
          >
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-2 rounded-xl bg-gray-800/90 text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-lg"
              >
                <Eye className="w-4 h-4" /> Open Full Resolution
              </a>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-2 rounded-full bg-gray-800/90 text-white hover:bg-gray-700 shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div
              className="max-w-4xl max-h-[85vh] p-2 bg-gray-900/60 rounded-2xl border border-gray-700 flex items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={value}
                alt="Expense Receipt"
                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
            <p className="text-gray-400 text-xs font-bold mt-3">Click anywhere outside to close</p>
          </div>,
          document.body
        )}
    </div>
  );
}
