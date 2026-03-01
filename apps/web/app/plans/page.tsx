"use client"

import { useState } from "react"
import { Plus, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { plans } from "@/lib/mock-data"

const statusStyles: Record<string, string> = {
  active: "bg-accent/10 text-accent border-0",
  completed: "bg-chart-3/10 text-chart-3 border-0",
  cancelled: "bg-destructive/10 text-destructive border-0",
}

export default function PlansPage() {
  const [showNewPlan, setShowNewPlan] = useState(false)
  const [mealTypes, setMealTypes] = useState<string[]>(["breakfast", "lunch", "dinner"])

  const toggleMealType = (type: string) => {
    setMealTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budget Plans</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your current and past food budgets.</p>
        </div>
        <Button onClick={() => setShowNewPlan(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New Plan
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => {
          const spentPercent = Math.round((plan.spent / plan.totalBudget) * 100)
          const remaining = plan.totalBudget - plan.spent
          return (
            <Card key={plan.id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base capitalize text-card-foreground">{plan.type} Plan</CardTitle>
                  <Badge variant="secondary" className={statusStyles[plan.status]}>
                    {plan.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />
                  {new Date(plan.startDate).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
                  {" - "}
                  {new Date(plan.endDate).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      PKR {plan.spent.toLocaleString()} spent
                    </span>
                    <span className="font-semibold text-card-foreground">
                      PKR {plan.totalBudget.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={spentPercent} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-secondary p-2">
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="text-sm font-bold text-card-foreground">
                      {(plan.totalBudget / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary p-2">
                    <p className="text-xs text-muted-foreground">Spent</p>
                    <p className="text-sm font-bold text-card-foreground">
                      {(plan.spent / 1000).toFixed(1)}k
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary p-2">
                    <p className="text-xs text-muted-foreground">Left</p>
                    <p className="text-sm font-bold text-card-foreground">
                      {remaining > 0 ? `${(remaining / 1000).toFixed(1)}k` : "0"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {plan.mealTypes.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs capitalize">
                      {type}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs">
                    {plan.mealsPerDay} meals/day
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* New plan dialog */}
      <Dialog open={showNewPlan} onOpenChange={setShowNewPlan}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Plan</DialogTitle>
            <DialogDescription>
              Set up a new budget plan for your meals.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <Label>Plan type</Label>
              <Select defaultValue="monthly">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-budget">Total budget (PKR)</Label>
              <Input id="new-budget" type="number" placeholder="45000" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-meals">Meals per day</Label>
              <Input id="new-meals" type="number" min={1} max={5} defaultValue={3} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Meal types</Label>
              <div className="flex flex-wrap gap-3">
                {["breakfast", "lunch", "dinner"].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={mealTypes.includes(type)}
                      onCheckedChange={() => toggleMealType(type)}
                    />
                    <span className="text-sm capitalize text-foreground">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full mt-2" onClick={() => setShowNewPlan(false)}>
              Create plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
