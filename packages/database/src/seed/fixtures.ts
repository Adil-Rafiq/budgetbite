/**
 * Deterministic demo/seed data for `pnpm db:seed`.
 *
 * Pure data — no DB imports — so tests can use these as fixtures without
 * touching a connection. Restaurants sit around the same Lahore point the
 * scraper targets, priced in PKR.
 *
 * Every seeded restaurant slug is prefixed with `seed-` and the demo user has
 * a fixed email; the seed script uses both to wipe and re-create its own rows
 * idempotently without touching scraped or real user data.
 */

export const SEED_SLUG_PREFIX = 'seed-';

/** Same point the scraper uses (apps/scraper/src/config.py). */
export const SEED_LOCATION = {
  latitude: 31.461658,
  longitude: 74.364802,
} as const;

export const SEED_MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', sortOrder: 0 },
  { key: 'lunch', label: 'Lunch', sortOrder: 1 },
  { key: 'dinner', label: 'Dinner', sortOrder: 2 },
] as const;

export const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@budgetbite.dev',
  /** Plain-text on purpose — the seed script hashes it with better-auth's scrypt. */
  password: 'DemoUser123!',
  dietaryPreferences: ['halal'],
  allergens: [] as string[],
} as const;

export const DEMO_PLAN = {
  planType: 'weekly',
  days: 7,
  mealsPerDay: 3,
  optionsPerSlot: 3,
  /** endDate = today - this many days, so the seeded plan is already over. */
  endedDaysAgo: 2,
  /** totalBudget = actual spend padded by this ratio → the demo user "saved". */
  budgetPaddingRatio: 1.08,
} as const;

export interface SeedMenuItemFixture {
  name: string;
  description: string;
  /** PKR */
  price: number;
}

export interface SeedRestaurantFixture {
  /** Must start with SEED_SLUG_PREFIX (idempotent wipe key). */
  slug: string;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  deliveryFee: number;
  minimumOrder: number;
  rating: number;
  ratingCount: number;
  /** Meal-type keys this restaurant plausibly serves; drives the demo plan's option pools. */
  slots: string[];
  items: SeedMenuItemFixture[];
}

export const SEED_RESTAURANTS: SeedRestaurantFixture[] = [
  {
    slug: 'seed-chai-shai-corner',
    name: 'Chai Shai Corner',
    phone: '+92 300 1234501',
    latitude: 31.468224,
    longitude: 74.358911,
    deliveryFee: 60,
    minimumOrder: 250,
    rating: 4.4,
    ratingCount: 812,
    slots: ['breakfast'],
    items: [
      {
        name: 'Halwa Puri Platter',
        description: '2 puris with halwa, chanay and achaar',
        price: 350,
      },
      { name: 'Anda Paratha', description: 'Crispy paratha with two fried eggs', price: 220 },
      {
        name: 'Chicken Cheese Omelette',
        description: 'Three-egg omelette with chicken chunks and cheddar',
        price: 320,
      },
      { name: 'Doodh Patti Chai', description: 'Strong milk tea, full cup', price: 120 },
      {
        name: 'Aloo Paratha with Dahi',
        description: 'Stuffed potato paratha served with yogurt',
        price: 260,
      },
      { name: 'French Toast', description: 'Three slices with honey drizzle', price: 280 },
    ],
  },
  {
    slug: 'seed-green-bowl-kitchen',
    name: 'Green Bowl Kitchen',
    phone: '+92 300 1234502',
    latitude: 31.455102,
    longitude: 74.371933,
    deliveryFee: 100,
    minimumOrder: 400,
    rating: 4.6,
    ratingCount: 289,
    slots: ['breakfast', 'lunch'],
    items: [
      {
        name: 'Peanut Butter Banana Oats',
        description: 'Overnight oats with banana, peanut butter and honey',
        price: 340,
      },
      {
        name: 'Chicken Caesar Salad',
        description: 'Grilled chicken, romaine, parmesan, house dressing',
        price: 620,
      },
      {
        name: 'Fruit Yogurt Parfait',
        description: 'Seasonal fruit with granola and yogurt',
        price: 380,
      },
      {
        name: 'Grilled Chicken Wrap',
        description: 'Whole-wheat wrap with grilled chicken and veggies',
        price: 540,
      },
      {
        name: 'Quinoa Power Bowl',
        description: 'Quinoa, chickpeas, roasted veg, tahini dressing',
        price: 690,
      },
      { name: 'Fresh Orange Juice', description: 'Cold-pressed, no sugar added', price: 250 },
    ],
  },
  {
    slug: 'seed-burger-bhai',
    name: 'Burger Bhai',
    phone: '+92 300 1234503',
    latitude: 31.465871,
    longitude: 74.372414,
    deliveryFee: 80,
    minimumOrder: 350,
    rating: 4.2,
    ratingCount: 1543,
    slots: ['lunch', 'dinner'],
    items: [
      {
        name: 'Zinger Burger',
        description: 'Crispy fried chicken fillet with mayo and lettuce',
        price: 480,
      },
      {
        name: 'Beef Smash Burger',
        description: 'Double smashed patties with cheese and house sauce',
        price: 650,
      },
      {
        name: 'Crispy Chicken Wings (6 pcs)',
        description: 'Fried wings tossed in buffalo sauce',
        price: 450,
      },
      {
        name: 'Loaded Fries',
        description: 'Fries with cheese sauce, jalapeños and chicken bits',
        price: 350,
      },
      {
        name: 'Chicken Shawarma Roll',
        description: 'Grilled chicken strips with garlic sauce in pita',
        price: 300,
      },
      {
        name: 'Grilled Chicken Sandwich',
        description: 'Chargrilled fillet with honey mustard',
        price: 520,
      },
      { name: 'Soft Drink (500ml)', description: 'Chilled bottle', price: 90 },
    ],
  },
  {
    slug: 'seed-karachi-biryani-house',
    name: 'Karachi Biryani House',
    phone: '+92 300 1234504',
    latitude: 31.452958,
    longitude: 74.359204,
    deliveryFee: 50,
    minimumOrder: 300,
    rating: 4.5,
    ratingCount: 2210,
    slots: ['lunch', 'dinner'],
    items: [
      {
        name: 'Chicken Biryani',
        description: 'Karachi-style spicy biryani with aloo, single serving',
        price: 380,
      },
      { name: 'Beef Pulao', description: 'Bannu-style beef pulao with raita', price: 450 },
      { name: 'Mutton Biryani', description: 'Mutton biryani with raita and salad', price: 650 },
      { name: 'Raita', description: 'Mint yogurt side', price: 60 },
      { name: 'Shami Kebab (2 pcs)', description: 'Beef shami kebabs, shallow fried', price: 180 },
      { name: 'Zarda', description: 'Sweet rice with dry fruit', price: 200 },
    ],
  },
  {
    slug: 'seed-desi-dhaba-gulberg',
    name: 'Desi Dhaba Gulberg',
    phone: '+92 300 1234505',
    latitude: 31.470413,
    longitude: 74.368327,
    deliveryFee: 120,
    minimumOrder: 500,
    rating: 4.3,
    ratingCount: 934,
    slots: ['lunch', 'dinner'],
    items: [
      {
        name: 'Chicken Karahi (Half)',
        description: 'Half-kg chicken karahi with fresh tomatoes',
        price: 850,
      },
      { name: 'Daal Makhani', description: 'Slow-cooked black daal with butter', price: 380 },
      {
        name: 'Seekh Kebab (4 pcs)',
        description: 'Charcoal-grilled beef seekh kebabs',
        price: 480,
      },
      { name: 'Butter Naan', description: 'Tandoor naan brushed with butter', price: 70 },
      { name: 'Palak Paneer', description: 'Spinach with cottage cheese cubes', price: 420 },
      { name: 'Chicken Handi (Half)', description: 'Creamy boneless chicken handi', price: 780 },
      { name: 'Roghni Naan', description: 'Sesame-topped soft naan', price: 90 },
    ],
  },
];
