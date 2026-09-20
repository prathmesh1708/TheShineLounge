// Presentation config for the six service routes: display name, strapline and
// the accent colour the navbar themes itself with.
//
// This file used to also carry a full hardcoded menu and price list per
// service. Those were demo values that shadowed the real catalog, so they have
// been removed -- every price, plan and menu item now comes from the API
// (GET /api/services/:slug). Nothing here describes what is for sale.
export const servicesData = {
  cafe: {
    id: 'cafe',
    name: 'Café',
    tagline: 'Artisan coffees, fresh bakery delights, and custom brunch plates.',
    accentColor: '#8D5B28' // rich warm coffee brown
  },
  'drive-through-cafe': {
    id: 'drive-through-cafe',
    name: 'Drive-Through Café',
    tagline: 'Premium coffee and bites, served at speed for your journey.',
    accentColor: '#C17F19' // rich warm gold
  },
  'car-wash': {
    id: 'car-wash',
    name: 'Car Wash',
    tagline: 'Eco-friendly touchless washing for a flawless shine.',
    accentColor: '#FF6B00' // vibrant orange
  },
  'car-detailing': {
    id: 'car-detailing',
    name: 'Car Detailing',
    tagline: 'Deep interior restoration and professional paint correction.',
    accentColor: '#FF6B00' // vibrant orange
  },
  'dog-wash': {
    id: 'dog-wash',
    name: 'Dog Bath',
    tagline: 'Self-serve and full-care tubs for happy, clean pups.',
    accentColor: '#FF6B00' // vibrant orange
  },
  salon: {
    id: 'salon',
    name: "Men's Salon",
    tagline: 'Expert precision haircuts, hot towels, and grooming rituals.',
    accentColor: '#FF6B00' // vibrant orange
  }
};
