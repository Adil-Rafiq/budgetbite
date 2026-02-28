import { UtensilsCrossed } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-8">
      <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary">
            <UtensilsCrossed className="w-3 h-3 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">BudgetBite</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Built for foodies on a budget. All prices in PKR.
        </p>
      </div>
    </footer>
  )
}
