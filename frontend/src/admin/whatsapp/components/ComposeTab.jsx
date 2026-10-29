import React, { useEffect, useMemo, useState } from 'react';
import { Send, FileText, PenLine, AlertTriangle, Info, Loader2, ExternalLink, Copy, Check, FlaskConical, RefreshCw } from 'lucide-react';
import AdminModal from '../../common/components/AdminModal';
import ContactPicker from './ContactPicker';
import MessageComposer from './MessageComposer';
import MediaAttachment from './MediaAttachment';
import WhatsAppPreview from './WhatsAppPreview';
import { createWhatsAppCampaign, sendWhatsAppTest, errorMessage } from '../../services/whatsappApi';
import { SAMPLE_VARS, namedBody, renderVariables, waMeLink, within24h, normalizePhone } from '../utils/whatsappFormat';

const EMPTY_MEDIA = { type: 'none', url: '', filename: '', bytes: 0 };
const field = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400/40';
const label = 'block text-[11px] font-black uppercase tracking-wide text-gray-500 mb-1.5';

// Manual mode: no API keys yet, so open each chat in WhatsApp with the text
// already typed. wa.me cannot attach files — the media link goes in the text.
function ManualSendModal({ isOpen, onClose, recipients, buildText }) {
  const [opened, setOpened] = useState(() => new Set());
  const [copied, setCopied] = useState('');

  useEffect(() => { if (isOpen) setOpened(new Set()); }, [isOpen]);

  const open = (c) => {
    window.open(waMeLink(c.phone, buildText(c)), '_blank', 'noopener');
    setOpened((s) => new Set(s).add(c.phone));
  };
  const copy = async (c) => {
    try {
      await navigator.clipboard.writeText(buildText(c));
      setCopied(c.phone);
      setTimeout(() => setCopied(''), 1500);
    } catch (e) { /* clipboard blocked */ }
  };
  const next = recipients.find((c) => !opened.has(c.phone));

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl"
      title="Send manually through WhatsApp"
      subtitle={`${opened.size} of ${recipients.length} chats opened`}>
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11.5px] font-semibold text-amber-800 flex gap-2">
        <Info className="w-4 h-4 shrink-0 mt-px" />
        <span>
          The WhatsApp API keys are not set yet, so each chat opens in WhatsApp (Web or app) with the message typed in — press send there.
          Photos, videos and PDFs cannot be attached this way; their link is added to the text instead.
        </span>
      </div>
      {next && (
        <button type="button" onClick={() => open(next)}
          className="w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white text-sm font-black flex items-center justify-center gap-2">
          <ExternalLink className="w-4 h-4" /> Open next chat — {next.name || next.display}
        </button>
      )}
      <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
        {recipients.map((c) => (
          <li key={c.phone} className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 truncate">{c.name || 'Unnamed'}</p>
              <p className="text-[11px] text-gray-500 font-semibold">{c.display}</p>
            </div>
            <button type="button" onClick={() => copy(c)} title="Copy message"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100">
              {copied === c.phone ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button type="button" onClick={() => open(c)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 ${
                opened.has(c.phone) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-[#008069] text-white'
              }`}>
              {opened.has(c.phone) ? <><Check className="w-3.5 h-3.5" /> Opened</> : <><ExternalLink className="w-3.5 h-3.5" /> Open chat</>}
            </button>
          </li>
        ))}
      </ul>
    </AdminModal>
  );
}

export default function ComposeTab({
  status,
  contacts,
  contactsLoading,
  onReloadContacts,
  onToggleOptOut,
  templates,
  presetTemplateId,
  onCampaignCreated,
  onRefreshTemplates
}) {
  const apiReady = Boolean(status && status.configured);
  const strictTemplates = apiReady && !status.dryRun;
  // BhashSMS free-form replies are text only and it does not report who replied.
  const isBhash = Boolean(status && status.provider === 'bhashsms');

  const [selected, setSelected] = useState(() => new Map());
  const [mode, setMode] = useState('template');
  const [templateId, setTemplateId] = useState('');
  const [body, setBody] = useState('');
  const [media, setMedia] = useState(EMPTY_MEDIA);
  const [headerOverride, setHeaderOverride] = useState(EMPTY_MEDIA);
  const [previewPhone, setPreviewPhone] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [testPhone, setTestPhone] = useState(() => {
    try { return localStorage.getItem('tsl_wa_test_phone') || ''; } catch (e) { return ''; }
  });
  const [busy, setBusy] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const usableTemplates = useMemo(
    () => templates.filter((t) => !strictTemplates || t.metaStatus === 'APPROVED'),
    [templates, strictTemplates]
  );
  const template = templates.find((t) => t._id === templateId) || null;

  useEffect(() => {
    if (presetTemplateId) {
      setMode('template');
      setTemplateId(presetTemplateId);
    }
  }, [presetTemplateId]);

  useEffect(() => { setHeaderOverride(EMPTY_MEDIA); }, [templateId]);

  // No approved template yet: start in free-form so the page is usable.
  useEffect(() => {
    if (!presetTemplateId && !usableTemplates.length) setMode('freeform');
  }, [usableTemplates.length, presetTemplateId]);

  const recipients = useMemo(() => [...selected.values()], [selected]);
  const previewContact = selected.get(previewPhone) || recipients[0] || null;
  const vars = previewContact && previewContact.vars ? previewContact.vars : SAMPLE_VARS;

  const isTemplate = mode === 'template';
  const templateHasMedia = template && ['image', 'video', 'document'].includes(template.headerType);
  const effectiveHeaderMedia = isTemplate ? (headerOverride.url ? headerOverride : { url: template ? template.headerMediaUrl : '' }) : media;
  const messageText = isTemplate ? namedBody(template) : body;

  const preview = isTemplate
    ? {
      headerType: template ? template.headerType : 'none',
      headerText: template ? template.headerText : '',
      mediaUrl: effectiveHeaderMedia.url,
      mediaFilename: effectiveHeaderMedia.filename,
      body: messageText,
      footer: template ? template.footer : '',
      buttons: template ? template.buttons : []
    }
    : { headerType: media.url ? media.type : 'none', mediaUrl: media.url, mediaFilename: media.filename, body };

  const repliedCount = recipients.filter((c) => within24h(c.lastInboundAt)).length;
  const hasContent = isTemplate ? Boolean(template) : Boolean(body.trim() || media.url);
  const canSend = recipients.length > 0 && hasContent;

  const payload = () => ({
    title: title.trim(),
    mode,
    templateId: isTemplate ? templateId : undefined,
    body: isTemplate ? undefined : body,
    media: isTemplate ? (headerOverride.url ? headerOverride : undefined) : (media.url ? media : undefined),
    recipients: recipients.map((c) => ({ phone: c.phone, name: c.name })),
    scheduledAt: scheduleAt ? new Date(scheduleAt).toISOString() : undefined
  });

  const buildManualText = (c) => {
    const text = renderVariables(messageText, c.vars || { phone: c.display });
    const link = effectiveHeaderMedia && effectiveHeaderMedia.url;
    const footer = isTemplate && template && template.footer ? `\n\n${template.footer}` : '';
    return `${template && isTemplate && template.headerType === 'text' && template.headerText ? `*${template.headerText}*\n\n` : ''}${text}${footer}${link ? `\n\n${link}` : ''}`;
  };

  const handleSendClick = () => {
    setFeedback({ type: '', text: '' });
    if (apiReady) setConfirmOpen(true);
    else setManualOpen(true);
  };

  const send = async () => {
    setBusy('send');
    setFeedback({ type: '', text: '' });
    try {
      const campaign = await createWhatsAppCampaign(payload());
      setConfirmOpen(false);
      setSelected(new Map());
      setTitle('');
      setScheduleAt('');
      onCampaignCreated && onCampaignCreated(campaign._id);
    } catch (err) {
      setFeedback({ type: 'error', text: errorMessage(err, 'Could not queue the campaign') });
    } finally {
      setBusy('');
    }
  };

  const sendTest = async () => {
    const phone = normalizePhone(testPhone);
    if (!phone) {
      setFeedback({ type: 'error', text: 'Enter a valid test number' });
      return;
    }
    try { localStorage.setItem('tsl_wa_test_phone', testPhone); } catch (e) { /* storage off */ }
    setBusy('test');
    setFeedback({ type: '', text: '' });
    try {
      const { recipients: _r, scheduledAt: _s, title: _t, ...rest } = payload();
      await sendWhatsAppTest({ ...rest, phone });
      setFeedback({ type: 'success', text: 'Test queued — check that phone in a few seconds (and the Campaigns tab for its status).' });
    } catch (err) {
      setFeedback({ type: 'error', text: errorMessage(err, 'Test send failed') });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* Recipients */}
      <div className="lg:col-span-4">
        <ContactPicker
          contacts={contacts}
          loading={contactsLoading}
          onRefresh={onReloadContacts}
          selected={selected}
          onChange={setSelected}
          onToggleOptOut={onToggleOptOut}
        />
      </div>

      {/* Message format */}
      <div className="lg:col-span-5 bg-white border border-gray-200/90 rounded-2xl shadow-sm p-4 space-y-4">
        <div>
          <h3 className="text-sm font-black text-gray-900">Message format</h3>
          <p className="text-[11px] text-gray-500 font-medium">Choose an approved template, or write a free-form message.</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'template', icon: FileText, title: 'Template', sub: 'Any time · photo/video/PDF header' },
            { id: 'freeform', icon: PenLine, title: 'Free-form', sub: isBhash ? 'Text reply · 24h after they message you' : 'Text, photo, video, PDF' }
          ].map((m) => (
            <button key={m.id} type="button" onClick={() => setMode(m.id)}
              className={`text-left p-3 rounded-xl border-2 transition-colors ${
                mode === m.id ? 'border-[#008069] bg-emerald-50/50' : 'border-gray-100 hover:border-gray-200'
              }`}>
              <div className="flex items-center gap-1.5 text-xs font-black text-gray-900">
                <m.icon className="w-3.5 h-3.5 text-[#008069]" /> {m.title}
              </div>
              <p className="text-[10.5px] text-gray-500 font-semibold mt-0.5">{m.sub}</p>
            </button>
          ))}
        </div>

        {isTemplate ? (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <label className={label}>Template</label>
                {onRefreshTemplates && (
                  <button type="button" onClick={async () => { setBusy('refresh'); try { await onRefreshTemplates(); } finally { setBusy(''); } }}
                    disabled={busy === 'refresh'}
                    className="mb-1.5 text-[10.5px] font-bold text-[#008069] hover:underline flex items-center gap-1 disabled:opacity-50">
                    <RefreshCw className={`w-3 h-3 ${busy === 'refresh' ? 'animate-spin' : ''}`} /> {isBhash ? 'Refresh from BhashSMS' : 'Refresh'}
                  </button>
                )}
              </div>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={field}>
                <option value="">— Select a template —</option>
                {usableTemplates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.displayName || t.name} · {String(t.category || '').toLowerCase()}{t.headerType !== 'none' ? ` · ${t.headerType === 'document' ? 'PDF' : t.headerType}` : ''}{t.metaStatus !== 'APPROVED' ? ` (${t.metaStatus.toLowerCase()})` : ''}
                  </option>
                ))}
                {strictTemplates && templates.filter((t) => t.metaStatus !== 'APPROVED').length > 0 && (
                  <optgroup label="Not usable yet (pending / rejected on the panel)">
                    {templates.filter((t) => t.metaStatus !== 'APPROVED').map((t) => (
                      <option key={t._id} value={t._id} disabled>
                        {t.displayName || t.name} — {t.metaStatus === 'DISABLED' ? 'not on BhashSMS' : t.metaStatus.toLowerCase()}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              {template && template.purpose === 'invoice' && (
                <p className="text-[10.5px] text-amber-700 font-semibold mt-1">This is the invoice-receipt template — for a promotion pick an image template instead.</p>
              )}
              {!usableTemplates.length && (
                <p className="text-[11px] text-amber-700 font-semibold mt-1.5">
                  {isBhash
                    ? 'No templates yet. Get one approved on the BhashSMS panel, then register it in the Templates tab.'
                    : strictTemplates
                    ? 'No approved templates yet. Create one in the Templates tab and submit it to Meta (approval usually takes minutes to a few hours).'
                    : 'No templates yet — create one in the Templates tab.'}
                </p>
              )}
            </div>
            {template && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-medium text-gray-700 whitespace-pre-wrap">
                {namedBody(template)}
              </div>
            )}
            {templateHasMedia && (
              <div>
                <label className={label}>Header {template.headerType === 'document' ? 'PDF' : template.headerType} for this send {template.headerMediaUrl ? '(optional)' : '(required)'}</label>
                <MediaAttachment value={headerOverride} onChange={setHeaderOverride} lockedType={template.headerType} />
                {!headerOverride.url && template.headerMediaUrl && (
                  <p className="text-[10.5px] text-gray-400 font-semibold mt-1">Leave empty to use the template&apos;s sample file.</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {templates.length > 0 && (
              <div>
                <label className={label}>Start from a saved format</label>
                <select value="" onChange={(e) => {
                  const t = templates.find((x) => x._id === e.target.value);
                  if (t) setBody(namedBody(t));
                }} className={field}>
                  <option value="">— Copy text from a template —</option>
                  {templates.map((t) => <option key={t._id} value={t._id}>{t.displayName || t.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className={label}>Message</label>
              <MessageComposer value={body} onChange={setBody} maxLength={4096} rows={7}
                placeholder={'Hi {{firstName}} 👋\n\nYour car is *ready for pickup* at The Shine Lounge!'} />
            </div>
            {!isBhash && (
              <div>
                <label className={label}>Attach photo, video or PDF</label>
                <MediaAttachment value={media} onChange={setMedia} allowedTypes={['image', 'video', 'document']} />
              </div>
            )}
            {isBhash && (
              <p className="text-[11px] font-semibold text-gray-500 flex gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
                To send a photo, video or PDF, use a template approved with that header type.
              </p>
            )}
            {apiReady && !isBhash && recipients.length > 0 && (
              <div className={`p-3 rounded-xl text-[11.5px] font-semibold flex gap-2 ${
                repliedCount === recipients.length ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                <span>
                  WhatsApp only delivers free-form messages to people who messaged you in the last 24 hours.
                  {' '}<b>{repliedCount} of {recipients.length}</b> selected qualify — the rest will be skipped. Use a template to reach everyone.
                </span>
              </div>
            )}
          </div>
        )}

        <div className="pt-1 flex flex-col sm:flex-row gap-2">
          <button type="button" disabled={!canSend} onClick={handleSendClick}
            className="flex-1 py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-black flex items-center justify-center gap-2 transition-colors">
            <Send className="w-4 h-4" />
            {apiReady ? `Send to ${recipients.length || ''} ${recipients.length === 1 ? 'contact' : 'contacts'}` : `Send manually to ${recipients.length || ''}`}
          </button>
        </div>
        {!recipients.length && <p className="text-[11px] text-gray-400 font-semibold text-center -mt-2">Select recipients on the left.</p>}
        {feedback.text && !confirmOpen && (
          <p className={`text-xs font-semibold ${feedback.type === 'error' ? 'text-rose-600' : 'text-emerald-700'}`}>{feedback.text}</p>
        )}
      </div>

      {/* Preview */}
      <div className="lg:col-span-3 lg:sticky lg:top-20 space-y-3">
        <div className="bg-white border border-gray-200/90 rounded-2xl shadow-sm p-3">
          <label className={label}>Preview as</label>
          <select value={previewContact ? previewContact.phone : ''} onChange={(e) => setPreviewPhone(e.target.value)}
            disabled={!recipients.length} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs font-bold bg-white disabled:bg-gray-50">
            {!recipients.length && <option value="">Sample customer</option>}
            {recipients.slice(0, 300).map((c) => <option key={c.phone} value={c.phone}>{c.name || c.display}</option>)}
          </select>
        </div>
        <WhatsAppPreview {...preview} vars={vars} recipientLabel={previewContact ? (previewContact.name || previewContact.display) : 'sample customer'} />
      </div>

      {/* Confirm (API mode) */}
      <AdminModal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Send WhatsApp campaign"
        subtitle={`${recipients.length} recipient${recipients.length === 1 ? '' : 's'} · ${isTemplate ? `template "${template ? template.displayName || template.name : ''}"` : 'free-form'}`}>
        {status && status.dryRun && (
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-[11.5px] font-semibold text-sky-800">
            Dry-run mode is on (WHATSAPP_DRY_RUN=true): nothing is really sent to WhatsApp.
          </div>
        )}
        {!isTemplate && !isBhash && repliedCount < recipients.length && (
          <p className="text-[11.5px] font-semibold text-amber-700">
            {recipients.length - repliedCount} contact(s) have not messaged you in 24h and will be skipped.
          </p>
        )}
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wide text-gray-500 flex items-center gap-1.5"><FlaskConical className="w-3.5 h-3.5" /> Send a test first</p>
          <div className="flex gap-2">
            <input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="Your number" className={`${field} py-2`} />
            <button type="button" onClick={sendTest} disabled={busy !== ''}
              className="px-3 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:border-gray-400 flex items-center gap-1.5 shrink-0 disabled:opacity-50">
              {busy === 'test' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Test
            </button>
          </div>
        </div>
        {feedback.text && (
          <p className={`text-xs font-semibold ${feedback.type === 'error' ? 'text-rose-600' : 'text-emerald-700'}`}>{feedback.text}</p>
        )}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => setConfirmOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">Cancel</button>
          <button type="button" onClick={send} disabled={busy !== ''}
            className="flex-[2] py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-60">
            {busy === 'send' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {scheduleAt ? 'Schedule' : 'Send now'}
          </button>
        </div>
      </AdminModal>

      <ManualSendModal isOpen={manualOpen} onClose={() => setManualOpen(false)} recipients={recipients} buildText={buildManualText} />
    </div>
  );
}
