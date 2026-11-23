import React, { useState } from 'react';
import { AlertCircle, Globe, RefreshCw, Send, X } from 'lucide-react';
import GoogleStars from './GoogleStars';
import { REPLY_LIMIT, replyPresets, splitTranslation } from '../utils/googleReviewFormat';
import { errorMessage, replyToGoogleReview } from '../../services/googleReviewsApi';

export default function GoogleReplyModal({ review, onClose, onSaved }) {
  const [text, setText] = useState(review.reply?.comment || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const presets = replyPresets(review.starRating, review.isAnonymous ? '' : review.reviewerName);
  const original = splitTranslation(review.comment).text;
  const trimmed = text.trim();

  const submit = async (e) => {
    e.preventDefault();
    if (!trimmed) { setError('Write a reply first.'); return; }
    setSaving(true);
    setError('');
    try {
      const saved = await replyToGoogleReview(review.reviewId, trimmed);
      onSaved(saved);
    } catch (err) {
      setError(errorMessage(err, 'Could not post the reply to Google'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-start border-b border-gray-100 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">Google review</span>
            <h3 className="text-base font-extrabold text-gray-900 mt-1">
              {review.reply?.comment ? 'Edit reply to' : 'Reply to'} {review.reviewerName || 'Google user'}
            </h3>
            <GoogleStars value={review.starRating} />
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-900 flex gap-2">
          <Globe className="w-4 h-4 flex-shrink-0 mt-px" />
          This reply is posted publicly on Google Maps and Search under The Shine Lounge.
        </div>

        {original && (
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs text-slate-700 font-medium max-h-32 overflow-y-auto whitespace-pre-line">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Their review:</span>
            "{original}"
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl text-xs font-bold flex items-start gap-2 bg-red-50 text-red-800 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div>
          <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1.5">Quick replies</span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button key={p.label} type="button" onClick={() => setText(p.text)}
                className="px-2.5 py-1.5 rounded-xl bg-gray-50 hover:bg-amber-50 hover:border-amber-200 border border-gray-200/80 text-[11px] font-bold text-gray-700 transition-all">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <textarea
              rows={5}
              value={text}
              maxLength={REPLY_LIMIT}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your public reply..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium"
            />
            <div className="text-right text-[10px] font-semibold text-gray-400">{text.length} / {REPLY_LIMIT}</div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={saving} className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl">
              Cancel
            </button>
            <button type="submit" disabled={saving || !trimmed}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50">
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {review.reply?.comment ? 'Update on Google' : 'Post to Google'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
