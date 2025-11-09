import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../../api/api.js';
import LoanCard from '../../components/LoanCard.jsx';
import { formatCurrency, formatPercent, formatDate } from '../../utils/format.js';
import { useToast } from '../../components/Toast.jsx';

const parseList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload)) return payload;
  return [];
};

const LoansList = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const { data: schemesData, isLoading: schemesLoading } = useQuery({
    queryKey: ['loan', 'schemes'],
    queryFn: async () => {
      const { data } = await api.get('/api/loan/schemes/');
      return data;
    },
    staleTime: 5 * 60 * 1000
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['loan', 'history'],
    queryFn: async () => {
      const { data } = await api.get('/api/loan/loans/history/');
      return data;
    }
  });

  const applyMutation = useMutation({
    mutationFn: (schemeId) => api.post('/api/loan/loans/', { scheme_id: schemeId }),
    onSuccess: () => {
      pushToast('Loan application submitted. Await approval.', 'success');
      queryClient.invalidateQueries({ queryKey: ['loan', 'history'] });
    },
    onError: () => pushToast('Unable to submit application. Try again.', 'error')
  });

  const payoffMutation = useMutation({
    mutationFn: (loanId) => api.post(`/api/loan/loans/${loanId}/payoff/`),
    onSuccess: () => {
      pushToast('Loan repaid successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['loan', 'history'] });
    },
    onError: () => pushToast('Unable to complete repayment.', 'error')
  });

  const schemes = useMemo(() => parseList(schemesData), [schemesData]);
  const pendingLoans = useMemo(() => parseList(historyData?.pending), [historyData]);
  const activeLoans = useMemo(() => parseList(historyData?.active), [historyData]);
  const paidLoans = useMemo(() => parseList(historyData?.paid), [historyData]);
  const closedLoans = useMemo(() => parseList(historyData?.closed), [historyData]);

  const handleApply = async (schemeId) => {
    await applyMutation.mutateAsync(schemeId);
  };

  const handlePayoff = async (loan) => {
    await payoffMutation.mutateAsync(loan.id);
  };

  const renderEmptyState = (message) => (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-muted"
    >
      {message}
    </motion.div>
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Loan centre</h1>
        <p className="text-sm text-muted">
          Explore available loan schemes, track application status, and repay active loans in a single view.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Available loan schemes</h2>
            <p className="text-xs text-muted">Select a scheme to view details and submit an application.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schemesLoading ? (
            renderEmptyState('Loading loan schemes…')
          ) : schemes.length ? (
            schemes.map((scheme) => (
              <article key={scheme.id} className="flex h-full flex-col rounded-xl border border-slate-200 bg-background p-5">
                <div className="flex-1 space-y-3 text-sm text-slate-600">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{scheme.name}</p>
                    <p className="text-xs text-muted">Offered by {scheme.lender_name}</p>
                  </div>
                  {scheme.description && <p>{scheme.description}</p>}
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center justify-between">
                      <span className="text-muted">Principal</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(scheme.principal)}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-muted">Interest rate</span>
                      <span className="font-semibold text-slate-900">{scheme.interest_rate}%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-muted">Term</span>
                      <span className="font-semibold text-slate-900">{scheme.term_months} months</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-muted">Max days to repay</span>
                      <span className="font-semibold text-slate-900">{scheme.max_payback_days} days</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handleApply(scheme.id)}
                  disabled={applyMutation.isPending}
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {applyMutation.isPending ? 'Submitting…' : 'Apply for this loan'}
                </button>
              </article>
            ))
          ) : (
            renderEmptyState('No loan schemes are currently available. Check back soon.')
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Active loans</h2>
        <p className="text-xs text-muted">Pay back the full principal and accrued interest before the due date.</p>
        <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {historyLoading ? (
            renderEmptyState('Loading your loans…')
          ) : activeLoans.length ? (
            activeLoans.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                onView={(item) => navigate(`/loans/${item.id}`)}
                onPay={handlePayoff}
                isPaying={payoffMutation.isPending && payoffMutation.variables === loan.id}
              />
            ))
          ) : (
            renderEmptyState('You have no active loans at the moment.')
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Application history</h2>
        <p className="text-xs text-muted">Review pending requests, paid loans, and declined applications.</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <HistoryPanel
            title="Pending"
            description="Awaiting lender review."
            items={pendingLoans}
            emptyMessage="No pending applications."
          />
          <HistoryPanel
            title="Paid"
            description="Loans you have fully settled."
            items={paidLoans}
            emptyMessage="No paid loans yet."
          />
          <HistoryPanel
            title="Closed"
            description="Declined or closed applications."
            items={closedLoans}
            emptyMessage="No closed loans."
          />
        </div>
      </section>
    </div>
  );
};

const HistoryPanel = ({ title, description, items = [], emptyMessage }) => (
  <div className="flex flex-col rounded-xl border border-slate-200 bg-background p-5">
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-muted">{description}</p>
    </div>
    <ul className="mt-4 flex-1 space-y-3 text-xs text-slate-600">
      {items.length ? (
        items.slice(0, 5).map((loan) => {
          const principal = Number(loan.principal ?? 0);
          const interestAmount = Number(loan.interest_amount ?? 0);
          const rawTotal = Number(loan.total_payable ?? principal + interestAmount);
          const totalPayable = rawTotal > 0 ? rawTotal : principal + interestAmount;
          const isPending = loan.status === 'pending';
          let outstanding = Number(loan.outstanding_balance ?? totalPayable);
          if (!Number.isFinite(outstanding) || outstanding <= 0) {
            outstanding = isPending ? totalPayable : 0;
          }
          const amountRepaid = Math.max(totalPayable - outstanding, 0);
          const progress = totalPayable > 0 ? amountRepaid / totalPayable : null;

          return (
            <li key={loan.id} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
              <p className="font-semibold text-slate-900">{loan?.scheme?.name ?? loan.lender_name}</p>
              <p className="mt-1 flex items-center justify-between">
                <span className="text-muted">Principal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(principal)}</span>
              </p>
              {interestAmount > 0 && (
                <p className="mt-1 flex items-center justify-between">
                  <span className="text-muted">Interest</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(interestAmount)}</span>
                </p>
              )}
              {totalPayable > 0 && (
                <p className="mt-1 flex items-center justify-between">
                  <span className="text-muted">Total repayable</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(totalPayable)}</span>
                </p>
              )}
              {loan.due_date && (
                <p className="mt-1 flex items-center justify-between">
                  <span className="text-muted">Due date</span>
                  <span className="font-semibold text-slate-900">{formatDate(loan.due_date)}</span>
                </p>
              )}
              {progress !== null && (
                <p className="mt-1 flex items-center justify-between">
                  <span className="text-muted">Progress</span>
                  <span className="font-semibold text-slate-900">{formatPercent(progress)}</span>
                </p>
              )}
            </li>
          );
        })
      ) : (
        <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-muted">{emptyMessage}</li>
      )}
    </ul>
  </div>
);

export default LoansList;
