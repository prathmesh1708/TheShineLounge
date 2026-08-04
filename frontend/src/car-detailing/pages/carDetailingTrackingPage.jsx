import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, MessageSquare, ShieldCheck, ArrowLeft, CheckCircle2, PartyPopper, FileText, Sparkles } from 'lucide-react';

import { getTechnician, getBookingById, updateBookingStatus } from '../services/carDetailingApi';
import { Toast, Drawer } from '../components/carDetailingUI';
import CarDetailingInvoiceModal from '../components/carDetailingInvoiceModal';

export default function CarDetailingTrackingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("id") || "BK-9831";

  const [tech, setTech] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Invoice modal & state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Chat drawer and toast states
  const [showChat, setShowChat] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { sender: "tech", msg: "Hello! I am preparing the detailing van with steam unit & ceramic prep kits. Do you have a water faucet nearby?" },
    { sender: "user", msg: "Yes, we have a water faucet right in our driveway." }
  ]);

  const [toastMsg, setToastMsg] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  const fetchTrackingDetails = () => {
    Promise.all([getTechnician(), getBookingById(bookingId)]).then(([techRes, bookRes]) => {
      setTech(techRes);
      setBooking(bookRes);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchTrackingDetails();

    const handleDataChanged = () => {
      fetchTrackingDetails();
    };

    window.addEventListener('carDetailingDataChanged', handleDataChanged);
    window.addEventListener('storage', handleDataChanged);

    let bc;
    try {
      bc = new BroadcastChannel('tsl_live_sync');
      bc.onmessage = handleDataChanged;
    } catch (e) {}

    const intervalId = setInterval(fetchTrackingDetails, 2000);

    return () => {
      window.removeEventListener('carDetailingDataChanged', handleDataChanged);
      window.removeEventListener('storage', handleDataChanged);
      if (bc) bc.close();
      clearInterval(intervalId);
    };
  }, [bookingId]);

  const handleCall = () => {
    setToastMsg(`Calling technician ${tech.name} at ${tech.phone}...`);
    setToastOpen(true);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;

    setChatHistory(prev => [...prev, { sender: "user", msg: chatMsg }]);
    setChatMsg("");

    setTimeout(() => {
      setChatHistory(prev => [...prev, { sender: "tech", msg: "Awesome, thank you! I'm on my way and will arrive shortly." }]);
    }, 1500);
  };

  const handleSimulateCompletion = async () => {
    await updateBookingStatus(bookingId, "Completed");
    setToastMsg("🎉 Notification: Detailing Service Completed! Your vehicle is showroom ready.");
    setToastOpen(true);
  };

  if (loading) {
    return (
      <div className="h-[400px] w-full bg-zinc-50 border border-zinc-200 rounded-24 animate-pulse flex items-center justify-center">
        <span className="text-zinc-400 font-bold">Loading Detailing GPS Tracking...</span>
      </div>
    );
  }

  const isCompleted = booking?.status === "Completed";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 max-w-4xl mx-auto text-zinc-800"
    >
      {/* Back to Bookings Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/car-detailing/my-bookings')}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-800 transition-colors font-bold"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
          <span>Back to My Bookings</span>
        </button>

        <button
          onClick={() => setShowInvoiceModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 text-xs font-bold rounded-16 shadow-sm transition-all"
        >
          <FileText className="w-4 h-4 text-luxury-emerald" />
          <span>GST Invoice</span>
        </button>
      </div>

      {/* Service Completion Notification Banner */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-emerald-500 text-white rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden"
        >
          <div className="flex items-center gap-4 z-10">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-md">
              <PartyPopper className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-xs bg-white/20 text-white font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                SERVICE COMPLETION NOTIFICATION
              </span>
              <h2 className="text-xl font-black mt-1">Detailing Completed & Verified!</h2>
              <p className="text-xs text-white/90 font-medium">
                Your vehicle has been detailed to showroom perfection with 100% satisfaction guarantee.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowInvoiceModal(true)}
            className="py-3 px-5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-20 text-xs font-extrabold shadow-lg transition-all flex items-center gap-2 z-10 flex-shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span>Download Tax Invoice</span>
          </button>
        </motion.div>
      )}

      {/* Main Content Layout: Detailer Info on Left, Detailing Progress Stepper on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Detailer Info (5 columns) */}
        <div className="md:col-span-5 space-y-6">
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

          {/* Quick Progress Simulation Control */}
          {!isCompleted && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-20 p-3.5 flex justify-between items-center text-xs">
              <span className="text-zinc-600 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-luxury-emerald" />
                <span>Simulate detailing completion:</span>
              </span>
              <button
                onClick={handleSimulateCompletion}
                className="py-1.5 px-3 bg-luxury-emerald text-white font-bold rounded-16 text-xs hover:bg-luxury-emeraldHover transition-all shadow-sm"
              >
                Complete Detailing Job
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Detailing Progress Stepper (7 columns) */}
        <div className="md:col-span-7">
          <div className="bg-white border border-zinc-200/85 rounded-24 p-6 space-y-4 shadow-premium flex-grow">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
              <h3 className="font-bold text-sm text-zinc-800">Detailing Progress Stepper</h3>
              <span className="text-xs font-black text-luxury-emerald bg-luxury-emerald/10 px-2.5 py-1 rounded-full border border-luxury-emerald/20">
                {Math.round(((booking?.stepIndex || 0) / 7) * 100)}% Completed
              </span>
            </div>

            {/* Live Progress Bar */}
            <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-luxury-emerald h-full transition-all duration-500 rounded-full"
                style={{ width: `${Math.round(((booking?.stepIndex || 0) / 7) * 100)}%` }}
              />
            </div>

            <div className="relative pl-6 space-y-4 text-xs font-semibold text-zinc-500 pt-2">
              {/* Vertical connector line */}
              <div className="absolute left-2.5 top-2 bottom-2 w-[1px] bg-zinc-200" />

              {(booking?.timeline || []).map((t, idx) => (
                <div key={idx} className="relative flex justify-between items-start gap-4">
                  {/* Circle check badge */}
                  <div className={`absolute -left-5 w-3.5 h-3.5 rounded-full border transition-all ${
                    t.active ? 'bg-luxury-emerald border-luxury-emerald ring-2 ring-emerald-100' : 'bg-white border-zinc-300'
                  }`} />

                  <div className="space-y-0.5">
                    <span className={`font-bold ${t.active ? 'text-zinc-800 font-extrabold' : 'text-zinc-400'}`}>{t.status}</span>
                  </div>
                  <span className={`text-[10px] font-bold ${t.active ? 'text-luxury-emerald font-extrabold' : 'text-zinc-400'}`}>{t.time}</span>
                </div>
              ))}

            </div>
          </div>

        </div>

      </div>

      {/* Invoice Modal */}
      <CarDetailingInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        booking={booking}
      />

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
