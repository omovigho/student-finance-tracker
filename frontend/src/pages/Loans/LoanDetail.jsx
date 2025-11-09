import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../../api/api.js';
import { useToast } from '../../components/Toast.jsx';
import { formatCurrency, formatDate, formatPercent } from '../../utils/format.js';

const LoanDetail = () => {
  const { loanId } = useParams();
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const { data: loan, isLoading } = useQuery({
    queryKey: ['loans', loanId],
    queryFn: async () => {
      const { data } = await api.get(`/api/loan/loans/${loanId}/`);
      return data;
    }
  });

  const repayments = useMemo(() => {
    if (!loan) return [];
    if (Array.isArray(loan.repayments)) return loan.repayments;
    if (Array.isArray(loan.schedule)) return loan.schedule;
    return [];
  }, [loan]);

  const payoffMutation = useMutation({
    mutationFn: () => api.post(`/api/loan/loans/${loanId}/payoff/`),
    onSuccess: () => {
      pushToast('Loan repaid successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['loans', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loan', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['loan', 'summary'] });
    },
    onError: () => pushToast('Unable to process repayment.', 'error')
  });

  if (isLoading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted shadow-sm">Loading loan…</div>;
  }

  if (!loan) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600 shadow-sm">Loan not found.</div>;
  }

  const totalPayable = Number(loan.total_payable ?? loan.principal ?? 0);
  const outstanding = Number(loan.outstanding_balance ?? loan.current_amount_due ?? 0);
  const paidAmount = Math.max(totalPayable - outstanding, 0);
  const progress = totalPayable > 0 ? Math.min((paidAmount / totalPayable) * 100, 100) : 0;

  return (
    <div className="space-y-8">
      <header>
  <h1 className="text-2xl font-semibold text-slate-900">{loan.scheme?.name ?? loan.name ?? loan.title ?? 'Loan details'}</h1>
        <p className="text-sm text-muted">
          Issued by {loan.scheme?.lender_name ?? loan.lender_name ?? 'Partner lender'} · Due on {formatDate(loan.due_date ?? loan.next_due_date)}
        </p>
      </header>

      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="grid gap-6 md:grid-cols-2"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="grid grid-cols-2 gap-4 text-sm text-slate-600">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Principal</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(loan.principal)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Interest rate</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">{loan.interest_rate ? `${loan.interest_rate}%` : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Total repaid</dt>
              <dd className="mt-1 text-lg font-semibold text-emerald-600">{formatCurrency((loan.total_payable ?? 0) - (loan.outstanding_balance ?? 0))}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Outstanding</dt>
              <dd className="mt-1 text-lg font-semibold text-red-500">{formatCurrency(loan.outstanding_balance ?? loan.current_amount_due ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Total payable</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(loan.total_payable ?? loan.principal)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Status</dt>
              <dd className="mt-1 text-lg font-semibold capitalize text-slate-900">{loan.status}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-semibold text-muted">
              <span>Progress</span>
              <span>{formatPercent(progress)}</span>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Repay loan</h2>
          <p className="text-xs text-muted">Pay back the full outstanding balance including interest.</p>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p className="flex items-center justify-between">
              <span className="text-muted">Amount due</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(loan.outstanding_balance ?? loan.current_amount_due ?? loan.total_payable ?? loan.principal)}
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-muted">Due date</span>
              <span className="font-semibold text-slate-900">{formatDate(loan.due_date ?? loan.next_due_date)}</span>
            </p>
          </div>
          <button
            type="button"
            disabled={loan.status !== 'active' || payoffMutation.isPending}
            onClick={() => payoffMutation.mutateAsync()}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loan.status === 'active' ? (payoffMutation.isPending ? 'Processing…' : 'Pay loan in full') : 'Repayment complete'}
          </button>
        </div>
      </motion.section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Repayment schedule</h2>
        <p className="text-xs text-muted">Detailed history of repayments and outstanding amounts.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Payment date</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Amount due</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Paid amount</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repayments.length ? (
                repayments.map((entry) => (
                  <tr key={entry.id ?? entry.payment_date}
                      className="hover:bg-primary/5">
                    <td className="px-4 py-3 text-slate-700">{formatDate(entry.payment_date ?? entry.paid_date ?? entry.due_date)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(entry.amount_due ?? entry.amount ?? 0)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(entry.paid_amount ?? 0)}</td>
                    <td className="px-4 py-3 text-right text-slate-600 capitalize">{entry.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">
                    Repayments will appear here after they are recorded.
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

export default LoanDetail;
