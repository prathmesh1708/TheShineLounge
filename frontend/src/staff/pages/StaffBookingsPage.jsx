import React, { useState } from 'react';
import { useStaff } from '../common/context/StaffContext';
import { CarWashStaffJobsPage } from '../car-wash-staff';
import { CarDetailingStaffJobsPage } from '../car-detailing-staff';
import { DogWashStaffJobsPage } from '../dog-wash-staff';
import { CafeStaffOrdersPage } from '../cafe-staff';
import { DriveThroughStaffOrdersPage } from '../drive-through-cafe-staff';
import { SalonStaffAppointmentsPage } from '../salon-staff';
import { Car, CarFront, Dog, Coffee, CupSoda, Scissors } from 'lucide-react';

export default function StaffBookingsPage() {
  const { currentStaff } = useStaff();
  const [selectedService, setSelectedService] = useState(currentStaff?.serviceKey || 'car-wash');

  const isGlobalRole = currentStaff?.serviceKey === 'global' || currentStaff?.role === 'Super Admin' || currentStaff?.role === 'Branch Manager' || currentStaff?.role === 'Cashier';

  const activeKey = isGlobalRole ? selectedService : (currentStaff?.serviceKey || 'car-wash');

  const services = [
    { key: 'car-wash', label: 'Car Wash', icon: Car },
    { key: 'car-detailing', label: 'Detailing', icon: CarFront },
    { key: 'dog-wash', label: 'Dog Spa', icon: Dog },
    { key: 'cafe', label: 'Café', icon: Coffee },
    { key: 'drive-through-cafe', label: 'Drive-Thru', icon: CupSoda },
    { key: 'salon', label: 'Salon', icon: Scissors }
  ];

  return (
    <div className="space-y-4">
      {/* Global Manager Service Switcher */}
      {isGlobalRole && (
        <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto scrollbar-none">
          {services.map((srv) => {
            const Icon = srv.icon;
            const isActive = activeKey === srv.key;

            return (
              <button
                key={srv.key}
                onClick={() => setSelectedService(srv.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{srv.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Render Specific Service Module */}
      {activeKey === 'car-wash' && <CarWashStaffJobsPage />}
      {activeKey === 'car-detailing' && <CarDetailingStaffJobsPage />}
      {activeKey === 'dog-wash' && <DogWashStaffJobsPage />}
      {activeKey === 'cafe' && <CafeStaffOrdersPage />}
      {activeKey === 'drive-through-cafe' && <DriveThroughStaffOrdersPage />}
      {activeKey === 'salon' && <SalonStaffAppointmentsPage />}
    </div>
  );
}
