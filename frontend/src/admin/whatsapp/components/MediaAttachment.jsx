import React, { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Video, Mic, FileText, Upload, X, Loader2, Square, Link2, AlertTriangle } from 'lucide-react';
import { uploadToCloudinary } from '../../../common/utils/cloudinaryUpload';
import { MEDIA_TYPES, formatBytes } from '../utils/whatsappFormat';

const ICONS = { image: ImageIcon, video: Video, audio: Mic, document: FileText };
const FOLDER = 'shine-lounge/whatsapp';

/**
 * value: { type: 'none'|'image'|'video'|'audio'|'document', url, filename, bytes }
 * allowedTypes: which tabs to offer (templates can't carry audio).
 * lockedType: force one type (a template's header type).
 */
export default function MediaAttachment({ value, onChange, allowedTypes = ['image', 'video', 'audio', 'document'], lockedType = null }) {
  const media = value || { type: 'none' };
  const [activeType, setActiveType] = useState(lockedType || (media.type !== 'none' ? media.type : allowedTypes[0]));
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [urlMode, setUrlMode] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const inputRef = useRef(null);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => { if (lockedType) setActiveType(lockedType); }, [lockedType]);
  useEffect(() => () => {
    clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
  }, []);

  const cfg = MEDIA_TYPES[activeType];

  const upload = async (file) => {
    setError('');
    if (!file) return;
    if (file.size > cfg.maxBytes) {
      setError(`${cfg.label} is ${formatBytes(file.size)} — WhatsApp allows up to ${formatBytes(cfg.maxBytes)}.`);
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const res = await uploadToCloudinary(file, FOLDER, setProgress);
      if (!/^https:\/\//.test(res.url || '')) {
        setError('Uploaded to local storage only — WhatsApp needs a public link. Set the Cloudinary keys in the backend .env.');
      }
      onChange({ type: activeType, url: res.url, filename: file.name, bytes: res.bytes || file.size });
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    setError('');
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setError('Voice recording is not supported in this browser — upload an audio file instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);
        setRecording(false);
        const mime = recorder.mimeType || 'audio/webm';
        const ext = mime.includes('ogg') ? 'ogg' : (mime.includes('mp4') ? 'm4a' : 'webm');
        const blob = new Blob(chunks, { type: mime });
        // Cloudinary converts this to MP3 on delivery, which WhatsApp accepts.
        upload(new File([blob], `voice-note-${Date.now()}.${ext}`, { type: mime }));
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecordSecs(0);
      setRecording(true);
      timerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } catch (err) {
      setError('Microphone permission was denied.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
  };

  const applyUrl = () => {
    const url = urlDraft.trim();
    if (!/^https:\/\//i.test(url)) {
      setError('Paste a full https:// link that anyone can open.');
      return;
    }
    setError('');
    onChange({ type: activeType, url, filename: url.split('/').pop().split('?')[0], bytes: 0 });
    setUrlDraft('');
    setUrlMode(false);
  };

  const hasMedia = media.type && media.type !== 'none' && media.url;

  return (
    <div className="space-y-2.5">
      {!lockedType && (
        <div className="flex flex-wrap gap-1.5">
          {allowedTypes.map((t) => {
            const Icon = ICONS[t];
            const active = activeType === t;
            return (
              <button
                key={t}
                type="button"
                disabled={uploading || recording}
                onClick={() => { setActiveType(t); setError(''); }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border transition-colors ${
                  active ? 'bg-[#008069] text-white border-[#008069]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {MEDIA_TYPES[t].label}
              </button>
            );
          })}
        </div>
      )}

      {hasMedia ? (
        <div className="flex items-center gap-3 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60">
          <div className="w-12 h-12 rounded-lg bg-white border border-emerald-100 overflow-hidden flex items-center justify-center shrink-0">
            {media.type === 'image'
              ? <img src={media.url} alt="" className="w-full h-full object-cover" />
              : React.createElement(ICONS[media.type] || FileText, { className: 'w-5 h-5 text-emerald-600' })}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-800 truncate">{media.filename || 'Attached file'}</p>
            <p className="text-[11px] text-gray-500">
              {MEDIA_TYPES[media.type] ? MEDIA_TYPES[media.type].label : media.type}
              {media.bytes ? ` · ${formatBytes(media.bytes)}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ type: 'none', url: '', filename: '', bytes: 0 })}
            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files && e.dataTransfer.files[0]); }}
          className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-4 text-center"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <Loader2 className="w-5 h-5 animate-spin text-[#008069]" />
              <div className="w-full max-w-[200px] h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full bg-[#008069] transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[11px] font-semibold text-gray-500">Uploading… {progress}%</p>
            </div>
          ) : recording ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <div className="flex items-center gap-2 text-rose-600 text-sm font-black">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                Recording {String(Math.floor(recordSecs / 60)).padStart(2, '0')}:{String(recordSecs % 60).padStart(2, '0')}
              </div>
              <button type="button" onClick={stopRecording}
                className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5">
                <Square className="w-3.5 h-3.5" /> Stop & attach
              </button>
            </div>
          ) : urlMode ? (
            <div className="flex gap-2">
              <input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://…"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
              />
              <button type="button" onClick={applyUrl} className="px-3 py-2 rounded-lg bg-[#008069] text-white text-xs font-bold">Use</button>
              <button type="button" onClick={() => setUrlMode(false)} className="px-2 py-2 rounded-lg text-gray-500 text-xs font-bold">Cancel</button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={() => inputRef.current && inputRef.current.click()}
                  className="px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-[#008069] text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> Upload {cfg.label.toLowerCase()}
                </button>
                {activeType === 'audio' && (
                  <button type="button" onClick={startRecording}
                    className="px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-rose-400 text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-rose-500" /> Record voice note
                  </button>
                )}
                <button type="button" onClick={() => setUrlMode(true)}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" /> Paste link
                </button>
              </div>
              <p className="text-[11px] text-gray-400 font-medium mt-2">{cfg.hint} · or drag & drop here</p>
            </>
          )}
          <input ref={inputRef} type="file" accept={cfg.accept} className="hidden" onChange={(e) => upload(e.target.files && e.target.files[0])} />
        </div>
      )}

      {error && (
        <p className="text-[11px] font-semibold text-rose-600 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
