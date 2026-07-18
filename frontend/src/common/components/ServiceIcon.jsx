import React from 'react';

export default function ServiceIcon({ name, size = 32 }) {
  switch (name.toLowerCase()) {
    case 'cafe':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          {/* Saucer */}
          <ellipse cx="32" cy="48" rx="22" ry="6" fill="#F0E5D8" stroke="#2C1B18" strokeWidth="2" />
          {/* Cup Body */}
          <path d="M16 26h32v12c0 8-8 10-16 10S16 38 16 26z" fill="#FAF9F6" stroke="#2C1B18" strokeWidth="2" />
          {/* Handle */}
          <path d="M48 30c4 0 7 2 7 6s-3 6-7 6" stroke="#2C1B18" strokeWidth="2" strokeLinecap="round" />
          {/* Coffee inside */}
          <ellipse cx="32" cy="26" rx="15" ry="3" fill="#5C3A21" />
          {/* Steam */}
          <path d="M26 18c0-3 3-3 3-6M32 18c0-3 3-3 3-6M38 18c0-3 3-3 3-6" stroke="#8E7E76" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'drive-through-cafe':
    case 'drive-through':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          {/* Car */}
          <g transform="translate(1, 28) scale(0.65)">
            <path d="M8 25h32v10H8z" fill="#3182CE" stroke="#2C1B18" strokeWidth="3" />
            <path d="M12 25l4-12h16l4 12" fill="#63B3ED" stroke="#2C1B18" strokeWidth="3" />
            <circle cx="15" cy="35" r="5" fill="#2C1B18" />
            <circle cx="33" cy="35" r="5" fill="#2C1B18" />
          </g>
          {/* Hamburger */}
          <g transform="translate(25, 4) scale(0.6)">
            <path d="M10 24c0-5 8-7 18-7s18 2 18 7H10z" fill="#D69E2E" stroke="#2C1B18" strokeWidth="3" />
            <rect x="8" y="24" width="40" height="3" rx="1.5" fill="#E53E3E" stroke="#2C1B18" strokeWidth="2.5" />
            <rect x="6" y="27" width="44" height="3" rx="1.5" fill="#38A169" stroke="#2C1B18" strokeWidth="2.5" />
            <rect x="8" y="30" width="40" height="5" rx="2.5" fill="#4A5568" stroke="#2C1B18" strokeWidth="3" />
            <path d="M10 35c0 3 5 5 18 5s18-2 18-5H10z" fill="#D69E2E" stroke="#2C1B18" strokeWidth="3" />
          </g>
          {/* Soda Cup */}
          <g transform="translate(42, 24) scale(0.6)">
            <path d="M10 16h20l-3 24H13L10 16z" fill="#E53E3E" stroke="#2C1B18" strokeWidth="3" />
            <rect x="7" y="12" width="26" height="4" rx="2" fill="#FAF9F6" stroke="#2C1B18" strokeWidth="3" />
            <path d="M20 12l3-9" stroke="#2C1B18" strokeWidth="3" strokeLinecap="round" />
          </g>
        </svg>
      );
    case 'car-wash':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          {/* Sponge */}
          <rect x="6" y="26" width="34" height="20" rx="4" fill="#ECC94B" stroke="#2C1B18" strokeWidth="2.5" />
          {/* Sponge Scrubbing Green Layer */}
          <path d="M6 26h34v4H6v-4z" fill="#38A169" stroke="#2C1B18" strokeWidth="2" />
          {/* Bubbles */}
          <circle cx="12" cy="20" r="3" fill="#E2E8F0" stroke="#2C1B18" strokeWidth="1.5" />
          <circle cx="22" cy="16" r="4.5" fill="#E2E8F0" stroke="#2C1B18" strokeWidth="1.5" />
          <circle cx="32" cy="21" r="2.5" fill="#E2E8F0" stroke="#2C1B18" strokeWidth="1.5" />
          {/* Hose Spray Nozzle */}
          <g transform="translate(28, 6) rotate(15) scale(0.85)">
            <path d="M12 28l12-16 6 4-12 16z" fill="#4A5568" stroke="#2C1B18" strokeWidth="2.5" />
            <path d="M18 16L6 14v-4l12 2z" fill="#38A169" stroke="#2C1B18" strokeWidth="2.5" />
            {/* Water Spray */}
            <path d="M4 10C0 6-4 4-8 4M4 14C0 14-4 16-8 18M4 12C-2 12-6 12-10 12" stroke="#4299E1" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </svg>
      );
    case 'car-detailing':
    case 'detailing':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          {/* Blue Car */}
          <path d="M8 32h48v12H8z" fill="#3182CE" stroke="#2C1B18" strokeWidth="2.5" />
          <path d="M14 32l5-12h26l5 12" fill="#63B3ED" stroke="#2C1B18" strokeWidth="2.5" />
          <circle cx="18" cy="44" r="6" fill="#2C1B18" />
          <circle cx="46" cy="44" r="6" fill="#2C1B18" />
          
          {/* Polishing Hand with yellow buffer pad */}
          <g transform="translate(26, 4) scale(0.85)">
            <circle cx="16" cy="16" r="10" fill="#ECC94B" stroke="#2C1B18" strokeWidth="2" />
            <path d="M12 12c-4-4-8 0-8 4s6 8 10 4" stroke="#2C1B18" strokeWidth="2" fill="#718096" />
          </g>
          {/* Sparkles */}
          <path d="M52 12l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#ECC94B" />
          <path d="M6 22l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#ECC94B" />
        </svg>
      );
    case 'dog-wash':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          {/* Shampoo Bottle */}
          <path d="M14 22h18l-2 26H16L14 22z" fill="#81E6D9" stroke="#2C1B18" strokeWidth="2.5" />
          <rect x="17" y="16" width="12" height="6" rx="1" fill="#4FD1C5" stroke="#2C1B18" strokeWidth="2" />
          {/* Paw Print on bottle */}
          <circle cx="23" cy="34" r="3" fill="#2C1B18" />
          <circle cx="19" cy="28" r="1.5" fill="#2C1B18" />
          <circle cx="23" cy="26" r="1.5" fill="#2C1B18" />
          <circle cx="27" cy="28" r="1.5" fill="#2C1B18" />
          
          {/* Separate Paw Print & bubbles */}
          <g transform="translate(32, 14) scale(0.95)">
            <circle cx="16" cy="18" r="6" fill="#E2D4C9" stroke="#2C1B18" strokeWidth="2" />
            <circle cx="8" cy="8" r="3" fill="#E2D4C9" stroke="#2C1B18" strokeWidth="2" />
            <circle cx="16" cy="5" r="3" fill="#E2D4C9" stroke="#2C1B18" strokeWidth="2" />
            <circle cx="24" cy="8" r="3" fill="#E2D4C9" stroke="#2C1B18" strokeWidth="2" />
          </g>
          {/* Bubbles */}
          <circle cx="48" cy="12" r="3.5" fill="none" stroke="#2C1B18" strokeWidth="1.5" />
          <circle cx="10" cy="14" r="2" fill="none" stroke="#2C1B18" strokeWidth="1.5" />
          <circle cx="36" cy="44" r="4.5" fill="none" stroke="#2C1B18" strokeWidth="1.5" />
        </svg>
      );
    case 'salon':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          {/* Hair Dryer */}
          <g transform="translate(4, 6) scale(0.9)">
            <path d="M12 12h18v10H12z" fill="#4A5568" stroke="#2C1B18" strokeWidth="2.5" />
            <path d="M16 22l-2 16h6l2-16z" fill="#E53E3E" stroke="#2C1B18" strokeWidth="2.5" />
            <path d="M30 14h4v6h-4z" fill="#2D3748" />
            <circle cx="12" cy="17" r="4" fill="#718096" stroke="#2C1B18" strokeWidth="2" />
          </g>
          {/* Scissors */}
          <g transform="translate(28, 20) scale(0.85)">
            <circle cx="10" cy="30" r="5" stroke="#2C1B18" strokeWidth="2.5" />
            <circle cx="22" cy="30" r="5" stroke="#2C1B18" strokeWidth="2.5" />
            <line x1="12" y1="25" x2="24" y2="5" stroke="#2C1B18" strokeWidth="2.5" />
            <line x1="20" y1="25" x2="8" y2="5" stroke="#2C1B18" strokeWidth="2.5" />
          </g>
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}
