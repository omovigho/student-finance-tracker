import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../api/api.js';
import ChartArea from '../components/ChartArea.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';

const describeDueTiming = (days) => {
  if (days == null) return null;
  if (days > 1) return `${days} days remaining`;
  if (days === 1) return '1 day remaining';
  if (days === 0) return 'Due today';
  return 'Overdue';
};

const Dashboard = () => {
  const shouldReduceMotion = useReducedMotion();
  const [searchParams] = useSearchParams();
  const selectedStudentId = searchParams.get('student') || searchParams.get('student_id');

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['finance', 'summary'],
    queryFn: async () => {
      const { data } = await api.get('/api/finance/summary/');
      return data;
    },
    staleTime: 5 * 60 * 1000
  });

  const { data: trendData } = useQuery({
    queryKey: ['finance', 'trend'],
    queryFn: async () => {
      const { data } = await api.get('/api/finance/summary/trends/', {
        params: { window: '6m', include_current: true }
      });
      return data;
    }
  });

  const { data: expenseCategoryData } = useQuery({
    queryKey: ['finance', 'expenses', 'by-category'],
    queryFn: async () => {
      const { data } = await api.get('/api/finance/summary/expenses/by-category/', {
        params: { period: 'current_month' }
      });
      return data;
    }
  });

  const { data: loanSummary } = useQuery({
    queryKey: ['loan', 'summary', selectedStudentId ?? 'me'],
    queryFn: async () => {
      const params = selectedStudentId ? { student_id: selectedStudentId } : undefined;
      const { data } = await api.get('/api/loan/summary/', { params });
      return data;
    }
  });

  const kpis = useMemo(() => {
    const fallback = {
      income_this_month: 0,
      expense_this_month: 0,
      current_balance: 0,
      income_change: null,
      expense_change: null,
      balance_change: null
    };
    return { ...fallback, ...(summaryData ?? {}) };
  }, [summaryData]);

  const upcomingRepayments = useMemo(() => {
    if (!loanSummary) return [];
    if (Array.isArray(loanSummary.active_loans)) return loanSummary.active_loans;
    if (Array.isArray(loanSummary.upcoming)) return loanSummary.upcoming;
    if (Array.isArray(loanSummary.upcoming_repayments)) return loanSummary.upcoming_repayments;
    if (Array.isArray(loanSummary)) return loanSummary;
    return [];
  }, [loanSummary]);

  return (
    <div className="space-y-8">
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="grid gap-5 sm:grid-cols-3"
      >
        <KpiCard
          title="Income this month"
          value={formatCurrency(kpis.income_this_month)}
          delta={kpis.income_change}
          loading={summaryLoading}
        />
        <KpiCard
          title="Expenses this month"
          value={formatCurrency(kpis.expense_this_month)}
          delta={kpis.expense_change}
          tone="warning"
          loading={summaryLoading}
        />
        <KpiCard
          title="Current balance"
          value={formatCurrency(kpis.current_balance)}
          delta={kpis.balance_change}
          loading={summaryLoading}
        />
      </motion.section>

      <ChartArea trendData={trendData?.results ?? trendData} categoryData={expenseCategoryData?.results ?? expenseCategoryData} />

      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Upcoming repayments</h3>
              <p className="text-xs text-muted">Stay on top of loan schedules.</p>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {upcomingRepayments.length ? (
              upcomingRepayments.slice(0, 5).map((item) => {
                const dueTiming = describeDueTiming(item.days_until_due);
                return (
                  <li
                    key={item.id ?? `${item.loan}-${item.due_date}`}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.loan_name ?? item.loan ?? 'Loan repayment'}</p>
                      <p className="text-xs text-muted">Due {formatDate(item.due_date ?? item.expected_payment_date)}</p>
                      {dueTiming && (
                        <p className="text-xs text-slate-500">{dueTiming}</p>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(item.amount_due ?? item.outstanding_balance ?? item.amount)}</p>
                  </li>
                );
              })
            ) : (
              <li className="flex items-center justify-center py-6 text-sm text-muted">
                No repayments due in the next two weeks.
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Financial health tips</h3>
          <p className="mt-2 text-xs text-muted">Quick wins to keep your project funded.</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="rounded-xl bg-primary/5 px-4 py-3">
              Allocate a portion of scholarship awards to emergency reserves.
            </li>
            <li className="rounded-xl bg-primary/5 px-4 py-3">
              Review recurring expenses monthly to avoid scope creep.
            </li>
            <li className="rounded-xl bg-primary/5 px-4 py-3">
              Track loan repayments weekly to catch missed instalments early.
            </li>
          </ul>
        </div>
      </motion.section>
    </div>
  );
};

const KpiCard = ({ title, value, delta, loading = false, tone = 'default' }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
    <p className="mt-3 text-3xl font-bold text-slate-900">{loading ? '—' : value}</p>
    {delta != null && !loading && (
      <p className={`mt-2 text-xs font-semibold ${tone === 'warning' ? 'text-red-500' : delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
        {delta >= 0 ? '+' : ''}{delta}% vs last month
      </p>
    )}
  </div>
);

export default Dashboard;
