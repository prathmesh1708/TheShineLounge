import React from 'react';
import tslLogo from '../../assets/images/tsl_logo.png';

/**
 * Format date string or object to 'Month D, YYYY' (e.g. September 8, 2026)
 */
export function formatReceiptDate(rawDate) {
  if (!rawDate) {
    const d = new Date();
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  // If already formatted like 'September 8, 2026', return as-is
  if (typeof rawDate === 'string' && /^[A-Z][a-z]+ \d{1,2}, \d{4}$/.test(rawDate)) {
    return rawDate;
  }

  const parsed = new Date(rawDate);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  return String(rawDate);
}

/**
 * Format phone to standard '+91 XXXXXXXXXX' format
 */
export function formatReceiptPhone(phone) {
  if (!phone) return '—';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2)}`;
  }
  return String(phone);
}

/**
 * Compute clean validity range
 */
export function getReceiptValidityRange(sale, formattedIssuedDate) {
  if (!sale) return formattedIssuedDate;
  const isMembership = sale.saleType === 'membership' || !!sale.membershipName;

  if (sale.membershipExpiry) {
    const startStr = formattedIssuedDate;
    const endStr = formatReceiptDate(sale.membershipExpiry);
    return `${startStr} - ${endStr}`;
  }

  if (sale.membershipValidity && sale.membershipValidity.includes(' - ')) {
    return sale.membershipValidity;
  }

  if (isMembership) {
    const d = new Date();
    const startStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    d.setDate(d.getDate() + 30);
    const endStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  }

  return formattedIssuedDate;
}

/**
 * Pixel-perfect Receipt Document component matching The Shine Lounge official design
 */
const ReceiptDocument = React.forwardRef(({ sale, forPrint = false }, ref) => {
  if (!sale) return null;

  const isMembership = sale.saleType === 'membership' || !!sale.membershipName;
  const planName = sale.packageName || sale.membershipName || (isMembership ? 'Monthly Membership' : 'Car Wash Service');
  const price = Number(sale.price || sale.total || sale.amount || 0);

  const issuedDate = formatReceiptDate(sale.date || sale.createdAt);
  const validityRange = getReceiptValidityRange(sale, issuedDate);
  const receiptNo = sale.id || sale.bookingId || sale.receiptNo || 'OFS-2026-001';
  const paymentMode = sale.paymentMode || 'Cash';
  const customerPhone = formatReceiptPhone(sale.phone || sale.customerPhone || sale.mobile);

  return (
    <div
      ref={ref}
      id="printable-tsl-receipt"
      className="receipt-print-wrapper bg-white text-[#0f172a] mx-auto w-full max-w-[794px] overflow-hidden select-none"
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: 'border-box',
        backgroundColor: '#ffffff'
      }}
    >
      {/* 1. Split Top Header Banner (72% Navy #1e3e62, 28% Orange #e07b2a) */}
      <div
        className="w-full flex"
        style={{ height: '18px', minHeight: '18px', display: 'flex', width: '100%' }}
      >
        <div
          style={{
            flex: '0 0 72%',
            width: '72%',
            backgroundColor: '#1e3e62',
            height: '100%'
          }}
        />
        <div
          style={{
            flex: '0 0 28%',
            width: '28%',
            backgroundColor: '#e07b2a',
            height: '100%'
          }}
        />
      </div>

      {/* 2. Inner Receipt Content */}
      <div style={{ padding: '38px 48px 48px 48px' }}>
        {/* Top Header Row: Logo on Left, Receipt Title & Metadata on Right */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '38px'
          }}
        >
          {/* Brand Col */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <img
              src={tslLogo}
              alt="The Shine Lounge"
              style={{
                width: '74px',
                height: '74px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
            <span
              style={{
                fontWeight: 900,
                fontSize: '13px',
                letterSpacing: '1px',
                color: '#0f172a',
                textTransform: 'uppercase',
                marginTop: '10px',
                display: 'block'
              }}
            >
              THE SHINE LOUNGE
            </span>
          </div>

          {/* Doc Info Col */}
          <div style={{ textAlign: 'right' }}>
            <h1
              style={{
                fontSize: '25px',
                fontWeight: 900,
                color: '#0f172a',
                letterSpacing: '-0.4px',
                textTransform: 'uppercase',
                margin: '0 0 6px 0',
                lineHeight: 1.15
              }}
            >
              {isMembership ? 'MEMBERSHIP RECEIPT' : 'SERVICE RECEIPT'}
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: '#5a6e85',
                margin: '3px 0',
                fontWeight: 500
              }}
            >
              Issued: {issuedDate}
            </p>
            <p
              style={{
                fontSize: '13px',
                color: '#5a6e85',
                margin: '3px 0',
                fontWeight: 500
              }}
            >
              Plan: {planName}
            </p>
            <p
              style={{
                fontSize: '13px',
                color: '#5a6e85',
                margin: '3px 0',
                fontWeight: 500
              }}
            >
              Receipt No: {receiptNo}
            </p>
          </div>
        </div>

        {/* 3. MEMBER DETAILS */}
        <div style={{ marginBottom: '34px' }}>
          <h2
            style={{
              fontSize: '12px',
              fontWeight: 900,
              color: '#1e3e62',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              margin: '0 0 14px 0'
            }}
          >
            MEMBER DETAILS
          </h2>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13.5px'
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    width: '42%',
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    padding: '6px 0',
                    verticalAlign: 'middle'
                  }}
                >
                  MEMBER NAME
                </td>
                <td
                  style={{
                    width: '58%',
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '14px',
                    padding: '6px 0',
                    verticalAlign: 'middle'
                  }}
                >
                  {sale.customerName || 'Valued Customer'}
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    padding: '6px 0',
                    verticalAlign: 'middle'
                  }}
                >
                  CONTACT NUMBER
                </td>
                <td
                  style={{
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '14px',
                    padding: '6px 0',
                    verticalAlign: 'middle'
                  }}
                >
                  {customerPhone}
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    padding: '6px 0',
                    verticalAlign: 'middle'
                  }}
                >
                  EMAIL ADDRESS
                </td>
                <td
                  style={{
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '14px',
                    padding: '6px 0',
                    verticalAlign: 'middle'
                  }}
                >
                  {sale.customerEmail || '—'}
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    padding: '6px 0',
                    verticalAlign: 'middle'
                  }}
                >
                  MEMBERSHIP VALIDITY
                </td>
                <td
                  style={{
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '14px',
                    padding: '6px 0',
                    verticalAlign: 'middle'
                  }}
                >
                  {validityRange}
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    padding: '6px 0',
                    verticalAlign: 'middle'
                  }}
                >
                  VEHICLE NUMBER
                </td>
                <td
                  style={{
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '14px',
                    letterSpacing: '0.5px',
                    padding: '6px 0',
                    verticalAlign: 'middle'
                  }}
                >
                  {sale.vehicleNo || '—'}
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    padding: '6px 0',
                    verticalAlign: 'middle'
                  }}
                >
                  VEHICLE MODEL
                </td>
                <td
                  style={{
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '14px',
                    padding: '6px 0',
                    verticalAlign: 'middle'
                  }}
                >
                  {sale.vehicleModel || sale.vehicleType || '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. PAYMENT SUMMARY */}
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '12px',
              fontWeight: 900,
              color: '#1e3e62',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              margin: '0 0 14px 0'
            }}
          >
            PAYMENT SUMMARY
          </h2>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '18px 24px',
              marginBottom: '12px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '13.5px',
                color: '#334155',
                fontWeight: 600
              }}
            >
              <span>{planName}</span>
              <span>Rs. {price.toLocaleString('en-IN')}</span>
            </div>

            <div
              style={{
                height: '1px',
                backgroundColor: '#e2e8f0',
                margin: '14px 0'
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: 900,
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px'
                }}
              >
                TOTAL PAID
              </span>
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: '#e07b2a'
                }}
              >
                Rs. {price.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div
            style={{
              fontSize: '11.5px',
              color: '#64748b',
              lineHeight: 1.6
            }}
          >
            <p style={{ margin: '0 0 2px 0' }}>
              Regular price: Rs. {price.toLocaleString('en-IN')} before applicable taxes.
            </p>
            <p style={{ margin: 0 }}>
              Amount received via {paymentMode}: Rs. {price.toLocaleString('en-IN')}.
            </p>
          </div>
        </div>

        {/* 5. MEMBERSHIP CONFIRMED BANNER */}
        <div
          style={{
            backgroundColor: '#1e3e62',
            color: '#ffffff',
            borderRadius: '10px',
            padding: '14px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '46px'
          }}
        >
          <span
            style={{
              fontSize: '12.5px',
              fontWeight: 900,
              letterSpacing: '0.8px',
              textTransform: 'uppercase'
            }}
          >
            {isMembership ? 'MEMBERSHIP CONFIRMED' : 'SERVICE CONFIRMED'}
          </span>
          <span
            style={{
              fontSize: '12px',
              color: '#dbeafe',
              fontWeight: 500
            }}
          >
            {isMembership ? `Valid ${validityRange}` : `Completed on ${issuedDate}`}
          </span>
        </div>

        {/* 6. FOOTER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '16px'
          }}
        >
          <div>
            <p
              style={{
                fontSize: '12px',
                fontWeight: 900,
                color: '#0f172a',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                margin: '0 0 3px 0'
              }}
            >
              THE SHINE LOUNGE
            </p>
            <p
              style={{
                fontSize: '11px',
                color: '#64748b',
                margin: 0
              }}
            >
              Thank you for choosing The Shine Lounge.
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: '11.5px',
                color: '#94a3b8',
                fontWeight: 500,
                margin: 0
              }}
            >
              Customer Copy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ReceiptDocument;
