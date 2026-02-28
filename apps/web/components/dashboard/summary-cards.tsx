import { Card, CardContent } from "@/components/ui/card"
import { Wallet, TrendingDown, PiggyBank, CalendarDays } from "lucide-react"
import { activePlan } from "@/lib/mock-data"

export function SummaryCards() {
  const remaining = activePlan.totalBudget - activePlan.spent
  const startDate = new Date(activePlan.startDate)
  const endDate = new Date(activePlan.endDate)
  const today = new Date()
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

  const cards = [
    {
      label: "Total Budget",
      value: `PKR ${activePlan.totalBudget.toLocaleString()}`,
      icon: Wallet,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Amount Spent",
      value: `PKR ${activePlan.spent.toLocaleString()}`,
      icon: TrendingDown,
      color: "text-chart-5",
      bg: "bg-chart-5/10",
    },
    {
      label: "Remaining",
      value: `PKR ${remaining.toLocaleString()}`,
      icon: PiggyBank,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Days Left",
      value: `${daysLeft} days`,
      icon: CalendarDays,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">{card.label}</span>
                <span className="text-lg font-bold text-card-foreground">{card.value}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
