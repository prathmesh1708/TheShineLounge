import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Package, Barcode as BarcodeIcon, RefreshCw, Printer, Loader2 } from 'lucide-react';
import BarcodeLabel, { generateBarcodeValue } from './BarcodeLabel';
import OptionSelect from './OptionSelect';
import {
  discountPercent,
  getSalonProductOptions,
  createSalonProductOption,
  deleteSalonProductOption
} from '../services/salonProductApi';

const BLANK = {
  name: '',
  category: 'Hair Care',
  variant: '',
  brand: '',
  unit: 'pc',
  mrp: '',
  sellPrice: '',
  stock: '',
  lowStockThreshold: 5,
  barcode: '',
  hsnCode: '',
  taxRate: 18,
  status: 'active',
  notes: ''
};


export default function SalonProductModal({ open, product, onClose, onSave }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [barcodeNote, setBarcodeNote] = useState('');
  const [options, setOptions] = useState({ category: [], unit: [] });
  const labelRef = useRef(null);

  const loadOptions = async () => {
    try {
      setOptions(await getSalonProductOptions());
    } catch (err) {
      console.warn('Could not load product options:', err.message);
    }
  };

  useEffect(() => { if (open) loadOptions(); }, [open]);

  const addOption = async (kind, value) => {
    await createSalonProductOption(kind, value);
    await loadOptions();
  };

  const removeOption = async (kind, option) => {
    await deleteSalonProductOption(option._id);
    await loadOptions();
  };

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(product
      ? {
          name: product.name || '',
          category: product.category || 'General',
          variant: product.variant || '',
          brand: product.brand || '',
          unit: product.unit || 'pc',
          mrp: product.mrp ?? '',
          sellPrice: product.sellPrice ?? '',
          stock: product.stock ?? '',
          lowStockThreshold: product.lowStockThreshold ?? 5,
          barcode: product.barcode || '',
          hsnCode: product.hsnCode || '',
          taxRate: product.taxRate ?? 18,
          status: product.status || 'active',
          notes: product.notes || ''
        }
      : BLANK);
  }, [open, product]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Live discount preview. Recomputed from MRP and selling price rather than
  // typed in, so the two can never disagree.
  const pricing = useMemo(() => {
    const mrp = Number(form.mrp) || 0;
    const sell = Number(form.sellPrice) || 0;
    return {
      mrp,
      sell,
      percent: discountPercent(mrp, sell),
      amount: Math.max(0, Math.round((mrp - sell) * 100) / 100),
      invalid: sell > mrp && mrp > 0
    };
  }, [form.mrp, form.sellPrice]);

  // Typing a code and pressing Generate used to throw that code away and
  // substitute a random one. A code the user entered is the code they want:
  // render it, and only mint a new one when the field is actually empty.
  const handleGenerateBarcode = () => {
    const typed = String(form.barcode || '').trim();
    if (typed) {
      setBarcodeNote(`Using ${typed}`);
      return;
    }
    const fresh = generateBarcodeValue();
    setForm((f) => ({ ...f, barcode: fresh }));
    setBarcodeNote(`Generated ${fresh}`);
  };

  // Explicit, separate action for the rarer case of wanting to discard a
  // code and mint a new one, so it can never happen by accident.
  const handleReplaceBarcode = () => {
    if (form.barcode && !window.confirm('Replace the current barcode with a new generated one?')) return;
    const fresh = generateBarcodeValue();
    setForm((f) => ({ ...f, barcode: fresh }));
    setBarcodeNote(`Generated ${fresh}`);
  };

  const handlePrintLabel = () => {
    const node = labelRef.current;
    if (!node) return;
    const win = window.open('', '_blank', 'width=420,height=320');
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>${form.name || 'Product'} — Label</title>
        <style>
          body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; text-align: center; }
          .name { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
          .meta { font-size: 11px; color: #444; margin-bottom: 8px; }
          svg { max-width: 100%; }
          @media print { @page { margin: 6mm; } }
        </style></head>
        <body>
          <div class="name">${(form.name || '').replace(/</g, '&lt;')}</div>
          <div class="meta">${(form.variant || '').replace(/</g, '&lt;')} &nbsp; MRP ₹${form.mrp || 0} &nbsp; ₹${form.sellPrice || 0}</div>
          ${node.innerHTML}
        </body>
      </html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Product name is required');
    if (form.mrp === '' || form.sellPrice === '') return setError('MRP and selling price are both required');
    if (pricing.invalid) return setError('Selling price cannot be higher than MRP');

    setSaving(true);
    try {
      await onSave({
        ...form,
        mrp: Number(form.mrp),
        sellPrice: Number(form.sellPrice),
        stock: Number(form.stock) || 0,
        lowStockThreshold: Number(form.lowStockThreshold) || 0,
        taxRate: Number(form.taxRate) || 0
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const field = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400';
  const label = 'block text-[11px] font-black uppercase tracking-wide text-gray-500 mb-1.5';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-black text-gray-900">{product ? 'Edit Product' : 'Add Salon Product'}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={label}>Product Name *</label>
              <input className={field} value={form.name} onChange={set('name')} placeholder="e.g. Argan Hair Serum" autoFocus />
            </div>

            <OptionSelect
              label="Type / Category"
              value={form.category}
              options={options.category}
              onChange={(v) => setForm((f) => ({ ...f, category: v }))}
              onAdd={(v) => addOption('category', v)}
              onRemove={(o) => removeOption('category', o)}
              placeholder="e.g. Hair Colour"
            />

            <div>
              <label className={label}>Variant</label>
              <input className={field} value={form.variant} onChange={set('variant')} placeholder="e.g. 100ml / Large" />
            </div>

            <div>
              <label className={label}>Brand</label>
              <input className={field} value={form.brand} onChange={set('brand')} placeholder="e.g. Loreal" />
            </div>

            <OptionSelect
              label="Unit"
              value={form.unit}
              options={options.unit}
              onChange={(v) => setForm((f) => ({ ...f, unit: v }))}
              onAdd={(v) => addOption('unit', v)}
              onRemove={(o) => removeOption('unit', o)}
              placeholder="e.g. sachet"
            />
          </div>

          {/* Pricing */}
          <div className="rounded-2xl border border-gray-200 p-4 space-y-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">Pricing</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={label}>MRP (₹) *</label>
                <input type="number" min="0" step="0.01" className={field} value={form.mrp} onChange={set('mrp')} placeholder="0.00" />
              </div>
              <div>
                <label className={label}>Selling Price (₹) *</label>
                <input type="number" min="0" step="0.01" className={field} value={form.sellPrice} onChange={set('sellPrice')} placeholder="0.00" />
              </div>
              <div>
                <label className={label}>Discount (auto)</label>
                <div className={`px-3 py-2.5 rounded-xl border text-sm font-black ${pricing.invalid ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                  {pricing.invalid ? 'Sell > MRP' : `${pricing.percent}%  (₹${pricing.amount})`}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={label}>Opening Stock</label>
                <input type="number" min="0" className={field} value={form.stock} onChange={set('stock')} placeholder="0" />
              </div>
              <div>
                <label className={label}>Low Stock Alert At</label>
                <input type="number" min="0" className={field} value={form.lowStockThreshold} onChange={set('lowStockThreshold')} />
              </div>
              <div>
                <label className={label}>GST %</label>
                <input type="number" min="0" className={field} value={form.taxRate} onChange={set('taxRate')} />
              </div>
            </div>
          </div>

          {/* Barcode */}
          <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <BarcodeIcon className="w-4 h-4 text-amber-500" />
              <p className="text-[11px] font-black uppercase tracking-wide text-gray-500">Barcode</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <input
                  className={field}
                  value={form.barcode}
                  onChange={(e) => { set('barcode')(e); setBarcodeNote(''); }}
                  placeholder="Scan or type a barcode"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={handleGenerateBarcode}
                    className="flex-1 px-3 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-gray-800">
                    <RefreshCw className="w-3.5 h-3.5" />
                    {String(form.barcode || '').trim() ? 'Use This Code' : 'Generate Code'}
                  </button>
                  <button type="button" onClick={handlePrintLabel} disabled={!form.barcode}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50 disabled:opacity-40">
                    <Printer className="w-3.5 h-3.5" /> Print Label
                  </button>
                </div>
                {String(form.barcode || '').trim() && (
                  <button type="button" onClick={handleReplaceBarcode}
                    className="w-full px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-[11px] font-bold text-gray-500 hover:bg-gray-50">
                    Replace with a new generated code
                  </button>
                )}
                {barcodeNote && <p className="text-[11px] font-bold text-emerald-600">{barcodeNote}</p>}
                <p className="text-[11px] text-gray-500 font-medium">
                  Your own code is kept as typed. Leave the field blank and press Generate to mint one — generated codes start with 200, reserved for in-store use, so they never clash with a manufacturer barcode.
                </p>
              </div>
              <div ref={labelRef} className="bg-white rounded-xl border border-gray-200 p-2 flex items-center justify-center">
                <BarcodeLabel value={form.barcode} height={54} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {product ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
