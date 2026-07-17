import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Heart, MapPin, Award, Save, HeartCrack, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { FormInput, PrimaryButton, Toast } from '../components/dogWashUI';
import { MOCK_PETS } from '../services/dogWashApi';

export default function DogWashProfilePage() {
  const [activeTab, setActiveTab] = useState("pets");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [pets, setPets] = useState(MOCK_PETS);
  const [showAddPet, setShowAddPet] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      petName: "",
      petBreed: "",
      petAge: "",
      petWeight: "",
      fullName: "Ramesh Singh",
      email: "ramesh.singh@outlook.com",
      phone: "+91 98260 12345",
      address: "Scheme No. 54, Vijay Nagar, Indore"
    }
  });

  const handleUpdateProfile = (data) => {
    setToastMsg("Profile details updated successfully!");
    setToastOpen(true);
  };

  const handleAddPet = (data) => {
    if (!data.petName || !data.petBreed) return;

    const newPet = {
      id: `pet-${Date.now()}`,
      name: data.petName,
      breed: data.petBreed,
      age: data.petAge || "1 year",
      weight: data.petWeight || "10 kg",
      avatar: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=100" // puppy placeholder
    };

    setPets(prev => [...prev, newPet]);
    setShowAddPet(false);
    reset({ petName: "", petBreed: "", petAge: "", petWeight: "" });
    setToastMsg(`${data.petName} added to your pet family!`);
    setToastOpen(true);
  };

  const sidebarLinks = [
    { id: "pets", label: "My Pets", icon: <Heart className="w-4 h-4" /> },
    { id: "profile", label: "Owner Profile", icon: <User className="w-4 h-4" /> }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 max-w-4xl mx-auto text-zinc-800"
    >
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-855">My Profile</h1>
        <p className="text-xs md:text-sm text-zinc-500 font-semibold mt-1">Manage pet profiles, saved locations, and personal settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Summary Card */}
        <div className="lg:col-span-4 bg-white border border-zinc-200/80 rounded-24 p-6 space-y-6 shadow-premium flex flex-col justify-between">
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
                alt="Ramesh profile"
                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-grooming-primary shadow-sm"
              />
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-zinc-800">Ramesh Singh</h3>
                <span className="text-[10px] text-zinc-405 block font-bold uppercase tracking-wider">MEMBER SINCE JULY 2024</span>
              </div>
            </div>

            <div className="bg-grooming-primary/10 border border-grooming-primary/20 rounded-20 p-4 flex items-center gap-3 shadow-sm">
              <Award className="w-7 h-7 text-grooming-primary" />
              <div>
                <span className="text-[9px] text-zinc-450 font-bold block uppercase">Loyalty Tier</span>
                <strong className="text-sm font-extrabold text-grooming-primary">Paw Gold Partner</strong>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {sidebarLinks.map((link) => {
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => setActiveTab(link.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-20 text-xs font-bold border transition-all ${
                      isActive
                        ? 'bg-grooming-primary text-white border-grooming-primary shadow-premium'
                        : 'bg-zinc-50 border-zinc-150 text-zinc-650 hover:bg-grooming-cream'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-5 text-center flex justify-around text-zinc-500 font-semibold text-xs">
            <div>
              <span className="text-base font-extrabold text-zinc-800 block">{pets.length}</span>
              <span>Pets</span>
            </div>
            <div className="border-r border-zinc-200 h-8 self-center" />
            <div>
              <span className="text-base font-extrabold text-zinc-800 block">Gold</span>
              <span>Tier</span>
            </div>
          </div>
        </div>

        {/* Right Side: Forms */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-24 p-6 md:p-8 space-y-6 shadow-premium">
          
          {/* Tab 1: Pets list */}
          {activeTab === "pets" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                <h3 className="text-lg font-bold text-zinc-800">My Pet Family</h3>
                <button
                  onClick={() => setShowAddPet(!showAddPet)}
                  className="text-xs font-bold text-grooming-primary hover:text-grooming-hover flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Pet</span>
                </button>
              </div>

              {/* Add Pet Form */}
              {showAddPet && (
                <form onSubmit={handleSubmit(handleAddPet)} className="p-5 border border-dashed border-zinc-200 rounded-20 space-y-4 bg-zinc-50">
                  <h4 className="text-sm font-bold text-zinc-700">Add New Pet</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput label="Pet Name" name="petName" placeholder="e.g. Bella" register={register} />
                    <FormInput label="Pet Breed" name="petBreed" placeholder="e.g. Shih Tzu" register={register} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput label="Pet Age" name="petAge" placeholder="e.g. 2 years" register={register} />
                    <FormInput label="Pet Weight" name="petWeight" placeholder="e.g. 7 kg" register={register} />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowAddPet(false)} className="px-4 py-2 bg-white border border-zinc-200 text-xs font-bold rounded-16">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-grooming-primary text-white text-xs font-bold rounded-16">Save Pet</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pets.map((pet) => (
                  <div key={pet.id} className="p-4 border border-zinc-200 rounded-20 flex items-center gap-4 bg-white shadow-sm hover:border-grooming-primary/20 transition-all">
                    <img src={pet.avatar} alt={pet.name} className="w-14 h-14 rounded-full object-cover border border-zinc-150 flex-shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-base text-zinc-800">{pet.name}</h4>
                      <p className="text-xs text-zinc-500 font-semibold uppercase mt-0.5">{pet.breed}</p>
                      <span className="text-[10px] text-zinc-400 font-bold block mt-1">{pet.age} • {pet.weight}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Profile Info */}
          {activeTab === "profile" && (
            <form onSubmit={handleSubmit(handleUpdateProfile)} className="space-y-5">
              <h3 className="text-lg font-bold border-b border-zinc-100 pb-2 text-zinc-800">
                Owner Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Full Name"
                  name="fullName"
                  register={register}
                  errors={errors}
                  required
                />
                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  register={register}
                  errors={errors}
                  required
                  disabled
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Phone Number"
                  name="phone"
                  register={register}
                  errors={errors}
                  required
                />
                <FormInput
                  label="Grooming Address"
                  name="address"
                  register={register}
                  errors={errors}
                  required
                />
              </div>

              <div className="pt-2">
                <PrimaryButton type="submit" icon={<Save className="w-4.5 h-4.5" />}>
                  Save Owner Profile
                </PrimaryButton>
              </div>
            </form>
          )}

        </div>

      </div>

      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message={toastMsg}
        type="success"
      />

    </motion.div>
  );
}
