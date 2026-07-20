import React, { useState } from 'react';
import { Plus, Image as ImageIcon, ToggleLeft, ToggleRight, Trash2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { useAdmin } from '../common/context/AdminContext';
import AdminModal from '../common/components/AdminModal';

export default function ManageBannersPage() {
  const { banners, addBanner, toggleBannerStatus, deleteBanner } = useAdmin();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    badge: 'Special Promo',
    link: '/cafe',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80'
  });

  const handleCreateBanner = () => {
    if (!bannerForm.title || !bannerForm.imageUrl) return;
    addBanner(bannerForm);
    setIsModalOpen(false);
    setBannerForm({
      title: '',
      subtitle: '',
      badge: 'Special Promo',
      link: '/cafe',
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Promotional Banner Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage carousel hero banners displayed on the customer mobile app & website.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-95 transition-opacity"
          style={{ backgroundColor: '#e07b2a' }}
        >
          <Plus className="w-4 h-4" /> Add Promotional Banner
        </button>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((ban) => (
          <div
            key={ban.id}
            className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between ${
              ban.status === 'active' ? 'border-gray-200' : 'border-gray-200 opacity-60'
            }`}
          >
            {/* Banner Preview */}
            <div className="relative h-48 overflow-hidden bg-gray-900">
              <img src={ban.imageUrl} alt={ban.title} className="w-full h-full object-cover opacity-85" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/30 to-transparent" />
              
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                {ban.badge}
              </span>

              <button
                onClick={() => toggleBannerStatus(ban.id)}
                className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all ${
                  ban.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-white'
                }`}
              >
                {ban.status === 'active' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                <span>{ban.status === 'active' ? 'Active' : 'Inactive'}</span>
              </button>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-base font-black leading-tight">{ban.title}</h3>
                <p className="text-xs text-gray-200 mt-1 line-clamp-2 font-medium">{ban.subtitle}</p>
              </div>
            </div>

            {/* Footer Links & Actions */}
            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-600 font-semibold truncate max-w-[200px]">
                <LinkIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className="truncate">{ban.link}</span>
              </div>

              <button
                onClick={() => deleteBanner(ban.id)}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                title="Delete Banner"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add New Banner */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Promotional Banner"
        subtitle="Create a marketing hero banner for app homepage"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Banner Title</label>
            <input
              type="text"
              placeholder="e.g. MONSOON CERAMIC SPECIAL"
              value={bannerForm.title}
              onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Subtitle / Marketing Description</label>
            <textarea
              rows="2"
              placeholder="e.g. Get 20% off on all underbody rust coatings this month"
              value={bannerForm.subtitle}
              onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Badge Tag</label>
              <input
                type="text"
                placeholder="e.g. Wash Special"
                value={bannerForm.badge}
                onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Target Route Link</label>
              <select
                value={bannerForm.link}
                onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
              >
                <option value="/car-wash">/car-wash</option>
                <option value="/car-detailing">/car-detailing</option>
                <option value="/dog-wash">/dog-wash</option>
                <option value="/cafe">/cafe</option>
                <option value="/drive-through-cafe">/drive-through-cafe</option>
                <option value="/salon">/salon</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Banner Image URL</label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/..."
              value={bannerForm.imageUrl}
              onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateBanner}
              className="px-4 py-2 text-xs font-bold text-white rounded-xl"
              style={{ backgroundColor: '#e07b2a' }}
            >
              Publish Banner
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
