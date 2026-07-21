import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, MapPin, Sparkles } from 'lucide-react';
import { useStaff } from '../context/StaffContext';

export default function CameraCapture() {
  const { isCameraOpen, setIsCameraOpen, cameraPurpose, processCheckIn, onCaptureCallback } = useStaff();
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCameraOpen]);

  const startCamera = async () => {
    setCapturedImage(null);
    setCameraError(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleSnap = () => {
    setIsCapturing(true);
    if (videoRef.current && canvasRef.current && !cameraError) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 400;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
    } else {
      // Fallback mock selfie
      setCapturedImage('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80');
    }
    setIsCapturing(false);
  };

  const handleConfirm = () => {
    const photoToUse = capturedImage || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80';
    
    if (cameraPurpose === 'check-in') {
      processCheckIn(photoToUse);
    } else if (onCaptureCallback) {
      onCaptureCallback(photoToUse);
    }
    
    stopCamera();
    setIsCameraOpen(false);
  };

  if (!isCameraOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between p-4 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between text-white py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="font-extrabold text-sm capitalize">
            {cameraPurpose === 'check-in' ? 'Attendance Selfie Check-In' : 'Job Photo Capture'}
          </span>
        </div>
        <button
          onClick={() => { stopCamera(); setIsCameraOpen(false); }}
          className="p-2 rounded-full bg-gray-800 text-gray-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Camera Preview Box */}
      <div className="relative flex-1 my-4 bg-gray-950 rounded-3xl overflow-hidden flex items-center justify-center border-2 border-gray-800 shadow-2xl">
        {!capturedImage ? (
          <>
            {!cameraError ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="p-6 text-center text-gray-400">
                <Camera className="w-12 h-12 mx-auto mb-3 text-amber-400 opacity-80" />
                <p className="text-xs font-bold text-gray-200 mb-1">Live Camera Unavailable</p>
                <p className="text-[11px] text-gray-400">Press button below to capture mock selfie photo</p>
              </div>
            )}
            
            {/* Viewfinder Target Ring */}
            <div className="absolute inset-12 border-2 border-dashed border-amber-400/60 rounded-3xl pointer-events-none flex items-center justify-center">
              <div className="text-[10px] font-extrabold text-amber-400 bg-black/60 px-3 py-1 rounded-full flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" /> Thane Branch GPS Logged
              </div>
            </div>
          </>
        ) : (
          <img
            src={capturedImage}
            alt="Captured Preview"
            className="w-full h-full object-cover rounded-3xl"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Shutter Controls */}
      <div className="py-4 flex items-center justify-around">
        {!capturedImage ? (
          <button
            onClick={handleSnap}
            disabled={isCapturing}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center shadow-xl active:scale-90 transition-transform"
            style={{ backgroundColor: '#e07b2a' }}
          >
            <div className="w-12 h-12 rounded-full bg-white/30 border border-white" />
          </button>
        ) : (
          <div className="flex items-center gap-6">
            <button
              onClick={() => setCapturedImage(null)}
              className="w-12 h-12 rounded-full bg-gray-800 text-white flex items-center justify-center shadow-md hover:bg-gray-700"
              title="Retake Photo"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-3 rounded-full text-white font-black text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-transform"
              style={{ backgroundColor: '#10b981' }}
            >
              <Check className="w-5 h-5" />
              <span>Confirm & Save</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
