import React from 'react';
import { Search, X } from 'lucide-react';

export default function DogWashSearchBar({ value, onChange, placeholder = "Search grooming, nail trims, spa..." }) {
  return (
    <div className="relative w-full text-zinc-800">
      <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-zinc-450">
        <Search className="w-5 h-5" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full py-4 pl-12 pr-12 bg-white border border-zinc-200 hover:border-zinc-300 focus:border-grooming-primary/60 text-zinc-800 placeholder-zinc-400 rounded-24 outline-none transition-all shadow-glass font-medium text-sm"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 pr-4.5 flex items-center text-zinc-405 hover:text-zinc-700"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      )}
    </div>
  );
}
