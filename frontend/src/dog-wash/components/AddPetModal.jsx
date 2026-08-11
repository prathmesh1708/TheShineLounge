import React, { useState, useEffect, useRef } from 'react';
import { savePet } from '../utils/petStorage';

const POPULAR_BREEDS = [
  'Golden Retriever',
  'Labrador Retriever',
  'German Shepherd',
  'Beagle',
  'Pug',
  'Shih Tzu',
  'Poodle',
  'Indie / Mixed Breed',
  'Other'
];

const PET_ICONS = ['🐕', '🐶', '🐕‍🦺', '🐩', '🐾'];

export default function AddPetModal({ isOpen, onClose, initialPet = null, onSaveSuccess }) {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [icon, setIcon] = useState('🐕');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const breedInputRef = useRef(null);

  useEffect(() => {
    if (initialPet) {
      setName(initialPet.name || '');
      const petBreed = initialPet.breed || '';
      setBreed(petBreed);
      const isPreset = POPULAR_BREEDS.slice(0, -1).includes(petBreed);
      setIsOtherSelected(!isPreset && petBreed !== '');
      setWeight(initialPet.weight ? initialPet.weight.replace(/[^0-9]/g, '') : '');
      setAge(initialPet.age || '');
      setIcon(initialPet.icon || '🐕');
      setNotes(initialPet.notes || '');
    } else {
      setName('');
      setBreed('Golden Retriever');
      setIsOtherSelected(false);
      setWeight('25');
      setAge('2 years');
      setIcon('🐕');
      setNotes('');
    }
    setError('');
  }, [initialPet, isOpen]);

  if (!isOpen) return null;

  const handleChipClick = (selectedChip) => {
    if (selectedChip === 'Other') {
      setIsOtherSelected(true);
      if (POPULAR_BREEDS.slice(0, -1).includes(breed)) {
        setBreed('');
      }
      setTimeout(() => breedInputRef.current?.focus(), 50);
    } else {
      setIsOtherSelected(false);
      setBreed(selectedChip);
    }
  };

  const handleBreedInputChange = (e) => {
    const val = e.target.value;
    setBreed(val);
    if (!POPULAR_BREEDS.slice(0, -1).includes(val)) {
      setIsOtherSelected(true);
    } else {
      setIsOtherSelected(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your dog’s name');
      return;
    }
    if (!breed.trim()) {
      setError('Please select or enter your dog’s breed');
      return;
    }

    const petPayload = {
      ...(initialPet?.id ? { id: initialPet.id } : {}),
      name: name.trim(),
      breed: breed.trim(),
      weight: weight ? `${weight.trim()} kg` : '15 kg',
      age: age.trim() || '1 year',
      icon,
      notes: notes.trim()
    };

    const saved = savePet(petPayload);
    if (onSaveSuccess) {
      onSaveSuccess(saved);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#15171D] border border-[#2A2E36] rounded-2xl shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2E36] bg-[#1A1D24]">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{icon}</span>
            <h3 className="text-lg font-bold font-display text-white">
              {initialPet ? 'Edit Dog Details' : 'Add New Dog'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Dog Emoji Latch */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Select Icon
            </label>
            <div className="flex items-center space-x-2">
              {PET_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-11 h-11 text-xl rounded-xl border flex items-center justify-center transition-all ${
                    icon === emoji 
                      ? 'border-[#FF8C1A] bg-[#FF8C1A]/20 scale-105 shadow-md shadow-[#FF8C1A]/20' 
                      : 'border-[#2A2E36] bg-[#1E222B] text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Dog Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Dog Name <span className="text-[#FF8C1A]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Bruno, Max, Bella"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1D2027] border border-[#2A2E36] text-white text-sm focus:outline-none focus:border-[#FF8C1A] transition"
              required
            />
          </div>

          {/* Breed selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Breed <span className="text-[#FF8C1A]">*</span>
            </label>
            <input
              ref={breedInputRef}
              type="text"
              placeholder={isOtherSelected ? "Type your custom breed name..." : "Select chip below or type breed name"}
              value={breed}
              onChange={handleBreedInputChange}
              className={`w-full px-4 py-3 rounded-xl bg-[#1D2027] border text-white text-sm focus:outline-none transition mb-2 ${
                isOtherSelected ? 'border-[#FF8C1A] ring-1 ring-[#FF8C1A]/30' : 'border-[#2A2E36] focus:border-[#FF8C1A]'
              }`}
              required
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_BREEDS.map((b) => {
                const isSelected = b === 'Other' ? isOtherSelected : (breed === b && !isOtherSelected);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleChipClick(b)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                      isSelected
                        ? 'bg-[#FF8C1A] text-black border-[#FF8C1A] font-semibold shadow-md shadow-[#FF8C1A]/20'
                        : 'bg-[#1E222B] text-zinc-300 border-[#2A2E36] hover:border-zinc-500'
                    }`}
                  >
                    {b === 'Other' ? '✨ Other' : b}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weight & Age Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                placeholder="e.g. 25"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1D2027] border border-[#2A2E36] text-white text-sm focus:outline-none focus:border-[#FF8C1A] transition"
                min="1"
                max="100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Age
              </label>
              <input
                type="text"
                placeholder="e.g. 2 years"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1D2027] border border-[#2A2E36] text-white text-sm focus:outline-none focus:border-[#FF8C1A] transition"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Care Notes (Optional)
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Sensitive ears, fears loud air dryer, extra shampoo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1D2027] border border-[#2A2E36] text-white text-sm focus:outline-none focus:border-[#FF8C1A] transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#2A2E36] text-zinc-300 font-semibold text-sm hover:bg-[#1E222B] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-[#FF8C1A] text-black font-bold text-sm hover:bg-[#e07b16] transition shadow-lg shadow-[#FF8C1A]/20"
            >
              {initialPet ? 'Save Changes' : 'Save & Select Dog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
