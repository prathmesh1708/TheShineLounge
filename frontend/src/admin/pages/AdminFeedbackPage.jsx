import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  HelpCircle,
  Star,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Trash2,
  User,
  Mail,
  Phone,
  RefreshCw,
  X,
  AlertCircle,
  Sparkles,
  Check
} from 'lucide-react';
import apiClient from '../../common/utils/apiClient';

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    replied: 0,
    resolved: 0,
    avgRating: 5.0
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Reply Modal State
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState('Replied');
  const [sendingReply, setSendingReply] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState({ type: '', text: '' });

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await apiClient.get(`/users/admin/feedback?${params.toString()}`);
      if (res.data && res.data.success) {
        setFeedbacks(res.data.feedbacks || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.warn('Error loading feedbacks:', err.message);
      // Local storage fallback for seamless testing
      const localData = JSON.parse(localStorage.getItem('tsl_user_feedbacks') || '[]');
      setFeedbacks(localData);
      setStats({
        total: localData.length,
        pending: localData.filter(f => !f.status || f.status === 'Pending').length,
        replied: localData.filter(f => f.status === 'Replied').length,
        resolved: localData.filter(f => f.status === 'Resolved').length,
        avgRating: 4.8
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFeedbacks();
  };

  const openReplyModal = (feedback) => {
    setSelectedFeedback(feedback);
    setReplyMessage(feedback.replyMessage || '');
    setReplyStatus(feedback.status === 'Pending' ? 'Replied' : feedback.status);
    setNotificationMsg({ type: '', text: '' });
  };

  const closeReplyModal = () => {
    setSelectedFeedback(null);
    setReplyMessage('');
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      setNotificationMsg({ type: 'error', text: 'Please write a reply message.' });
      return;
    }

    setSendingReply(true);
    setNotificationMsg({ type: '', text: '' });

    try {
      if (selectedFeedback._id) {
        const res = await apiClient.put(`/users/admin/feedback/${selectedFeedback._id}/reply`, {
          replyMessage: replyMessage.trim(),
          status: replyStatus
        });
        if (res.data && res.data.success) {
          setNotificationMsg({ type: 'success', text: 'Reply sent successfully!' });
          setTimeout(() => {
            closeReplyModal();
            fetchFeedbacks();
          }, 1200);
        }
      } else {
        // Local storage update fallback
        const localData = JSON.parse(localStorage.getItem('tsl_user_feedbacks') || '[]');
        const updated = localData.map(item => {
          if (item.id === selectedFeedback.id || item.timestamp === selectedFeedback.timestamp) {
            return {
              ...item,
              replyMessage: replyMessage.trim(),
              status: replyStatus,
              repliedBy: 'Admin Executive',
              repliedAt: new Date().toISOString()
            };
          }
          return item;
        });
        localStorage.setItem('tsl_user_feedbacks', JSON.stringify(updated));
        setNotificationMsg({ type: 'success', text: 'Reply saved successfully!' });
        setTimeout(() => {
          closeReplyModal();
          fetchFeedbacks();
        }, 1200);
      }
    } catch (err) {
      setNotificationMsg({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      if (id.length > 10) {
        await apiClient.patch(`/users/admin/feedback/${id}/status`, { status });
      } else {
        const localData = JSON.parse(localStorage.getItem('tsl_user_feedbacks') || '[]');
        const updated = localData.map(item => item.id === id ? { ...item, status } : item);
        localStorage.setItem('tsl_user_feedbacks', JSON.stringify(updated));
      }
      fetchFeedbacks();
    } catch (err) {
      console.warn('Status update error:', err.message);
    }
  };

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback entry?')) return;
    try {
      if (id.length > 10) {
        await apiClient.delete(`/users/admin/feedback/${id}`);
      } else {
        const localData = JSON.parse(localStorage.getItem('tsl_user_feedbacks') || '[]');
        const updated = localData.filter(item => item.id !== id);
        localStorage.setItem('tsl_user_feedbacks', JSON.stringify(updated));
      }
      fetchFeedbacks();
    } catch (err) {
      alert('Error deleting feedback: ' + err.message);
    }
  };

  const presetResponses = [
    {
      label: '🌟 Appreciation & Thanks',
      text: 'Thank you for your valuable feedback! We appreciate your kind words and are glad to have provided you with a great experience at The Shine Lounge.'
    },
    {
      label: '🔍 Support Under Investigation',
      text: 'Hello! Thank you for reaching out. Our support team is currently investigating your request and will follow up with you shortly.'
    },
    {
      label: '✅ Issue Resolved',
      text: 'Hi! Thank you for bringing this to our attention. We have resolved the issue and implemented measures to prevent future occurrences.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 rounded-3xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-black tracking-wider uppercase border border-amber-500/30 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> Customer Support Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Feedback & Help Support Module
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Review user feedback, answer support tickets, and send direct responses to lounge customers.
          </p>
        </div>

        <button
          onClick={fetchFeedbacks}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95 flex-shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Feedbacks
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Feedbacks */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Feedbacks</span>
            <span className="text-2xl font-black text-gray-900 mt-0.5 block">{stats.total || feedbacks.length}</span>
          </div>
        </div>

        {/* Pending Tickets */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Pending Requests</span>
            <span className="text-2xl font-black text-amber-800 mt-0.5 block">{stats.pending}</span>
          </div>
        </div>

        {/* Replied / Resolved */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Replied & Resolved</span>
            <span className="text-2xl font-black text-emerald-800 mt-0.5 block">{stats.replied + stats.resolved}</span>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Average Rating</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-2xl font-black text-purple-900">{stats.avgRating || '5.0'}</span>
              <span className="text-xs text-amber-500 font-bold">/ 5.0 ⭐</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-grow max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, or message text..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none transition-all"
          />
        </form>

        {/* Category & Status Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 border border-gray-200 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[11px] font-bold text-gray-500 uppercase">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-800 outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="General Feedback">General Feedback</option>
              <option value="Help & Support Request">Help & Support</option>
              <option value="Service Quality / Experience">Service Quality</option>
              <option value="Bug or Technical Issue">Bug Report</option>
              <option value="Feature Suggestion">Feature Suggestion</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 border border-gray-200 rounded-xl">
            <span className="text-[11px] font-bold text-gray-500 uppercase">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-800 outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Replied">Replied</option>
              <option value="Resolved">Resolved</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback Feed List */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-600" /> Customer Submissions ({feedbacks.length})
          </h3>
          <span className="text-[11px] font-semibold text-gray-400">Sorted by recent submission</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 font-bold text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            Loading customer feedback entries...
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold text-xs space-y-2">
            <HelpCircle className="w-8 h-8 text-gray-300 mx-auto" />
            <p>No feedback or support entries match your current search filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {feedbacks.map((fb, idx) => {
              const dateStr = fb.createdAt ? new Date(fb.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (fb.timestamp ? new Date(fb.timestamp).toLocaleDateString() : 'Just Now');
              const isPending = !fb.status || fb.status === 'Pending';
              const isReplied = fb.status === 'Replied';
              const isResolved = fb.status === 'Resolved';

              return (
                <div key={fb._id || fb.id || idx} className="p-5 hover:bg-slate-50/60 transition-colors space-y-3">
                  {/* Top Details Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center flex-shrink-0 border border-amber-200">
                        {(fb.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-gray-900 text-xs">{fb.name || 'Customer'}</h4>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md border border-slate-200">
                            {fb.category || 'General'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                          {fb.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" /> {fb.email}</span>}
                          {fb.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" /> {fb.phone}</span>}
                          <span className="text-gray-300">•</span>
                          <span>{dateStr}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 align-self-start sm:align-self-auto">
                      {/* Rating Display */}
                      <div className="flex items-center bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-xs font-bold text-amber-800">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                        {fb.rating || 5} / 5
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider ${
                        isPending ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                        isReplied ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                        isResolved ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {fb.status || 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Message Body */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs text-slate-800 font-medium leading-relaxed">
                    "{fb.message}"
                  </div>

                  {/* Admin Reply Box (if replied) */}
                  {fb.replyMessage && (
                    <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center justify-between font-bold text-[11px] text-emerald-800 border-b border-emerald-200/60 pb-1 mb-1">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Admin Response ({fb.repliedBy || 'Admin Executive'})
                        </span>
                        {fb.repliedAt && <span className="text-[10px] font-semibold text-emerald-700">{new Date(fb.repliedAt).toLocaleDateString()}</span>}
                      </div>
                      <p className="font-medium">{fb.replyMessage}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openReplyModal(fb)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 text-[11px]"
                      >
                        <Send className="w-3 h-3" /> {fb.replyMessage ? 'Edit Reply' : 'Reply Message'}
                      </button>

                      {!isResolved && (
                        <button
                          onClick={() => handleStatusUpdate(fb._id || fb.id, 'Resolved')}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl transition-all text-[11px] flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Mark Resolved
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteFeedback(fb._id || fb.id)}
                      className="px-2.5 py-1.5 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-all text-[11px] flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                  {selectedFeedback.category || 'Feedback'}
                </span>
                <h3 className="text-base font-extrabold text-gray-900 mt-1">
                  Reply to {selectedFeedback.name || 'Customer'}
                </h3>
                <p className="text-[11px] text-gray-400 font-semibold">{selectedFeedback.email || 'No email provided'}</p>
              </div>
              <button
                onClick={closeReplyModal}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification alert */}
            {notificationMsg.text && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                notificationMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {notificationMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                {notificationMsg.text}
              </div>
            )}

            {/* Original Customer Message Quote */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs text-slate-700 font-medium">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Original Message:</span>
              "{selectedFeedback.message}"
            </div>

            {/* Response Templates */}
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1.5">Quick Reply Templates</span>
              <div className="space-y-1.5">
                {presetResponses.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setReplyMessage(preset.text)}
                    className="w-full text-left p-2 rounded-xl bg-gray-50 hover:bg-amber-50 hover:border-amber-200 border border-gray-200/80 text-[11px] font-bold text-gray-700 transition-all flex justify-between items-center"
                  >
                    <span>{preset.label}</span>
                    <span className="text-[9px] text-amber-600 uppercase font-extrabold">Use Preset</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase block mb-1">Your Admin Reply *</label>
                <textarea
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Write your official response to the customer..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-900 outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium"
                  required
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-600">Update Status:</label>
                  <select
                    value={replyStatus}
                    onChange={(e) => setReplyStatus(e.target.value)}
                    className="bg-gray-100 border border-gray-200 text-xs font-extrabold text-gray-800 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                  >
                    <option value="Replied">Replied</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeReplyModal}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingReply}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    {sendingReply ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send Response
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
