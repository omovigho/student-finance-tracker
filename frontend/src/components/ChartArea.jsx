import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useReducedMotion } from 'framer-motion';
import { formatCurrency } from '../utils/format.js';

const chartPalette = ['#0B63CE', '#F59E0B', '#22C55E', '#EC4899', '#6366F1', '#F97316'];

const ChartArea = ({ trendData = [], categoryData = [] }) => {
  const shouldReduceMotion = useReducedMotion();

  const normalisedTrend = useMemo(() => {
    if (!Array.isArray(trendData)) return [];
    return trendData.map((item) => ({
      month: item.month ?? item.label ?? item.period,
      income: Number(item.income ?? item.total_income ?? 0),
      expense: Number(item.expense ?? item.total_expense ?? 0)
    }));
  }, [trendData]);

  const hasTrendSeries = useMemo(
    () => normalisedTrend.some((item) => item.income !== 0 || item.expense !== 0),
    [normalisedTrend]
  );

  const normalisedCategory = useMemo(() => {
    if (!Array.isArray(categoryData)) return [];
    const formatted = categoryData.map((item) => ({
      name: item.category ?? item.name,
      value: Number(item.amount ?? item.total ?? 0)
    }));
    return formatted.sort((a, b) => b.value - a.value);
  }, [categoryData]);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Income vs Expense (6 months)</h3>
            <p className="text-xs text-muted">Track how cash flow changes over time.</p>
          </div>
        </div>
        <div className="h-64">
          {normalisedTrend.length && hasTrendSeries ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={normalisedTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" tickFormatter={(value) => formatCurrency(value)} width={80} />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
                />
                <Legend />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#0B63CE"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={!shouldReduceMotion}
                />
                <Bar
                  dataKey="expense"
                  name="Expense"
                  fill="#F59E0B"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={!shouldReduceMotion}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState label="Add transactions to see trends." />
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h3 className="text-base font-semibold text-slate-900">Expense by category</h3>
        <p className="text-xs text-muted">Understand where money goes.</p>
        <div className="mt-4 flex h-64 flex-col justify-center">
          {normalisedCategory.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={normalisedCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" stroke="#94A3B8" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis type="category" dataKey="name" stroke="#94A3B8" width={110} />
                <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />
                <Bar
                  dataKey="value"
                  name="Expense"
                  radius={[0, 6, 6, 0]}
                  isAnimationActive={!shouldReduceMotion}
                >
                  {normalisedCategory.map((entry, index) => (
                    <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState label="Log expenses to break down spending." />
          )}
        </div>
        {normalisedCategory.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {normalisedCategory.map((item, index) => (
              <li key={item.name} className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: chartPalette[index % chartPalette.length] }}
                  />
                  {item.name}
                </span>
                <span className="font-semibold text-slate-900">{formatCurrency(item.value)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

const EmptyChartState = ({ label }) => (
  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs font-medium text-muted">
    {label}
  </div>
);

export default ChartArea;
