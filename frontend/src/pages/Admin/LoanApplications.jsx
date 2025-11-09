import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/api.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import { useToast } from '../../components/Toast.jsx';
import useAuth from '../../hooks/useAuth.js';

const parseList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload)) return payload;
  return [];
};

const LoanApplications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['loan', 'admin', 'history'],
    queryFn: async () => {
      const { data } = await api.get('/api/loan/loans/admin/history/');
      return data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: (loanId) => api.post(`/api/loan/loans/${loanId}/approve/`),
    onSuccess: () => {
      pushToast('Loan approved.', 'success');
      queryClient.invalidateQueries({ queryKey: ['loan', 'admin', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['loan', 'history'] });
    },
    onError: () => pushToast('Unable to approve loan.', 'error')
  });

  const declineMutation = useMutation({
    mutationFn: ({ id, note }) => api.post(`/api/loan/loans/${id}/decline/`, note ? { note } : {}),
    onSuccess: () => {
      pushToast('Loan declined.', 'info');
      queryClient.invalidateQueries({ queryKey: ['loan', 'admin', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['loan', 'history'] });
    },
    onError: () => pushToast('Unable to decline loan.', 'error')
  });

  const applications = useMemo(() => parseList(data?.results), [data]);
  const totals = data?.totals ?? {};

  const pending = applications.filter((loan) => loan.status === 'pending');
  const active = applications.filter((loan) => loan.status === 'active');
  const paid = applications.filter((loan) => loan.status === 'paid');
  const closed = applications.filter((loan) => loan.status === 'closed');

  const handleApprove = (loanId) => approveMutation.mutate(loanId);
  const handleDecline = (loanId) => {
    const note = window.prompt('Optional note for the student (leave blank to skip):');
    declineMutation.mutate({ id: loanId, note: note ?? '' });
  };

  if (!(user?.role === 'admin' || user?.is_staff)) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted shadow-sm">
        You need administrator access to review loan applications.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Loan applications</h1>
        <p className="text-sm text-muted">Review pending requests, approve funding, or decline with notes.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Pending" value={totals.pending} tone="warning" />
        <SummaryCard label="Active" value={totals.active} tone="success" />
        <SummaryCard label="Paid" value={totals.paid} />
        <SummaryCard label="Closed" value={totals.closed} tone="muted" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Pending approvals</h2>
        <p className="text-xs text-muted">Students awaiting a decision.</p>
        <LoanTable
          loading={isLoading}
          loans={pending}
          emptyMessage="No pending applications."
          actions={(loan) => (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleDecline(loan.id)}
                disabled={declineMutation.isPending}
                className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => handleApprove(loan.id)}
                disabled={approveMutation.isPending}
                className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white transition hover:bg-primary/90"
              >
                Approve
              </button>
            </div>
          )}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Active loans</h2>
        <p className="text-xs text-muted">Loans that have been approved but not yet repaid.</p>
        <LoanTable loading={isLoading} loans={active} emptyMessage="No active loans." />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Loan history</h2>
        <p className="text-xs text-muted">Previously paid or declined applications.</p>
        <LoanTable loading={isLoading} loans={[...paid, ...closed]} emptyMessage="No historical loans." />
      </section>
    </div>
  );
};

const LoanTable = ({ loading, loans, emptyMessage, actions }) => (
  <div className="mt-4 overflow-x-auto">
    <table className="min-w-full divide-y divide-slate-100 text-sm">
      <thead className="bg-slate-50">
        <tr>
          <th className="px-4 py-3 text-left font-semibold text-slate-600">Student</th>
          <th className="px-4 py-3 text-left font-semibold text-slate-600">Scheme</th>
          <th className="px-4 py-3 text-right font-semibold text-slate-600">Principal</th>
          <th className="px-4 py-3 text-right font-semibold text-slate-600">Interest</th>
          <th className="px-4 py-3 text-right font-semibold text-slate-600">Total repayable</th>
          <th className="px-4 py-3 text-right font-semibold text-slate-600">Due date</th>
          <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
          {actions && <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {loading ? (
          <tr>
            <td colSpan={actions ? 8 : 7} className="px-4 py-8 text-center text-muted">Loading loans…</td>
          </tr>
        ) : loans.length ? (
          loans.map((loan) => (
            <tr key={loan.id}>
              <td className="px-4 py-3 text-slate-700">{loan.user?.first_name ? `${loan.user.first_name} ${loan.user.last_name}` : loan.user?.email ?? '—'}</td>
              <td className="px-4 py-3 text-slate-600">{loan.scheme?.name ?? loan.lender_name}</td>
              <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(loan.principal)}</td>
              <td className="px-4 py-3 text-right text-slate-600">{loan.interest_rate}%</td>
              <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(loan.total_payable ?? loan.principal)}</td>
              <td className="px-4 py-3 text-right text-slate-600">{loan.due_date ? formatDate(loan.due_date) : '—'}</td>
              <td className="px-4 py-3 text-center">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${loan.status === 'active' ? 'bg-emerald-100 text-emerald-700' : loan.status === 'pending' ? 'bg-amber-100 text-amber-700' : loan.status === 'paid' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {loan.status}
                </span>
              </td>
              {actions && <td className="px-4 py-3 text-right">{actions(loan)}</td>}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={actions ? 8 : 7} className="px-4 py-8 text-center text-muted">{emptyMessage}</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const SummaryCard = ({ label, value = 0, tone = 'default' }) => {
  const toneStyles = {
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    muted: 'bg-slate-50 text-slate-600',
    default: 'bg-primary/10 text-primary'
  };
  return (
    <div className={`rounded-2xl border border-slate-200 p-5 ${toneStyles[tone] ?? toneStyles.default}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value ?? 0}</p>
    </div>
  );
};

export default LoanApplications;
