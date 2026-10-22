import React, { useMemo, useState } from 'react';
import { Plus, RefreshCw, Send, Edit2, Trash2, Loader2, FileText, Image as ImageIcon, Video, Type, X, Rocket, Receipt, Info } from 'lucide-react';
import AdminModal from '../../common/components/AdminModal';
import MessageComposer from './MessageComposer';
import MediaAttachment from './MediaAttachment';
import WhatsAppPreview from './WhatsAppPreview';
import {
  createWhatsAppTemplate, updateWhatsAppTemplate, submitWhatsAppTemplate,
  syncWhatsAppTemplates, deleteWhatsAppTemplate, errorMessage
} from '../../services/whatsappApi';
import { SAMPLE_VARS, VARIABLES, TEMPLATE_STATUS_STYLES, namedBody, formatDateTime } from '../utils/whatsappFormat';

const field = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400/40';
const label = 'block text-[11px] font-black uppercase tracking-wide text-gray-500 mb-1.5';

const BLANK = {
  displayName: '',
  category: 'MARKETING',
  language: 'en',
  headerType: 'none',
  headerText: '',
  headerMediaUrl: '',
  body: '',
  footer: '',
  buttons: []
};

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'en_US', label: 'English (US)' },
  { id: 'en_GB', label: 'English (UK)' },
  { id: 'hi', label: 'Hindi' },
  { id: 'mr', label: 'Marathi' }
];

const HEADER_TYPES = [
  { id: 'none', label: 'None', icon: X },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'image', label: 'Photo', icon: ImageIcon },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'document', label: 'PDF', icon: FileText }
];

const STARTERS = [
  {
    displayName: 'Membership renewal reminder',
    category: 'UTILITY',
    body: 'Hi {{firstName}}, your *{{membershipPlan}}* at The Shine Lounge expires on *{{membershipExpiry}}*.\n\nRenew now to keep enjoying your washes without a break. Reply to this message and we will help you renew.'
  },
  {
    displayName: 'Festive offer',
    category: 'MARKETING',
    headerType: 'image',
    body: 'Hi {{firstName}} ✨\n\nThis festive season get *20% off* on Premium Foam Wash & Detailing at The Shine Lounge.\n\nValid till Sunday. Show this message at the counter to redeem.'
  },
  {
    displayName: 'We miss you',
    category: 'MARKETING',
    body: 'Hi {{firstName}}, it has been a while since your last visit ({{lastService}}). Your {{vehicle}} deserves a shine! 🚗\n\nCome by this week for a complimentary interior vacuum with any wash.'
  },
  {
    displayName: 'Staff announcement',
    category: 'UTILITY',
    body: 'Hello {{firstName}}, this is an update for the {{department}} team.\n\nPlease check the staff app for today\'s schedule and updates. Thank you!'
  }
];

function TemplateEditor({ isOpen, onClose, initial, onSaved, canSubmit }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const editing = Boolean(initial && initial._id);

  React.useEffect(() => {
    if (!isOpen) return;
    setError('');
    setForm(initial ? { ...BLANK, ...initial, buttons: (initial.buttons || []).map((b) => ({ ...b })) } : BLANK);
  }, [isOpen, initial]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (submit) => {
    setError('');
    if (!form.displayName.trim()) return setError('Give the template a name');
    if (!form.body.trim()) return setError('Write the message body');
    setSaving(submit ? 'submit' : 'save');
    try {
      const payload = {
        displayName: form.displayName,
        name: editing ? undefined : form.displayName,
        category: form.category,
        language: form.language,
        headerType: form.headerType,
        headerText: form.headerType === 'text' ? form.headerText : '',
        headerMediaUrl: ['image', 'video', 'document'].includes(form.headerType) ? form.headerMediaUrl : '',
        body: form.body,
        footer: form.footer,
        buttons: form.buttons
      };
      let saved = editing ? await updateWhatsAppTemplate(initial._id, payload) : await createWhatsAppTemplate(payload);
      if (submit) saved = await submitWhatsAppTemplate(saved._id);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Could not save the template'));
    } finally {
      setSaving('');
    }
  };

  const hasMediaHeader = ['image', 'video', 'document'].includes(form.headerType);

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-5xl"
      title={editing ? 'Edit template' : 'New message template'}
      subtitle="Templates are reviewed by Meta once, then can be sent to anyone, any time.">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <div className="md:col-span-3 space-y-4">
          {!editing && (
            <div>
              <label className={label}>Quick start</label>
              <div className="flex flex-wrap gap-1.5">
                {STARTERS.map((s) => (
                  <button key={s.displayName} type="button" onClick={() => setForm({ ...BLANK, ...s, buttons: (s.buttons || []).map((b) => ({ ...b })) })}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 text-[11px] font-bold text-gray-600 hover:border-emerald-300 hover:text-emerald-700">
                    {s.displayName}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className={label}>Template name</label>
              <input value={form.displayName} onChange={(e) => set('displayName', e.target.value)} placeholder="e.g. Membership renewal reminder" className={field} />
            </div>
            <div>
              <label className={label}>Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={field}>
                <option value="MARKETING">Marketing (offers, promos)</option>
                <option value="UTILITY">Utility (updates, reminders)</option>
              </select>
            </div>
            <div>
              <label className={label}>Language</label>
              <select value={form.language} onChange={(e) => set('language', e.target.value)} className={field}>
                {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={label}>Header</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {HEADER_TYPES.map((h) => (
                <button key={h.id} type="button" onClick={() => set('headerType', h.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${
                    form.headerType === h.id ? 'bg-[#008069] text-white border-[#008069]' : 'bg-white text-gray-600 border-gray-200'
                  }`}>
                  <h.icon className="w-3.5 h-3.5" /> {h.label}
                </button>
              ))}
            </div>
            {form.headerType === 'text' && (
              <input value={form.headerText} maxLength={60} onChange={(e) => set('headerText', e.target.value)} placeholder="Header text (60 chars, no variables)" className={field} />
            )}
            {hasMediaHeader && (
              <>
                <MediaAttachment
                  value={{ type: form.headerMediaUrl ? form.headerType : 'none', url: form.headerMediaUrl, filename: '' }}
                  onChange={(m) => set('headerMediaUrl', m.url || '')}
                  lockedType={form.headerType}
                />
                <p className="text-[10.5px] text-gray-400 font-semibold mt-1">
                  This sample is sent to Meta for review. Each campaign can use a different {form.headerType}.
                </p>
              </>
            )}
          </div>

          <div>
            <label className={label}>Body</label>
            <MessageComposer value={form.body} onChange={(v) => set('body', v)} maxLength={1024} rows={7}
              placeholder="Hi {{firstName}}, …" />
            <p className="text-[10.5px] text-gray-400 font-semibold mt-1">Do not start or end the body with a variable — Meta rejects that.</p>
          </div>


        </div>

        <div className="md:col-span-2">
          <p className={label}>Live preview</p>
          <WhatsAppPreview
            headerType={form.headerType}
            headerText={form.headerText}
            mediaUrl={form.headerMediaUrl}
            body={form.body}
            footer={form.footer}
            buttons={form.buttons}
            vars={SAMPLE_VARS}
            recipientLabel="Rahul (sample)"
          />
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
        <button type="button" onClick={onClose} className="sm:flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">Cancel</button>
        <button type="button" onClick={() => save(false)} disabled={saving !== ''}
          className="sm:flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {saving === 'save' && <Loader2 className="w-4 h-4 animate-spin" />} Save as draft
        </button>
        <button type="button" onClick={() => save(true)} disabled={saving !== '' || !canSubmit}
          title={canSubmit ? '' : 'Add the WhatsApp API keys to the backend .env to submit templates'}
          className="sm:flex-[1.4] py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50">
          {saving === 'submit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />} Save & submit to Meta
        </button>
      </div>
    </AdminModal>
  );
}

// BhashSMS: templates are created and approved on the BhashSMS panel. Here
// the admin only records the approved name and text, and says which contact
// field fills each {{1}}, {{2}} — those values become the API's Params.
const positionsIn = (body) => {
  const found = String(body || '').match(/\{\{\s*(\d+)\s*\}\}/g) || [];
  return [...new Set(found.map((m) => Number(m.replace(/\D/g, ''))))].sort((a, b) => a - b);
};

const REGISTER_BLANK = { name: '', displayName: '', category: 'UTILITY', headerType: 'none', headerMediaUrl: '', body: '', variableMap: [], purpose: 'campaign' };

function RegisterTemplateEditor({ isOpen, onClose, initial, onSaved }) {
  const [form, setForm] = useState(REGISTER_BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const editing = Boolean(initial && initial._id);

  React.useEffect(() => {
    if (!isOpen) return;
    setError('');
    setForm(initial ? { ...REGISTER_BLANK, ...initial, variableMap: [...(initial.variableMap || [])] } : REGISTER_BLANK);
  }, [isOpen, initial]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const positions = positionsIn(form.body);
  const setVar = (n, key) => setForm((f) => {
    const next = [...(f.variableMap || [])];
    next[n - 1] = key;
    return { ...f, variableMap: next };
  });

  const save = async () => {
    setError('');
    if (!form.name.trim()) return setError('Enter the template name exactly as on the BhashSMS panel');
    if (!form.body.trim()) return setError('Paste the approved template text');
    const unmapped = positions.filter((n) => !(form.variableMap || [])[n - 1]);
    if (unmapped.length) return setError(`Choose what fills ${unmapped.map((n) => `{{${n}}}`).join(', ')}`);
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        displayName: form.displayName.trim() || form.name.trim(),
        category: form.category,
        headerType: form.headerType,
        headerMediaUrl: ['image', 'video'].includes(form.headerType) ? form.headerMediaUrl : '',
        body: form.body,
        variableMap: form.variableMap,
        purpose: form.purpose
      };
      const saved = editing ? await updateWhatsAppTemplate(initial._id, payload) : await createWhatsAppTemplate(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Could not save the template'));
    } finally {
      setSaving(false);
    }
  };


  return (
    <AdminModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-5xl"
      title={editing ? 'Edit registered template' : 'Register approved template'}
      subtitle="Copy the template exactly as it was approved on the BhashSMS panel.">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <div className="md:col-span-3 space-y-4">
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-[11.5px] font-semibold text-sky-800 flex gap-2">
            <Info className="w-4 h-4 shrink-0 mt-px" />
            <span>
              Create the template on <b>bhashsms.com</b> first and wait for approval. Then enter its name and text here.
              The name must match exactly — it is what the API sends as <code>text=</code>.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>Template name on BhashSMS</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. tsl_invoice" className={field} />
            </div>
            <div>
              <label className={label}>Display name (optional)</label>
              <input value={form.displayName} onChange={(e) => set('displayName', e.target.value)} placeholder="e.g. Invoice receipt" className={field} />
            </div>
            <div>
              <label className={label}>Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={field}>
                <option value="UTILITY">Utility (receipts, reminders)</option>
                <option value="MARKETING">Marketing (offers, promos)</option>
              </select>
            </div>
            <div>
              <label className={label}>Use for</label>
              <select value={form.purpose} onChange={(e) => set('purpose', e.target.value)} className={field}>
                <option value="campaign">Campaigns (WhatsApp Hub)</option>
                <option value="invoice">Invoice receipts (staff billing)</option>
              </select>
            </div>
          </div>

          <div>
            <label className={label}>Header</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {HEADER_TYPES.filter((h) => h.id !== 'text').map((h) => (
                <button key={h.id} type="button" onClick={() => set('headerType', h.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${
                    form.headerType === h.id ? 'bg-[#008069] text-white border-[#008069]' : 'bg-white text-gray-600 border-gray-200'
                  }`}>
                  <h.icon className="w-3.5 h-3.5" /> {h.label}
                </button>
              ))}
            </div>
            {['image', 'video'].includes(form.headerType) && (
              <>
                <MediaAttachment
                  value={{ type: form.headerMediaUrl ? form.headerType : 'none', url: form.headerMediaUrl, filename: '' }}
                  onChange={(m) => set('headerMediaUrl', m.url || '')}
                  lockedType={form.headerType}
                />
                <p className="text-[10.5px] text-gray-400 font-semibold mt-1">Default {form.headerType}. Each campaign can attach a different one.</p>
              </>
            )}
            {form.headerType === 'document' && (
              <p className="text-[10.5px] text-gray-500 font-semibold">
                {form.purpose === 'invoice' ? 'The invoice PDF is attached automatically on every send.' : 'Attach the PDF when you send a campaign.'}
              </p>
            )}
            {form.purpose === 'invoice' && form.headerType !== 'document' && (
              <p className="text-[10.5px] text-amber-700 font-semibold mt-1">To attach the invoice PDF, the template must be approved with a Document header.</p>
            )}
          </div>

          <div>
            <label className={label}>Approved template text</label>
            <textarea value={form.body} onChange={(e) => set('body', e.target.value)} rows={7}
              placeholder={'Hello {{1}}, thank you for visiting The Shine Lounge. Your invoice {{2}} for Rs {{3}} is attached.'}
              className={`${field} font-medium resize-y`} />
            <p className="text-[10.5px] text-gray-400 font-semibold mt-1">Keep the variables exactly as on the panel: {'{{1}}'}, {'{{2}}'} …</p>
          </div>

          {positions.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-2">
              <p className="text-[10.5px] font-black uppercase tracking-wide text-emerald-700">Fill each variable with</p>
              {positions.map((n) => (
                <div key={n} className="flex items-center gap-2">
                  <code className="text-[11px] font-bold text-emerald-800 w-10">{`{{${n}}}`}</code>
                  <select value={(form.variableMap || [])[n - 1] || ''} onChange={(e) => setVar(n, e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-lg border border-emerald-200 text-[11.5px] font-bold bg-white">
                    <option value="">— choose —</option>
                    {VARIABLES.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <p className={label}>Live preview</p>
          <WhatsAppPreview
            headerType={form.headerType}
            mediaUrl={form.headerMediaUrl}
            mediaFilename={form.purpose === 'invoice' ? 'Invoice-TSL-1042.pdf' : ''}
            body={namedBody(form)}
            vars={SAMPLE_VARS}
            recipientLabel="Rahul (sample)"
          />
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
        <button type="button" onClick={onClose} className="sm:flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">Cancel</button>
        <button type="button" onClick={save} disabled={saving}
          className="sm:flex-[1.4] py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-60">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editing ? 'Save changes' : 'Register template'}
        </button>
      </div>
    </AdminModal>
  );
}

// Templates imported from Meta only know {{1}}, {{2}} — let the admin say
// which contact field fills each.
function VariableMapEditor({ template, onSaved }) {
  const positions = useMemo(() => {
    const found = String(template.body || '').match(/\{\{\s*(\d+)\s*\}\}/g) || [];
    return [...new Set(found.map((m) => Number(m.replace(/\D/g, ''))))].sort((a, b) => a - b);
  }, [template.body]);
  const [map, setMap] = useState(template.variableMap || []);
  const [saving, setSaving] = useState(false);
  if (!positions.length) return null;

  const save = async () => {
    setSaving(true);
    try {
      const max = Math.max(...positions);
      const full = Array.from({ length: max }, (_v, i) => map[i] || '');
      onSaved(await updateWhatsAppTemplate(template._id, { variableMap: full }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 p-3 rounded-xl bg-sky-50/60 border border-sky-100 space-y-2">
      <p className="text-[10.5px] font-black uppercase tracking-wide text-sky-700">Fill each variable with</p>
      {positions.map((n) => (
        <div key={n} className="flex items-center gap-2">
          <code className="text-[11px] font-bold text-sky-800 w-10">{`{{${n}}}`}</code>
          <select value={map[n - 1] || ''} onChange={(e) => setMap((m) => { const next = [...m]; next[n - 1] = e.target.value; return next; })}
            className="flex-1 px-2 py-1 rounded-lg border border-sky-200 text-[11px] font-bold bg-white">
            <option value="">— choose —</option>
            {VARIABLES.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
          </select>
        </div>
      ))}
      <button type="button" onClick={save} disabled={saving} className="px-3 py-1 rounded-lg bg-sky-600 text-white text-[11px] font-bold disabled:opacity-60">
        {saving ? 'Saving…' : 'Save mapping'}
      </button>
    </div>
  );
}

export default function TemplatesTab({ status, templates, setTemplates, reloadTemplates, onUseTemplate }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const canSubmit = Boolean(status && status.canManageTemplates);
  const isBhash = Boolean(status && status.provider === 'bhashsms');

  const upsert = (t) => setTemplates((list) => {
    const exists = list.some((x) => x._id === t._id);
    return exists ? list.map((x) => (x._id === t._id ? t : x)) : [t, ...list];
  });

  const run = async (key, fn, success) => {
    setBusy(key);
    setMessage({ type: '', text: '' });
    try {
      const out = await fn();
      if (success) setMessage({ type: 'success', text: typeof success === 'function' ? success(out) : success });
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  const sync = () => run('sync', async () => {
    const res = await syncWhatsAppTemplates();
    await reloadTemplates();
    return res;
  }, (res) => (isBhash
    ? `Synced with BhashSMS: ${res.total} on the panel, ${res.imported} new, ${res.updated} updated${res.missing ? `, ${res.missing} not on the panel` : ''}.`
    : `Synced with Meta: ${res.updated} updated, ${res.imported} imported.`));

  // BhashSMS statuses: the panel's word for each, shown on the card.
  const statusLabel = (t) => {
    if (t.provider !== 'bhashsms') return t.metaStatus;
    if (t.metaStatus === 'DISABLED') return 'NOT ON BHASHSMS';
    return t.metaStatus;
  };

  const submit = (t) => run(`submit-${t._id}`, async () => upsert(await submitWhatsAppTemplate(t._id)), 'Submitted to Meta for review.');

  const remove = (t) => {
    const onMeta = t.metaTemplateId && canSubmit;
    if (!window.confirm(onMeta
      ? `Delete "${t.displayName || t.name}" here AND from your WhatsApp account? Meta blocks reusing this name for 30 days.`
      : `Delete "${t.displayName || t.name}"?`)) return;
    run(`del-${t._id}`, async () => {
      await deleteWhatsAppTemplate(t._id);
      setTemplates((list) => list.filter((x) => x._id !== t._id));
    }, 'Template deleted.');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-gray-900">Message templates</h3>
          <p className="text-[11px] text-gray-500 font-medium">
            {isBhash
              ? 'Read automatically from your BhashSMS panel (Templates WA). Only APPROVED templates can be sent; create new ones on the panel and they appear here as Pending, then Approved.'
              : 'Saved message formats. Meta must approve a template before it can be sent to people who have not messaged you in 24h.'}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={sync} disabled={(!isBhash && !canSubmit) || busy === 'sync'}
            title={isBhash ? 'Read templates and their approval status from the BhashSMS panel' : (canSubmit ? 'Fetch approval status and templates from Meta' : 'Needs WHATSAPP_BUSINESS_ACCOUNT_ID in the backend .env')}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5 disabled:opacity-40">
            <RefreshCw className={`w-3.5 h-3.5 ${busy === 'sync' ? 'animate-spin' : ''}`} /> {isBhash ? 'Sync from BhashSMS' : 'Sync with Meta'}
          </button>
          <button type="button" onClick={() => { setEditing(null); setEditorOpen(true); }}
            className="px-3 py-2 rounded-xl bg-[#008069] hover:bg-[#006d59] text-white text-xs font-bold flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> {isBhash ? 'Register template' : 'New template'}
          </button>
        </div>
      </div>

      {message.text && (
        <p className={`text-xs font-semibold ${message.type === 'error' ? 'text-rose-600' : 'text-emerald-700'}`}>{message.text}</p>
      )}

      {!templates.length ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-14 text-center">
          <FileText className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-600 mt-2">No templates yet</p>
          <p className="text-xs text-gray-400 font-medium">Create your first message format — reminders, offers, staff notices.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((t) => {
            const registered = t.provider === 'bhashsms';
            const editable = registered || ['DRAFT', 'REJECTED'].includes(t.metaStatus) || (status && status.dryRun);
            const submittable = !isBhash && !registered && ['DRAFT', 'REJECTED'].includes(t.metaStatus);
            return (
              <div key={t._id} className="bg-white border border-gray-200/90 rounded-2xl shadow-sm p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{t.displayName || t.name}</p>
                    <p className="text-[10.5px] text-gray-400 font-bold">{t.name} · {t.language} · {t.category.toLowerCase()}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black shrink-0 ${TEMPLATE_STATUS_STYLES[t.metaStatus] || TEMPLATE_STATUS_STYLES.DRAFT}`}>
                    {statusLabel(t)}
                  </span>
                </div>
                {t.purpose === 'invoice' && (
                  <p className="mt-2 self-start px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10.5px] font-black text-amber-700 flex items-center gap-1">
                    <Receipt className="w-3 h-3" /> Used for invoice receipts
                  </p>
                )}
                {t.headerType !== 'none' && (
                  <p className="text-[10.5px] font-bold text-emerald-700 mt-2">Header: {t.headerType}{t.headerType === 'text' ? ` — ${t.headerText}` : ''}</p>
                )}
                <p className="mt-2 text-xs font-medium text-gray-600 whitespace-pre-wrap line-clamp-6 flex-1">{namedBody(t)}</p>
                {t.rejectedReason && <p className="mt-2 text-[11px] font-semibold text-rose-600">{t.metaStatus === 'DISABLED' ? '' : 'Rejected: '}{t.rejectedReason}</p>}
                {!registered && /\{\{\s*\d+\s*\}\}/.test(t.body) && <VariableMapEditor template={t} onSaved={upsert} />}
                <p className="mt-2 text-[10px] text-gray-400 font-semibold">Updated {formatDateTime(t.updatedAt)}</p>
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => onUseTemplate(t._id)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-100">
                    <Send className="w-3.5 h-3.5" /> Use
                  </button>
                  {submittable && (
                    <button type="button" onClick={() => submit(t)} disabled={!canSubmit || busy === `submit-${t._id}`}
                      title={canSubmit ? '' : 'Add the WhatsApp API keys to the backend .env first'}
                      className="px-2.5 py-1.5 rounded-lg bg-[#25D366] text-white text-[11px] font-bold flex items-center gap-1 disabled:opacity-40">
                      {busy === `submit-${t._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />} Submit
                    </button>
                  )}
                  {editable && (
                    <button type="button" onClick={() => { setEditing(t); setEditorOpen(true); }}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-[11px] font-bold flex items-center gap-1">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  <button type="button" onClick={() => remove(t)} disabled={busy === `del-${t._id}`}
                    className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isBhash || (editing && editing.provider === 'bhashsms')
        ? <RegisterTemplateEditor isOpen={editorOpen} onClose={() => setEditorOpen(false)} initial={editing} onSaved={(t) => { upsert(t); if (t.purpose === 'invoice') reloadTemplates(); }} />
        : <TemplateEditor isOpen={editorOpen} onClose={() => setEditorOpen(false)} initial={editing} onSaved={upsert} canSubmit={canSubmit} />}
    </div>
  );
}
