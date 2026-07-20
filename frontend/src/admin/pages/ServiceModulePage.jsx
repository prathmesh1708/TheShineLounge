import React from 'react';
import { useParams } from 'react-router-dom';
import { CarWashAdminHubPage } from '../car-wash-admin';
import { CarDetailingAdminHubPage } from '../car-detailing-admin';
import { DogWashAdminHubPage } from '../dog-wash-admin';
import { CafeAdminHubPage } from '../cafe-admin';
import { DriveThroughCafeAdminHubPage } from '../drive-through-cafe-admin';
import { SalonAdminHubPage } from '../salon-admin';

export default function ServiceModulePage() {
  const { serviceKey = 'car-wash' } = useParams();

  switch (serviceKey) {
    case 'car-wash':
      return <CarWashAdminHubPage />;
    case 'car-detailing':
      return <CarDetailingAdminHubPage />;
    case 'dog-wash':
      return <DogWashAdminHubPage />;
    case 'cafe':
      return <CafeAdminHubPage />;
    case 'drive-through-cafe':
      return <DriveThroughCafeAdminHubPage />;
    case 'salon':
      return <SalonAdminHubPage />;
    default:
      return <CarWashAdminHubPage />;
  }
}
