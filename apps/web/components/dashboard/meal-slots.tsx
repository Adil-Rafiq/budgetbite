"use client"

import { useState } from "react"
import { Coffee, Sun, Moon, Check, Star, X, ThumbsDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { todayMealSlots, type MealSlot, type MealOption } from "@/lib/mock-data"

const slotIcons = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
}

const slotColors = {
  breakfast: "text-chart-1 bg-chart-1/10",
  lunch: "text-chart-4 bg-chart-4/10",
  dinner: "text-chart-3 bg-chart-3/10",
}

export function MealSlots() {
  const [slots, setSlots] = useState<MealSlot[]>(todayMealSlots)
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null)
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<MealOption | null>(null)
  const [rating, setRating] = useState(0)

  const handleChoose = (slotId: string, meal: MealOption) => {
    setSelectedMeal(meal)
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, chosen: meal } : s))
    )
    setExpandedSlot(null)
    setLogModalOpen(true)
  }

  const handleLogClose = () => {
    setLogModalOpen(false)
    setSelectedMeal(null)
    setRating(0)
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{"Today's Meals"}</h2>
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-PK", { weekday: "long", month: "long", day: "numeric" })}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {slots.map((slot) => {
            const Icon = slotIcons[slot.type]
            const colors = slotColors[slot.type]

            return (
              <Card key={slot.id} className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${colors}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm capitalize text-card-foreground">{slot.type}</CardTitle>
                        <span className="text-xs text-muted-foreground">{slot.time}</span>
                      </div>
                    </div>
                    {slot.chosen && (
                      <Badge variant="secondary" className="text-accent bg-accent/10 border-0">
                        <Check className="w-3 h-3 mr-1" />
                        Chosen
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {slot.chosen ? (
                    <div className="rounded-lg bg-secondary p-3">
                      <p className="font-medium text-sm text-card-foreground">{slot.chosen.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{slot.chosen.restaurant}</p>
                      <p className="text-sm font-semibold text-primary mt-1">
                        PKR {(slot.chosen.price + slot.chosen.deliveryFee).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {slot.options.slice(0, 2).map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center justify-between rounded-lg bg-secondary p-3"
                        >
                          <div>
                            <p className="font-medium text-sm text-card-foreground">{option.name}</p>
                            <p className="text-xs text-muted-foreground">{option.restaurant}</p>
                          </div>
                          <span className="text-sm font-semibold text-primary">
                            PKR {option.price}
                          </span>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1"
                        onClick={() => setExpandedSlot(slot.id)}
                      >
                        View all options
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Meal suggestion modal */}
      <Dialog open={expandedSlot !== null} onOpenChange={() => setExpandedSlot(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Choose your {slots.find((s) => s.id === expandedSlot)?.type}
            </DialogTitle>
            <DialogDescription>
              Pick one of the suggested meals or dismiss options you{"'"}re not interested in.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-3 mt-2">
            {slots
              .find((s) => s.id === expandedSlot)
              ?.options.map((option) => (
                <Card key={option.id} className="border-border">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div>
                      <p className="font-semibold text-card-foreground">{option.name}</p>
                      <p className="text-sm text-muted-foreground">{option.restaurant}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < Math.floor(option.rating) ? "text-chart-4 fill-chart-4" : "text-muted-foreground/30"}`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">{option.rating}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-bold text-card-foreground">PKR {option.price}</span>
                      <span className="text-muted-foreground"> + PKR {option.deliveryFee} delivery</span>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleChoose(expandedSlot!, option)}
                      >
                        Choose
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span className="sr-only">Not interested</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Log meal modal */}
      <Dialog open={logModalOpen} onOpenChange={handleLogClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Log your meal</DialogTitle>
            <DialogDescription>
              Confirm the amount spent and rate your meal.
            </DialogDescription>
          </DialogHeader>
          {selectedMeal && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="rounded-lg bg-secondary p-3">
                <p className="font-medium text-card-foreground">{selectedMeal.name}</p>
                <p className="text-sm text-muted-foreground">{selectedMeal.restaurant}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="actual-amount">Actual amount spent (PKR)</Label>
                <Input
                  id="actual-amount"
                  type="number"
                  defaultValue={selectedMeal.price + selectedMeal.deliveryFee}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setRating(i + 1)}
                      className="p-0.5"
                      aria-label={`Rate ${i + 1} stars`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          i < rating ? "text-chart-4 fill-chart-4" : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={handleLogClose}>
                Save meal
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
