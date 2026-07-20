import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import TSLLogo from './TSLLogo';
import { servicesData } from '../data/servicesData';
import { Search } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.substring(1); // Get service ID from path
  
  const currentService = servicesData[path];
  const isService = !!currentService;
  const accentColor = currentService?.accentColor || '#D49A7F';

  const [showNavbar, setShowNavbar] = useState(true);
  const [navSearchQuery, setNavSearchQuery] = useState("");
  const lastScrollY = useRef(0);
  const navRef = useRef(null);

  const searchPages = ['/car-detailing', '/dog-wash', '/salon'];
  const hasSearch = searchPages.includes(location.pathname);

  // Reset states on path change
  useEffect(() => {
    setShowNavbar(true);
    setNavSearchQuery("");
    
    // Defer height measurement to ensure DOM is updated
    const timer = setTimeout(() => {
      if (navRef.current) {
        const height = navRef.current.offsetHeight;
        document.documentElement.style.setProperty('--navbar-offset', `${height}px`);
        document.documentElement.style.setProperty('--navbar-height', `${height}px`);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY.current;

      if (currentScrollY <= 60) {
        setShowNavbar(true);
      } else if (Math.abs(scrollDiff) > 10) {
        if (scrollDiff > 0) {
          // Scrolling down - hide navbar smoothly with CSS transform (no layout shift)
          setShowNavbar(false);
        } else {
          // Scrolling up - reveal navbar
          setShowNavbar(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!navSearchQuery.trim()) return;

    if (location.pathname === '/car-detailing') {
      navigate(`/car-detailing/services?search=${encodeURIComponent(navSearchQuery)}`);
    } else if (location.pathname === '/salon') {
      navigate(`/salon/services?search=${encodeURIComponent(navSearchQuery)}`);
    } else if (location.pathname === '/dog-wash') {
      navigate(`/dog-wash/services?search=${encodeURIComponent(navSearchQuery)}`);
    } else if (location.pathname === '/cafe') {
      navigate(`/cafe?search=${encodeURIComponent(navSearchQuery)}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(navSearchQuery)}`);
    }
  };

  const getSearchPlaceholder = () => {
    if (location.pathname === '/car-detailing') return "Search detailing treatments, steam, ceramic...";
    if (location.pathname === '/salon') return "Search haircut, balayage, facial, spa...";
    if (location.pathname === '/dog-wash') return "Search puppy wash, deshedding rake, flea...";
    if (location.pathname === '/cafe') return "Search coffee, lattes, croissants...";
    return "Search restaurants, salons, washes...";
  };

  const getSearchBtnBg = () => {
    if (location.pathname === '/car-detailing') return 'bg-luxury-emerald hover:bg-luxury-emeraldHover';
    if (location.pathname === '/dog-wash') return 'bg-grooming-primary hover:bg-grooming-hover';
    if (location.pathname === '/salon') return 'bg-[#00B8B0] hover:bg-[#00A19B]';
    return 'bg-zinc-800 hover:bg-zinc-900';
  };

  return (
    <nav ref={navRef} className={`navbar ${showNavbar ? 'navbar-visible' : 'navbar-hidden'}`}>
      <div className="navbar-container flex flex-col">
        
        {/* Row 1: Logo & Actions */}
        <div className="navbar-row-top w-full flex items-center justify-between">
          {/* Left Side: Logo Link */}
          <Link to="/" className="logo-link">
            <div className="logo-badge">
              <TSLLogo accentColor={accentColor} isService={isService} />
            </div>
            <span className="logo-text">THE SHINE LOUNGE</span>
          </Link>
          
          {/* Right Side: Profile & Notification Actions */}
          <div className="navbar-right-actions">
            {/* Notification Bell */}
            <button 
              className="navbar-action-btn"
              onClick={() => alert('No new notifications')}
              aria-label="Notifications"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </button>
            
            {/* Profile Icon */}
            <Link 
              to="/profile" 
              className="navbar-action-btn"
              aria-label="Profile"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Row 2: Search Bar */}
        {hasSearch && (
          <div className="navbar-row-bottom w-full">
            <form onSubmit={handleSearchSubmit} className="w-full flex gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder={getSearchPlaceholder()}
                  value={navSearchQuery}
                  onChange={(e) => setNavSearchQuery(e.target.value)}
                  className="w-full py-2.5 pl-11 pr-4 bg-zinc-50 border border-zinc-200 focus:border-luxury-emerald text-zinc-800 placeholder-zinc-400 rounded-20 outline-none text-xs sm:text-sm font-semibold transition-all shadow-sm"
                />
              </div>
              <button
                type="submit"
                className={`py-2.5 px-5 text-white text-xs sm:text-sm font-bold rounded-20 shadow-md transition-all flex-shrink-0 ${getSearchBtnBg()}`}
              >
                Search
              </button>
            </form>
          </div>
        )}

      </div>
    </nav>
  );
}

