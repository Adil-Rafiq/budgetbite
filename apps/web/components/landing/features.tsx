import { Card, CardContent } from "@/components/ui/card"
import { Utensils, Wallet, BarChart3 } from "lucide-react"

const features = [
  {
    icon: Utensils,
    title: "Smart Meal Suggestions",
    description: "Get personalized meal recommendations from nearby restaurants that fit your budget and preferences.",
  },
  {
    icon: Wallet,
    title: "Budget Tracking",
    description: "Set weekly or monthly food budgets in PKR and track every rupee spent with detailed breakdowns.",
  },
  {
    icon: BarChart3,
    title: "Spending Analytics",
    description: "Visualize your spending patterns with charts and insights to make smarter food choices.",
  },
]

export function Features() {
  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Everything you need to eat well on a budget
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Simple tools to plan meals, track spending, and save money.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
