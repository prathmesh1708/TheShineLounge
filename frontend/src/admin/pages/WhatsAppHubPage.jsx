import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Send, FileText, Megaphone, Settings2, Users, Briefcase, MessageSquareReply, AlertTriangle } from 'lucide-react';
import ComposeTab from '../whatsapp/components/ComposeTab';
import TemplatesTab from '../whatsapp/components/TemplatesTab';
import CampaignsTab from '../whatsapp/components/CampaignsTab';
import SettingsTab from '../whatsapp/components/SettingsTab';
import {
  getWhatsAppStatus, getWhatsAppContacts, getWhatsAppTemplates, updateWhatsAppContact, errorMessage
} from '../services/whatsappApi';
import { within24h } from '../whatsapp/utils/whatsappFormat';

const TABS = [
  { id: 'compose', label: 'Compose', icon: Send },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'settings', label: 'Settings', icon: Settings2 }
];

export default function WhatsAppHubPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'compose';
  const setTab = (id, extra = {}) => setParams({ tab: id, ...extra });
  const openCampaignId = params.get('campaign');

  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [presetTemplateId, setPresetTemplateId] = useState('');
  const [error, setError] = useState('');

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      setStatus(await getWhatsAppStatus());
    } catch (err) {
      setError(errorMessage(err, 'Could not reach the WhatsApp service'));
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const loadContacts = useCallback(async (refresh = false) => {
    setContactsLoading(true);
    try {
      setContacts(await getWhatsAppContacts({ refresh }));
    } catch (err) {
      setError(errorMessage(err, 'Could not load contacts'));
    } finally {
      setContactsLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async ({ refresh = false } = {}) => {
    try {
      setTemplates(await getWhatsAppTemplates({ refresh }));
    } catch (err) {
      setError(errorMessage(err, 'Could not load templates'));
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadContacts();
  }, [loadStatus, loadContacts]);

  // New panel templates show up as soon as the tab is opened again.
  useEffect(() => {
    if (tab === 'compose' || tab === 'templates') loadTemplates();
  }, [tab, loadTemplates]);

  const toggleOptOut = async (contact) => {
    const optedOut = !contact.optedOut;
    if (optedOut && !window.confirm(`Stop sending WhatsApp messages to ${contact.name || contact.display}?`)) return;
    try {
      await updateWhatsAppContact(contact.phone, { optedOut });
      setContacts((list) => list.map((c) => (c.phone === contact.phone ? { ...c, optedOut, optIn: optedOut ? false : c.optIn } : c)));
    } catch (err) {
      window.alert(errorMessage(err));
    }
  };

  const stats = useMemo(() => ({
    total: contacts.length,
    customers: contacts.filter((c) => c.kind === 'customer').length,
    staff: contacts.filter((c) => c.kind === 'staff').length,
    replied: contacts.filter((c) => within24h(c.lastInboundAt)).length
  }), [contacts]);

  const connected = status && status.configured;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#25D366] flex items-center justify-center shadow-sm shrink-0">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">WhatsApp Hub</h2>
              <p className="text-xs text-gray-500 font-medium">
                Message customers and staff on WhatsApp — text, photos, videos and PDFs.
              </p>
            </div>
          </div>
          <span className={`self-start md:self-auto px-3 py-1.5 rounded-full text-[11px] font-black border flex items-center gap-1.5 ${
            statusLoading ? 'bg-gray-50 text-gray-500 border-gray-200'
              : connected ? (status.dryRun ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${statusLoading ? 'bg-gray-300' : connected ? (status.dryRun ? 'bg-sky-500' : 'bg-emerald-500') : 'bg-amber-500'}`} />
            {statusLoading ? 'Checking…'
              : connected ? (status.dryRun ? 'API · dry run'
                : status.provider === 'bhashsms' ? `BhashSMS connected${status.bhashsms && status.bhashsms.sender ? ` · ${status.bhashsms.sender}` : ''}`
                  : `API connected${status.phone && status.phone.display_phone_number ? ` · ${status.phone.display_phone_number}` : ''}`)
                : 'Manual mode (API keys not set)'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Contacts', value: stats.total, icon: Users },
            { label: 'Customers', value: stats.customers, icon: Users },
            { label: 'Staff', value: stats.staff, icon: Briefcase },
            { label: 'Replied in 24h', value: stats.replied, icon: MessageSquareReply }
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wide text-gray-400">{s.label}</span>
                <s.icon className="w-3.5 h-3.5 text-gray-300" />
              </div>
              <p className="text-xl font-black text-gray-900 mt-1">{contactsLoading && !contacts.length ? '—' : s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {!statusLoading && !connected && tab !== 'settings' && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs font-semibold text-amber-800 flex-1">
            The WhatsApp API keys are not in the backend .env yet. Everything is ready — until then, messages open in WhatsApp one chat at a time.
          </p>
          <button type="button" onClick={() => setTab('settings')} className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold shrink-0">
            See setup
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs font-semibold text-rose-600">{error}</p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white border border-gray-200/90 rounded-2xl shadow-sm overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`flex-1 min-w-[110px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              tab === t.id ? 'bg-[#008069] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'compose' && (
        <ComposeTab
          status={status}
          contacts={contacts}
          contactsLoading={contactsLoading}
          onReloadContacts={() => loadContacts(true)}
          onToggleOptOut={toggleOptOut}
          templates={templates}
          presetTemplateId={presetTemplateId}
          onCampaignCreated={(id) => setTab('campaigns', { campaign: id })}
          onRefreshTemplates={() => loadTemplates({ refresh: true })}
        />
      )}
      {tab === 'templates' && (
        <TemplatesTab
          status={status}
          templates={templates}
          setTemplates={setTemplates}
          reloadTemplates={loadTemplates}
          onUseTemplate={(id) => { setPresetTemplateId(id); setTab('compose'); }}
        />
      )}
      {tab === 'campaigns' && (
        <CampaignsTab
          openCampaignId={openCampaignId}
          onOpenCampaign={(id) => setTab('campaigns', id ? { campaign: id } : {})}
        />
      )}
      {tab === 'settings' && <SettingsTab status={status} onRefresh={loadStatus} loading={statusLoading} />}
    </div>
  );
}
