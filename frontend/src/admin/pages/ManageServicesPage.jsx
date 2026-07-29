import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, Trash2, Clock, CheckCircle2, AlertCircle, Search, Layers, Palette, Shield, Sparkles, Image, HelpCircle, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import AdminModal from '../common/components/AdminModal';
import serviceApi from '../../common/services/serviceApi';

const CATEGORIES = ['Automotive', 'Pet Care', 'Hospitality', 'Personal Care', 'General Services'];

const defaultTheme = {
  primaryColor: '#1e4a7e',
  secondaryColor: '#e07b2a',
  textColor: '#1f2937',
  gradient: 'from-blue-900 via-blue-800 to-indigo-900',
  buttonColor: '#e07b2a',
  cardColor: '#ffffff',
  iconColor: '#3b82f6',
  background: '#f8fafc',
  hoverColor: '#c9681f'
};

const emptyServiceForm = {
  serviceName: '',
  slug: '',
  shortDescription: '',
  description: '',
  category: 'Automotive',
  icon: 'Car',
  bannerImage: '',
  thumbnail: '',
  coverImage: '',
  mobileBanner: '',
  gallery: [],
  theme: { ...defaultTheme },
  displayOrder: 0,
  isActive: true,
  showOnHome: true,
  showInNavbar: true,
  allowBooking: true,
  allowMembership: true,
  allowOnlinePayment: true,
  allowPartialPayment: false,
  allowWalkIn: true,
  allowVehicleSelection: false,
  allowStaffSelection: true,
  allowDateSelection: true,
  allowTimeSlot: true,
  allowReviews: true,
  allowRatings: true,
  allowOffers: true,
  allowCoupons: true,
  allowLoyaltyPoints: true,
  allowInvoice: true,
  branchSupport: true,
  gstPercentage: 18,
  serviceDuration: '30 mins',
  cancellationPolicy: 'Free cancellation up to 2 hours before appointment.',
  termsConditions: 'Standard lounge terms and conditions apply.',
  pricing: [],
  memberships: [],
  plans: [],
  features: [],
  faqs: [],
  seoTitle: '',
  seoDescription: ''
};

export default function ManageServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'theme', 'flags', 'pricing', 'memberships', 'plans', 'features', 'seo'
  const [form, setForm] = useState({ ...emptyServiceForm });
  const [editingId, setEditingId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Fetch Services
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { search, category: categoryFilter, status: statusFilter.toLowerCase() };
      const data = await serviceApi.getServices(params);
      if (data.success) {
        setServices(data.services);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Handle Form Open (New)
  const openCreateModal = () => {
    setForm({ ...emptyServiceForm, theme: { ...defaultTheme } });
    setEditingId(null);
    setActiveTab('basic');
    setModalError('');
    setIsModalOpen(true);
  };

  // Handle Form Open (Edit)
  const openEditModal = (service) => {
    setForm({
      ...service,
      theme: service.theme ? { ...defaultTheme, ...service.theme } : { ...defaultTheme }
    });
    setEditingId(service._id);
    setActiveTab('basic');
    setModalError('');
    setIsModalOpen(true);
  };

  // Auto-generate slug from name
  const handleNameChange = (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setForm(prev => ({
      ...prev,
      serviceName: name,
      slug: editingId ? prev.slug : slug
    }));
  };

  // Save Service
  const handleSaveService = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    try {
      if (editingId) {
        await serviceApi.updateService(editingId, form);
      } else {
        await serviceApi.createService(form);
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save service');
    } finally {
      setModalLoading(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (id) => {
    try {
      await serviceApi.toggleServiceStatus(id);
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  // Delete Service
  const handleDeleteService = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}"?`)) return;
    try {
      await serviceApi.deleteService(id);
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete service');
    }
  };

  // Sub-item Helper Adders
  const addPricingItem = () => {
    setForm(prev => ({
      ...prev,
      pricing: [...prev.pricing, { title: 'New Option', price: 299, gst: true, description: '' }]
    }));
  };

  const removePricingItem = (index) => {
    setForm(prev => ({
      ...prev,
      pricing: prev.pricing.filter((_, i) => i !== index)
    }));
  };

  const addMembershipItem = () => {
    setForm(prev => ({
      ...prev,
      memberships: [...prev.memberships, { name: 'Monthly VIP', price: 1499, duration: 30, benefits: ['Unlimited Access'], isPopular: false, badge: 'Popular' }]
    }));
  };

  const removeMembershipItem = (index) => {
    setForm(prev => ({
      ...prev,
      memberships: prev.memberships.filter((_, i) => i !== index)
    }));
  };

  const addPlanItem = () => {
    setForm(prev => ({
      ...prev,
      plans: [...prev.plans, { name: 'Deluxe Package', price: 999, duration: '45 mins', description: '', features: [] }]
    }));
  };

  const removePlanItem = (index) => {
    setForm(prev => ({
      ...prev,
      plans: prev.plans.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Dynamic Service Catalog & Engine</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage services, dynamic color themes, pricing tiers, memberships, plans, and feature flags.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-95 transition-opacity"
          style={{ backgroundColor: '#e07b2a' }}
        >
          <Plus className="w-4 h-4" /> Add New Dynamic Service
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, description, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400 font-semibold flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Loading Services Catalog...
          </div>
        ) : services.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400 font-semibold">
            No services found. Click "Add New Dynamic Service" to create one.
          </div>
        ) : (
          services.map((srv) => (
            <div
              key={srv._id}
              className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                srv.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div>
                {/* Banner & Image Header */}
                <div className="relative h-44 overflow-hidden bg-gray-900">
                  <img
                    src={srv.bannerImage || srv.thumbnail || 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80'}
                    alt={srv.serviceName}
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent" />

                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/90 text-gray-900 backdrop-blur-xs">
                    {srv.category}
                  </span>

                  {/* Dynamic Color Theme Pill Badge */}
                  <div
                    className="absolute top-3 right-14 px-2 py-0.5 rounded-full text-[9px] font-black text-white flex items-center gap-1 shadow-sm"
                    style={{ backgroundColor: srv.theme?.primaryColor || '#1e4a7e' }}
                  >
                    Theme
                  </div>

                  <button
                    onClick={() => handleToggleStatus(srv._id)}
                    className={`absolute top-3 right-3 p-1.5 rounded-full text-white shadow-sm transition-all ${
                      srv.isActive ? 'bg-emerald-500' : 'bg-gray-700'
                    }`}
                    title={srv.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {srv.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-lg font-black leading-tight">{srv.serviceName}</h3>
                    <p className="text-[10px] text-amber-300 font-bold truncate">slug: /{srv.slug}</p>
                  </div>
                </div>

                {/* Service Details Body */}
                <div className="p-4 space-y-3">
                  <p className="text-xs text-gray-600 line-clamp-2">{srv.shortDescription}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Starting Rate</span>
                      <span className="text-base font-black text-gray-900">
                        ₹{srv.pricing?.[0]?.price || srv.plans?.[0]?.price || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        {srv.pricing?.length || 0} Pricing • {srv.memberships?.length || 0} Memberships
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => openEditModal(srv)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Manage & Edit
                </button>

                <button
                  onClick={() => handleDeleteService(srv._id, srv.serviceName)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove Service"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── CREATE / EDIT SERVICE MULTI-TAB MODAL ───────────────────────── */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? `Edit Service: ${form.serviceName}` : 'Create Dynamic Service'}
        subtitle="Full configuration for pricing, memberships, theme colors, and features"
      >
        <form onSubmit={handleSaveService} className="space-y-4 text-xs">
          {modalError && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
              <AlertCircle className="w-3.5 h-3.5" /> <span>{modalError}</span>
            </div>
          )}

          {/* Modal Navigation Tabs */}
          <div className="flex overflow-x-auto gap-1 border-b border-gray-200 pb-2 custom-scrollbar">
            {[
              { id: 'basic', label: 'Basic Info', icon: Layers },
              { id: 'theme', label: 'Theme & Media', icon: Palette },
              { id: 'flags', label: 'Config Flags', icon: Shield },
              { id: 'pricing', label: `Pricing (${form.pricing.length})`, icon: Sparkles },
              { id: 'memberships', label: `Memberships (${form.memberships.length})`, icon: CheckCircle2 },
              { id: 'plans', label: `Plans (${form.plans.length})`, icon: Layers },
              { id: 'seo', label: 'SEO & Policies', icon: HelpCircle }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-[11px] transition-colors ${
                    activeTab === tab.id ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Service Name *</label>
                  <input
                    type="text"
                    required
                    value={form.serviceName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Tunnel Car Wash"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="e.g. car-wash"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Service Duration</label>
                  <input
                    type="text"
                    value={form.serviceDuration}
                    onChange={(e) => setForm({ ...form, serviceDuration: e.target.value })}
                    placeholder="e.g. 30 mins"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={form.gstPercentage}
                    onChange={(e) => setForm({ ...form, gstPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Short Summary *</label>
                <input
                  type="text"
                  required
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  placeholder="One sentence overview for home cards..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Full Description *</label>
                <textarea
                  rows="3"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed service overview..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                />
              </div>
            </div>
          )}

          {/* TAB 2: THEME & MEDIA */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Banner Image URL</label>
                  <input
                    type="text"
                    value={form.bannerImage}
                    onChange={(e) => setForm({ ...form, bannerImage: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Thumbnail URL</label>
                  <input
                    type="text"
                    value={form.thumbnail}
                    onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Color Theme Customizer */}
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <h4 className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-amber-500" /> Dynamic Color Theme Customizer
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1">Primary Color</label>
                    <input
                      type="color"
                      value={form.theme?.primaryColor || '#1e4a7e'}
                      onChange={(e) => setForm({ ...form, theme: { ...form.theme, primaryColor: e.target.value } })}
                      className="w-full h-8 rounded-lg cursor-pointer border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1">Secondary Accent</label>
                    <input
                      type="color"
                      value={form.theme?.secondaryColor || '#e07b2a'}
                      onChange={(e) => setForm({ ...form, theme: { ...form.theme, secondaryColor: e.target.value } })}
                      className="w-full h-8 rounded-lg cursor-pointer border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1">Button Color</label>
                    <input
                      type="color"
                      value={form.theme?.buttonColor || '#e07b2a'}
                      onChange={(e) => setForm({ ...form, theme: { ...form.theme, buttonColor: e.target.value } })}
                      className="w-full h-8 rounded-lg cursor-pointer border border-gray-300"
                    />
                  </div>
                </div>

                {/* Live Preview Pill */}
                <div
                  className="p-3 rounded-xl text-white font-bold flex items-center justify-between shadow-md"
                  style={{ backgroundColor: form.theme?.primaryColor || '#1e4a7e' }}
                >
                  <span>Live Theme Card Preview</span>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg text-xs text-white font-black"
                    style={{ backgroundColor: form.theme?.buttonColor || '#e07b2a' }}
                  >
                    Action Button
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONFIG FLAGS */}
          {activeTab === 'flags' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
              {[
                { key: 'showOnHome', label: 'Show on Homepage' },
                { key: 'showInNavbar', label: 'Show in Navbar' },
                { key: 'allowBooking', label: 'Allow Booking' },
                { key: 'allowMembership', label: 'Allow Memberships' },
                { key: 'allowOnlinePayment', label: 'Allow Online Payment' },
                { key: 'allowWalkIn', label: 'Allow Walk-In' },
                { key: 'allowStaffSelection', label: 'Allow Staff Selection' },
                { key: 'allowTimeSlot', label: 'Allow Time Slot Selection' },
                { key: 'allowCoupons', label: 'Allow Discount Coupons' },
                { key: 'allowInvoice', label: 'Generate GST Invoice' }
              ].map(flag => (
                <label key={flag.key} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={!!form[flag.key]}
                    onChange={(e) => setForm({ ...form, [flag.key]: e.target.checked })}
                    className="w-4 h-4 rounded accent-amber-500"
                  />
                  <span className="text-[11px] font-bold text-gray-800">{flag.label}</span>
                </label>
              ))}
            </div>
          )}

          {/* TAB 4: PRICING */}
          {activeTab === 'pricing' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-700">Dynamic Pricing Items</span>
                <button
                  type="button"
                  onClick={addPricingItem}
                  className="px-3 py-1 bg-amber-500 text-white rounded-lg font-bold text-[11px]"
                >
                  + Add Price Option
                </button>
              </div>

              {form.pricing.map((p, idx) => (
                <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Title (e.g. Single Wash)"
                    value={p.title}
                    onChange={(e) => {
                      const updated = [...form.pricing];
                      updated[idx].title = e.target.value;
                      setForm({ ...form, pricing: updated });
                    }}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-bold"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={p.price}
                    onChange={(e) => {
                      const updated = [...form.pricing];
                      updated[idx].price = Number(e.target.value);
                      setForm({ ...form, pricing: updated });
                    }}
                    className="w-24 px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => removePricingItem(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: MEMBERSHIPS */}
          {activeTab === 'memberships' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-700">Dynamic Service Memberships</span>
                <button
                  type="button"
                  onClick={addMembershipItem}
                  className="px-3 py-1 bg-amber-500 text-white rounded-lg font-bold text-[11px]"
                >
                  + Add Membership Tier
                </button>
              </div>

              {form.memberships.map((m, idx) => (
                <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Membership Name"
                      value={m.name}
                      onChange={(e) => {
                        const updated = [...form.memberships];
                        updated[idx].name = e.target.value;
                        setForm({ ...form, memberships: updated });
                      }}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-bold"
                    />
                    <input
                      type="number"
                      placeholder="Price (₹)"
                      value={m.price}
                      onChange={(e) => {
                        const updated = [...form.memberships];
                        updated[idx].price = Number(e.target.value);
                        setForm({ ...form, memberships: updated });
                      }}
                      className="w-24 px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => removeMembershipItem(idx)}
                      className="text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: PLANS */}
          {activeTab === 'plans' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-700">Sub-Service Packages / Plans</span>
                <button
                  type="button"
                  onClick={addPlanItem}
                  className="px-3 py-1 bg-amber-500 text-white rounded-lg font-bold text-[11px]"
                >
                  + Add Package Plan
                </button>
              </div>

              {form.plans.map((pl, idx) => (
                <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Plan Name (e.g. Ceramic Package)"
                    value={pl.name}
                    onChange={(e) => {
                      const updated = [...form.plans];
                      updated[idx].name = e.target.value;
                      setForm({ ...form, plans: updated });
                    }}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-bold"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={pl.price}
                    onChange={(e) => {
                      const updated = [...form.plans];
                      updated[idx].price = Number(e.target.value);
                      setForm({ ...form, plans: updated });
                    }}
                    className="w-24 px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => removePlanItem(idx)}
                    className="text-red-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 7: SEO */}
          {activeTab === 'seo' && (
            <div className="space-y-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">SEO Meta Title</label>
                <input
                  type="text"
                  value={form.seoTitle}
                  onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                  placeholder="e.g. Express Tunnel Car Wash in Thane | The Shine Lounge"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">SEO Meta Description</label>
                <textarea
                  rows="2"
                  value={form.seoDescription}
                  onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                  placeholder="Meta description for search engines..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-5 py-2 font-extrabold text-white rounded-xl disabled:opacity-60"
              style={{ backgroundColor: '#e07b2a' }}
            >
              {modalLoading ? 'Saving Service...' : (editingId ? 'Update Service' : 'Publish Service')}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
