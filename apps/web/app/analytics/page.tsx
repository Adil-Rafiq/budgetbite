'use client';

import type React from 'react';
import { useMemo, useState } from 'react';
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import {
  Bar as RechartsBar,
  BarChart,
  type BarProps,
  CartesianGrid,
  Cell,
  Legend as RechartsLegend,
  type LegendProps,
  Line as RechartsLine,
  LineChart,
  type LineProps,
  Pie as RechartsPie,
  type PieProps,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  type TooltipProps,
  XAxis as RechartsXAxis,
  type XAxisProps,
  YAxis as RechartsYAxis,
  type YAxisProps,
} from 'recharts';

// recharts 2.x's class-component exports don't satisfy React 19's stricter
// JSX.ElementType constraint (fixed upstream only in recharts 3, a breaking
// major bump) — cast the affected ones back to a plain component type.
const Bar = RechartsBar as unknown as React.FC<BarProps>;
const Legend = RechartsLegend as unknown as React.FC<LegendProps>;
const Line = RechartsLine as unknown as React.FC<LineProps>;
const Pie = RechartsPie as unknown as React.FC<PieProps>;
const Tooltip = RechartsTooltip as unknown as React.FC<TooltipProps<number, string>>;
const XAxis = RechartsXAxis as unknown as React.FC<XAxisProps>;
const YAxis = RechartsYAxis as unknown as React.FC<YAxisProps>;

import { ChartSkeleton, TableSkeleton } from '@/components/skeletons';
import { FadeUp, Stagger, StaggerItem } from '@/components/motion';
import { Pill } from '@/components/ui/pill';
import { motion } from 'motion/react';

import { useBudgetPlans } from '@/hooks/use-budget-plan';
import { useListActiveMealTypes } from '@/hooks/use-meal-type';
import { useMealHistory, useSpendingAnalytics } from '@/hooks/use-analytics';

const FATHOM = 'var(--color-fathom)';
const PULSE = 'var(--color-pulse)';
const AMBER = 'var(--color-amber)';
const GLOW = 'var(--color-glow)';
const VAST = 'var(--color-vast)';
const SOFT = 'var(--color-soft)';
const MUTED = 'var(--color-ink)';
const LUMEN = 'var(--color-lumen)';
const LUMEN_DK = 'var(--color-lumen-dk)';
const WHITE = '#ffffff';

const mealTypePalette = [FATHOM, AMBER, PULSE, VAST, GLOW, SOFT, MUTED];

const chartTooltipStyle = {
  backgroundColor: WHITE,
  border: `1px solid ${LUMEN_DK}`,
  borderRadius: 12,
  color: VAST,
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
} as const;

const chartAxisTick = { fontSize: 11, fill: MUTED, fontFamily: 'var(--font-mono)' } as const;

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

const formatPKR = (value: number) => `₨ ${value.toLocaleString()}`;
const formatPKRCompact = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1000)}k`;
  return String(value);
};

function Panel({
  code,
  title,
  children,
}: {
  code: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-lumen-dk bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between border-b border-lumen-dk bg-lumen px-5 py-3.5">
        <span
          className="text-[10px] uppercase text-soft"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
        >
          {code}
        </span>
        <span
          className="text-vast"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function RangeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pill
      variant={active ? 'primary' : 'ghost'}
      size="xs"
      onClick={onClick}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {children}
    </Pill>
  );
}

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

  const colorByMealTypeId = useMemo(() => {
    const map = new Map<string, string>();
    mealTypes.forEach((mt, i) => {
      map.set(mt.id, mealTypePalette[i % mealTypePalette.length] ?? FATHOM);
    });
    return map;
  }, [mealTypes]);

  const breakdown = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of historyData ?? []) {
      const prev = totals.get(item.mealTypeId) ?? 0;
      totals.set(item.mealTypeId, prev + item.actualAmountSpent);
    }
    return Array.from(totals.entries())
      .map(([id, value]) => {
        const mt = mealTypesById.get(id);
        return {
          name: mt?.label ?? 'Other',
          value,
          fill: colorByMealTypeId.get(id) ?? FATHOM,
        };
      })
      .filter((slice) => slice.value > 0);
  }, [historyData, mealTypesById, colorByMealTypeId]);

  const history = historyData ?? [];

  const setCustomStart = (v: string) => setRange({ ...range, kind: 'custom', startDate: v });
  const setCustomEnd = (v: string) => setRange({ ...range, kind: 'custom', endDate: v });

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <FadeUp>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <div
              className="text-[10px] uppercase text-fathom"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.22em' }}
            >
              spend · /analytics
            </div>
            <h1
              className="text-vast"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 3.6vw, 40px)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                lineHeight: 1.05,
              }}
            >
              Understand the week.
            </h1>
            <p className="max-w-[540px] text-[14px] text-ink">
              Patterns in spend, meal mix, and budget drift — over time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RangeButton active={range.kind === 'week'} onClick={() => setRange(thisWeek())}>
              Week
            </RangeButton>
            <RangeButton active={range.kind === 'month'} onClick={() => setRange(thisMonth())}>
              Month
            </RangeButton>
            {range.kind === 'custom' ? (
              <div className="flex items-center gap-1 rounded-full border border-lumen-dk bg-white px-2 py-1">
                <input
                  type="date"
                  value={range.startDate}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-32 bg-transparent text-[12px] text-vast outline-none"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <span className="text-[11px] text-soft" style={{ fontFamily: 'var(--font-mono)' }}>
                  →
                </span>
                <input
                  type="date"
                  value={range.endDate}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-32 bg-transparent text-[12px] text-vast outline-none"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
            ) : (
              <RangeButton
                active={false}
                onClick={() =>
                  setRange({
                    kind: 'custom',
                    startDate: range.startDate,
                    endDate: range.endDate,
                  })
                }
              >
                Custom
              </RangeButton>
            )}
          </div>
        </header>
      </FadeUp>

      <Stagger className="grid gap-4 lg:grid-cols-2 lg:gap-5" delay={0.1} stagger={0.08}>
        <StaggerItem>
          <Panel code="01" title="Spending over time">
            <div className="h-64">
              {spendingQuery.isLoading ? (
                <ChartSkeleton variant="line" />
              ) : spendingQuery.error ? (
                <p className="text-[13px] text-pulse">Could not load spending.</p>
              ) : spendingChartData.length === 0 ? (
                <p className="text-[13px] text-ink">No spending in this range.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={spendingChartData}
                    margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={LUMEN_DK} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={chartAxisTick} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={chartAxisTick}
                      tickFormatter={formatPKRCompact}
                      width={40}
                    />
                    <Tooltip
                      cursor={{ stroke: LUMEN_DK, strokeDasharray: '3 3' }}
                      contentStyle={chartTooltipStyle}
                      formatter={(value: number) => [formatPKR(value), 'Spent']}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke={FATHOM}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, fill: FATHOM, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Panel>
        </StaggerItem>

        <StaggerItem>
          <Panel code="02" title="Budget vs actual">
            <div className="h-64">
              {plansQuery.isLoading ? (
                <ChartSkeleton variant="bar" />
              ) : budgetVsActual.length === 0 ? (
                <p className="text-[13px] text-ink">No budget plans yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={budgetVsActual}
                    barCategoryGap="28%"
                    barGap={4}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={LUMEN_DK} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={chartAxisTick} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={chartAxisTick}
                      tickFormatter={formatPKRCompact}
                      width={40}
                    />
                    <Tooltip
                      cursor={{ fill: LUMEN, opacity: 0.6 }}
                      contentStyle={chartTooltipStyle}
                      formatter={(value: number) => [formatPKR(value)]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{
                        paddingTop: 12,
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: MUTED,
                      }}
                    />
                    <Bar
                      dataKey="budget"
                      fill={SOFT}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                      name="Budget"
                    />
                    <Bar
                      dataKey="actual"
                      fill={FATHOM}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                      name="Actual"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Panel>
        </StaggerItem>

        <StaggerItem>
          <Panel code="03" title="Breakdown by meal type">
            <div className="flex h-64 items-center justify-center">
              {historyQuery.isLoading ? (
                <ChartSkeleton variant="pie" />
              ) : breakdown.length === 0 ? (
                <p className="text-[13px] text-ink">No meals in this range.</p>
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
                      stroke={WHITE}
                    >
                      {breakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value: number) => [formatPKR(value)]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{
                        paddingTop: 12,
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: MUTED,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Panel>
        </StaggerItem>

        <StaggerItem>
          <Panel code="04" title="Meal history">
            <div className="max-h-[360px] overflow-auto pr-2">
              {historyQuery.isLoading ? (
                <TableSkeleton rows={5} columns={4} />
              ) : history.length === 0 ? (
                <p className="text-[13px] text-ink">No meals logged in this range.</p>
              ) : (
                <div className="flex flex-col">
                  <div
                    className="sticky top-0 z-10 grid grid-cols-[64px_1fr_auto] gap-3 border-b border-lumen-dk bg-white py-2 text-[10px] uppercase text-soft"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.18em',
                    }}
                  >
                    <span>Date</span>
                    <span>Meal · place</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {history.map((item, i) => {
                    const mt = mealTypesById.get(item.mealTypeId);
                    const label = mt?.label ?? 'Meal';
                    const tint = colorByMealTypeId.get(item.mealTypeId) ?? FATHOM;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.35,
                          delay: Math.min(i * 0.03, 0.4),
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        whileHover={{
                          background: 'color-mix(in srgb, var(--color-lumen) 60%, transparent)',
                        }}
                        className={`grid grid-cols-[64px_1fr_auto] items-center gap-3 py-3 ${
                          i === 0 ? '' : 'border-t border-lumen-dk'
                        }`}
                      >
                        <span
                          className="text-[12px] text-ink"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {format(new Date(item.slotDate), 'MMM d')}
                        </span>
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex h-1.5 w-1.5 rounded-full"
                              style={{ background: tint }}
                            />
                            <span
                              className="text-[10px] uppercase text-soft"
                              style={{
                                fontFamily: 'var(--font-mono)',
                                letterSpacing: '0.18em',
                              }}
                            >
                              {label}
                            </span>
                          </div>
                          <span className="truncate text-[13px] font-medium text-vast">
                            {item.restaurantName ?? item.manualDescription ?? '—'}
                          </span>
                        </div>
                        <span
                          className="text-right text-[14px] font-semibold tabular-nums text-vast"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          ₨ {item.actualAmountSpent.toLocaleString()}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </Panel>
        </StaggerItem>
      </Stagger>
    </div>
  );
}
