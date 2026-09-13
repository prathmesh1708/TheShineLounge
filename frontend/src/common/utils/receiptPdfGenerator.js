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
 * Returns the rendered HTML5 Canvas of the receipt element
 */
export async function getReceiptCanvas(element) {
  if (!element) throw new Error('Receipt element not found');
  const options = getPdfConfig('Receipt.pdf');
  const worker = html2pdf().set(options).from(element);
  const canvas = await worker.toCanvas().get('canvas');
  return canvas;
}

/**
 * Returns a PNG Blob of the receipt image
 */
export async function getReceiptImageBlob(element) {
  const canvas = await getReceiptCanvas(element);
  if (!canvas) throw new Error('Failed to generate canvas from receipt');

  if (typeof canvas.toBlob === 'function') {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          try {
            const dataUrl = canvas.toDataURL('image/png');
            const byteString = atob(dataUrl.split(',')[1]);
            const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            resolve(new Blob([ab], { type: mimeString }));
          } catch (e) {
            reject(e);
          }
        }
      }, 'image/png', 1.0);
    });
  } else {
    const dataUrl = canvas.toDataURL('image/png');
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }
}

/**
 * Copies the visual receipt image directly to the system clipboard
 * so the admin can simply press Cmd+V / Ctrl+V in WhatsApp Web / Desktop.
 */
export async function copyReceiptImageToClipboard(element) {
  if (!navigator?.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('Clipboard image copying is not supported on this browser.');
  }
  const blob = await getReceiptImageBlob(element);
  const item = new ClipboardItem({ 'image/png': blob });
  await navigator.clipboard.write([item]);
  return true;
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


