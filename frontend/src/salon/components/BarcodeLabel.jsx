import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

/**
 * Renders a scannable CODE128 barcode as inline SVG.
 *
 * SVG rather than canvas so the bars stay crisp when the label is printed or
 * pulled into the PDF receipt — a canvas barcode blurs at print DPI and
 * scanners start refusing it.
 */
export default function BarcodeLabel({
  value,
  width = 2,
  height = 60,
  fontSize = 14,
  displayValue = true,
  className = ''
}) {
  const svgRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const code = String(value || '').trim();
    if (!svgRef.current) return;

    if (!code) {
      setError('No code');
      return;
    }

    try {
      JsBarcode(svgRef.current, code, {
        format: 'CODE128',
        width,
        height,
        fontSize,
        displayValue,
        margin: 8,
        background: '#ffffff',
        lineColor: '#000000'
      });
      setError('');
    } catch (e) {
      // JsBarcode throws on input CODE128 cannot encode. Say so rather than
      // leaving a blank box that looks like a rendering bug.
      setError('Cannot encode this code');
    }
  }, [value, width, height, fontSize, displayValue]);

  if (!String(value || '').trim()) {
    return (
      <div className={`flex items-center justify-center h-20 rounded-lg border border-dashed border-gray-300 bg-gray-50 ${className}`}>
        <span className="text-[11px] font-semibold text-gray-400">No barcode assigned</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <svg ref={svgRef} className="w-full" />
      {error && (
        <p className="text-[11px] font-semibold text-rose-600 text-center mt-1">{error}</p>
      )}
    </div>
  );
}

/**
 * Generates a numeric barcode for products that arrived without one.
 *
 * Prefixed 200 — within the GS1 "restricted distribution" range reserved for
 * in-store use, so a generated label can never collide with a real
 * manufacturer's barcode on another product.
 */
export const generateBarcodeValue = () => {
  const stamp = String(Date.now()).slice(-9);
  const rand = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return `200${stamp}${rand}`;
};
