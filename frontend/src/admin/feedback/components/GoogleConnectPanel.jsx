import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, Link2, MapPin, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  errorMessage,
  getGoogleAuthUrl,
  getGoogleLocations,
  selectGoogleLocation
} from '../../services/googleReviewsApi';

const STEPS = [
  {
    title: 'Own the Business Profile',
    detail: 'Sign in to business.google.com with the Google account that owns or manages "The Shine Lounge". If Google shows "Own this business?", claim and verify it first.'
  },
  {
    title: 'Enable the APIs in Google Cloud',
    detail: 'In the project that owns the OAuth client, enable: My Business Account Management API, My Business Business Information API and Google My Business API.'
  },
  {
    title: 'Request Business Profile API access',
    detail: 'Submit Google\'s "Business Profile API access request" form for the project. Until it is approved the API quota is 0 and reviews cannot load.'
  },
  {
    title: 'Configure the OAuth consent screen',
    detail: 'Add the scope business.manage, add the redirect URI below to the OAuth client, and set the app to "In production" (in Testing mode the connection expires every 7 days).'
  }
];

export function LocationPicker({ onSelected }) {
  const [locations, setLocations] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');

  useEffect(() => {
    getGoogleLocations()
      .then((d) => setLocations(d.locations || []))
      .catch((err) => setError(errorMessage(err, 'Could not load Business Profile locations')));
  }, []);

  const choose = async (loc) => {
    setSaving(loc.locationName);
    setError('');
    try {
      await selectGoogleLocation(loc.accountName, loc.locationName);
      onSelected();
    } catch (err) {
      setError(errorMessage(err, 'Could not select that location'));
    } finally {
      setSaving('');
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-gray-700">Choose which Business Profile to show:</p>
      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
      {!locations && !error && <p className="text-xs text-gray-400 font-semibold flex items-center gap-1.5"><RefreshCw className="w-3 h-3 animate-spin" /> Loading locations…</p>}
      {locations && locations.length === 0 && (
        <p className="text-xs text-gray-500 font-semibold">This Google account does not manage any Business Profile. Disconnect and connect with the owner account.</p>
      )}
      {locations && locations.map((loc) => (
        <button key={loc.locationName} type="button" disabled={Boolean(saving)} onClick={() => choose(loc)}
          className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all flex items-center gap-3 disabled:opacity-60">
          <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-extrabold text-gray-900">{loc.title || loc.locationName}</span>
            {loc.address && <span className="block text-[11px] text-gray-500 font-medium truncate">{loc.address}</span>}
          </span>
          {saving === loc.locationName && <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />}
        </button>
      ))}
    </div>
  );
}

export default function GoogleConnectPanel({ status, isAdmin, reconnect = false }) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const oauthConfigured = status?.oauthConfigured;

  const connect = async () => {
    setConnecting(true);
    setError('');
    try {
      window.location.href = await getGoogleAuthUrl();
    } catch (err) {
      setError(errorMessage(err, 'Could not start Google sign-in'));
      setConnecting(false);
    }
  };

  const button = isAdmin && oauthConfigured && (
    <button type="button" onClick={connect} disabled={connecting}
      className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-60">
      {connecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
      {reconnect ? 'Reconnect Google Business' : 'Connect Google Business Profile'}
    </button>
  );

  if (reconnect) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex gap-2 text-xs font-semibold text-rose-900">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-px" />
          <span>Google access expired or was revoked. Showing the last synced reviews. {isAdmin ? 'Reconnect to resume syncing and replying.' : 'Ask an admin to reconnect.'}</span>
        </div>
        {button}
        {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-gray-900">Show live Google reviews here</h3>
          <p className="text-xs text-gray-500 font-medium mt-1 max-w-xl">
            Connect the Google Business Profile once. Every review then syncs here automatically, and admins can reply on Google without leaving this page.
          </p>
        </div>
        {button}
      </div>

      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

      {!oauthConfigured && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold">
          The backend is missing Google OAuth settings. Set <code>GOOGLE_OAUTH_CLIENT_ID</code>, <code>GOOGLE_OAUTH_CLIENT_SECRET</code> and <code>GOOGLE_OAUTH_REDIRECT_URI</code> in <code>backend/.env</code> and restart.
        </div>
      )}
      {!isAdmin && oauthConfigured && (
        <p className="text-xs text-gray-500 font-semibold">Only an admin can connect the Google account.</p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex gap-3">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-[11px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
            <div>
              <p className="text-xs font-extrabold text-gray-900">{s.title}</p>
              <p className="text-[11px] text-gray-600 font-medium mt-0.5 leading-relaxed">{s.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {status?.redirectUri && (
        <div className="text-[11px] text-gray-500 font-semibold space-y-1">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Authorized redirect URI for this server:</span>
          <code className="block px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 break-all">{status.redirectUri}</code>
        </div>
      )}

      <a href="https://developers.google.com/my-business/content/prereqs" target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline">
        Google's Business Profile API prerequisites <ExternalLink className="w-3 h-3" />
      </a>
      {status?.placesConfigured && (
        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Places API fallback is configured.
        </p>
      )}
    </div>
  );
}
