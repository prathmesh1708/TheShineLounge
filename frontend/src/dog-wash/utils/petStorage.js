/**
 * Pet Storage Utility for Dog Wash Module
 * Handles local persistence of user pets and active pet selection.
 */

const STORAGE_KEY = 'tsl_user_pets';
const ACTIVE_PET_KEY = 'tsl_active_pet_id';

export const DEFAULT_PETS = [
  {
    id: "pet-max",
    name: "Max",
    breed: "Golden Retriever",
    weight: "25 kg",
    age: "2 years",
    icon: "🐕",
    avatar: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=100",
    notes: "Friendly & playful. Loves warm hydrobath."
  },
  {
    id: "pet-leo",
    name: "Leo",
    breed: "Pug",
    weight: "8 kg",
    age: "4 years",
    icon: "🐶",
    avatar: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&q=80&w=100",
    notes: "Sensitive ears, gentle water pressure needed."
  },
  {
    id: "pet-rocky",
    name: "Rocky",
    breed: "German Shepherd",
    weight: "34 kg",
    age: "3 years",
    icon: "🐕‍🦺",
    avatar: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&q=80&w=100",
    notes: "Enjoys warm air blower dry session."
  }
];

export const getUserPets = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading pets from localStorage:', e);
  }
  // Fallback default
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PETS));
  return DEFAULT_PETS;
};

export const getActivePet = () => {
  const pets = getUserPets();
  try {
    const activeId = localStorage.getItem(ACTIVE_PET_KEY);
    if (activeId) {
      const found = pets.find(p => p.id === activeId);
      if (found) return found;
    }
  } catch (e) {
    console.warn('Error reading active pet id:', e);
  }
  return pets[0] || DEFAULT_PETS[0];
};

export const setActivePet = (petOrId) => {
  const pets = getUserPets();
  let targetId = typeof petOrId === 'string' ? petOrId : petOrId?.id;
  const found = pets.find(p => p.id === targetId);
  
  if (found) {
    localStorage.setItem(ACTIVE_PET_KEY, found.id);
    window.dispatchEvent(new CustomEvent('tslActivePetChanged', { detail: found }));
    return found;
  }
  return pets[0] || DEFAULT_PETS[0];
};

export const savePet = (petData) => {
  const pets = getUserPets();
  let updatedPets = [];
  let savedPet = null;

  if (petData.id) {
    // Edit existing pet
    updatedPets = pets.map(p => {
      if (p.id === petData.id) {
        savedPet = { ...p, ...petData };
        return savedPet;
      }
      return p;
    });
  } else {
    // Add new pet
    savedPet = {
      id: `pet-${Date.now()}`,
      name: petData.name?.trim() || 'My Dog',
      breed: petData.breed?.trim() || 'Indie / Mixed',
      weight: petData.weight ? (petData.weight.toString().includes('kg') ? petData.weight : `${petData.weight} kg`) : '15 kg',
      age: petData.age || '1 year',
      icon: petData.icon || '🐕',
      avatar: petData.avatar || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=100',
      notes: petData.notes || ''
    };
    updatedPets = [savedPet, ...pets];
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPets));
  if (savedPet) {
    setActivePet(savedPet);
  }

  window.dispatchEvent(new CustomEvent('tslPetsChanged', { detail: updatedPets }));
  return savedPet;
};

export const deletePet = (petId) => {
  const pets = getUserPets();
  const updatedPets = pets.filter(p => p.id !== petId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPets));

  const activeId = localStorage.getItem(ACTIVE_PET_KEY);
  if (activeId === petId && updatedPets.length > 0) {
    setActivePet(updatedPets[0]);
  }

  window.dispatchEvent(new CustomEvent('tslPetsChanged', { detail: updatedPets }));
  return updatedPets;
};
