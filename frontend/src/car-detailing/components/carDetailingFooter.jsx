import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';

export default function CarDetailingFooter() {
  const navigate = useNavigate();

  const handleLink = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-zinc-50 border-t border-zinc-200 text-zinc-700 py-12 px-6 mt-16 -mx-6 -mb-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Column */}
        <div className="space-y-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-2xl tracking-wider text-zinc-800">DETAIL</span>
              <span className="font-extrabold text-2xl tracking-wider text-luxury-emerald bg-luxury-emerald/10 px-2 py-0.5 rounded-md">PRO</span>
            </div>
            <span className="text-[10px] tracking-[0.25em] font-semibold text-zinc-400 uppercase mt-0.5">CAR DETAILING</span>
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Experience premium luxury detailing and paint protection. Apple-grade service engineered to restore your vehicle to a flawless showroom finish.
          </p>
          <div className="flex gap-4 pt-2">
            <a href="#" className="p-2 bg-zinc-200/50 hover:bg-luxury-emerald hover:text-white rounded-full transition-all duration-300 text-zinc-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="#" className="p-2 bg-zinc-200/50 hover:bg-luxury-emerald hover:text-white rounded-full transition-all duration-300 text-zinc-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="#" className="p-2 bg-zinc-200/50 hover:bg-luxury-emerald hover:text-white rounded-full transition-all duration-300 text-zinc-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
            </a>
          </div>
        </div>

        {/* Quick Services */}
        <div className="space-y-4">
          <h4 className="font-bold text-base tracking-wide text-zinc-800">Services</h4>
          <ul className="space-y-2 text-sm text-zinc-550">
            <li><button onClick={() => handleLink("/car-detailing/services")} className="hover:text-luxury-emerald transition-colors">Paint Correction & Swirl Fix</button></li>
            <li><button onClick={() => handleLink("/car-detailing/services")} className="hover:text-luxury-emerald transition-colors">Interior Cabin Steam Clean</button></li>
            <li><button onClick={() => handleLink("/car-detailing/services")} className="hover:text-luxury-emerald transition-colors">Full Bumper-to-Bumper Detail</button></li>
            <li><button onClick={() => handleLink("/car-detailing/services")} className="hover:text-luxury-emerald transition-colors">9H Nano Ceramic Coating</button></li>
            <li><button onClick={() => handleLink("/car-detailing/services")} className="hover:text-luxury-emerald transition-colors">Paint Protection Film (PPF)</button></li>
          </ul>
        </div>

        {/* Platform Links */}
        <div className="space-y-4">
          <h4 className="font-bold text-base tracking-wide text-zinc-800">Quick Links</h4>
          <ul className="space-y-2 text-sm text-zinc-550">
            <li><button onClick={() => handleLink("/car-detailing")} className="hover:text-luxury-emerald transition-colors">Home Page</button></li>
            <li><button onClick={() => handleLink("/car-detailing/packages")} className="hover:text-luxury-emerald transition-colors">Detales Packages</button></li>
            <li><button onClick={() => handleLink("/car-detailing/offers")} className="hover:text-luxury-emerald transition-colors">Offers & Coupons</button></li>
            <li><button onClick={() => handleLink("/car-detailing/about")} className="hover:text-luxury-emerald transition-colors">About Story</button></li>
            <li><button onClick={() => handleLink("/car-detailing/contact")} className="hover:text-luxury-emerald transition-colors">Contact Support</button></li>
          </ul>
        </div>

        {/* Contact info */}
        <div className="space-y-4">
          <h4 className="font-bold text-base tracking-wide text-zinc-800">Contact Details</h4>
          <ul className="space-y-3.5 text-sm text-zinc-550">
            <li className="flex gap-2.5 items-start">
              <MapPin className="w-5 h-5 text-luxury-emerald flex-shrink-0 mt-0.5" />
              <span>Vijay Nagar Main Square, Indore, Madhya Pradesh - 452010</span>
            </li>
            <li className="flex gap-2.5 items-center">
              <Phone className="w-4.5 h-4.5 text-luxury-emerald flex-shrink-0" />
              <span>+91 98765 43210</span>
            </li>
            <li className="flex gap-2.5 items-center">
              <Mail className="w-4.5 h-4.5 text-luxury-emerald flex-shrink-0" />
              <span>support@detailpro.in</span>
            </li>
            <li className="flex gap-2.5 items-center pt-2">
              <ShieldCheck className="w-5 h-5 text-luxury-emerald" />
              <span className="text-xs uppercase tracking-wider font-bold text-luxury-emerald bg-luxury-emerald/10 py-1 px-2.5 rounded-full">CERTIFIED DETAIL SHOP</span>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-6xl mx-auto border-t border-zinc-200 mt-10 pt-6 text-center text-xs text-zinc-400 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© {new Date().getFullYear()} DetailPro Car Detailing. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-zinc-655 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-zinc-655 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-zinc-655 transition-colors">Refund Policy</a>
        </div>
      </div>
    </footer>
  );
}
