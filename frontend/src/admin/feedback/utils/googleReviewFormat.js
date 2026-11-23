// Google appends machine translations to review text, in one of two shapes:
//   "<original>\n\n(Translated by Google)\n<translation>"
//   "(Translated by Google) <translation>\n\n(Original)\n<original>"
// Show the original, and keep the translation for a toggle.
export const splitTranslation = (comment = '') => {
  const text = String(comment || '');
  const originalMarker = text.indexOf('(Original)');
  if (originalMarker !== -1) {
    return {
      text: text.slice(originalMarker + '(Original)'.length).trim(),
      translation: text.slice(0, originalMarker).replace('(Translated by Google)', '').trim()
    };
  }
  const translatedMarker = text.indexOf('(Translated by Google)');
  if (translatedMarker > 0) {
    return {
      text: text.slice(0, translatedMarker).trim(),
      translation: text.slice(translatedMarker + '(Translated by Google)'.length).trim()
    };
  }
  return { text: text.trim(), translation: '' };
};

export const relativeTime = (value) => {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then) / 1000;
  const units = [
    ['year', 365 * 24 * 3600],
    ['month', 30 * 24 * 3600],
    ['week', 7 * 24 * 3600],
    ['day', 24 * 3600],
    ['hour', 3600],
    ['minute', 60]
  ];
  for (const [unit, secs] of units) {
    const n = Math.floor(diff / secs);
    if (n >= 1) return `${n} ${unit}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
};

export const formatDate = (value) => (value
  ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : '');

export const REPLY_LIMIT = 4096;

export const replyPresets = (stars, name) => {
  const first = String(name || '').split(' ')[0] || 'there';
  if (stars >= 4) {
    return [
      { label: 'Thank you', text: `Thank you so much, ${first}! We're delighted you enjoyed your visit to The Shine Lounge. See you again soon!` },
      { label: 'Team appreciation', text: `Hi ${first}, thank you for the wonderful review! Our team works hard to give every car the care it deserves, and your kind words mean a lot to us.` }
    ];
  }
  if (stars === 3) {
    return [
      { label: 'Thanks + improve', text: `Hi ${first}, thank you for your feedback. We'd love to know what would have made your visit a 5-star experience. Please reach us at 091387 05051 so we can do better next time.` }
    ];
  }
  return [
    { label: 'Apology + follow-up', text: `Hi ${first}, we're sorry your experience didn't meet expectations. This isn't the standard we aim for. Please call us at 091387 05051 so our manager can look into this personally and make it right.` },
    { label: 'Investigating', text: `Hi ${first}, thank you for letting us know. We're looking into what happened during your visit and will reach out to resolve it. We hope to have the chance to serve you better.` }
  ];
};
