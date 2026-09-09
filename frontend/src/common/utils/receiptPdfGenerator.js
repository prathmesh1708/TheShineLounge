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
 * Tries Web Share API with the PDF file, falling back to download
 */
export async function shareOrDownloadReceiptPdf(element, filename = 'Receipt.pdf', shareTitle = 'The Shine Lounge Receipt') {
  try {
    const pdfBlob = await getReceiptPdfBlob(element, filename);
    const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: shareTitle,
          text: `Here is your official receipt from The Shine Lounge.`
        });
        return { shared: true, downloaded: false };
      } catch (err) {
        if (err.name === 'AbortError') {
          return { cancelled: true };
        }
        console.warn('Navigator share failed, triggering download:', err);
      }
    }

    // Fallback or non-supported: trigger direct file download
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);

    return { shared: false, downloaded: true };
  } catch (error) {
    console.error('PDF generation error, attempting direct save:', error);
    await downloadReceiptPdf(element, filename);
    return { shared: false, downloaded: true };
  }
}
