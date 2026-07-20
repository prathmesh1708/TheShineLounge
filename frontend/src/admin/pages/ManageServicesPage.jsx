import React, { useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, Trash2, Clock, CheckCircle2, AlertCircle, PlusCircle } from 'lucide-react';
import { useAdmin } from '../common/context/AdminContext';
import AdminModal from '../common/components/AdminModal';

export default function ManageServicesPage() {
  const { services, toggleServiceStatus, updateServicePrice, addServicePlan, deleteServicePlan } = useAdmin();
  
  const [editingService, setEditingService] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  
  const [addingPlanServiceId, setAddingPlanServiceId] = useState(null);
  const [planForm, setPlanForm] = useState({ name: '', price: '', description: '', billing: 'per service' });

  const handleOpenPriceModal = (srv) => {
    setEditingService(srv);
    setNewPrice(srv.price);
  };

  const handleSavePrice = () => {
    if (!newPrice || isNaN(newPrice)) return;
    updateServicePrice(editingService.id, newPrice);
    setEditingService(null);
  };

  const handleSavePlan = () => {
    if (!planForm.name || !planForm.price) return;
    addServicePlan(addingPlanServiceId, {
      name: planForm.name,
      price: Number(planForm.price),
      description: planForm.description,
      billing: planForm.billing
    });
    setAddingPlanServiceId(null);
    setPlanForm({ name: '', price: '', description: '', billing: 'per service' });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Service Catalog & Tier Pricing</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure rates, active availability, duration, and subscription packages across all 6 lounge offerings.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((srv) => (
          <div
            key={srv.id}
            className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
              srv.status === 'active' ? 'border-gray-200' : 'border-gray-200 opacity-60'
            }`}
          >
            {/* Image Header */}
            <div>
              <div className="relative h-44 overflow-hidden">
                <img src={srv.image} alt={srv.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/90 text-gray-900 backdrop-blur-xs">
                  {srv.category}
                </span>

                <button
                  onClick={() => toggleServiceStatus(srv.id)}
                  className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all ${
                    srv.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-white'
                  }`}
                >
                  {srv.status === 'active' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  <span>{srv.status === 'active' ? 'Active' : 'Inactive'}</span>
                </button>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-lg font-black">{srv.name}</h3>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{srv.duration}</span>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div className="p-4 space-y-3">
                <p className="text-xs text-gray-600 line-clamp-2">{srv.description}</p>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Base Price</span>
                    <span className="text-lg font-black text-gray-900">₹{srv.price}</span>
                  </div>

                  <button
                    onClick={() => handleOpenPriceModal(srv)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Price
                  </button>
                </div>

                {/* Sub-services / Pricing Plans List */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Sub-Service Plans ({srv.plans?.length || 0})</span>
                    <button
                      onClick={() => setAddingPlanServiceId(srv.id)}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Add Plan
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                    {srv.plans && srv.plans.map((plan) => (
                      <div key={plan.id} className="p-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                        <div className="overflow-hidden">
                          <p className="font-bold text-gray-900 truncate">{plan.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{plan.description}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-black text-amber-600">₹{plan.price}</span>
                          <button
                            onClick={() => deleteServicePlan(srv.id, plan.id)}
                            className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                            title="Delete Plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Edit Base Price */}
      <AdminModal
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        title={`Edit Price: ${editingService?.name}`}
        subtitle="Update base service charge"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">New Base Price (INR ₹)</label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => setEditingService(null)}
              className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePrice}
              className="px-4 py-2 text-xs font-bold text-white rounded-xl"
              style={{ backgroundColor: '#e07b2a' }}
            >
              Save New Rate
            </button>
          </div>
        </div>
      </AdminModal>

      {/* Modal: Add Sub-service Plan */}
      <AdminModal
        isOpen={!!addingPlanServiceId}
        onClose={() => setAddingPlanServiceId(null)}
        title="Add Sub-Service Tier / Package"
        subtitle="Add a new subscription tier or package option"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Plan Name</label>
            <input
              type="text"
              placeholder="e.g. Monthly VIP Pass"
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Price (₹)</label>
              <input
                type="number"
                placeholder="2499"
                value={planForm.price}
                onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Billing Interval</label>
              <select
                value={planForm.billing}
                onChange={(e) => setPlanForm({ ...planForm, billing: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
              >
                <option value="per service">Per Service</option>
                <option value="per month">Per Month</option>
                <option value="per year">Per Year</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Package Description</label>
            <input
              type="text"
              placeholder="e.g. Includes 4 washes + 1 complimentary polish"
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => setAddingPlanServiceId(null)}
              className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePlan}
              className="px-4 py-2 text-xs font-bold text-white rounded-xl"
              style={{ backgroundColor: '#e07b2a' }}
            >
              Create Package
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
