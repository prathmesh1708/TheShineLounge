import React from 'react';

export default function ServiceIcon({ name, size = 32 }) {
  switch (name.toLowerCase()) {
    case 'cafe':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          {/* Saucer Base */}
          <g id="saucer">
            <ellipse cx="32" cy="52" rx="24" ry="7" fill="#E2E8F0" stroke="#1E1B18" strokeWidth="2" />
            <ellipse cx="32" cy="51" rx="20" ry="5.5" fill="#F8FAFC" stroke="#1E1B18" strokeWidth="1.5" />
          </g>

          {/* Cup Handle */}
          <path d="M46 28C56 28 57 41 42 43" fill="none" stroke="#1E1B18" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M46 28C56 28 57 41 42 43" fill="none" stroke="#014785" strokeWidth="2.5" strokeLinecap="round" />

          {/* Cup Main Body */}
          <g id="cup-body">
            <path d="M14 26C14 43 20 48 32 48C44 48 50 43 50 26H14Z" fill="#014785" stroke="#1E1B18" strokeWidth="2" strokeLinejoin="round" />

            {/* Gold Coffee Beans Pattern */}
            <g id="bean-pattern" opacity="0.95">
              {/* Bean 1 */}
              <g transform="translate(18, 30) rotate(-20) scale(0.7)">
                <ellipse cx="0" cy="0" rx="4" ry="6" fill="#F38200" stroke="#1E1B18" strokeWidth="1" />
                <path d="M0 -5C-1 -2 1 2 0 5" stroke="#1E1B18" strokeWidth="1" />
              </g>
              {/* Bean 2 */}
              <g transform="translate(28, 33) rotate(15) scale(0.75)">
                <ellipse cx="0" cy="0" rx="4" ry="6" fill="#F38200" stroke="#1E1B18" strokeWidth="1" />
                <path d="M0 -5C-1 -2 1 2 0 5" stroke="#1E1B18" strokeWidth="1" />
              </g>
              {/* Bean 3 */}
              <g transform="translate(38, 30) rotate(-15) scale(0.7)">
                <ellipse cx="0" cy="0" rx="4" ry="6" fill="#F38200" stroke="#1E1B18" strokeWidth="1" />
                <path d="M0 -5C-1 -2 1 2 0 5" stroke="#1E1B18" strokeWidth="1" />
              </g>
              {/* Bean 4 */}
              <g transform="translate(22, 40) rotate(25) scale(0.65)">
                <ellipse cx="0" cy="0" rx="4" ry="6" fill="#F38200" stroke="#1E1B18" strokeWidth="1" />
                <path d="M0 -5C-1 -2 1 2 0 5" stroke="#1E1B18" strokeWidth="1" />
              </g>
              {/* Bean 5 */}
              <g transform="translate(34, 40) rotate(-25) scale(0.65)">
                <ellipse cx="0" cy="0" rx="4" ry="6" fill="#F38200" stroke="#1E1B18" strokeWidth="1" />
                <path d="M0 -5C-1 -2 1 2 0 5" stroke="#1E1B18" strokeWidth="1" />
              </g>
            </g>
          </g>

          {/* Coffee Surface & Cream Rim */}
          <g id="coffee-surface">
            <ellipse cx="32" cy="26" rx="18" ry="5.5" fill="#014785" stroke="#1E1B18" strokeWidth="2" />
            <ellipse cx="32" cy="26" rx="16.5" ry="4.5" fill="#FEF3C7" stroke="#1E1B18" strokeWidth="1" />
            {/* Latte Swirl / Coffee Center */}
            <ellipse cx="32" cy="26" rx="12" ry="3.2" fill="#D97706" />
            <path d="M26 26C28 24 34 24 37 26C35 28 29 28 26 26Z" fill="#FEF3C7" opacity="0.8" />
          </g>

          {/* Wisps of Steam */}
          <g id="steam" stroke="#475569" strokeWidth="2" strokeLinecap="round">
            <path d="M23 20C19 15 25 10 21 4" />
            <path d="M32 20C27 13 36 8 30 2" strokeWidth="2.5" stroke="#014785" />
            <path d="M41 20C37 15 43 10 39 4" />
          </g>
        </svg>
      );
    case 'drive-through-cafe':
    case 'drive-through':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          {/* Ground line */}
          <line x1="4" y1="56" x2="60" y2="56" stroke="#2C1B18" strokeWidth="2" strokeLinecap="round" />

          {/* Menu Board (Top Left) */}
          <g id="menu-board">
            <line x1="12" y1="36" x2="12" y2="48" stroke="#2C1B18" strokeWidth="2" />
            <line x1="24" y1="36" x2="24" y2="48" stroke="#2C1B18" strokeWidth="2" />
            <rect x="6" y="12" width="24" height="25" rx="2" fill="#F38200" stroke="#2C1B18" strokeWidth="2" />
            <rect x="8" y="14" width="20" height="4" fill="#2C1B18" rx="1" />
            <rect x="8" y="20" width="9" height="15" fill="#1A365D" rx="1" />
            <rect x="19" y="20" width="9" height="15" fill="#1A365D" rx="1" />
            <line x1="9.5" y1="23" x2="15.5" y2="23" stroke="#FAF9F6" strokeWidth="1" />
            <line x1="9.5" y1="26" x2="15.5" y2="26" stroke="#FAF9F6" strokeWidth="1" />
            <line x1="9.5" y1="29" x2="15.5" y2="29" stroke="#FAF9F6" strokeWidth="1" />
            <line x1="20.5" y1="23" x2="26.5" y2="23" stroke="#FAF9F6" strokeWidth="1" />
            <line x1="20.5" y1="26" x2="26.5" y2="26" stroke="#FAF9F6" strokeWidth="1" />
            <line x1="20.5" y1="29" x2="26.5" y2="29" stroke="#FAF9F6" strokeWidth="1" />
          </g>

          {/* Booth (Right Side) */}
          <g id="booth">
            <rect x="28" y="22" width="30" height="34" rx="2" fill="#F7FAFC" stroke="#2C1B18" strokeWidth="2" />
            <path d="M25 22L31 15H60L56 22Z" fill="#014785" stroke="#2C1B18" strokeWidth="2" strokeLinejoin="round" />
            <rect x="25" y="21" width="35" height="3" rx="1" fill="#1A365D" stroke="#2C1B18" strokeWidth="1.5" />
            <rect x="33" y="28" width="14" height="13" rx="1" fill="#2D3748" stroke="#2C1B18" strokeWidth="2" />
            <rect x="31" y="41" width="18" height="2" fill="#CBD5E0" stroke="#2C1B18" strokeWidth="1.5" />
            <rect x="49" y="32" width="7" height="24" rx="1" fill="#E2E8F0" stroke="#2C1B18" strokeWidth="1.5" />
            <circle cx="51" cy="44" r="0.8" fill="#2C1B18" />
            {/* Coffee Cup on Roof */}
            <g transform="translate(42, 4)">
              <path d="M2 7L4 16H12L14 7H2Z" fill="#014785" stroke="#2C1B18" strokeWidth="1.5" />
              <rect x="1" y="5" width="14" height="2.5" rx="1" fill="#FFFFFF" stroke="#2C1B18" strokeWidth="1.5" />
              <path d="M9 5L12 0H14" stroke="#D69E2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>

          {/* Blue Car (Foreground) */}
          <g id="car" transform="translate(4, 32)">
            <path d="M2 14C2 14 5 13 8 13L13 6C15 3 24 3 28 6L34 13C38 13 41 14 41 17V21C41 22.5 39.5 23 38 23H5C3.5 23 2 22.5 2 21V14Z" fill="#1D4ED8" stroke="#2C1B18" strokeWidth="2" strokeLinejoin="round" />
            <path d="M14 7C16 4.5 23 4.5 27 7L32 13H10L14 7Z" fill="#93C5FD" stroke="#2C1B18" strokeWidth="1.5" />
            <line x1="21" y1="7" x2="21" y2="13" stroke="#2C1B18" strokeWidth="1.5" />
            <ellipse cx="39.5" cy="16" rx="1.5" ry="2" fill="#FEFCBF" stroke="#2C1B18" strokeWidth="1" />
            <circle cx="10" cy="22" r="4.5" fill="#1E293B" stroke="#2C1B18" strokeWidth="1.5" />
            <circle cx="10" cy="22" r="2" fill="#94A3B8" />
            <circle cx="32" cy="22" r="4.5" fill="#1E293B" stroke="#2C1B18" strokeWidth="1.5" />
            <circle cx="32" cy="22" r="2" fill="#94A3B8" />
          </g>
        </svg>
      );
    case 'car-wash':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          {/* Base Platform */}
          <g id="platform">
            <path d="M4 42L32 54L60 42L32 30Z" fill="#1E3A8A" stroke="#1E1B18" strokeWidth="1.5" />
            <path d="M4 42L32 54V57L4 45Z" fill="#172554" stroke="#1E1B18" strokeWidth="1.5" />
            <path d="M60 42L32 54V57L60 45Z" fill="#1E293B" stroke="#1E1B18" strokeWidth="1.5" />
            {/* Tracks */}
            <path d="M16 38L38 48" stroke="#F38200" strokeWidth="1.5" strokeDasharray="3 2" />
            <path d="M26 34L48 44" stroke="#F38200" strokeWidth="1.5" strokeDasharray="3 2" />
          </g>

          {/* Gears on Left Pillar */}
          <g id="gears" transform="translate(6, 12)">
            <circle cx="6" cy="6" r="5" fill="#F38200" stroke="#1E1B18" strokeWidth="1.5" />
            <circle cx="6" cy="6" r="2" fill="#1E1B18" />
            <circle cx="4" cy="15" r="6" fill="#475569" stroke="#1E1B18" strokeWidth="1.5" />
            <circle cx="4" cy="15" r="2.5" fill="#1E1B18" />
          </g>

          {/* Main Gantry Frame (Steel Arch) */}
          <g id="gantry-frame">
            <path d="M20 20V40" stroke="#1E40AF" strokeWidth="3" strokeLinecap="round" />
            <path d="M14 18V44" stroke="#1E40AF" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M14 18V44" stroke="#1E1B18" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M50 18V44" stroke="#1E40AF" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M50 18V44" stroke="#1E1B18" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 18L32 10L52 18" stroke="#1E40AF" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M12 18L32 10L52 18" stroke="#1E1B18" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            <rect x="18" y="24" width="3" height="12" rx="1" fill="#CBD5E0" stroke="#1E1B18" strokeWidth="1" />
          </g>

          {/* Car in Wash Bay */}
          <g id="wash-car" transform="translate(20, 26)">
            <path d="M4 14C4 14 6 12 9 12L15 6C17 4 23 4 27 6L31 12C34 12 36 13 36 15V19H4V14Z" fill="#64748B" stroke="#1E1B18" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M16 7C18 5 22 5 26 7L29 12H12L16 7Z" fill="#94A3B8" stroke="#1E1B18" strokeWidth="1" />
            <circle cx="10" cy="19" r="3.5" fill="#1E293B" stroke="#1E1B18" strokeWidth="1" />
            <circle cx="28" cy="19" r="3.5" fill="#1E293B" stroke="#1E1B18" strokeWidth="1" />
            <ellipse cx="34" cy="14" rx="1.5" ry="1" fill="#FEFCBF" />
          </g>

          {/* Roller Brushes (Striped Orange & Blue) */}
          <g id="brushes">
            {/* Top Horizontal Brush */}
            <g id="top-brush" transform="translate(22, 14)">
              <rect x="0" y="0" width="22" height="7" rx="3.5" fill="#2563EB" stroke="#1E1B18" strokeWidth="1.5" />
              <path d="M4 0V7M8 0V7M12 0V7M16 0V7M20 0V7" stroke="#F38200" strokeWidth="2.5" />
            </g>

            {/* Left Vertical Roller Brush */}
            <g id="left-brush" transform="translate(19, 24)">
              <rect x="0" y="0" width="7" height="20" rx="3.5" fill="#2563EB" stroke="#1E1B18" strokeWidth="1.5" />
              <path d="M0 4H7M0 8H7M0 12H7M0 16H7" stroke="#F38200" strokeWidth="2.5" />
            </g>

            {/* Right Vertical Roller Brush */}
            <g id="right-brush" transform="translate(42, 22)">
              <rect x="0" y="0" width="7" height="20" rx="3.5" fill="#2563EB" stroke="#1E1B18" strokeWidth="1.5" />
              <path d="M0 4H7M0 8H7M0 12H7M0 16H7" stroke="#F38200" strokeWidth="2.5" />
            </g>
          </g>

          {/* Water Tank on Right */}
          <g id="water-tank" transform="translate(52, 34)">
            <rect x="0" y="0" width="8" height="12" rx="2" fill="#38BDF8" fillOpacity="0.6" stroke="#1E1B18" strokeWidth="1.2" />
            <path d="M1 5C3 4 5 6 7 5V10H1V5Z" fill="#0284C7" opacity="0.8" />
            <rect x="2" y="-2" width="4" height="2" rx="0.5" fill="#CBD5E0" stroke="#1E1B18" strokeWidth="1" />
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
          {/* Golden Sparkles & Crescent Moon Top */}
          <g id="sky-elements">
            {/* Crescent Moon */}
            <path d="M38 5C35 7 35 12 38 14C34 14 31 10 33 5Z" fill="#F38200" stroke="#1E1B18" strokeWidth="1" />
            {/* Sparkle Stars */}
            <path d="M14 8L15 11L18 12L15 13L14 16L13 13L10 12L13 11Z" fill="#F38200" stroke="#1E1B18" strokeWidth="0.8" />
            <path d="M49 12L50 14L52 15L50 16L49 18L48 16L46 15L48 14Z" fill="#F38200" stroke="#1E1B18" strokeWidth="0.8" />
            <path d="M12 24L12.5 25.5L14 26L12.5 26.5L12 28L11.5 26.5L10 26L11.5 25.5Z" fill="#F38200" />
            <path d="M25 6L25.5 7.5L27 8L25.5 8.5L25 10L24.5 8.5L23 8L24.5 7.5Z" fill="#F38200" />
          </g>

          {/* Foam / Soapy Bubbles Stack (Background) */}
          <g id="foam-bubbles" opacity="0.95">
            <circle cx="16" cy="38" r="4.5" fill="#BAE6FD" stroke="#014785" strokeWidth="1.2" />
            <circle cx="12" cy="46" r="6" fill="#E0F2FE" stroke="#014785" strokeWidth="1.2" />
            <circle cx="18" cy="52" r="5" fill="#BAE6FD" stroke="#014785" strokeWidth="1.2" />
            <circle cx="21" cy="32" r="5" fill="#E0F2FE" stroke="#014785" strokeWidth="1.2" />
            <circle cx="46" cy="30" r="5.5" fill="#BAE6FD" stroke="#014785" strokeWidth="1.2" />
            <circle cx="50" cy="40" r="4" fill="#E0F2FE" stroke="#014785" strokeWidth="1.2" />
            <circle cx="44" cy="44" r="3" fill="#BAE6FD" stroke="#014785" strokeWidth="1.2" />
          </g>

          {/* Main Shampoo Bottle */}
          <g id="shampoo-bottle">
            {/* Cap */}
            <rect x="26" y="13" width="12" height="6" rx="2" fill="#0F2942" stroke="#1E1B18" strokeWidth="1.5" />
            <path d="M28 13C28 11 36 11 36 13" stroke="#1E1B18" strokeWidth="1" fill="#0F2942" />

            {/* Bottle Body */}
            <path d="M22 23C22 18 42 18 42 23V48C42 52 22 52 22 48Z" fill="#014785" stroke="#1E1B18" strokeWidth="2" strokeLinejoin="round" />

            {/* White/Light-Blue Label */}
            <rect x="25" y="25" width="14" height="21" rx="2.5" fill="#F0F9FF" stroke="#1E1B18" strokeWidth="1.2" />

            {/* Paw Print on Label */}
            <g id="label-paw" transform="translate(32, 35.5)">
              <ellipse cx="0" cy="2" rx="3.2" ry="2.5" fill="#014785" />
              <circle cx="-3" cy="-2.5" r="1.2" fill="#014785" />
              <circle cx="-1" cy="-4.2" r="1.2" fill="#014785" />
              <circle cx="1.8" cy="-4.2" r="1.2" fill="#014785" />
              <circle cx="3.6" cy="-2.5" r="1.2" fill="#014785" />
            </g>
          </g>

          {/* Leather Dog Collar (Bottom Right) */}
          <g id="dog-collar" transform="translate(36, 44)">
            <ellipse cx="8" cy="6" rx="9" ry="4" fill="none" stroke="#F38200" strokeWidth="3.5" />
            <ellipse cx="8" cy="6" rx="9" ry="4" fill="none" stroke="#1E1B18" strokeWidth="1" />
            {/* Metal Buckle */}
            <rect x="13" y="3" width="4" height="6" rx="1" fill="#CBD5E0" stroke="#1E1B18" strokeWidth="1" />
            <line x1="15" y1="3" x2="15" y2="9" stroke="#1E1B18" strokeWidth="1" />
          </g>

          {/* Foreground Bubbles */}
          <g id="fg-bubbles">
            <circle cx="25" cy="54" r="3.5" fill="#E0F2FE" stroke="#014785" strokeWidth="1.2" />
            <circle cx="14" cy="22" r="2.5" fill="#BAE6FD" stroke="#014785" strokeWidth="1.2" />
          </g>
        </svg>
      );
    case 'salon':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          {/* Background Geometric Accents */}
          <g id="bg-shapes" opacity="0.35" stroke="#F38200" strokeWidth="1">
            <polygon points="12,14 16,8 20,14" fill="none" />
            <polygon points="46,6 50,2 54,6 50,10" fill="none" stroke="#014785" />
            <polygon points="10,36 14,32 18,36 14,40" fill="none" stroke="#014785" />
            <polygon points="48,34 52,28 56,34" fill="none" />
          </g>

          {/* Stand / Tray Base */}
          <g id="base-tray">
            <rect x="8" y="52" width="48" height="7" rx="1.5" fill="#014785" stroke="#1E1B18" strokeWidth="1.8" />
            <rect x="10" y="53" width="44" height="2" fill="#3B82F6" opacity="0.4" />
          </g>

          {/* Serum / Hair Oil Bottle (Far Left) */}
          <g id="serum-bottle" transform="translate(11, 36)">
            <rect x="2" y="6" width="6" height="10" rx="1" fill="#014785" stroke="#1E1B18" strokeWidth="1.2" />
            <rect x="3.5" y="2" width="3" height="4" rx="0.5" fill="#F38200" stroke="#1E1B18" strokeWidth="1" />
            <line x1="2" y1="10" x2="8" y2="10" stroke="#F38200" strokeWidth="1" />
          </g>

          {/* Orange Comb */}
          <g id="comb" transform="translate(23, 28) rotate(22)">
            <rect x="0" y="0" width="7" height="22" rx="1.5" fill="#F38200" stroke="#1E1B18" strokeWidth="1.2" />
            {/* Comb Teeth */}
            <path d="M7 2H2M7 5H2M7 8H2M7 11H2M7 14H2M7 17H2M7 20H2" stroke="#1E1B18" strokeWidth="1" />
          </g>

          {/* Main Hair Dryer (Center) */}
          <g id="hair-dryer">
            {/* Dryer Head */}
            <path d="M17 11C17 7 35 7 35 11L33 22C33 25 17 25 17 22Z" fill="#014785" stroke="#1E1B18" strokeWidth="2" strokeLinejoin="round" />
            {/* Rear Filter Cap */}
            <ellipse cx="17" cy="16.5" rx="2.5" ry="6" fill="#0F2942" stroke="#1E1B18" strokeWidth="1.2" />
            <line x1="17" y1="12" x2="17" y2="21" stroke="#3B82F6" strokeWidth="1" />
            {/* Nozzle Tip */}
            <rect x="35" y="10" width="3" height="13" rx="1" fill="#0F2942" stroke="#1E1B18" strokeWidth="1.2" />
            {/* Dryer Handle */}
            <path d="M22 23.5V38C22 41 26 41 26 38V23.5" fill="#014785" stroke="#1E1B18" strokeWidth="2" />
            <circle cx="24" cy="42" r="1.5" fill="none" stroke="#1E1B18" strokeWidth="1" />

            {/* Blowing Wind Currents */}
            <g id="wind-lines" stroke="#014785" strokeWidth="2" strokeLinecap="round">
              <path d="M40 11C44 11 46 9 50 9" />
              <path d="M40 16.5H53" strokeWidth="2.5" stroke="#F38200" />
              <path d="M40 22C44 22 46 24 50 24" />
            </g>
          </g>

          {/* Professional Scissors (Right) */}
          <g id="scissors" transform="translate(33, 22)">
            {/* Blades */}
            <line x1="6" y1="2" x2="21" y2="28" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="6" y1="2" x2="21" y2="28" stroke="#1E1B18" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="21" y1="2" x2="6" y2="28" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="21" y1="2" x2="6" y2="28" stroke="#1E1B18" strokeWidth="1.2" strokeLinecap="round" />
            {/* Pivot Screw */}
            <circle cx="13.5" cy="15" r="1.5" fill="#F38200" stroke="#1E1B18" strokeWidth="0.8" />
            {/* Finger Loops */}
            <circle cx="4" cy="28" r="3.5" fill="none" stroke="#1E1B18" strokeWidth="2" />
            <circle cx="23" cy="28" r="3.5" fill="none" stroke="#1E1B18" strokeWidth="2" />
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
