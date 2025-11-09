import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar
} from 'recharts';
import api from '../../api/api.js';
import { formatCurrency, formatPercent } from '../../utils/format.js';

const CHART_COLORS = ['#0ea5e9', '#6366f1', '#f97316', '#22c55e', '#a855f7', '#facc15', '#ef4444'];

const Summary = () => {
  const shouldReduceMotion = useReducedMotion();

  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['finance', 'summary', 'full'],
    queryFn: async () => {
      const { data } = await api.get('/api/finance/summary/');
      return data;
    }
  });

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthKey = `${currentYear}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [breakdownFilter, setBreakdownFilter] = useState(`month:${currentMonthKey}`);

  const { data: breakdownData, isLoading: breakdownLoading } = useQuery({
    queryKey: ['finance', 'expenses', 'breakdown', breakdownFilter],
    queryFn: async () => {
      const filter = breakdownFilter.startsWith('month:')
        ? { mode: 'month', month: breakdownFilter.split(':')[1] }
        : { mode: breakdownFilter };
      const { data } = await api.get('/api/finance/summary/expenses/category-breakdown/', { params: filter });
      return data;
    }
  });

  const monthOptions = useMemo(() => {
    const options = [];
    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      const date = new Date(currentYear, monthIndex, 1);
      const label = date.toLocaleString(undefined, { month: 'long' });
      const value = `month:${currentYear}-${String(monthIndex + 1).padStart(2, '0')}`;
      options.push({ label: `${label} ${currentYear}`, value });
    }
    return options;
  }, [currentYear]);

  const breakdownSeries = breakdownData?.series ?? [];

  const categoryKeys = useMemo(() => {
    const set = new Set();
    breakdownSeries.forEach((entry) => {
      entry.categories?.forEach((item) => {
        const name = item.category ?? 'Uncategorised';
        set.add(name);
      });
    });
    return Array.from(set);
  }, [breakdownSeries]);

  const chartData = useMemo(() => {
    return breakdownSeries.map((entry) => {
      const row = { month: entry.month };
      categoryKeys.forEach((key) => {
        row[key] = 0;
      });
      entry.categories?.forEach((item) => {
        const key = item.category ?? 'Uncategorised';
        row[key] = Number(item.amount ?? 0);
      });
      return row;
    });
  }, [breakdownSeries, categoryKeys]);

  const categoryRows = useMemo(() => {
    const map = new Map();
    breakdownSeries.forEach((entry) => {
      entry.categories?.forEach((item) => {
        const key = item.category ?? 'Uncategorised';
        const existing = map.get(key) ?? { category: key, amount: 0 };
        existing.amount += Number(item.amount ?? 0);
        map.set(key, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [breakdownSeries]);

  const totalSpent = categoryRows.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Finance summary</h1>
        <p className="text-sm text-muted">High-level view of performance across categories and budgets.</p>
      </header>

      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="grid gap-5 md:grid-cols-3"
      >
        <SummaryCard title="Total income" value={formatCurrency(summaryData?.total_income ?? 0)} loading={isLoading} />
        <SummaryCard title="Total expenses" value={formatCurrency(summaryData?.total_expense ?? 0)} loading={isLoading} tone="warning" />
        <SummaryCard title="Net balance" value={formatCurrency(summaryData?.net_balance ?? 0)} loading={isLoading} />
      </motion.section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Category breakdown</h2>
            <p className="text-xs text-muted">Visualise how your expenses distribute across categories.</p>
          </div>
          <select
            value={breakdownFilter}
            onChange={(event) => setBreakdownFilter(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value={`month:${currentMonthKey}`}>This month</option>
            <option value="last_3_months">Last 3 months</option>
            <option value="last_6_months">Last 6 months</option>
            <optgroup label={`${currentYear} months`}>
              {monthOptions
                .filter((option) => option.value !== `month:${currentMonthKey}`)
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>

        <div className="mt-6 h-72 w-full">
          {breakdownLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted">Loading breakdown…</div>
          ) : chartData.length && categoryKeys.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} width={90} />
                <Tooltip formatter={(value) => formatCurrency(value)} labelStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {categoryKeys.map((key, index) => (
                  <Bar key={key} dataKey={key} stackId="expenses" fill={CHART_COLORS[index % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">No expenses recorded for the selected period.</div>
          )}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Category</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Total spend</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryRows.length ? (
                categoryRows.map((row) => (
                  <tr key={row.category} className="hover:bg-primary/5">
                    <td className="px-4 py-3 text-slate-700">{row.category}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(row.amount)}</td>
                    <td className="px-4 py-3 text-right text-muted">{formatPercent(totalSpent ? row.amount / totalSpent : 0)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-sm text-muted">
                    Add expenses to see category analytics.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const SummaryCard = ({ title, value, tone = 'default', loading = false }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
    <p className="mt-3 text-3xl font-bold text-slate-900">{loading ? '—' : value}</p>
    {tone === 'warning' && !loading && (
      <p className="mt-2 text-xs font-semibold text-red-500">Monitor this closely.</p>
    )}
  </div>
);

export default Summary;
