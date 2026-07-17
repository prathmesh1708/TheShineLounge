export const carwashMockData = {
  vehicle: {
    name: 'Tesla Model 3',
    plate: 'TSL-3000',
    icon: '🚗'
  },
  services: [
    {
      id: 'basic-wash',
      name: 'Basic Eco Wash',
      description: 'Hand wash, basic wheel cleaning, and towel dry.',
      duration: '20 min',
      price: 149,
      image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=400&q=80',
      isPopular: false
    },
    {
      id: 'premium-wash',
      name: 'Premium Hydro Wash',
      description: 'Active foam bath, underbody spray, wax seal, and interior vacuum.',
      duration: '40 min',
      price: 299,
      image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=400&q=80',
      isPopular: true
    },
    {
      id: 'deluxe-detailing',
      name: 'Deluxe Clay & Polish',
      description: 'Decontamination clay bar treatment, hand polish, and leather conditioning.',
      duration: '90 min',
      price: 899,
      image: 'https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&w=400&q=80',
      isPopular: false
    },
    {
      id: 'underbody-wash',
      name: 'Rust Guard Underbody',
      description: 'High-pressure undercarriage wash and rust inhibitor coating.',
      duration: '15 min',
      price: 99,
      image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80',
      isPopular: false
    }
  ],
  slots: [
    { id: 'slot-1', label: 'Today 4:30 PM', date: 'Today', time: '4:30 PM' },
    { id: 'slot-2', label: 'Today 6:00 PM', date: 'Today', time: '6:00 PM' },
    { id: 'slot-3', label: 'Tomorrow 9:00 AM', date: 'Tomorrow', time: '9:00 AM' }
  ]
};
