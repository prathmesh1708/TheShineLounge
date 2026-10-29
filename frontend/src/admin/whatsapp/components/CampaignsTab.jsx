import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Eye, XCircle, RotateCcw, Trash2, Loader2, Megaphone, Search } from 'lucide-react';
import AdminModal from '../../common/components/AdminModal';
import WhatsAppPreview from './WhatsAppPreview';
import {
  getWhatsAppCampaigns, getWhatsAppCampaign, cancelWhatsAppCampaign,
  retryWhatsAppCampaign, deleteWhatsAppCampaign, errorMessage
} from '../../services/whatsappApi';
import { formatDateTime, formatPhone } from '../utils/whatsappFormat';

const SEGMENTS = [
  { key: 'read', label: 'Read', color: 'bg-sky-500' },
  { key: 'delivered', label: 'Delivered', color: 'bg-emerald-500' },
  { key: 'sent', label: 'Sent', color: 'bg-emerald-300' },
  { key: 'failed', label: 'Failed', color: 'bg-rose-500' },
  { key: 'skipped', label: 'Skipped', color: 'bg-gray-300' }
];

const CAMPAIGN_STATUS = {
  queued: 'bg-amber-50 text-amber-700 border-amber-200',
  sending: 'bg-sky-50 text-sky-700 border-sky-200',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200'
};

const RECIPIENT_STATUS = {
  queued: 'text-amber-600',
  sending: 'text-sky-600',
  sent: 'text-emerald-600',
  delivered: 'text-emerald-700',
  read: 'text-sky-700',
  failed: 'text-rose-600',
  skipped: 'text-gray-400'
};

function ProgressBar({ counts = {}, total = 0 }) {
  if (!total) return <div className="h-2 rounded-full bg-gray-100" />;
  return (
    <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex">
      {SEGMENTS.map((s) => (counts[s.key] ? (
        <div key={s.key} className={s.color} style={{ width: `${(counts[s.key] / total) * 100}%` }} title={`${s.label}: ${counts[s.key]}`} />
      ) : null))}
    </div>
  );
}

const isActive = (c) => c && ['queued', 'sending'].includes(c.status);

function CampaignDetail({ id, onClose, onChanged }) {
  const [campaign, setCampaign] = useState(null);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setCampaign(await getWhatsAppCampaign(id));
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [id]);

  useEffect(() => { setCampaign(null); setFilter('all'); load(); }, [load]);
  useEffect(() => {
    if (!isActive(campaign)) return undefined;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [campaign, load]);

  const act = async (key, fn) => {
    setBusy(key);
    setError('');
    try {
      await fn();
      await load();
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy('');
    }
  };

  const rows = useMemo(() => {
    if (!campaign) return [];
    const needle = q.trim().toLowerCase();
    return campaign.recipients.filter((r) =>
      (filter === 'all' || r.status === filter)
      && (!needle || (r.name || '').toLowerCase().includes(needle) || r.phone.includes(needle.replace(/\D/g, '') || '~')));
  }, [campaign, filter, q]);

  return (
    <AdminModal isOpen={Boolean(id)} onClose={onClose} maxWidth="max-w-5xl"
      title={campaign ? campaign.title : 'Campaign'}
      subtitle={campaign ? `${campaign.mode === 'template' ? `Template: ${campaign.templateName}` : 'Free-form'} · created ${formatDateTime(campaign.createdAt)}${campaign.dryRun ? ' · DRY RUN' : ''}` : ''}>
      {!campaign ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[{ key: 'all', label: 'Total', value: campaign.total }, ...['sent', 'delivered', 'read', 'failed', 'skipped'].map((k) => ({ key: k, label: k, value: campaign.counts[k] || 0 }))].map((s) => (
                <button key={s.key} type="button" onClick={() => setFilter(s.key)}
                  className={`p-2 rounded-xl border text-left ${filter === s.key ? 'border-gray-900 bg-gray-50' : 'border-gray-100'}`}>
                  <p className="text-[9.5px] font-black uppercase tracking-wide text-gray-400">{s.label}</p>
                  <p className="text-lg font-black text-gray-900">{s.value}</p>
                </button>
              ))}
            </div>
            <ProgressBar counts={campaign.counts} total={campaign.total} />
            {isActive(campaign) && (
              <p className="text-[11px] font-semibold text-sky-700 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {new Date(campaign.scheduledAt) > new Date() ? `Scheduled for ${formatDateTime(campaign.scheduledAt)}` : `Sending… ${campaign.counts.queued || 0} still queued`}
              </p>
            )}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recipients"
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none" />
            </div>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="max-h-[360px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-400 sticky top-0">
                    <tr>
                      <th className="text-left font-black px-3 py-2">Recipient</th>
                      <th className="text-left font-black px-3 py-2">Status</th>
                      <th className="text-left font-black px-3 py-2 hidden sm:table-cell">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.slice(0, 500).map((r) => (
                      <tr key={r._id}>
                        <td className="px-3 py-2">
                          <p className="font-bold text-gray-800">{r.name || 'Unnamed'}</p>
                          <p className="text-[10.5px] text-gray-400 font-semibold">{formatPhone(r.phone)}</p>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`font-black capitalize ${RECIPIENT_STATUS[r.status]}`}
                            title={campaign.provider === 'bhashsms' && r.status === 'sent' ? 'BhashSMS accepted the message. Delivery is not reported back yet — WhatsApp drops it if the template name/text is not approved.' : undefined}>
                            {campaign.provider === 'bhashsms' && r.status === 'sent' ? 'Accepted by BhashSMS' : r.status}
                          </span>
                          {r.error && <p className="text-[10.5px] text-gray-500 font-medium max-w-[280px]">{r.error}</p>}
                          {!r.error && r.providerResponse && (
                            <p className="text-[10px] text-gray-400 font-mono max-w-[280px] truncate" title={r.providerResponse}>Provider: {r.providerResponse}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[10.5px] text-gray-400 font-semibold hidden sm:table-cell">
                          {formatDateTime(r.readAt || r.deliveredAt || r.sentAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!rows.length && <p className="py-8 text-center text-xs text-gray-400 font-semibold">No recipients in this view.</p>}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <WhatsAppPreview
              headerType={campaign.media && campaign.media.url ? campaign.media.type : 'none'}
              mediaUrl={campaign.media && campaign.media.url}
              mediaFilename={campaign.media && campaign.media.filename}
              body={campaign.mode === 'template'
                ? String(campaign.body || '').replace(/\{\{\s*(\d+)\s*\}\}/g, (m, n) => (campaign.variableMap[n - 1] ? `{{${campaign.variableMap[n - 1]}}}` : m))
                : campaign.body}
              vars={(campaign.recipients[0] && campaign.recipients[0].vars) || {}}
              recipientLabel={campaign.recipients[0] ? campaign.recipients[0].name || formatPhone(campaign.recipients[0].phone) : ''}
            />
            <div className="flex flex-wrap gap-2">
              {isActive(campaign) && (
                <button type="button" onClick={() => act('cancel', () => cancelWhatsAppCampaign(campaign._id))} disabled={busy !== ''}
                  className="flex-1 py-2 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Cancel
                </button>
              )}
              {!isActive(campaign) && (campaign.counts.failed || 0) > 0 && (
                <button type="button" onClick={() => act('retry', () => retryWhatsAppCampaign(campaign._id))} disabled={busy !== ''}
                  className="flex-1 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold flex items-center justify-center gap-1.5">
                  {busy === 'retry' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Retry {campaign.counts.failed} failed
                </button>
              )}
            </div>
            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          </div>
        </div>
      )}
    </AdminModal>
  );
}

export default function CampaignsTab({ openCampaignId, onOpenCampaign }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setCampaigns(await getWhatsAppCampaigns());
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load campaigns'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const anyActive = campaigns.some(isActive);
  useEffect(() => {
    if (!anyActive) return undefined;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [anyActive, load]);

  const remove = async (c) => {
    if (!window.confirm(`Delete campaign "${c.title}" and its delivery history?`)) return;
    try {
      await deleteWhatsAppCampaign(c._id);
      load();
    } catch (err) {
      window.alert(errorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-gray-900">Campaign history</h3>
          <p className="text-[11px] text-gray-500 font-medium">Every send with live delivered / read status from WhatsApp.</p>
        </div>
        <button type="button" onClick={load} className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

      {!loading && !campaigns.length ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-14 text-center">
          <Megaphone className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-600 mt-2">No campaigns yet</p>
          <p className="text-xs text-gray-400 font-medium">Messages you send from the Compose tab will show up here.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200/90 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[720px]">
              <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="text-left font-black px-4 py-3">Campaign</th>
                  <th className="text-left font-black px-4 py-3">Status</th>
                  <th className="text-left font-black px-4 py-3 w-[34%]">Delivery</th>
                  <th className="text-left font-black px-4 py-3">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaigns.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900">{c.title}</p>
                      <p className="text-[10.5px] text-gray-400 font-semibold">
                        {c.source === 'invoice' ? 'Invoice receipt · ' : ''}
                        {c.mode === 'template' ? `Template · ${c.templateName}` : 'Free-form'}
                        {c.media && c.media.type !== 'none' ? ` · ${c.media.type}` : ''}
                        {c.dryRun ? ' · dry run' : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black capitalize ${CAMPAIGN_STATUS[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <ProgressBar counts={c.counts} total={c.total} />
                      <p className="text-[10.5px] text-gray-500 font-semibold mt-1">
                        {c.total} total · {(c.counts.sent || 0) + (c.counts.delivered || 0) + (c.counts.read || 0)} sent
                        {c.counts.failed ? ` · ${c.counts.failed} failed` : ''}{c.counts.skipped ? ` · ${c.counts.skipped} skipped` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-gray-500 font-semibold">{formatDateTime(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => onOpenCampaign(c._id)} title="View"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"><Eye className="w-4 h-4" /></button>
                        {!isActive(c) && (
                          <button type="button" onClick={() => remove(c)} title="Delete"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CampaignDetail id={openCampaignId} onClose={() => onOpenCampaign(null)} onChanged={load} />
    </div>
  );
}
