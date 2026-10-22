import React, { useState } from 'react';
import { CheckCircle2, XCircle, Copy, Check, RefreshCw, KeyRound, Webhook, Smartphone, ShieldCheck, ListChecks } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

const ENV_SNIPPET = `WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_APP_ID=
WHATSAPP_APP_SECRET=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_API_VERSION=v21.0`;

function Row({ ok, title, detail }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      {ok ? <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500 shrink-0 mt-px" /> : <XCircle className="w-[18px] h-[18px] text-gray-300 shrink-0 mt-px" />}
      <div>
        <p className="text-xs font-bold text-gray-900">{title}</p>
        {detail && <p className="text-[11px] text-gray-500 font-medium">{detail}</p>}
      </div>
    </div>
  );
}

function CopyField({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <code className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-bold text-gray-700 truncate">{value}</code>
      <button type="button" onClick={async () => {
        try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) { /* blocked */ }
      }} className="px-2.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900">
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

const BHASH_ENV_SNIPPET = `WHATSAPP_PROVIDER=bhashsms
BHASHSMS_BASE_URL=https://bhashsms.com/api
BHASHSMS_USER=
BHASHSMS_PASS=
BHASHSMS_SENDER=BUZWAP`;

function BhashSmsSettings({ status, onRefresh, loading }) {
  const s = status || {};
  const b = s.bhashsms || {};
  const tpl = s.invoiceTemplate;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <div className="bg-white border border-gray-200/90 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#008069]" /> BhashSMS connection</h3>
          <button type="button" onClick={onRefresh} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100" title="Re-check">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="divide-y divide-gray-50 mt-2">
          <Row ok={b.credentialsSet} title="Login"
            detail={b.credentialsSet ? `User ${b.user} · sender ${b.sender}` : 'Set BHASHSMS_USER, BHASHSMS_PASS and BHASHSMS_SENDER in backend/.env.'} />
          <Row ok={Boolean(b.balance) && !b.balanceError} title="Account balance"
            detail={b.balanceError || (b.balance ? `${b.balance} credits` : 'Not available')} />
          <Row ok={Boolean(tpl)} title="Invoice receipt template"
            detail={tpl ? `"${tpl.displayName || tpl.name}" — staff billing sends invoices with it.` : 'Register the approved invoice template in the Templates tab and set "Use for: Invoice receipts".'} />
          <Row ok={s.dryRun === false} title="Live sending"
            detail={s.dryRun ? 'Dry-run mode (WHATSAPP_DRY_RUN=true) — nothing reaches WhatsApp.' : 'Messages go out for real.'} />
          <Row ok={false} title="Delivery reports & replies"
            detail="Not set up yet. Ask your BhashSMS account manager for call-backs; until then messages show as “sent” (accepted by BhashSMS)." />
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200/90 rounded-2xl shadow-sm p-5 space-y-2">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2"><ListChecks className="w-4 h-4 text-amber-500" /> Setup checklist</h3>
          <ol className="text-[11.5px] text-gray-600 font-medium list-decimal pl-4 space-y-1.5">
            <li>Ask BhashSMS to <b>activate API access</b> on your account (until then every send fails with “API Not Activated”).</li>
            <li>On the BhashSMS panel, create templates and wait for approval — e.g. an invoice template (Utility, Document header) and offer templates (Marketing).</li>
            <li>Register each approved template in the <b>Templates</b> tab with its exact name and variable order.</li>
            <li>Send a test to your own number from <b>Compose</b>.</li>
          </ol>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2"><KeyRound className="w-4 h-4 text-amber-500" /> Settings in <code className="text-xs">backend/.env</code></h3>
          <p className="text-[11px] text-gray-500 font-medium">The password stays on the server only. Restart the backend after changing it.</p>
          <pre className="p-3 rounded-xl bg-gray-900 text-emerald-300 text-[11px] font-mono overflow-x-auto">{BHASH_ENV_SNIPPET}</pre>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl shadow-sm p-5 space-y-2">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2"><Smartphone className="w-4 h-4 text-gray-500" /> Good to know</h3>
          <ul className="text-[11px] text-gray-600 font-medium list-disc pl-4 space-y-1">
            <li>Utility or Marketing is decided by the template you send, not by the API — each uses its own credits.</li>
            <li>Only Indian (+91) mobile numbers can be messaged through BhashSMS.</li>
            <li>Photos, videos and PDFs go out as a template header; free-form replies are text only.</li>
            <li>Commas inside a variable value are replaced with spaces (the API separates values with commas).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function SettingsTab({ status, onRefresh, loading }) {
  const s = status || {};
  if (s.provider === 'bhashsms') return <BhashSmsSettings status={status} onRefresh={onRefresh} loading={loading} />;
  const webhook = s.webhook || {};
  const phone = s.phone || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <div className="bg-white border border-gray-200/90 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#008069]" /> Connection</h3>
          <button type="button" onClick={onRefresh} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100" title="Re-check">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="divide-y divide-gray-50 mt-2">
          <Row ok={s.configured} title="Sending messages"
            detail={s.configured
              ? (s.dryRun ? 'Dry-run mode — the pipeline runs but nothing reaches WhatsApp.' : 'WhatsApp Cloud API is connected.')
              : 'Not connected — the hub sends manually via wa.me. Add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.'} />
          <Row ok={Boolean(phone) && !s.phoneError} title="Business phone number"
            detail={phone ? `${phone.display_phone_number || ''} · ${phone.verified_name || ''}${phone.quality_rating ? ` · quality ${phone.quality_rating}` : ''}` : (s.phoneError || 'Not available until the API is connected.')} />
          <Row ok={s.canManageTemplates} title="Template management"
            detail={s.canManageTemplates ? 'Templates can be submitted to and synced with Meta.' : 'Add WHATSAPP_BUSINESS_ACCOUNT_ID.'} />
          <Row ok={s.canUploadHeaderSamples} title="Photo / video / PDF template headers"
            detail={s.canUploadHeaderSamples ? 'Header samples can be uploaded for review.' : 'Add WHATSAPP_APP_ID.'} />
          <Row ok={webhook.verifyTokenSet && webhook.appSecretSet} title="Delivery receipts & replies (webhook)"
            detail={webhook.verifyTokenSet && webhook.appSecretSet
              ? 'Delivered/read ticks, replies, STOP opt-outs and the 24h window are tracked.'
              : `Missing: ${[!webhook.verifyTokenSet && 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', !webhook.appSecretSet && 'WHATSAPP_APP_SECRET'].filter(Boolean).join(', ')}`} />
          <Row ok title="Opt-in rule"
            detail={s.requireOptIn ? 'Only contacts marked "opted in" receive campaigns.' : 'Everyone not opted out can receive campaigns (WHATSAPP_REQUIRE_OPT_IN=false).'} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200/90 rounded-2xl shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2"><KeyRound className="w-4 h-4 text-amber-500" /> Keys to add in <code className="text-xs">backend/.env</code></h3>
          <p className="text-[11px] text-gray-500 font-medium">
            From <b>developers.facebook.com → your app → WhatsApp → API Setup</b>. Use a permanent System User token
            (Business Settings → System users) — the temporary token expires in 24 hours. Restart the backend after editing.
          </p>
          <pre className="p-3 rounded-xl bg-gray-900 text-emerald-300 text-[11px] font-mono overflow-x-auto">{ENV_SNIPPET}</pre>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2"><Webhook className="w-4 h-4 text-sky-500" /> Webhook</h3>
          <p className="text-[11px] text-gray-500 font-medium">
            In Meta: WhatsApp → Configuration → Webhook. Paste this callback URL and the same verify token as in .env,
            then subscribe to the <b>messages</b> field. The backend must be reachable over https (your deployed URL, not localhost).
          </p>
          <CopyField value={`${API_BASE_URL.replace(/\/$/, '')}${webhook.path || '/api/whatsapp/webhook'}`} />
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl shadow-sm p-5 space-y-2">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2"><Smartphone className="w-4 h-4 text-gray-500" /> Good to know</h3>
          <ul className="text-[11px] text-gray-600 font-medium list-disc pl-4 space-y-1">
            <li>Templates reach anyone at any time once Meta approves them. Free-form messages reach only people who messaged you in the last 24h.</li>
            <li>Media limits: photo 5 MB, video 16 MB, PDF 100 MB. Files are converted automatically to formats WhatsApp plays.</li>
            <li>Replies of STOP automatically opt a contact out.</li>
            <li>On Vercel, call <code>POST /api/internal/whatsapp/tick</code> every minute with the <code>x-cron-secret</code> header to keep large campaigns moving.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
