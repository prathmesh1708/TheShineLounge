import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Search, ScanLine, Plus, Minus, Trash2, Loader2, ShoppingCart } from 'lucide-react';
import { findSalonProductByCode, createSalonProductSale } from '../services/salonProductApi';

const money = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Net Banking'];

export default function SalonPosModal({ open, products, onClose, onSold }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [scanCode, setScanCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [billDiscount, setBillDiscount] = useState('');
  const [includeGst, setIncludeGst] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const scanRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setCart([]); setSearch(''); setScanCode(''); setCustomerName(''); setCustomerPhone('');
    setPaymentMode('Cash'); setBillDiscount(''); setIncludeGst(true); setError('');
    // Barcode scanners type into whatever has focus, so the scan box claims it.
    setTimeout(() => scanRef.current?.focus(), 80);
  }, [open]);

  const available = useMemo(
    () => (products || []).filter((p) => p.status !== 'inactive' && Number(p.stock) > 0),
    [products]
  );

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available.slice(0, 8);
    return available.filter((p) =>
      [p.name, p.sku, p.barcode, p.category, p.variant, p.brand]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    ).slice(0, 12);
  }, [available, search]);

  const addToCart = (product, qty = 1) => {
    setError('');
    if (!product) return;
    const stock = Number(product.stock) || 0;

    setCart((prev) => {
      const idx = prev.findIndex((l) => l.productId === product._id);
      if (idx >= 0) {
        const next = [...prev];
        const wanted = next[idx].quantity + qty;
        if (wanted > stock) {
          setError(`Only ${stock} left of "${product.name}"`);
          return prev;
        }
        next[idx] = { ...next[idx], quantity: wanted };
        return next;
      }
      if (qty > stock) {
        setError(`Only ${stock} left of "${product.name}"`);
        return prev;
      }
      return [...prev, {
        productId: product._id,
        name: product.name,
        variant: product.variant || '',
        sku: product.sku,
        mrp: Number(product.mrp) || 0,
        sellPrice: Number(product.sellPrice) || 0,
        stock,
        quantity: qty
      }];
    });
  };

  const setQty = (productId, quantity) => {
    setCart((prev) => prev.map((l) => {
      if (l.productId !== productId) return l;
      const q = Math.max(1, Math.min(Number(quantity) || 1, l.stock));
      return { ...l, quantity: q };
    }));
  };

  const removeLine = (productId) => setCart((prev) => prev.filter((l) => l.productId !== productId));

  // A scanner ends its transmission with Enter, so this doubles as the manual
  // "type a code and press enter" path.
  const handleScan = async (e) => {
    e.preventDefault();
    const code = scanCode.trim();
    if (!code) return;

    setScanning(true);
    setError('');
    try {
      const local = available.find((p) => p.barcode === code || p.sku === code);
      const product = local || (await findSalonProductByCode(code));
      if (!product) {
        setError(`No product matches ${code}`);
      } else {
        addToCart(product, 1);
        setScanCode('');
      }
    } catch (err) {
      setError(err?.response?.data?.message || `No product matches ${code}`);
    } finally {
      setScanning(false);
      scanRef.current?.focus();
    }
  };

  const totals = useMemo(() => {
    const gross = round2(cart.reduce((s, l) => s + l.mrp * l.quantity, 0));
    const subtotal = round2(cart.reduce((s, l) => s + l.sellPrice * l.quantity, 0));
    const itemDiscount = round2(gross - subtotal);
    const extra = Math.min(round2(Math.max(0, Number(billDiscount) || 0)), subtotal);
    const taxable = round2(subtotal - extra);
    const gst = includeGst ? round2(taxable * 0.18) : 0;
    return { gross, subtotal, itemDiscount, extra, taxable, gst, total: round2(taxable + gst) };
  }, [cart, billDiscount, includeGst]);

  const handleCheckout = async () => {
    if (cart.length === 0) return setError('Add at least one product');
    setSaving(true);
    setError('');
    try {
      const sale = await createSalonProductSale({
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        customerName, customerPhone, paymentMode,
        billDiscount: Number(billDiscount) || 0,
        includeGst, gstRate: 18
      });
      onSold(sale);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not complete the sale');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const field = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/60';

  return (
    <div className="fixed inset-0 z-[92] flex items-start justify-center overflow-y-auto bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-black text-gray-900">Salon Counter Sale</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
          {/* Picker */}
          <div className="lg:col-span-3 p-6 space-y-4 border-r border-gray-100">
            <form onSubmit={handleScan} className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={scanRef}
                  className={`${field} pl-9`}
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  placeholder="Scan barcode, or type a code and press Enter"
                />
              </div>
              <button type="submit" disabled={scanning}
                className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 disabled:opacity-60">
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </button>
            </form>

            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input className={`${field} pl-9`} value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name, SKU, brand or category" />
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {results.length === 0 && (
                <p className="text-xs font-semibold text-gray-400 text-center py-8">
                  {available.length === 0 ? 'No products in stock yet. Add some under Supplies & Stock.' : 'No products match that search.'}
                </p>
              )}
              {results.map((p) => {
                const off = p.mrp > 0 ? Math.round(((p.mrp - p.sellPrice) / p.mrp) * 100) : 0;
                return (
                  <button key={p._id} type="button" onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-gray-900 truncate">{p.name}</p>
                      <p className="text-[11px] font-semibold text-gray-500 truncate">
                        {[p.variant, p.brand, p.sku].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-gray-900">{money(p.sellPrice)}</p>
                      {off > 0 && <p className="text-[11px] font-bold text-emerald-600">{off}% off</p>}
                      <p className="text-[10px] font-bold text-gray-400">{p.stock} in stock</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-2 p-6 space-y-4 bg-gray-50/60">
            {error && (
              <div className="px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700">{error}</div>
            )}

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {cart.length === 0 && <p className="text-xs font-semibold text-gray-400 text-center py-6">Cart is empty</p>}
              {cart.map((l) => (
                <div key={l.productId} className="bg-white rounded-xl border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-900 truncate">{l.name}</p>
                      {l.variant && <p className="text-[10px] font-semibold text-gray-400">{l.variant}</p>}
                    </div>
                    <button onClick={() => removeLine(l.productId)} className="p-1 rounded hover:bg-rose-50" aria-label="Remove">
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setQty(l.productId, l.quantity - 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50" aria-label="Decrease">
                        <Minus className="w-3 h-3" />
                      </button>
                      <input className="w-10 text-center text-xs font-black border border-gray-200 rounded-lg py-1"
                        value={l.quantity} onChange={(e) => setQty(l.productId, e.target.value)} />
                      <button onClick={() => setQty(l.productId, l.quantity + 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50" aria-label="Increase">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-black text-gray-900">{money(l.sellPrice * l.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input className={field} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
              <input className={field} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone" />
              <select className={field} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <input type="number" min="0" className={field} value={billDiscount}
                onChange={(e) => setBillDiscount(e.target.value)} placeholder="Extra discount ₹" />
            </div>

            <label className="flex items-center gap-2 text-[11px] font-bold text-gray-600">
              <input type="checkbox" checked={includeGst} onChange={(e) => setIncludeGst(e.target.checked)} className="rounded" />
              Add GST @ 18%
            </label>

            <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-1 text-[11px] font-bold">
              <div className="flex justify-between text-gray-400"><span>Gross (MRP)</span><span>{money(totals.gross)}</span></div>
              {totals.itemDiscount > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Product discount</span><span>− {money(totals.itemDiscount)}</span></div>
              )}
              {totals.extra > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Bill discount</span><span>− {money(totals.extra)}</span></div>
              )}
              {includeGst && <div className="flex justify-between text-gray-400"><span>GST 18%</span><span>{money(totals.gst)}</span></div>}
              <div className="flex justify-between text-base font-black text-gray-900 pt-1.5 border-t border-gray-100">
                <span>Total</span><span>{money(totals.total)}</span>
              </div>
            </div>

            <button onClick={handleCheckout} disabled={saving || cart.length === 0}
              className="w-full px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Complete Sale &amp; Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
