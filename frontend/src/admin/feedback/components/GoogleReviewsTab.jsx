import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  MessageSquareReply,
  RefreshCw,
  Search,
  Unplug,
  X
} from 'lucide-react';
import GoogleStars from './GoogleStars';
import GoogleReviewCard from './GoogleReviewCard';
import GoogleReplyModal from './GoogleReplyModal';
import GoogleConnectPanel, { LocationPicker } from './GoogleConnectPanel';
import { relativeTime } from '../utils/googleReviewFormat';
import {
  deleteGoogleReviewReply,
  disconnectGoogleReviews,
  errorMessage,
  getGoogleReviewsStatus,
  listGoogleReviews,
  syncGoogleReviews
} from '../../services/googleReviewsApi';

const AUTO_REFRESH_MS = 5 * 60 * 1000;
const DEFAULT_FILTERS = { rating: 'all', replied: 'all', sort: 'newest', search: '', page: 1 };

function RatingSummary({ summary, filters, setFilters, trackReplies }) {
  const total = summary.distribution ? Object.values(summary.distribution).reduce((a, b) => a + b, 0) : 0;
  return (
    <div className="grid md:grid-cols-[auto_1fr_auto] gap-6 items-center">
      <div className="text-center md:text-left">
        <div className="text-5xl font-black text-gray-900 leading-none">
          {summary.averageRating != null ? Number(summary.averageRating).toFixed(1) : '–'}
        </div>
        <div className="mt-2"><GoogleStars value={summary.averageRating} size="w-4 h-4" /></div>
        <div className="text-xs font-bold text-blue-600 mt-1">
          {summary.totalReviewCount ?? 0} Google review{summary.totalReviewCount === 1 ? '' : 's'}
        </div>
      </div>

      {summary.distribution ? (
        <div className="space-y-1 w-full max-w-md">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.distribution[star] || 0;
            const pct = total ? (count / total) * 100 : 0;
            const active = String(filters.rating) === String(star);
            return (
              <button key={star} type="button"
                onClick={() => setFilters((f) => ({ ...f, rating: active ? 'all' : String(star), page: 1 }))}
                className={`w-full flex items-center gap-2 px-1.5 py-0.5 rounded-lg text-[11px] font-bold transition-colors ${active ? 'bg-amber-100' : 'hover:bg-gray-50'}`}
                title={`Show ${star}-star reviews`}>
                <span className="w-3 text-gray-600">{star}</span>
                <span className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <span className="block h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-8 text-right text-gray-500">{count}</span>
              </button>
            );
          })}
        </div>
      ) : <div />}

      {trackReplies && summary.unreplied != null && (
        <button type="button"
          onClick={() => setFilters((f) => ({ ...f, replied: f.replied === 'no' ? 'all' : 'no', page: 1 }))}
          className={`p-4 rounded-2xl border text-left transition-colors ${filters.replied === 'no' ? 'bg-amber-100 border-amber-300' : 'bg-amber-50 border-amber-200 hover:bg-amber-100'}`}>
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <MessageSquareReply className="w-3.5 h-3.5" /> Awaiting reply
          </span>
          <span className="text-2xl font-black text-amber-900 block mt-0.5">{summary.unreplied}</span>
        </button>
      )}
    </div>
  );
}

export default function GoogleReviewsTab({ isAdmin }) {
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [deletingId, setDeletingId] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const loadSeq = useRef(0);

  // Result of the Google OAuth round trip, carried back in the URL.
  useEffect(() => {
    const connected = params.get('connected');
    const googleError = params.get('google_error');
    if (!connected && !googleError) return;
    setFlash(connected
      ? { type: 'success', text: 'Google Business Profile connected. Reviews are syncing.' }
      : { type: 'error', text: googleError === 'access_denied' ? 'Google sign-in was cancelled.' : googleError === 'no_refresh_token' ? 'Google did not grant offline access. Try connecting again.' : `Google connection failed: ${googleError}` });
    const next = new URLSearchParams(params);
    next.delete('connected');
    next.delete('google_error');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const load = useCallback(async ({ quiet = false } = {}) => {
    const seq = ++loadSeq.current;
    if (!quiet) setLoading(true);
    try {
      const [s, list] = await Promise.all([getGoogleReviewsStatus(), listGoogleReviews(filters)]);
      if (seq !== loadSeq.current) return;
      setStatus(s);
      setData(list);
      setError('');
    } catch (err) {
      if (seq === loadSeq.current) setError(errorMessage(err, 'Could not load Google reviews'));
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = setInterval(() => load({ quiet: true }), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const integration = data?.integration || status?.integration;
  const source = data?.source;
  const needsLocation = integration?.status === 'connected' && !integration?.locationName;
  const needsReconnect = integration?.status === 'needs_reconnect';
  const isGbp = source === 'gbp';
  const canReply = isAdmin && isGbp && integration?.status === 'connected';

  const syncNow = async () => {
    setSyncing(true);
    setFlash(null);
    try {
      const r = await syncGoogleReviews(true);
      setFlash({ type: 'success', text: `Synced with Google${r.upserted ? ` (${r.upserted} updated)` : ''}.` });
      await load({ quiet: true });
    } catch (err) {
      setFlash({ type: 'error', text: errorMessage(err, 'Sync failed') });
      await load({ quiet: true });
    } finally {
      setSyncing(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Disconnect Google Business Profile? Synced reviews are cleared from this panel (nothing changes on Google).')) return;
    try {
      await disconnectGoogleReviews();
      setFilters(DEFAULT_FILTERS);
      await load();
    } catch (err) {
      setFlash({ type: 'error', text: errorMessage(err, 'Could not disconnect') });
    }
  };

  const handleDeleteReply = async (review) => {
    if (!window.confirm('Delete your public reply to this review on Google?')) return;
    setDeletingId(review.reviewId);
    try {
      await deleteGoogleReviewReply(review.reviewId);
      await load({ quiet: true });
    } catch (err) {
      setFlash({ type: 'error', text: errorMessage(err, 'Could not delete the reply') });
    } finally {
      setDeletingId('');
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: searchInput.trim(), page: 1 }));
  };

  const flashBanner = flash && (
    <div className={`p-3 rounded-xl text-xs font-bold flex items-start gap-2 ${flash.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
      {flash.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      <span className="flex-1">{flash.text}</span>
      <button type="button" onClick={() => setFlash(null)}><X className="w-3.5 h-3.5" /></button>
    </div>
  );

  if (loading && !data) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center text-gray-400 font-bold text-xs flex flex-col items-center gap-2">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-500" /> Loading Google reviews…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-3">
        <AlertCircle className="w-7 h-7 text-rose-400 mx-auto" />
        <p className="text-xs font-bold text-rose-700">{error}</p>
        <button type="button" onClick={() => load()} className="px-4 py-2 bg-amber-500 text-white text-xs font-extrabold rounded-xl">Try again</button>
      </div>
    );
  }

  // Connected to Google but no location chosen yet (several, none, or API not approved).
  if (needsLocation) {
    return (
      <div className="space-y-4">
        {flashBanner}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Google account connected</h3>
              <p className="text-xs text-gray-500 font-medium">{integration.connectedEmail}</p>
            </div>
            {isAdmin && (
              <button type="button" onClick={disconnect} className="px-3 py-2 text-xs font-bold text-gray-600 hover:text-rose-600 flex items-center gap-1.5">
                <Unplug className="w-3.5 h-3.5" /> Disconnect
              </button>
            )}
          </div>
          {integration.lastSyncError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-px" /> {integration.lastSyncError}
            </div>
          )}
          {isAdmin
            ? <LocationPicker onSelected={() => { setFlash({ type: 'success', text: 'Location selected. Reviews synced.' }); load(); }} />
            : <p className="text-xs text-gray-500 font-semibold">An admin needs to choose the Business Profile location.</p>}
        </div>
      </div>
    );
  }

  if (source === 'none') {
    return (
      <div className="space-y-4">
        {flashBanner}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Show Google reviews here — quick setup</h3>
            <p className="text-xs text-gray-500 font-medium mt-1">
              One API key, no Google sign-in or verification. Shows your live rating, review count and the latest reviews Google provides (up to 5).
            </p>
          </div>
          <ol className="space-y-2 text-xs text-gray-700 font-medium list-decimal pl-5">
            <li>Open <a className="text-blue-600 font-bold hover:underline" href="https://console.cloud.google.com/apis/library/places.googleapis.com" target="_blank" rel="noreferrer">Places API (New)</a> in Google Cloud Console and click <b>Enable</b> (the project needs a billing account; normal use stays in the free credit).</li>
            <li>Go to <a className="text-blue-600 font-bold hover:underline" href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">APIs &amp; Services → Credentials</a> → <b>Create credentials → API key</b>. Restrict it to "Places API (New)".</li>
            <li>Add it to <code className="px-1 py-0.5 rounded bg-gray-100">backend/.env</code> as <code className="px-1 py-0.5 rounded bg-gray-100">GOOGLE_PLACES_API_KEY=your-key</code> and restart the backend.</li>
          </ol>
          <button type="button" onClick={() => setShowSetup((v) => !v)} className="text-[11px] font-bold text-gray-500 hover:text-gray-900">
            {showSetup ? 'Hide advanced option' : 'Advanced: show all reviews and reply from here (needs owner sign-in + Google approval)'}
          </button>
        </div>
        {showSetup && <GoogleConnectPanel status={status} isAdmin={isAdmin} />}
      </div>
    );
  }

  const summary = data?.summary || {};
  const reviews = data?.reviews || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };
  const filtered = filters.rating !== 'all' || filters.replied !== 'all' || filters.search;

  return (
    <div className="space-y-4">
      {flashBanner}

      {needsReconnect && <GoogleConnectPanel status={status} isAdmin={isAdmin} reconnect />}

      {source === 'places' && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <p className="text-xs font-semibold text-blue-900 flex gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-px" />
              Google shares {reviews.length} of the {summary.totalReviewCount ?? ''} reviews through its API. Use "Open on Google Maps" to read the rest.
            </p>
            <button type="button" onClick={() => setShowSetup((v) => !v)} className="px-3 py-2 bg-white border border-blue-200 text-blue-700 text-xs font-extrabold rounded-xl flex-shrink-0">
              {showSetup ? 'Hide' : 'Show all reviews (advanced)'}
            </button>
          </div>
          {showSetup && <GoogleConnectPanel status={status} isAdmin={isAdmin} />}
        </div>
      )}

      {isGbp && integration?.lastSyncError && !needsReconnect && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 flex gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-px" /> Last sync failed: {integration.lastSyncError}
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">{summary.title || integration?.locationTitle || 'The Shine Lounge'}</h3>
            <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
              {isGbp
                ? <>Live from Google Business Profile · {integration?.lastSyncAt ? `synced ${relativeTime(integration.lastSyncAt)}` : 'not synced yet'}{status?.syncIntervalMin ? ` · auto-sync every ${status.syncIntervalMin} min` : ''}</>
                : 'Live from Google Places'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {summary.mapsUri && (
              <a href={summary.mapsUri} target="_blank" rel="noreferrer"
                className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Open on Google Maps
              </a>
            )}
            {isGbp && isAdmin && integration?.status === 'connected' && (
              <button type="button" onClick={syncNow} disabled={syncing}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-60">
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing…' : 'Sync now'}
              </button>
            )}
            {!isGbp && (
              <button type="button" onClick={() => load()} className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            )}
            {isGbp && isAdmin && (
              <button type="button" onClick={disconnect} title="Disconnect Google Business Profile"
                className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50">
                <Unplug className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <RatingSummary summary={summary} filters={filters} setFilters={setFilters} trackReplies={isGbp} />
      </div>

      {/* Filters */}
      {isGbp && (
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <form onSubmit={submitSearch} className="relative flex-grow max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search reviewer, review or reply text…"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none transition-all"
            />
          </form>
          <div className="flex flex-wrap items-center gap-2">
            <select value={filters.rating} onChange={(e) => setFilters((f) => ({ ...f, rating: e.target.value, page: 1 }))}
              className="bg-gray-50 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none cursor-pointer">
              <option value="all">All ratings</option>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={String(n)}>{n} star{n > 1 ? 's' : ''}</option>)}
            </select>
            <select value={filters.replied} onChange={(e) => setFilters((f) => ({ ...f, replied: e.target.value, page: 1 }))}
              className="bg-gray-50 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none cursor-pointer">
              <option value="all">Replied & unreplied</option>
              <option value="no">Awaiting reply</option>
              <option value="yes">Replied</option>
            </select>
            <select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value, page: 1 }))}
              className="bg-gray-50 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none cursor-pointer">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="lowest">Lowest rating</option>
              <option value="highest">Highest rating</option>
            </select>
            {filtered && (
              <button type="button" onClick={() => { setFilters(DEFAULT_FILTERS); setSearchInput(''); }}
                className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-900">Clear</button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-extrabold text-sm text-gray-900">
            Google reviews ({isGbp ? pagination.total : reviews.length})
          </h3>
          {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />}
        </div>
        {reviews.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold text-xs">
            {filtered ? 'No reviews match these filters.' : isGbp && !integration?.lastSyncAt ? 'Reviews have not synced yet. Click "Sync now".' : 'No reviews yet.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((r) => (
              <GoogleReviewCard
                key={r.reviewId}
                review={r}
                canReply={canReply}
                trackReplies={isGbp}
                onReply={setReplyTarget}
                onDeleteReply={handleDeleteReply}
                deleting={deletingId === r.reviewId}
              />
            ))}
          </div>
        )}
        {isGbp && pagination.pages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-600">
            <button type="button" disabled={pagination.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="px-3 py-1.5 rounded-xl border border-gray-200 flex items-center gap-1 disabled:opacity-40">
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span>Page {pagination.page} of {pagination.pages}</span>
            <button type="button" disabled={pagination.page >= pagination.pages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="px-3 py-1.5 rounded-xl border border-gray-200 flex items-center gap-1 disabled:opacity-40">
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {replyTarget && (
        <GoogleReplyModal
          review={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSaved={() => {
            setReplyTarget(null);
            setFlash({ type: 'success', text: 'Reply posted on Google.' });
            load({ quiet: true });
          }}
        />
      )}
    </div>
  );
}
