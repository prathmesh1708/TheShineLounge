import React, { useState } from 'react';
import { CheckCircle2, Languages, Pencil, Reply, Trash2, RefreshCw } from 'lucide-react';
import GoogleStars from './GoogleStars';
import { formatDate, relativeTime, splitTranslation } from '../utils/googleReviewFormat';

const CLAMP = 320;

function Avatar({ name, photo }) {
  const [broken, setBroken] = useState(false);
  if (photo && !broken) {
    return (
      <img
        src={photo}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-extrabold text-sm flex items-center justify-center flex-shrink-0 border border-amber-200">
      {(name || 'G').charAt(0).toUpperCase()}
    </div>
  );
}

// trackReplies: false for Places API results, which never include replies.
export default function GoogleReviewCard({ review, canReply, trackReplies = true, onReply, onDeleteReply, deleting }) {
  const [expanded, setExpanded] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const { text, translation } = splitTranslation(review.comment);
  const body = showTranslation && translation ? translation : text;
  const long = body.length > CLAMP;
  const shown = long && !expanded ? `${body.slice(0, CLAMP).trimEnd()}…` : body;
  const hasReply = Boolean(review.reply?.comment);
  const lowRating = review.starRating <= 2;

  return (
    <div className={`p-5 space-y-3 transition-colors hover:bg-slate-50/60 ${lowRating && !hasReply ? 'border-l-4 border-l-rose-400' : ''}`}>
      <div className="flex items-start gap-3">
        <Avatar name={review.reviewerName} photo={review.reviewerPhotoUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <h4 className="font-extrabold text-gray-900 text-sm truncate">{review.reviewerName || 'Google user'}</h4>
            {!hasReply && trackReplies && (
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${lowRating ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                Awaiting reply
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <GoogleStars value={review.starRating} />
            <span className="text-[11px] text-gray-400 font-semibold" title={formatDate(review.createTime)}>
              {review.relativeTime || relativeTime(review.createTime)}
            </span>
            {review.updateTime && review.createTime && new Date(review.updateTime) - new Date(review.createTime) > 60000 && (
              <span className="text-[10px] text-gray-400 font-semibold">(edited)</span>
            )}
          </div>
        </div>
      </div>

      {body ? (
        <div className="text-[13px] text-slate-800 font-medium leading-relaxed whitespace-pre-line">
          {shown}
          {long && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="ml-1 text-amber-700 font-bold text-xs hover:underline">
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">Rated without a written review.</p>
      )}
      {translation && (
        <button type="button" onClick={() => setShowTranslation((v) => !v)} className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1">
          <Languages className="w-3 h-3" /> {showTranslation ? 'Show original' : 'Show Google translation'}
        </button>
      )}

      {hasReply && (
        <div className="ml-4 sm:ml-12 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
          <div className="flex items-center justify-between gap-2 font-bold text-[11px] text-emerald-800">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Response from the owner
              {review.reply.repliedBy && <span className="font-semibold text-emerald-700">· {review.reply.repliedBy}</span>}
            </span>
            {review.reply.updateTime && <span className="text-[10px] font-semibold text-emerald-700">{relativeTime(review.reply.updateTime)}</span>}
          </div>
          <p className="font-medium whitespace-pre-line">{review.reply.comment}</p>
        </div>
      )}

      {canReply && (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onReply(review)}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 text-[11px]"
          >
            {hasReply ? <><Pencil className="w-3 h-3" /> Edit reply</> : <><Reply className="w-3 h-3" /> Reply on Google</>}
          </button>
          {hasReply && (
            <button
              type="button"
              disabled={deleting}
              onClick={() => onDeleteReply(review)}
              className="px-2.5 py-1.5 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-all text-[11px] flex items-center gap-1 disabled:opacity-50"
            >
              {deleting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete reply
            </button>
          )}
        </div>
      )}
    </div>
  );
}
