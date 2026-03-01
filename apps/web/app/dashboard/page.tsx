import { SummaryCards } from "@/components/dashboard/summary-cards"
import { MealSlots } from "@/components/dashboard/meal-slots"
import { RecentActivity } from "@/components/dashboard/recent-activity"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your meals and budget at a glance.</p>
      </div>
      <SummaryCards />
      <MealSlots />
      <RecentActivity />
    </div>
  )
}
