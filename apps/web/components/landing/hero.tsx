import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UtensilsCrossed, ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-card">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary)_0%,transparent_50%)] opacity-5" />
      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32 lg:py-40">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <UtensilsCrossed className="w-4 h-4" />
            Smart food budgeting for Pakistan
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Plan your meals.
            <br />
            <span className="text-primary">Stick to your budget.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground leading-relaxed">
            BudgetBite helps you discover affordable meals from nearby restaurants,
            track your food spending, and stay within your monthly budget. All in PKR.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <Button asChild size="lg" className="px-8 text-base">
              <Link href="/register">
                Get started free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 text-base">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
