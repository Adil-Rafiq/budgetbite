"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { spendingOverTime, budgetVsActual, mealTypeBreakdown, mealHistory } from "@/lib/mock-data"

const dateRanges = ["This Week", "This Month", "Custom"]

const mealTypeBadge: Record<string, string> = {
  Breakfast: "bg-chart-1/10 text-chart-1",
  Lunch: "bg-chart-4/10 text-chart-4",
  Dinner: "bg-chart-3/10 text-chart-3",
}

export default function AnalyticsPage() {
  const [range, setRange] = useState("This Month")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Understand your spending patterns.</p>
        </div>
        <div className="flex gap-2">
          {dateRanges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending over time line chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">Spending Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spendingOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      color: "var(--color-card-foreground)",
                    }}
                    formatter={(value: number) => [`PKR ${value.toLocaleString()}`, "Spent"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-primary)", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Budget vs Actual bar chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">Budget vs Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetVsActual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      color: "var(--color-card-foreground)",
                    }}
                    formatter={(value: number) => [`PKR ${value.toLocaleString()}`]}
                  />
                  <Legend />
                  <Bar dataKey="budget" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} name="Budget" />
                  <Bar dataKey="actual" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Meal type breakdown pie chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">Breakdown by Meal Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mealTypeBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    strokeWidth={2}
                    stroke="var(--color-card)"
                  >
                    {mealTypeBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      color: "var(--color-card-foreground)",
                    }}
                    formatter={(value: number) => [`PKR ${value.toLocaleString()}`]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Meal history table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">Meal History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-muted-foreground">Restaurant</TableHead>
                    <TableHead className="text-right text-muted-foreground">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mealHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm text-card-foreground">
                        {new Date(item.date).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`border-0 text-xs ${mealTypeBadge[item.mealType] || ""}`}>
                          {item.mealType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-card-foreground">{item.restaurant}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-card-foreground">
                        PKR {item.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
