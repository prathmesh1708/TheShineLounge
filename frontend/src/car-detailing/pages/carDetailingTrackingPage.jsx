import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, MessageSquare, Clock, ShieldCheck, Navigation, ArrowLeft } from 'lucide-react';

import { getTechnician, MOCK_BOOKINGS } from '../services/carDetailingApi';
import { Toast, Drawer } from '../components/carDetailingUI';

export default function CarDetailingTrackingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("id") || "BK-9831";

  const [tech, setTech] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chat drawer and toast states
  const [showChat, setShowChat] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { sender: "tech", msg: "Hello! I am preparing the detailing van. Do you have a water faucet available near the parking?" },
    { sender: "user", msg: "Yes, there is a dedicated wash bay with a water hookup right in our driveway." }
  ]);

  const [toastMsg, setToastMsg] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    Promise.all([getTechnician(), getBookingsMock()]).then(([techRes, bookRes]) => {
      setTech(techRes);
      setBooking(bookRes);
      setLoading(false);
    });
  }, [bookingId]);

  const getBookingsMock = () => {
    const found = MOCK_BOOKINGS.find(b => b.id === bookingId);
    return Promise.resolve(found || MOCK_BOOKINGS[0]);
  };

  const handleCall = () => {
    setToastMsg(`Calling technician ${tech.name} at ${tech.phone}...`);
    setToastOpen(true);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;

    setChatHistory(prev => [...prev, { sender: "user", msg: chatMsg }]);
    setChatMsg("");

    // Simulate reply after 1.5s
    setTimeout(() => {
      setChatHistory(prev => [...prev, { sender: "tech", msg: "Perfect, thank you! I'm leaving the workshop now and will arrive shortly." }]);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="h-[400px] w-full bg-zinc-50 border border-zinc-200 rounded-24 animate-pulse flex items-center justify-center">
        <span className="text-zinc-400 font-bold">Loading Tracking Coordinates...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 max-w-4xl mx-auto text-zinc-800"
    >
      {/* Back to Bookings */}
      <button
        onClick={() => navigate('/car-detailing/my-bookings')}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-800 transition-colors font-bold"
      >
        <ArrowLeft className="w-4.5 h-4.5" />
        <span>Back to My Bookings</span>
      </button>

      {/* Grid: Map on Left, Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Mock Map Container (7 columns) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="relative h-[360px] md:h-[420px] rounded-24 border border-zinc-200 overflow-hidden bg-slate-50 shadow-premium">
            
            {/* Custom map visual */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(22,163,74,0.06),rgba(255,255,255,0))]" />
            <div className="absolute inset-0 opacity-40" style={{
              backgroundImage: `radial-gradient(circle, #94A3B8 1.5px, transparent 1.5px)`,
              backgroundSize: '24px 24px'
            }} />

            {/* Custom SVG Streets layout representation */}
            <svg className="absolute inset-0 w-full h-full text-slate-200 stroke-current fill-none" strokeWidth="2.5">
              <path d="M 0 100 L 800 100" />
              <path d="M 0 300 L 800 300" />
              <path d="M 200 0 L 200 500" />
              <path d="M 550 0 L 550 500" />
              <path d="M 0 0 L 800 450" />
            </svg>

            {/* Route connecting line */}
            <svg className="absolute inset-0 w-full h-full stroke-luxury-emerald fill-none" strokeWidth="3" strokeDasharray="6 6">
              <path d="M 200 100 Q 375 200 550 300" />
            </svg>

            {/* Shop/Workshop Start point */}
            <div className="absolute top-[80px] left-[180px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-white border border-zinc-250 flex items-center justify-center shadow-premium backdrop-blur-md">
                <span className="text-[10px]">🏪</span>
              </div>
              <span className="text-[9px] text-zinc-400 mt-1 uppercase font-bold tracking-wider">Shop</span>
            </div>

            {/* Tech Moving Vehicle icon */}
            <motion.div
              animate={{
                x: [340, 360, 350, 340],
                y: [180, 195, 190, 180]
              }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="absolute top-0 left-0 z-10 flex flex-col items-center"
            >
              <div className="w-10 h-10 rounded-full bg-luxury-emerald border border-luxury-emeraldLight/30 flex items-center justify-center shadow-premium text-white animate-bounce">
                <Navigation className="w-5 h-5 rotate-45 fill-current" />
              </div>
              <span className="text-[10px] bg-luxury-emerald text-white font-extrabold px-2.5 py-0.5 rounded-full mt-1.5 shadow-premium border border-white/10">
                Detailer Van
              </span>
            </motion.div>

            {/* Destination/Home location */}
            <div className="absolute top-[280px] left-[530px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shadow-premium animate-pulse">
                <MapPin className="w-5.5 h-5.5 text-blue-500 fill-current" />
              </div>
              <span className="text-[10px] bg-blue-600 text-white font-extrabold px-2.5 py-0.5 rounded-full mt-1.5 shadow-premium">
                My Home
              </span>
            </div>

            {/* Bottom floating Map controls */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 border border-zinc-200 rounded-20 p-4 flex justify-between items-center z-10 shadow-sm backdrop-blur-md text-zinc-800">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-luxury-emerald" />
                <div>
                  <span className="text-[10px] text-zinc-400 block font-bold uppercase">Estimated Arrival</span>
                  <span className="text-sm font-extrabold text-zinc-800">ETA {booking.eta} (En Route)</span>
                </div>
              </div>
              <span className="text-[10px] bg-luxury-emerald/10 text-luxury-emerald border border-luxury-emerald/20 font-extrabold uppercase py-1 px-2.5 rounded-full">
                LIVE GPS
              </span>
            </div>

          </div>
        </div>

        {/* Right Side: Tech Profile & Timeline (5 columns) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          
          {/* Tech Card */}
          <div className="bg-white border border-zinc-200/85 rounded-24 p-6 space-y-5 shadow-premium">
            <div className="flex items-center gap-4">
              <img
                src={tech.avatar}
                alt={tech.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-luxury-emerald flex-shrink-0"
              />
              <div className="space-y-0.5">
                <span className="text-[10px] text-luxury-emerald font-bold uppercase tracking-wider">Assigned Detailer</span>
                <h3 className="text-lg font-bold text-zinc-800">{tech.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold">
                  <span className="text-yellow-600 font-bold">★ {tech.rating}</span>
                  <span>•</span>
                  <span>{tech.completedJobs} details done</span>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4 flex justify-between items-center text-xs text-zinc-500">
              <span>Van info:</span>
              <strong className="text-zinc-850 font-mono">{tech.vehicleInfo}</strong>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleCall}
                className="py-3 px-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-bold rounded-20 flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Phone className="w-4 h-4 text-luxury-emerald" />
                <span>Call Detailer</span>
              </button>
              
              <button
                onClick={() => setShowChat(true)}
                className="py-3 px-4 bg-luxury-emerald hover:bg-luxury-emeraldHover text-white text-xs font-bold rounded-20 flex items-center justify-center gap-2 transition-all shadow-premium"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Message</span>
              </button>
            </div>
          </div>

          {/* Detailed timeline indicator */}
          <div className="bg-white border border-zinc-200/85 rounded-24 p-6 space-y-4 shadow-premium flex-grow">
            <h3 className="font-bold text-sm text-zinc-800 border-b border-zinc-100 pb-2">detailing Timeline</h3>
            <div className="relative pl-6 space-y-4 text-xs font-semibold text-zinc-500">
              
              {/* Vertical connector line */}
              <div className="absolute left-2.5 top-2 bottom-2 w-[1px] bg-zinc-200" />

              {booking.timeline.map((t, idx) => (
                <div key={idx} className="relative flex justify-between items-start gap-4">
                  {/* Circle check badge */}
                  <div className={`absolute -left-5 w-3.5 h-3.5 rounded-full border transition-all ${
                    t.active ? 'bg-luxury-emerald border-luxury-emerald' : 'bg-white border-zinc-300'
                  }`} />
                  
                  <div className="space-y-0.5">
                    <span className={`font-bold ${t.active ? 'text-zinc-800' : 'text-zinc-300'}`}>{t.status}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-bold">{t.time}</span>
                </div>
              ))}

            </div>
          </div>

        </div>

      </div>

      {/* Chat messages Drawer bottom sheet */}
      <Drawer
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        title={`Chat with ${tech.name}`}
      >
        <div className="flex flex-col h-[400px]">
          {/* Scrollable messages area */}
          <div className="flex-grow overflow-y-auto space-y-4 pr-1 pb-4 scrollbar-thin scrollbar-thumb-zinc-200">
            {chatHistory.map((chat, idx) => {
              const isTech = chat.sender === "tech";
              return (
                <div key={idx} className={`flex ${isTech ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-20 p-3.5 text-xs md:text-sm ${
                    isTech
                      ? 'bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-tl-sm shadow-sm'
                      : 'bg-luxury-emerald text-white rounded-tr-sm shadow-premium'
                  }`}>
                    <p className="leading-relaxed font-semibold">{chat.msg}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message input form */}
          <form onSubmit={handleSendChat} className="flex gap-2 border-t border-zinc-150 pt-4 mt-2">
            <input
              type="text"
              placeholder="Type message here..."
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              className="flex-grow py-3 px-4 bg-zinc-50 border border-zinc-200 rounded-20 outline-none text-xs focus:border-luxury-emerald text-zinc-850"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-luxury-emerald hover:bg-luxury-emeraldHover text-white font-bold text-xs rounded-20 shadow-premium transition-all"
            >
              Send
            </button>
          </form>
        </div>
      </Drawer>

      {/* Call Feedback Toast */}
      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message={toastMsg}
        type="success"
      />

    </motion.div>
  );
}
