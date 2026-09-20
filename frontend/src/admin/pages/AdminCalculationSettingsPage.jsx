import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Save,
  RotateCcw,
  Percent,
  Receipt,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  DollarSign,
  PieChart,
  Layers,
  ArrowRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { useAdmin } from '../common/context/AdminContext';
import { defaultCalculationSettings, formatINR } from '../common/utils/calculationUtils';

export default function AdminCalculationSettingsPage() {
  const { calculationSettings, updateCalculationSettings, showToast } = useAdmin();
  const [form, setForm] = useState(calculationSettings || defaultCalculationSettings);

  // Sync form when calculationSettings in context changes
  useEffect(() => {
    if (calculationSettings) {
      setForm(calculationSettings);
    }
  }, [calculationSettings]);

  // Simulator state
  const [simAmount, setSimAmount] = useState(10000);
  const [simDept, setSimDept] = useState('car-wash');

  const handleSave = (e) => {
    e?.preventDefault();
    updateCalculationSettings(form);
  };

  const handleReset = () => {
    if (window.confirm('Reset all financial calculation rules and CA profile presets to factory defaults?')) {
      setForm(defaultCalculationSettings);
      updateCalculationSettings(defaultCalculationSettings);
      showToast('Calculation rules reset to defaults');
    }
  };

  // Live Simulator Computations
  const simRate = Number(form.categoryGstRates?.[simDept] ?? form.defaultGstRate ?? 18);
  const simGross = Math.max(0, Number(simAmount || 0));
  const simTaxable = form.gstPricingMode === 'exclusive' ? simGross : (simRate > 0 ? simGross / (1 + simRate / 100) : simGross);
  const simTax = form.gstPricingMode === 'exclusive' ? (simGross * simRate) / 100 : simGross - simTaxable;
  const simCgst = form.taxType === 'igst' ? 0 : simTax / 2;
  const simSgst = form.taxType === 'igst' ? 0 : simTax / 2;
  const simIgst = form.taxType === 'igst' ? simTax : 0;

  const simOverhead = (simTaxable * Number(form.operatingOverheadRate || 18.5)) / 100;
  const simStaff = (simTaxable * Number(form.staffIncentiveRate || 7.5)) / 100;
  const simGateway = (simGross * Number(form.gatewaySurchargeRate || 1.8)) / 100;
  const simDeprec = (simTaxable * Number(form.depreciationReserveRate || 2.2)) / 100;
  const simTotalDeductions = simOverhead + simStaff + simGateway + simDeprec;
  const simNetProfit = Math.max(0, simTaxable - simTotalDeductions);
  const simMargin = simTaxable > 0 ? ((simNetProfit / simTaxable) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Calculator className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900">Financial Calculation Rules & CA Presets</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Configure GST slabs, tax modes, operational expense ratios, staff performance incentives, and CA audit details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-gray-500" /> Reset Defaults
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold text-white rounded-xl shadow-sm hover:opacity-95 transition-opacity"
            style={{ backgroundColor: '#e07b2a' }}
          >
            <Save className="w-4 h-4" /> Save Calculation Rules
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Core Rules */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: GST & Tax Calculation Configuration */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-500" /> GST Tax Rules & Calculation Mode
              </h2>
              <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2.5 py-1 rounded-lg border border-amber-200">
                GST Compliance
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Default GST Rate */}
              <div>
                <label className="font-bold text-gray-700 block mb-1.5">
                  Standard Default GST Rate (%)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 5, 12, 18].map((rate) => (
                    <button
                      type="button"
                      key={rate}
                      onClick={() => setForm({ ...form, defaultGstRate: rate })}
                      className={`py-2 rounded-xl font-black text-xs border transition-all ${
                        form.defaultGstRate === rate
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing Mode: Inclusive vs Exclusive */}
              <div>
                <label className="font-bold text-gray-700 block mb-1.5">
                  Billing Tax Mode
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, gstPricingMode: 'inclusive' })}
                    className={`py-2 px-2 text-center rounded-xl font-bold text-xs border transition-all ${
                      form.gstPricingMode === 'inclusive'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Tax Inclusive (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, gstPricingMode: 'exclusive' })}
                    className={`py-2 px-2 text-center rounded-xl font-bold text-xs border transition-all ${
                      form.gstPricingMode === 'exclusive'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Tax Exclusive (+GST)
                  </button>
                </div>
              </div>

              {/* Tax Split: Intra-State (CGST+SGST) vs Inter-State (IGST) */}
              <div className="sm:col-span-2">
                <label className="font-bold text-gray-700 block mb-1.5">
                  Tax Jurisdiction Split Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, taxType: 'split' })}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      form.taxType === 'split'
                        ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-extrabold text-gray-900">Intra-State Supply (Maharashtra)</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">CGST 9% + SGST 9% (50:50 equal split)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, taxType: 'igst' })}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      form.taxType === 'igst'
                        ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-extrabold text-gray-900">Inter-State Supply (IGST)</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Integrated GST 18% (single central tax)</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Department Specific GST & SAC Codes */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Department-Specific GST Slabs & Statutory SAC Codes
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'car-wash', name: 'Car Wash', defaultSac: '998714' },
                  { key: 'car-detailing', name: 'Car Detailing', defaultSac: '998714' },
                  { key: 'cafe', name: 'Lounge Café', defaultSac: '996331' },
                  { key: 'drive-through-cafe', name: 'Drive-Thru Café', defaultSac: '996331' },
                  { key: 'dog-wash', name: 'Dog Bath Grooming', defaultSac: '999729' },
                  { key: 'salon', name: "Men's Luxury Salon", defaultSac: '999721' }
                ].map((dept) => (
                  <div key={dept.key} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-gray-900 text-xs">{dept.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 font-bold">GST:</span>
                        <select
                          value={form.categoryGstRates?.[dept.key] ?? 18}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              categoryGstRates: {
                                ...(form.categoryGstRates || {}),
                                [dept.key]: Number(e.target.value)
                              }
                            })
                          }
                          className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-black text-amber-600 focus:outline-none"
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 font-bold">SAC Code:</span>
                      <input
                        type="text"
                        value={form.categorySacCodes?.[dept.key] ?? dept.defaultSac}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            categorySacCodes: {
                              ...(form.categorySacCodes || {}),
                              [dept.key]: e.target.value
                            }
                          })
                        }
                        className="flex-1 px-2.5 py-1 bg-white border border-gray-200 rounded-lg font-mono text-xs font-bold text-gray-800 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Operating Overheads, Staff Incentives & Cost Deductions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" /> Operational Overheads & Cost Deduction Formulae
              </h2>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-1 rounded-lg border border-emerald-200">
                P&L Parameters
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Operating Overhead Ratio (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.operatingOverheadRate}
                  onChange={(e) => setForm({ ...form, operatingOverheadRate: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Allocated to lounge rent, power, water & consumables (% of net turnover).
                </p>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Staff Performance Incentive Pool (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.staffIncentiveRate}
                  onChange={(e) => setForm({ ...form, staffIncentiveRate: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Reserved for staff commission & bonus payouts (% of net turnover).
                </p>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Payment Gateway / POS Surcharge (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.gatewaySurchargeRate}
                  onChange={(e) => setForm({ ...form, gatewaySurchargeRate: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Bank and UPI processing fee deduction (% of gross turnover).
                </p>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Depreciation & Maintenance Reserve (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.depreciationReserveRate}
                  onChange={(e) => setForm({ ...form, depreciationReserveRate: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  High-pressure pumps and equipment wear & tear reserve (% of net turnover).
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Chartered Accountant (CA) & Legal Entity Profile */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" /> Chartered Accountant (CA) Profile & Legal Entity
              </h2>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold px-2.5 py-1 rounded-lg border border-blue-200">
                Auditor Preset
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">CA Auditor Name</label>
                <input
                  type="text"
                  value={form.caName}
                  onChange={(e) => setForm({ ...form, caName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">CA Firm Name</label>
                <input
                  type="text"
                  value={form.caFirmName}
                  onChange={(e) => setForm({ ...form, caFirmName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">CA Membership / Reg No</label>
                <input
                  type="text"
                  value={form.caMembershipNo}
                  onChange={(e) => setForm({ ...form, caMembershipNo: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  CA WhatsApp Phone (for direct report sharing)
                </label>
                <input
                  type="text"
                  value={form.caPhone}
                  onChange={(e) => setForm({ ...form, caPhone: e.target.value })}
                  placeholder="+919820123456"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-emerald-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">CA Audit Email</label>
                <input
                  type="email"
                  value={form.caEmail}
                  onChange={(e) => setForm({ ...form, caEmail: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Fiscal Year</label>
                <input
                  type="text"
                  value={form.fiscalYear}
                  onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Lounge GSTIN</label>
                <input
                  type="text"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold text-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Permanent Account No (PAN)</label>
                <input
                  type="text"
                  value={form.pan}
                  onChange={(e) => setForm({ ...form, pan: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold text-gray-900 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Real-Time Formula Simulator */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white border border-slate-700 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-extrabold tracking-wide">Live Calculation Simulator</h3>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-lg border border-amber-500/30">
                Interactive
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Test how an incoming customer bill will be split into GST, Overheads, Staff Share & Net Margin in real-time.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Simulation Amount (₹)</label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl font-mono font-black text-amber-400 text-base focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Service Department</label>
                <select
                  value={simDept}
                  onChange={(e) => setSimDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl font-bold text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="car-wash">Car Wash (GST {form.categoryGstRates?.['car-wash'] ?? 18}%)</option>
                  <option value="car-detailing">Car Detailing (GST {form.categoryGstRates?.['car-detailing'] ?? 18}%)</option>
                  <option value="cafe">Lounge Café (GST {form.categoryGstRates?.['cafe'] ?? 5}%)</option>
                  <option value="drive-through-cafe">Drive-Thru Café (GST {form.categoryGstRates?.['drive-through-cafe'] ?? 5}%)</option>
                  <option value="dog-wash">Dog Bath (GST {form.categoryGstRates?.['dog-wash'] ?? 18}%)</option>
                  <option value="salon">Men's Salon (GST {form.categoryGstRates?.['salon'] ?? 18}%)</option>
                </select>
              </div>
            </div>

            {/* Calculated Breakdown Card */}
            <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300 pb-1.5 border-b border-slate-700">
                <span>Taxable Base ({form.gstPricingMode}):</span>
                <span className="font-mono font-bold text-white">{formatINR(simTaxable)}</span>
              </div>
              <div className="flex justify-between text-slate-300 pb-1.5 border-b border-slate-700">
                <span>CGST ({(simRate / 2).toFixed(1)}%):</span>
                <span className="font-mono text-amber-400 font-semibold">{formatINR(simCgst)}</span>
              </div>
              <div className="flex justify-between text-slate-300 pb-1.5 border-b border-slate-700">
                <span>SGST ({(simRate / 2).toFixed(1)}%):</span>
                <span className="font-mono text-amber-400 font-semibold">{formatINR(simSgst)}</span>
              </div>
              <div className="flex justify-between text-slate-300 pb-1.5 border-b border-slate-700">
                <span>Total GST Output ({simRate}%):</span>
                <span className="font-mono font-black text-amber-400">{formatINR(simTax)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px] pt-1">
                <span>Overhead Cost ({form.operatingOverheadRate}%):</span>
                <span className="font-mono text-slate-300">-{formatINR(simOverhead)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Staff Incentive Pool ({form.staffIncentiveRate}%):</span>
                <span className="font-mono text-slate-300">-{formatINR(simStaff)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Gateway Fee ({form.gatewaySurchargeRate}%):</span>
                <span className="font-mono text-slate-300">-{formatINR(simGateway)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700 text-sm font-black">
                <span className="text-emerald-400">Net Profit (EBITDA):</span>
                <span className="font-mono text-emerald-400">{formatINR(simNetProfit)} ({simMargin}%)</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-2.5 text-xs font-black text-white rounded-xl shadow-md hover:opacity-95 transition-opacity"
              style={{ backgroundColor: '#e07b2a' }}
            >
              Apply & Save These Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
