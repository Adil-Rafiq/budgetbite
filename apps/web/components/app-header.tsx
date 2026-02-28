"use client"

import { UtensilsCrossed } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { activePlan, currentUser } from "@/lib/mock-data"

export function AppHeader() {
  const spentPercent = Math.round((activePlan.spent / activePlan.totalBudget) * 100)

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <UtensilsCrossed className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">BudgetBite</span>
        </div>

        <div className="hidden lg:block" />

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 bg-secondary rounded-lg px-3 py-2">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">PKR {(activePlan.totalBudget - activePlan.spent).toLocaleString()}</span>
              {" "}remaining
            </div>
            <Progress value={spentPercent} className="w-24 h-2" />
          </div>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {currentUser.avatarFallback}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
