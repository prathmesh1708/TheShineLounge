import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { CarWashAdminHubPage } from '../car-wash-admin';
import { CarDetailingAdminHubPage } from '../car-detailing-admin';
import { DogWashAdminHubPage } from '../dog-wash-admin';
import { CafeAdminHubPage } from '../cafe-admin';
import { DriveThroughCafeAdminHubPage } from '../drive-through-cafe-admin';
import { SalonAdminHubPage } from '../salon-admin';

export default function ServiceModulePage() {
  const { serviceKey: paramKey } = useParams();
  const location = useLocation();
  const pathKey = location.pathname.split('/')[2];
  const serviceKey = paramKey || pathKey || 'car-wash';

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
