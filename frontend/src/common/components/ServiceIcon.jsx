import React from 'react';

export default function ServiceIcon({ name, size = 24 }) {
  const iconProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };

  switch (name.toLowerCase()) {
    case 'cafe':
      return (
        <svg {...iconProps}>
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" y1="2" x2="6" y2="4" />
          <line x1="10" y1="2" x2="10" y2="4" />
          <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
      );
    case 'drive-through-cafe':
      return (
        <svg {...iconProps}>
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <path d="M7 11V7a3 3 0 0 1 6 0v4" />
          <circle cx="7" cy="21" r="2" fill="currentColor" />
          <circle cx="17" cy="21" r="2" fill="currentColor" />
          <path d="M19 5h2M17 2h4M18 8h3" />
        </svg>
      );
    case 'car-wash':
      return (
        <svg {...iconProps}>
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
          <path d="M12 2v3M9 3v2M15 3v2" />
          <path d="M12 7.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1Z" />
          <path d="M9 7.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1Z" />
          <path d="M15 7.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1Z" />
        </svg>
      );
    case 'car-detailing':
      return (
        <svg {...iconProps}>
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
          <path d="M12 2 L14 4 L12 6 L10 4 Z" fill="currentColor" stroke="none" />
          <path d="M21 2 L22 3.5 L21 5 L20 3.5 Z" fill="currentColor" stroke="none" />
          <path d="M4 4 L5.5 5 L4 6 L2.5 5 Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'dog-wash':
      return (
        <svg {...iconProps}>
          <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 18 18c0-2.2-1.8-4-4-4" />
          <path d="M12 5c0-1.5 1.5-3 3.5-3s3.5 1.5 3.5 3c0 2-2 4-3.5 5" />
          <circle cx="12" cy="14" r="1" fill="currentColor" />
          <circle cx="8" cy="14" r="1" fill="currentColor" />
          <circle cx="10" cy="18" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'salon':
      return (
        <svg {...iconProps}>
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="9.8" y1="8.2" x2="20" y2="17" />
          <line x1="9.8" y1="15.8" x2="20" y2="7" />
          <line x1="12" y1="12" x2="22" y2="12" />
        </svg>
      );
    default:
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}
