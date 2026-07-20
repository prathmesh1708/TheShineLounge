import React, { useState } from 'react';
import { Plus, Package, AlertTriangle, ArrowDownRight, ArrowUpRight, ShoppingCart, RefreshCw } from 'lucide-react';
import { useAdmin } from '../common/context/AdminContext';
import DataTable from '../common/components/DataTable';
import AdminModal from '../common/components/AdminModal';

export default function InventoryManagementPage() {
  const { inventory, addInventoryItem, updateStock } = useAdmin();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItemForStock, setSelectedItemForStock] = useState(null);
  const [stockChangeQty, setStockChangeQty] = useState(5);

  const [form, setForm] = useState({
    name: '',
    department: 'Car Wash',
    category: 'Chemicals',
    supplier: '3M Car Care',
    purchasePrice: 1200,
    sellingPrice: 0,
    currentStock: 10,
    minStock: 5,
    unit: 'Units'
  });

  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!form.name) return;
    addInventoryItem(form);
    setIsAddModalOpen(false);
    setForm({
      name: '',
      department: 'Car Wash',
      category: 'Chemicals',
      supplier: '3M Car Care',
      purchasePrice: 1200,
      sellingPrice: 0,
      currentStock: 10,
      minStock: 5,
      unit: 'Units'
    });
  };

  const columns = [
    {
      header: 'SKU / Product Name',
      accessorKey: 'name',
      cell: (row) => (
        <div>
          <p className="font-bold text-gray-900">{row.name}</p>
          <p className="text-[10px] text-gray-400 font-medium">{row.id} · {row.supplier}</p>
        </div>
      )
    },
    {
      header: 'Department',
      accessorKey: 'department',
      cell: (row) => (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-100">
          {row.department}
        </span>
      )
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: (row) => <span className="font-semibold text-gray-700">{row.category}</span>
    },
    {
      header: 'Purchase Price',
      accessorKey: 'purchasePrice',
      cell: (row) => <span className="font-bold text-gray-900">₹{row.purchasePrice}</span>
    },
    {
      header: 'Current Stock Level',
      accessorKey: 'currentStock',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className={`font-black text-sm ${row.currentStock <= row.minStock ? 'text-rose-600' : 'text-gray-900'}`}>
            {row.currentStock} {row.unit}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">(Min: {row.minStock})</span>
        </div>
      )
    },
    {
      header: 'Status Alert',
      accessorKey: 'status',
      cell: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
          row.status === 'Low Stock' ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Stock Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSelectedItemForStock(row);
              setStockChangeQty(5);
            }}
            className="px-2.5 py-1 text-[11px] font-bold text-white rounded-lg shadow-2xs"
            style={{ backgroundColor: '#e07b2a' }}
          >
            Adjust Stock
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Inventory & Stock Control</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track chemicals, shampoo cans, coffee beans, pet supplies, and salon tools across departments.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-95 transition-opacity"
          style={{ backgroundColor: '#e07b2a' }}
        >
          <Plus className="w-4 h-4" /> Add Inventory Product
        </button>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={inventory}
        searchPlaceholder="Search inventory by product name, supplier, category..."
        searchKeys={['name', 'supplier', 'category', 'id']}
        filterKey="department"
        filterOptions={['All', 'Car Wash', 'Car Detailing', 'Café', 'Dog Wash', 'Men\'s Salon']}
      />

      {/* Modal: Adjust Stock */}
      <AdminModal
        isOpen={!!selectedItemForStock}
        onClose={() => setSelectedItemForStock(null)}
        title={`Adjust Stock: ${selectedItemForStock?.name}`}
        subtitle={`Current Stock: ${selectedItemForStock?.currentStock} ${selectedItemForStock?.unit}`}
      >
        {selectedItemForStock && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Adjustment Quantity</label>
              <input
                type="number"
                value={stockChangeQty}
                onChange={(e) => setStockChangeQty(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  updateStock(selectedItemForStock.id, -Math.abs(stockChangeQty));
                  setSelectedItemForStock(null);
                }}
                className="px-4 py-2 font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100"
              >
                - Stock Out (Usage / Wastage)
              </button>
              <button
                onClick={() => {
                  updateStock(selectedItemForStock.id, Math.abs(stockChangeQty));
                  setSelectedItemForStock(null);
                }}
                className="px-4 py-2 font-bold text-white rounded-xl"
                style={{ backgroundColor: '#e07b2a' }}
              >
                + Stock In (Purchase Recd)
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Modal: Add Inventory Item */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Product to Inventory"
        subtitle="Catalog raw materials and retail products"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Product Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Microfiber Towels 800GSM"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="Car Wash">Car Wash</option>
                <option value="Car Detailing">Car Detailing</option>
                <option value="Café">Café</option>
                <option value="Dog Wash">Dog Wash</option>
                <option value="Men's Salon">Men's Salon</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Supplier Name</label>
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Purchase Price (₹)</label>
              <input
                type="number"
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Opening Stock</label>
              <input
                type="number"
                value={form.currentStock}
                onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Min Alert Qty</label>
              <input
                type="number"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white rounded-xl"
              style={{ backgroundColor: '#e07b2a' }}
            >
              Add Product
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
