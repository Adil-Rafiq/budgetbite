'use client';

import { useMemo, useState } from 'react';
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useBudgetPlans } from '@/hooks/use-budget-plan';
import { useListActiveMealTypes } from '@/hooks/use-meal-type';
import { useMealHistory, useSpendingAnalytics } from '@/hooks/use-analytics';

// ─── Types + helpers ─────────────────────────────────────────────────────────

type RangeKind = 'week' | 'month' | 'custom';

interface Range {
  kind: RangeKind;
  startDate: string;
  endDate: string;
}

const toISODate = (d: Date): string => format(d, 'yyyy-MM-dd');

function thisWeek(): Range {
  const now = new Date();
  return {
    kind: 'week',
    startDate: toISODate(startOfWeek(now, { weekStartsOn: 1 })),
    endDate: toISODate(endOfWeek(now, { weekStartsOn: 1 })),
  };
}

function thisMonth(): Range {
  const now = new Date();
  return {
    kind: 'month',
    startDate: toISODate(startOfMonth(now)),
    endDate: toISODate(endOfMonth(now)),
  };
}

const chartFills = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>(thisMonth());

  const spendingQuery = useSpendingAnalytics({
    startDate: range.startDate,
    endDate: range.endDate,
  });
  const historyQuery = useMealHistory({
    startDate: range.startDate,
    endDate: range.endDate,
  });
  const plansQuery = useBudgetPlans({ limit: 12, offset: 0 });
  const { data: mealTypes = [] } = useListActiveMealTypes();

  const spending = spendingQuery.data;
  const historyData = historyQuery.data?.data;
  const plansData = plansQuery.data?.data;

  const spendingChartData = useMemo(
    () =>
      (spending?.daily ?? []).map((p) => ({
        date: format(new Date(p.date), 'MMM d'),
        amount: p.amount,
      })),
    [spending?.daily],
  );

  const budgetVsActual = useMemo(
    () =>
      (plansData ?? [])
        .slice()
        .reverse()
        .map((p) => ({
          label: format(new Date(p.startDate), 'MMM yyyy'),
          budget: p.totalBudget,
          actual: p.spentAmount,
        })),
    [plansData],
  );

  const mealTypesById = useMemo(() => new Map(mealTypes.map((mt) => [mt.id, mt])), [mealTypes]);

  const breakdown = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of historyData ?? []) {
      const prev = totals.get(item.mealTypeId) ?? 0;
      totals.set(item.mealTypeId, prev + item.actualAmountSpent);
    }
    return Array.from(totals.entries())
      .map(([id, value], i) => {
        const mt = mealTypesById.get(id);
        return {
          name: mt?.label ?? 'Other',
          value,
          fill: chartFills[i % chartFills.length],
        };
      })
      .filter((slice) => slice.value > 0);
  }, [historyData, mealTypesById]);

  const history = historyData ?? [];

  const mealTypeBadge: Record<string, string> = {
    breakfast: 'bg-chart-1/10 text-chart-1',
    lunch: 'bg-chart-4/10 text-chart-4',
    dinner: 'bg-chart-3/10 text-chart-3',
  };

  // ─── UI ────────────────────────────────────────────────────────────────

  const setCustomStart = (v: string) => setRange({ ...range, kind: 'custom', startDate: v });
  const setCustomEnd = (v: string) => setRange({ ...range, kind: 'custom', endDate: v });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Understand your spending patterns.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setRange(thisWeek())}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              range.kind === 'week'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setRange(thisMonth())}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              range.kind === 'month'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            This Month
          </button>
          {range.kind === 'custom' ? (
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={range.startDate}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-35 h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={range.endDate}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-35 h-8 text-xs"
              />
            </div>
          ) : (
            <button
              onClick={() =>
                setRange({
                  kind: 'custom',
                  startDate: range.startDate,
                  endDate: range.endDate,
                })
              }
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Custom
            </button>
          )}
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
              {spendingQuery.isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : spendingQuery.error ? (
                <p className="text-sm text-destructive">Could not load spending.</p>
              ) : spendingChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No spending in this range.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={spendingChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: 'var(--color-card-foreground)',
                      }}
                      formatter={(value: number) => [`PKR ${value.toLocaleString()}`, 'Spent']}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--color-primary)', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
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
              {plansQuery.isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : budgetVsActual.length === 0 ? (
                <p className="text-sm text-muted-foreground">No budget plans yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetVsActual}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: 'var(--color-card-foreground)',
                      }}
                      formatter={(value: number) => [`PKR ${value.toLocaleString()}`]}
                    />
                    <Legend />
                    <Bar
                      dataKey="budget"
                      fill="var(--color-chart-2)"
                      radius={[4, 4, 0, 0]}
                      name="Budget"
                    />
                    <Bar
                      dataKey="actual"
                      fill="var(--color-chart-1)"
                      radius={[4, 4, 0, 0]}
                      name="Actual"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
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
              {historyQuery.isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : breakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No meals in this range.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      strokeWidth={2}
                      stroke="var(--color-card)"
                    >
                      {breakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: 'var(--color-card-foreground)',
                      }}
                      formatter={(value: number) => [`PKR ${value.toLocaleString()}`]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
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
              {historyQuery.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No meals logged in this range.</p>
              ) : (
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
                    {history.map((item) => {
                      const mt = mealTypesById.get(item.mealTypeId);
                      const label = mt?.label ?? 'Meal';
                      const key = mt?.key.toLowerCase() ?? '';
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm text-card-foreground">
                            {format(new Date(item.slotDate), 'MMM d')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`border-0 text-xs capitalize ${mealTypeBadge[key] ?? ''}`}
                            >
                              {label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-card-foreground">
                            {item.restaurantName ?? item.manualDescription ?? '—'}
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-card-foreground">
                            PKR {item.actualAmountSpent.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
