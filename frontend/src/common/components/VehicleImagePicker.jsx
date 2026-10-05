import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Upload, X, RefreshCw, Check, Loader2, Trash2 } from 'lucide-react';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

const VEHICLE_FOLDER = 'shine-lounge/vehicles';
const MAX_EDGE = 1280;
const MAX_BYTES = 10 * 1024 * 1024;

// Downscales on a canvas so a 12MP phone photo does not become a 6MB upload.
const resizeToDataUrl = (source, width, height) => {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
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
      reject(new Error('Could not read that image'));
    };
    img.src = url;
  });

/**
 * Vehicle photo picker: "Upload" from the device or "Take Photo" with the camera.
 * The image is uploaded as soon as it is chosen; the parent only ever holds the URL.
 */
export default function VehicleImagePicker({ value = '', onChange, onBusy, label = 'Vehicle Photo', compact = false }) {
  const fileRef = useRef(null);
  const captureRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [snapshot, setSnapshot] = useState('');
  const [preview, setPreview] = useState(false);

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

  useEffect(() => () => { stopStream(); }, []);

  // The <video> remounts after a retake, so re-attach the live stream.
  useEffect(() => {
    if (cameraOpen && !snapshot && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOpen, snapshot]);

  const sendDataUrl = async (dataUrl) => {
    setBusy(true);
    setError('');
    try {
      const res = await uploadToCloudinary(dataUrl, VEHICLE_FOLDER);
      if (res?.url) onChange(res.url);
    } catch (err) {
      setError(err.message || 'Photo upload failed');
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file');
      return;
    }
    if (file.size > MAX_BYTES * 3) {
      setError('That image is too large');
      return;
    }
    try {
      await sendDataUrl(await fileToResizedDataUrl(file));
    } catch (err) {
      setError(err.message || 'Could not read that image');
    }
  };

  // Phones: the native camera sheet via `capture`. Desktops: a live preview modal.
  const handleTakePhoto = async () => {
    setError('');
    const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
    if (isTouch && captureRef.current) {
      captureRef.current.click();
      return;
    }
    setCameraError('');
    setSnapshot('');
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setCameraError('Camera is unavailable. Allow camera access, or use Upload instead.');
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
    await sendDataUrl(data);
  };

  const btn = 'flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-gray-200 bg-white text-[11px] font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide">{label}</label>}

      <div className="flex items-stretch gap-2">
        {value && (
          <div className={`relative shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 ${compact ? 'w-12 h-12' : 'w-16 h-16'}`}>
            <img
              src={value}
              alt="Vehicle"
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => setPreview(true)}
            />
          </div>
        )}
        <div className="flex-1 flex gap-2">
          <button type="button" className={btn} disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {value ? 'Replace' : 'Upload'}
          </button>
          <button type="button" className={btn} disabled={uploading} onClick={handleTakePhoto}>
            <Camera className="w-3.5 h-3.5" /> Take Photo
          </button>
          {value && (
            <button
              type="button"
              className="px-2.5 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Remove photo"
              disabled={uploading}
              onClick={() => onChange('')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {uploading && <p className="text-[10px] font-semibold text-amber-600">Uploading photo…</p>}
      {error && <p className="text-[10px] font-semibold text-red-600">{error}</p>}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input ref={captureRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      {cameraOpen && createPortal(
        <div className="fixed inset-0 z-[100000] bg-black/90 flex flex-col p-4">
          <div className="flex items-center justify-between text-white py-2">
            <span className="font-extrabold text-sm">Vehicle Photo</span>
            <button type="button" onClick={closeCamera} className="p-2 rounded-full bg-gray-800 text-gray-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 my-3 rounded-3xl overflow-hidden bg-gray-950 border-2 border-gray-800 flex items-center justify-center">
            {cameraError ? (
              <p className="p-6 text-center text-xs font-bold text-gray-300">{cameraError}</p>
            ) : snapshot ? (
              <img src={snapshot} alt="Captured" className="w-full h-full object-contain" />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
            )}
          </div>
          <div className="py-3 flex items-center justify-center gap-6">
            {!snapshot ? (
              <button
                type="button"
                onClick={handleSnap}
                disabled={Boolean(cameraError)}
                className="w-16 h-16 rounded-full border-4 border-white shadow-xl active:scale-90 transition disabled:opacity-40"
                style={{ backgroundColor: '#e07b2a' }}
                title="Capture"
              />
            ) : (
              <>
                <button type="button" onClick={() => setSnapshot('')} className="w-12 h-12 rounded-full bg-gray-800 text-white flex items-center justify-center" title="Retake">
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button type="button" onClick={handleUseSnapshot} className="px-6 py-3 rounded-full text-white font-black text-sm flex items-center gap-2 shadow-xl" style={{ backgroundColor: '#10b981' }}>
                  <Check className="w-5 h-5" /> Use Photo
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {preview && value && createPortal(
        <div className="fixed inset-0 z-[100000] bg-black/85 flex items-center justify-center p-4" onClick={() => setPreview(false)}>
          <img src={value} alt="Vehicle" className="max-w-full max-h-full rounded-2xl" />
        </div>,
        document.body
      )}
    </div>
  );
}
