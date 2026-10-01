import React from 'react';
import tslLogo from '../../assets/images/tsl_logo.png';

// Official GSTIN, matching the car-wash tax invoice. Overridable per bill so a
// second branch with its own registration does not need a code change.
const DEFAULT_GST_NO = '06ABSCS4162M1ZO';

const NAVY = '#1e3e62';
const ORANGE = '#e07b2a';
const INK = '#0f172a';
const MUTED = '#64748b';
const SOFT = '#5a6e85';

const rupees = (n) =>
  `Rs. ${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatBillDate = (raw) => {
  const d = raw ? new Date(raw) : new Date();
  if (isNaN(d.getTime())) return String(raw || '');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const formatPhone = (phone) => {
  if (!phone) return '—';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2)}`;
  return String(phone);
};

/**
 * Tax invoice for salon retail sales.
 *
 * Deliberately separate from the shared ReceiptDocument: that one is built
 * around a single membership or service line and prints vehicle number, vehicle
 * model and membership validity, none of which a counter sale of shampoo has.
 * The header banner, logo, GST block and totals styling are matched to it so
 * the two read as the same document family, while the body is a real
 * multi-line item table.
 */
const SalonReceiptDocument = React.forwardRef(({ sale }, ref) => {
  if (!sale) return null;

  const items = Array.isArray(sale.items) ? sale.items : [];
  const hasGst = sale.includeGst !== false && Number(sale.gstAmount || 0) > 0;
  const gstRate = Number(sale.gstRate || 18);
  const gstAmount = Number(sale.gstAmount || 0);

  // India splits GST into CGST + SGST on an intra-state sale. Halve it, then
  // give any stray paisa to SGST so the two always re-add to the total.
  const cgst = Math.round((gstAmount / 2) * 100) / 100;
  const sgst = Math.round((gstAmount - cgst) * 100) / 100;

  const billDiscount = Number(sale.billDiscount || 0);
  const itemDiscount = Number(sale.itemDiscountTotal || 0);
  const taxable = Number(sale.subtotal || 0) - billDiscount;
  const total = Number(sale.total || 0);
  const saved = itemDiscount + billDiscount;

  const gstNo = sale.gstNo || sale.gstin || DEFAULT_GST_NO;
  const issuedDate = formatBillDate(sale.createdAt || sale.date);

  const th = {
    fontSize: '11px',
    fontWeight: 900,
    color: NAVY,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '0 0 8px 0',
    borderBottom: `1.5px solid ${NAVY}`
  };
  const td = { fontSize: '12.5px', color: INK, padding: '9px 0', verticalAlign: 'top' };
  const sumLabel = { fontSize: '12.5px', color: MUTED, padding: '4px 0', fontWeight: 600 };
  const sumValue = { fontSize: '12.5px', color: INK, padding: '4px 0', fontWeight: 800, textAlign: 'right' };

  return (
    <div
      ref={ref}
      id="printable-salon-bill"
      data-theme="light"
      className="receipt-print-wrapper receipt-paper-canvas mx-auto w-full max-w-[794px] overflow-hidden select-none"
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: INK
      }}
    >
      {/* Split banner — same 72/28 navy/orange as the car-wash invoice */}
      <div className="w-full flex" style={{ height: '18px', minHeight: '18px', display: 'flex', width: '100%' }}>
        <div style={{ flex: '0 0 72%', width: '72%', backgroundColor: NAVY, height: '100%' }} />
        <div style={{ flex: '0 0 28%', width: '28%', backgroundColor: ORANGE, height: '100%' }} />
      </div>

      <div style={{ padding: '38px 48px 48px 48px' }}>
        {/* Brand + document meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '34px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <img src={tslLogo} alt="The Shine Lounge"
              style={{ width: '74px', height: '74px', objectFit: 'contain', display: 'block' }} />
            <span style={{
              fontWeight: 900, fontSize: '13px', letterSpacing: '1px', color: INK,
              textTransform: 'uppercase', marginTop: '10px', display: 'block'
            }}>
              THE SHINE LOUNGE
            </span>
            <span style={{ fontSize: '11.5px', color: SOFT, fontWeight: 600, marginTop: '2px' }}>
              Men&apos;s Salon — Retail Counter
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h1 style={{
              fontSize: '25px', fontWeight: 900, color: INK, letterSpacing: '-0.4px',
              textTransform: 'uppercase', margin: '0 0 6px 0', lineHeight: 1.15
            }}>
              {hasGst ? 'TAX INVOICE' : 'RETAIL BILL'}
            </h1>
            <p style={{ fontSize: '13px', color: SOFT, margin: '3px 0', fontWeight: 500 }}>Issued: {issuedDate}</p>
            <p style={{ fontSize: '13px', color: SOFT, margin: '3px 0', fontWeight: 500 }}>Bill No: {sale.billNo}</p>
            <p style={{ fontSize: '13px', color: SOFT, margin: '3px 0', fontWeight: 500 }}>GST No: {gstNo}</p>
          </div>
        </div>

        {/* Customer */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{
            fontSize: '12px', fontWeight: 900, color: NAVY, textTransform: 'uppercase',
            letterSpacing: '0.8px', margin: '0 0 12px 0'
          }}>
            BILLED TO
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['CUSTOMER', sale.customerName || 'Walk-in Customer'],
                ['CONTACT', formatPhone(sale.customerPhone)],
                ['PAYMENT MODE', sale.paymentMode || 'Cash'],
                ...(sale.soldBy ? [['BILLED BY', sale.soldBy]] : [])
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{
                    color: MUTED, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.4px', padding: '5px 0', width: '38%', verticalAlign: 'middle'
                  }}>{k}</td>
                  <td style={{ color: INK, fontWeight: 800, fontSize: '14px', padding: '5px 0', verticalAlign: 'middle' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Items */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '12px', fontWeight: 900, color: NAVY, textTransform: 'uppercase',
            letterSpacing: '0.8px', margin: '0 0 12px 0'
          }}>
            ITEMS PURCHASED
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left' }}>Item</th>
                <th style={{ ...th, textAlign: 'center', width: '8%' }}>Qty</th>
                <th style={{ ...th, textAlign: 'right', width: '16%' }}>MRP</th>
                <th style={{ ...th, textAlign: 'right', width: '16%' }}>Rate</th>
                <th style={{ ...th, textAlign: 'right', width: '18%' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e8edf3' }}>
                  <td style={{ ...td, textAlign: 'left' }}>
                    <span style={{ fontWeight: 800 }}>{item.name}</span>
                    {(item.variant || item.sku) && (
                      <span style={{ display: 'block', fontSize: '11px', color: MUTED, fontWeight: 600 }}>
                        {[item.variant, item.sku].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </td>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 800 }}>{item.quantity}</td>
                  <td style={{
                    ...td, textAlign: 'right', color: MUTED,
                    textDecoration: Number(item.discountPerUnit) > 0 ? 'line-through' : 'none'
                  }}>
                    {rupees(item.mrp)}
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{rupees(item.sellPrice)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 900 }}>{rupees(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <table style={{ width: '58%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={sumLabel}>Gross (at MRP)</td>
                <td style={sumValue}>{rupees(sale.grossAmount)}</td>
              </tr>
              {itemDiscount > 0 && (
                <tr>
                  <td style={{ ...sumLabel, color: '#059669' }}>Product discount</td>
                  <td style={{ ...sumValue, color: '#059669' }}>− {rupees(itemDiscount)}</td>
                </tr>
              )}
              {billDiscount > 0 && (
                <tr>
                  <td style={{ ...sumLabel, color: '#059669' }}>Bill discount</td>
                  <td style={{ ...sumValue, color: '#059669' }}>− {rupees(billDiscount)}</td>
                </tr>
              )}
              <tr>
                <td style={{ ...sumLabel, fontWeight: 800, color: INK }}>Taxable Value</td>
                <td style={sumValue}>{rupees(taxable)}</td>
              </tr>
              {hasGst && (
                <>
                  <tr>
                    <td style={sumLabel}>CGST @ {gstRate / 2}%</td>
                    <td style={sumValue}>{rupees(cgst)}</td>
                  </tr>
                  <tr>
                    <td style={sumLabel}>SGST @ {gstRate / 2}%</td>
                    <td style={sumValue}>{rupees(sgst)}</td>
                  </tr>
                </>
              )}
              <tr>
                <td style={{
                  fontSize: '13px', fontWeight: 900, color: INK, textTransform: 'uppercase',
                  letterSpacing: '0.5px', padding: '12px 0 0 0', borderTop: `1.5px solid ${NAVY}`
                }}>
                  Total Paid {hasGst ? '(Incl. GST)' : ''}
                </td>
                <td style={{
                  fontSize: '22px', fontWeight: 900, color: ORANGE, textAlign: 'right',
                  padding: '12px 0 0 0', borderTop: `1.5px solid ${NAVY}`
                }}>
                  {rupees(total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {saved > 0 && (
          <p style={{ textAlign: 'right', fontSize: '12.5px', fontWeight: 800, color: '#059669', margin: '0 0 18px 0' }}>
            You saved {rupees(saved)} on this bill
          </p>
        )}

        <div style={{ fontSize: '11.5px', color: MUTED, lineHeight: 1.6, marginBottom: '8px' }}>
          {hasGst ? (
            <>
              <p style={{ margin: '0 0 2px 0' }}>
                Taxable value: {rupees(taxable)} + GST ({gstRate}%): {rupees(gstAmount)}.
              </p>
              <p style={{ margin: 0 }}>
                Amount received via {sale.paymentMode || 'Cash'}: {rupees(total)}. (GSTIN: {gstNo})
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 2px 0' }}>Commercial Receipt (Non-GST billing).</p>
              <p style={{ margin: 0 }}>
                Amount received via {sale.paymentMode || 'Cash'}: {rupees(total)}.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '22px' }}>
          <div>
            <p style={{
              fontSize: '12px', fontWeight: 900, color: INK, textTransform: 'uppercase',
              letterSpacing: '0.6px', margin: '0 0 3px 0'
            }}>
              THE SHINE LOUNGE
            </p>
            <p style={{ fontSize: '11px', color: MUTED, margin: 0 }}>
              Thank you for shopping with us · Goods once sold are not returnable.
            </p>
          </div>
          <div>
            <p style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500, margin: 0 }}>Customer Copy</p>
          </div>
        </div>
      </div>
    </div>
  );
});

SalonReceiptDocument.displayName = 'SalonReceiptDocument';

export default SalonReceiptDocument;
