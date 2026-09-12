/**
 * Utility for generating high-definition A4 PDF receipts from HTML elements
 * using html2pdf.js with support for Web Share API and automatic downloads.
 */

import html2pdf from 'html2pdf.js';

export const getPdfConfig = (filename = 'Receipt.pdf') => ({
  margin: [0, 0, 0, 0],
  filename,
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    letterRendering: true,
    scrollY: 0,
    scrollX: 0,
    logging: false,
    backgroundColor: '#ffffff'
  },
  jsPDF: {
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true
  }
});

/**
 * Directly downloads an element as an A4 PDF
 */
export async function downloadReceiptPdf(element, filename = 'Receipt.pdf') {
  if (!element) throw new Error('Receipt element not found for PDF generation');

  const options = getPdfConfig(filename);
  return html2pdf().set(options).from(element).save();
}

/**
 * Returns a Blob of the generated A4 PDF
 */
export async function getReceiptPdfBlob(element, filename = 'Receipt.pdf') {
  if (!element) throw new Error('Receipt element not found for PDF generation');

  const options = getPdfConfig(filename);
  const worker = html2pdf().set(options).from(element);
  const pdfBlob = await worker.output('blob');
  return pdfBlob;
}

/**
 * Generates an image Blob (PNG) from a receipt HTML element
 */
export async function getReceiptImageBlob(element) {
  if (!element) throw new Error('Receipt element not found for image generation');

  const options = getPdfConfig('Receipt.pdf');
  const worker = html2pdf().set(options).from(element);

  try {
    const canvas = await worker.toCanvas().get('canvas');
    if (canvas && typeof canvas.toBlob === 'function') {
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to Blob conversion failed'));
        }, 'image/png', 1.0);
      });
    }
  } catch (err) {
    console.warn('worker.toCanvas get failed, trying fallback:', err);
  }

  const imgUri = await worker.outputImg('datauristring');
  const res = await fetch(imgUri);
  return await res.blob();
}

/**
 * Copies receipt image directly into user's system clipboard for instant Cmd+V paste into WhatsApp
 */
export async function copyReceiptImageToClipboard(element) {
  if (!element) return false;
  try {
    const imageBlob = await getReceiptImageBlob(element);
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': imageBlob })
      ]);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard image write failed:', err);
  }
  return false;
}

/**
 * Direct file share helper using Web Share API with download fallback
 */
export async function sharePdfFile({ blob, fileName = 'Receipt.pdf', title = 'The Shine Lounge Receipt', text = '' }) {
  const file = new File([blob], fileName, {
    type: 'application/pdf',
    lastModified: Date.now()
  });

  const canShareFiles = typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] });

  if (canShareFiles) {
    try {
      await navigator.share({
        title,
        text,
        files: [file]
      });
      return {
        success: true,
        status: 'shared',
        method: 'native-share',
        file,
        blob
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          status: 'cancelled',
          method: 'native-share',
          file,
          blob
        };
      }
      console.warn('Native share threw error, continuing to download fallback:', err);
    }
  }

  // Fallback: trigger direct file download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);

  return {
    success: false,
    status: 'fallback-downloaded',
    method: 'download-fallback',
    file,
    blob
  };
}

/**
 * Tries Web Share API with the generated PDF file, falling back to download on desktop/unsupported browsers
 */
export async function shareOrDownloadReceiptPdf(element, filename = 'Receipt.pdf', shareTitle = 'The Shine Lounge Receipt', shareText = '') {
  try {
    const pdfBlob = await getReceiptPdfBlob(element, filename);
    return await sharePdfFile({
      blob: pdfBlob,
      fileName: filename,
      title: shareTitle,
      text: shareText
    });
  } catch (error) {
    console.error('PDF generation error, attempting direct save:', error);
    await downloadReceiptPdf(element, filename);
    return {
      success: false,
      status: 'fallback-downloaded',
      method: 'download-fallback',
      error
    };
  }
}

