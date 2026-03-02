export const currentUser = {
  id: "1",
  firstName: "Ahmed",
  lastName: "Khan",
  email: "ahmed.khan@example.com",
  location: { lat: 24.8607, lng: 67.0011 },
  avatarFallback: "AK",
}

export type MealOption = {
  id: string
  name: string
  restaurant: string
  price: number
  deliveryFee: number
  rating: number
  image?: string
}

export type MealSlot = {
  id: string
  type: "breakfast" | "lunch" | "dinner"
  time: string
  chosen?: MealOption
  options: MealOption[]
}

export type Plan = {
  id: string
  type: "weekly" | "monthly"
  totalBudget: number
  spent: number
  startDate: string
  endDate: string
  mealsPerDay: number
  mealTypes: string[]
  status: "active" | "completed" | "cancelled"
}

export type ActivityItem = {
  id: string
  date: string
  mealType: string
  restaurant: string
  mealName: string
  amount: number
}

export const activePlan: Plan = {
  id: "1",
  type: "monthly",
  totalBudget: 45000,
  spent: 18750,
  startDate: "2026-02-01",
  endDate: "2026-02-28",
  mealsPerDay: 3,
  mealTypes: ["breakfast", "lunch", "dinner"],
  status: "active",
}

export const plans: Plan[] = [
  activePlan,
  {
    id: "2",
    type: "monthly",
    totalBudget: 40000,
    spent: 38200,
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    mealsPerDay: 3,
    mealTypes: ["breakfast", "lunch", "dinner"],
    status: "completed",
  },
  {
    id: "3",
    type: "weekly",
    totalBudget: 12000,
    spent: 5400,
    startDate: "2025-12-15",
    endDate: "2025-12-21",
    mealsPerDay: 2,
    mealTypes: ["lunch", "dinner"],
    status: "cancelled",
  },
  {
    id: "4",
    type: "monthly",
    totalBudget: 35000,
    spent: 35000,
    startDate: "2025-12-01",
    endDate: "2025-12-31",
    mealsPerDay: 3,
    mealTypes: ["breakfast", "lunch", "dinner"],
    status: "completed",
  },
]

export const todayMealSlots: MealSlot[] = [
  {
    id: "slot-1",
    type: "breakfast",
    time: "8:00 AM",
    options: [
      { id: "b1", name: "Halwa Puri", restaurant: "Tooso Restaurant", price: 350, deliveryFee: 50, rating: 4.5 },
      { id: "b2", name: "Nihari with Naan", restaurant: "Sabri Nihari", price: 450, deliveryFee: 80, rating: 4.8 },
      { id: "b3", name: "Paratha Roll", restaurant: "Roll Junction", price: 280, deliveryFee: 40, rating: 4.2 },
    ],
  },
  {
    id: "slot-2",
    type: "lunch",
    time: "1:00 PM",
    chosen: {
      id: "l2",
      name: "Chicken Biryani",
      restaurant: "Student Biryani",
      price: 550,
      deliveryFee: 60,
      rating: 4.6,
    },
    options: [
      { id: "l1", name: "Daal Chawal", restaurant: "Karachi Darbar", price: 320, deliveryFee: 50, rating: 4.3 },
      { id: "l2", name: "Chicken Biryani", restaurant: "Student Biryani", price: 550, deliveryFee: 60, rating: 4.6 },
      { id: "l3", name: "Chicken Karahi", restaurant: "BBQ Tonight", price: 750, deliveryFee: 100, rating: 4.7 },
    ],
  },
  {
    id: "slot-3",
    type: "dinner",
    time: "8:00 PM",
    options: [
      { id: "d1", name: "Seekh Kebab Platter", restaurant: "Burns Garden", price: 650, deliveryFee: 70, rating: 4.4 },
      { id: "d2", name: "Mutton Karahi", restaurant: "Zameer Ansari", price: 900, deliveryFee: 90, rating: 4.9 },
      { id: "d3", name: "Chapli Kebab", restaurant: "Charsi Tikka", price: 500, deliveryFee: 60, rating: 4.5 },
    ],
  },
]

export const recentActivity: ActivityItem[] = [
  { id: "a1", date: "2026-02-27", mealType: "Lunch", restaurant: "Student Biryani", mealName: "Chicken Biryani", amount: 610 },
  { id: "a2", date: "2026-02-26", mealType: "Dinner", restaurant: "BBQ Tonight", mealName: "Chicken Karahi", amount: 850 },
  { id: "a3", date: "2026-02-26", mealType: "Breakfast", restaurant: "Tooso Restaurant", mealName: "Halwa Puri", amount: 400 },
  { id: "a4", date: "2026-02-25", mealType: "Lunch", restaurant: "Karachi Darbar", mealName: "Daal Chawal", amount: 370 },
  { id: "a5", date: "2026-02-25", mealType: "Dinner", restaurant: "Zameer Ansari", mealName: "Mutton Karahi", amount: 990 },
]

export const spendingOverTime = [
  { date: "Feb 1", amount: 1200 },
  { date: "Feb 4", amount: 1800 },
  { date: "Feb 7", amount: 1500 },
  { date: "Feb 10", amount: 2100 },
  { date: "Feb 13", amount: 1700 },
  { date: "Feb 16", amount: 1900 },
  { date: "Feb 19", amount: 2300 },
  { date: "Feb 22", amount: 1600 },
  { date: "Feb 25", amount: 2000 },
  { date: "Feb 27", amount: 1650 },
]

export const budgetVsActual = [
  { month: "Nov", budget: 35000, actual: 33500 },
  { month: "Dec", budget: 35000, actual: 35000 },
  { month: "Jan", budget: 40000, actual: 38200 },
  { month: "Feb", budget: 45000, actual: 18750 },
]

export const mealTypeBreakdown = [
  { name: "Breakfast", value: 4200, fill: "var(--color-chart-1)" },
  { name: "Lunch", value: 7350, fill: "var(--color-chart-2)" },
  { name: "Dinner", value: 7200, fill: "var(--color-chart-4)" },
]

export const mealHistory: ActivityItem[] = [
  { id: "h1", date: "2026-02-27", mealType: "Lunch", restaurant: "Student Biryani", mealName: "Chicken Biryani", amount: 610 },
  { id: "h2", date: "2026-02-26", mealType: "Dinner", restaurant: "BBQ Tonight", mealName: "Chicken Karahi", amount: 850 },
  { id: "h3", date: "2026-02-26", mealType: "Breakfast", restaurant: "Tooso Restaurant", mealName: "Halwa Puri", amount: 400 },
  { id: "h4", date: "2026-02-25", mealType: "Lunch", restaurant: "Karachi Darbar", mealName: "Daal Chawal", amount: 370 },
  { id: "h5", date: "2026-02-25", mealType: "Dinner", restaurant: "Zameer Ansari", mealName: "Mutton Karahi", amount: 990 },
  { id: "h6", date: "2026-02-24", mealType: "Breakfast", restaurant: "Roll Junction", mealName: "Paratha Roll", amount: 320 },
  { id: "h7", date: "2026-02-24", mealType: "Lunch", restaurant: "Student Biryani", mealName: "Chicken Biryani", amount: 610 },
  { id: "h8", date: "2026-02-24", mealType: "Dinner", restaurant: "Burns Garden", mealName: "Seekh Kebab Platter", amount: 720 },
  { id: "h9", date: "2026-02-23", mealType: "Breakfast", restaurant: "Sabri Nihari", mealName: "Nihari with Naan", amount: 530 },
  { id: "h10", date: "2026-02-23", mealType: "Lunch", restaurant: "Karachi Darbar", mealName: "Daal Chawal", amount: 370 },
]
