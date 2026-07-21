import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({
  title,
  value,
  growth,
  isCurrency = false,
  icon: Icon,
  iconBg = '#fff7ed',
  iconColor = '#e07b2a',
  subtitle
}) {
  const isPositive = growth >= 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
            style={{ backgroundColor: iconBg, color: iconColor }}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-black text-gray-900 tracking-tight">
          {isCurrency ? `₹${Number(value).toLocaleString('en-IN')}` : value}
        </h3>

        {growth !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
              isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{isPositive ? `+${growth}%` : `${growth}%`}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] text-gray-400 font-medium mt-1">{subtitle}</p>
      )}
    </div>
  );
}
