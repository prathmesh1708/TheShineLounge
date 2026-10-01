import React, { useState } from 'react';
import { Plus, Check, X, Trash2, Loader2 } from 'lucide-react';

/**
 * A <select> whose choices the user can add to and remove from.
 *
 * The list lives on the server, so an added category shows up for every admin
 * rather than only in the browser that typed it.
 */
export default function OptionSelect({
  label,
  value,
  options,
  onChange,
  onAdd,
  onRemove,
  placeholder = 'New value'
}) {
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const field = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400';

  const commitAdd = async () => {
    const v = draft.trim();
    if (!v) return;
    setBusy(true);
    setError('');
    try {
      await onAdd(v);
      onChange(v);          // select what was just added — that is why they added it
      setDraft('');
      setAdding(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not add');
    } finally {
      setBusy(false);
    }
  };

  const commitRemove = async (opt) => {
    setBusy(true);
    setError('');
    try {
      await onRemove(opt);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not remove');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[11px] font-black uppercase tracking-wide text-gray-500">{label}</label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setAdding((a) => !a); setManaging(false); setError(''); }}
            className="text-[10px] font-black uppercase tracking-wide text-amber-600 hover:text-amber-700 flex items-center gap-0.5">
            <Plus className="w-3 h-3" /> Add
          </button>
          <button type="button" onClick={() => { setManaging((m) => !m); setAdding(false); setError(''); }}
            className="text-[10px] font-black uppercase tracking-wide text-gray-400 hover:text-gray-600">
            Manage
          </button>
        </div>
      </div>

      <select className={field} value={value} onChange={(e) => onChange(e.target.value)}>
        {/* A product saved under a since-removed value must still show its own
            value, otherwise opening the form silently reassigns it. */}
        {value && !options.some((o) => o.value === value) && <option value={value}>{value}</option>}
        {options.map((o) => <option key={o._id || o.value} value={o.value}>{o.value}</option>)}
      </select>

      {adding && (
        <div className="flex gap-1.5 mt-2">
          <input
            autoFocus
            className={`${field} py-2`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitAdd(); }
              if (e.key === 'Escape') { setAdding(false); setDraft(''); }
            }}
            placeholder={placeholder}
          />
          <button type="button" onClick={commitAdd} disabled={busy || !draft.trim()}
            className="px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40" aria-label="Save">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => { setAdding(false); setDraft(''); setError(''); }}
            className="px-3 rounded-xl border border-gray-300 hover:bg-gray-50" aria-label="Cancel">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      {managing && (
        <div className="mt-2 rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-36 overflow-y-auto">
          {options.length === 0 && <p className="text-[11px] font-semibold text-gray-400 p-2 text-center">Nothing to manage</p>}
          {options.map((o) => (
            <div key={o._id || o.value} className="flex items-center justify-between px-3 py-1.5">
              <span className="text-xs font-bold text-gray-700">{o.value}</span>
              <button type="button" onClick={() => commitRemove(o)} disabled={busy}
                className="p-1 rounded hover:bg-rose-50 disabled:opacity-40" aria-label={`Remove ${o.value}`}>
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-[11px] font-bold text-rose-600 mt-1.5">{error}</p>}
    </div>
  );
}
