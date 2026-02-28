import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { recentActivity } from "@/lib/mock-data"

const mealTypeBadge: Record<string, string> = {
  Breakfast: "bg-chart-1/10 text-chart-1",
  Lunch: "bg-chart-4/10 text-chart-4",
  Dinner: "bg-chart-3/10 text-chart-3",
}

export function RecentActivity() {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-base text-card-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {recentActivity.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className={`border-0 text-xs ${mealTypeBadge[item.mealType] || ""}`}>
                  {item.mealType}
                </Badge>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{item.mealName}</p>
                  <p className="text-xs text-muted-foreground">{item.restaurant}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-card-foreground">PKR {item.amount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.date).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
