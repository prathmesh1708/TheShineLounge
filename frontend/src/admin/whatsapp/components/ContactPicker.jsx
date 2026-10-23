import React, { useMemo, useState } from 'react';
import { Search, RefreshCw, UserPlus, Users, Briefcase, CheckSquare, Square, MinusSquare, Loader2, BellOff, Crown } from 'lucide-react';
import { normalizePhone, formatPhone, within24h, timeAgo } from '../utils/whatsappFormat';

const PAGE = 150;
const DAY = 24 * 60 * 60 * 1000;

const KIND_TABS = [
  { id: 'all', label: 'All', icon: Users },
  { id: 'customer', label: 'Customers', icon: Users },
  { id: 'staff', label: 'Staff', icon: Briefcase }
];

const SEGMENTS = [
  { id: 'all', label: 'Every contact' },
  { id: 'active_members', label: 'Active members' },
  { id: 'expiring_7', label: 'Membership expiring in 7 days' },
  { id: 'expired', label: 'Membership expired' },
  { id: 'no_membership', label: 'No membership' },
  { id: 'replied_24h', label: 'Replied in last 24h (free-form OK)' },
  { id: 'opted_in', label: 'Opted in' },
  { id: 'opted_out', label: 'Opted out' },
  { id: 'inactive_30', label: 'No visit in 30+ days' }
];

const SERVICES = [
  { id: 'all', label: 'Any service' },
  { id: 'car-wash', label: 'Car Wash' },
  { id: 'car-detailing', label: 'Car Detailing' },
  { id: 'dog-wash', label: 'Dog Wash' },
  { id: 'cafe', label: 'Café' },
  { id: 'drive-through-cafe', label: 'Drive-Thru Café' },
  { id: 'salon', label: "Men's Salon" }
];

const matchesSegment = (c, segment) => {
  const m = c.membership;
  const expiry = m ? new Date(m.expiryDate).getTime() : 0;
  switch (segment) {
    case 'active_members': return Boolean(m && m.status !== 'Expired' && m.status !== 'Suspended' && expiry >= Date.now());
    case 'expiring_7': return Boolean(m && expiry >= Date.now() && expiry - Date.now() <= 7 * DAY);
    case 'expired': return Boolean(m && (m.status === 'Expired' || expiry < Date.now()));
    case 'no_membership': return !m;
    case 'replied_24h': return within24h(c.lastInboundAt);
    case 'opted_in': return c.optIn;
    case 'opted_out': return c.optedOut;
    case 'inactive_30': return !c.lastVisitAt || Date.now() - new Date(c.lastVisitAt).getTime() > 30 * DAY;
    default: return true;
  }
};

/**
 * Lists every known phone number (customers, staff, leads) with filters.
 * `selected` is a Map phone -> contact, so manually typed numbers that are
 * not in the database can be selected too.
 */
export default function ContactPicker({ contacts, loading, onRefresh, selected, onChange, onToggleOptOut }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('all');
  const [segment, setSegment] = useState('all');
  const [service, setService] = useState('all');
  const [limit, setLimit] = useState(PAGE);
  const [manual, setManual] = useState('');
  const [manualError, setManualError] = useState('');

  const counts = useMemo(() => {
    const out = { all: contacts.length, customer: 0, staff: 0, lead: 0 };
    for (const c of contacts) out[c.kind] = (out[c.kind] || 0) + 1;
    return out;
  }, [contacts]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const digits = needle.replace(/\D/g, '');
    return contacts.filter((c) => {
      if (kind !== 'all' && c.kind !== kind) return false;
      if (!matchesSegment(c, segment)) return false;
      if (service !== 'all' && !(c.serviceKeys || []).includes(service) && !(c.membership && c.membership.serviceKey === service)) return false;
      if (!needle) return true;
      return (c.name || '').toLowerCase().includes(needle)
        || (digits.length >= 3 && c.phone.includes(digits))
        || (c.vehicles || []).some((v) => v.toLowerCase().includes(needle))
        || (c.department || '').toLowerCase().includes(needle)
        || (c.email || '').includes(needle);
    });
  }, [contacts, q, kind, segment, service]);

  const visible = filtered.slice(0, limit);
  const selectable = filtered.filter((c) => !c.optedOut);
  const selectedInView = selectable.filter((c) => selected.has(c.phone)).length;
  const allInView = selectable.length > 0 && selectedInView === selectable.length;

  const toggle = (c) => {
    const next = new Map(selected);
    if (next.has(c.phone)) next.delete(c.phone);
    else next.set(c.phone, c);
    onChange(next);
  };

  const toggleAllInView = () => {
    const next = new Map(selected);
    if (allInView) selectable.forEach((c) => next.delete(c.phone));
    else selectable.forEach((c) => next.set(c.phone, c));
    onChange(next);
  };

  const addManual = () => {
    setManualError('');
    const entries = manual.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    if (!entries.length) return;
    const next = new Map(selected);
    const bad = [];
    for (const entry of entries) {
      const phone = normalizePhone(entry);
      if (!phone) { bad.push(entry); continue; }
      const known = contacts.find((c) => c.phone === phone);
      next.set(phone, known || { phone, display: formatPhone(phone), name: '', kind: 'manual', vars: { phone: formatPhone(phone) } });
    }
    onChange(next);
    setManual('');
    if (bad.length) setManualError(`Not valid: ${bad.join(', ')}`);
  };

  const SelectIcon = allInView ? CheckSquare : (selectedInView ? MinusSquare : Square);

  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl shadow-sm flex flex-col min-h-0 h-full">
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900">Recipients</h3>
          <button type="button" onClick={onRefresh} title="Reload contacts"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-0.5">
          {KIND_TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => { setKind(t.id); setLimit(PAGE); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border ${
                kind === t.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>
              {t.label} <span className="opacity-60">{counts[t.id] || 0}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }}
            placeholder="Search name, number, vehicle…"
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400/40" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select value={segment} onChange={(e) => { setSegment(e.target.value); setLimit(PAGE); }}
            className="px-2 py-1.5 rounded-lg border border-gray-200 text-[11px] font-bold text-gray-700 bg-white">
            {SEGMENTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={service} onChange={(e) => { setService(e.target.value); setLimit(PAGE); }}
            className="px-2 py-1.5 rounded-lg border border-gray-200 text-[11px] font-bold text-gray-700 bg-white">
            {SERVICES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <button type="button" onClick={toggleAllInView} disabled={!selectable.length}
            className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 hover:text-gray-900 disabled:opacity-40">
            <SelectIcon className="w-4 h-4 text-[#008069]" />
            {allInView ? 'Unselect' : 'Select'} all {selectable.length} shown
          </button>
          {selected.size > 0 && (
            <button type="button" onClick={() => onChange(new Map())} className="text-[11px] font-bold text-rose-600 hover:underline">
              Clear ({selected.size})
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[260px] max-h-[520px]">
        {loading && !contacts.length ? (
          <div className="flex items-center justify-center gap-2 py-12 text-xs font-semibold text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading contacts…
          </div>
        ) : !filtered.length ? (
          <p className="py-12 text-center text-xs font-semibold text-gray-400">No contacts match these filters.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {visible.map((c) => {
              const checked = selected.has(c.phone);
              return (
                <li key={c.phone}>
                  <label className={`flex items-start gap-2.5 px-4 py-2.5 cursor-pointer hover:bg-gray-50 ${c.optedOut ? 'opacity-50' : ''} ${checked ? 'bg-emerald-50/50' : ''}`}>
                    <input type="checkbox" className="mt-1 accent-[#008069]" checked={checked} disabled={c.optedOut} onChange={() => toggle(c)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-gray-900 truncate">{c.name || 'Unnamed contact'}</p>
                        {c.kind === 'staff' && (
                          <span className="px-1.5 py-px rounded bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase shrink-0">
                            Staff{c.department ? ` · ${c.department}` : ''}
                          </span>
                        )}
                        {c.kind === 'lead' && <span className="px-1.5 py-px rounded bg-sky-50 text-sky-700 text-[9px] font-black uppercase shrink-0">Lead</span>}
                      </div>
                      <p className="text-[11px] font-semibold text-gray-500">{c.display}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.membership && (
                          <span className={`px-1.5 py-px rounded text-[9.5px] font-bold flex items-center gap-0.5 ${
                            c.membership.status === 'Expired' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'
                          }`}>
                            <Crown className="w-2.5 h-2.5" /> {c.membership.plan}
                          </span>
                        )}
                        {(c.vehicles || []).slice(0, 2).map((v) => (
                          <span key={v} className="px-1.5 py-px rounded bg-gray-100 text-gray-600 text-[9.5px] font-bold">{v}</span>
                        ))}
                        {within24h(c.lastInboundAt) && (
                          <span className="px-1.5 py-px rounded bg-emerald-100 text-emerald-700 text-[9.5px] font-bold" title={c.lastInboundText}>
                            Replied {timeAgo(c.lastInboundAt)}
                          </span>
                        )}
                        {c.optIn && <span className="px-1.5 py-px rounded bg-emerald-50 text-emerald-700 text-[9.5px] font-bold">Opted in</span>}
                        {c.optedOut && <span className="px-1.5 py-px rounded bg-rose-50 text-rose-600 text-[9.5px] font-bold">Opted out</span>}
                      </div>
                    </div>
                    {onToggleOptOut && (
                      <button type="button" title={c.optedOut ? 'Allow messages again' : 'Mark as opted out'}
                        onClick={(e) => { e.preventDefault(); onToggleOptOut(c); }}
                        className={`p-1 rounded-md shrink-0 ${c.optedOut ? 'text-rose-500 hover:bg-rose-50' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100'}`}>
                        <BellOff className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        {filtered.length > limit && (
          <button type="button" onClick={() => setLimit((l) => l + PAGE)}
            className="w-full py-2.5 text-[11px] font-bold text-[#008069] hover:bg-emerald-50">
            Show more ({filtered.length - limit} remaining)
          </button>
        )}
      </div>

      <div className="p-3 border-t border-gray-100 space-y-1.5">
        <div className="flex gap-2">
          <input value={manual} onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManual(); } }}
            placeholder="Add number(s): 98765 43210, …"
            className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400/40" />
          <button type="button" onClick={addManual}
            className="px-2.5 py-2 rounded-lg bg-gray-900 text-white text-[11px] font-bold flex items-center gap-1 shrink-0">
            <UserPlus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        {manualError && <p className="text-[10.5px] font-semibold text-rose-600">{manualError}</p>}
      </div>
    </div>
  );
}
