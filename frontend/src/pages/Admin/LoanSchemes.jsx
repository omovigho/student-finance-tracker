import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/api.js';
import { formatCurrency } from '../../utils/format.js';
import { useToast } from '../../components/Toast.jsx';
import useAuth from '../../hooks/useAuth.js';

const parseList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload)) return payload;
  return [];
};

const LoanSchemes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      lender_name: '',
      principal: '',
      interest_rate: '',
      term_months: ''
    }
  });

  const { data: schemesData, isLoading } = useQuery({
    queryKey: ['loan', 'schemes', 'admin'],
    queryFn: async () => {
      const { data } = await api.get('/api/loan/schemes/');
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/api/loan/schemes/', payload),
    onSuccess: () => {
      pushToast('Loan scheme created successfully.', 'success');
      reset();
      queryClient.invalidateQueries({ queryKey: ['loan', 'schemes'] });
      queryClient.invalidateQueries({ queryKey: ['loan', 'schemes', 'admin'] });
    },
    onError: () => pushToast('Unable to create loan scheme.', 'error')
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/api/loan/schemes/${id}/`, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan', 'schemes'] });
      queryClient.invalidateQueries({ queryKey: ['loan', 'schemes', 'admin'] });
    },
    onError: () => pushToast('Unable to update scheme status.', 'error')
  });

  const schemes = useMemo(() => parseList(schemesData), [schemesData]);

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      description: values.description,
      lender_name: values.lender_name,
      principal: Number(values.principal),
      interest_rate: Number(values.interest_rate),
      term_months: Number(values.term_months),
      is_active: true
    };
    await createMutation.mutateAsync(payload);
  };

  const handleToggle = (scheme) => {
    toggleMutation.mutate({ id: scheme.id, isActive: !scheme.is_active });
  };

  if (!(user?.role === 'admin' || user?.is_staff)) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted shadow-sm">
        You need administrator access to manage loan schemes.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Loan schemes</h1>
        <p className="text-sm text-muted">Create and manage loan templates available to students.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Create scheme</h2>
        <p className="text-xs text-muted">Fill in the loan details students will see before applying.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="scheme-name">
              Scheme name
            </label>
            <input
              id="scheme-name"
              type="text"
              required
              {...register('name')}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="scheme-description">
              Description
            </label>
            <textarea
              id="scheme-description"
              rows={3}
              {...register('description')}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="scheme-lender">
              Lender name
            </label>
            <input
              id="scheme-lender"
              type="text"
              required
              {...register('lender_name')}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="scheme-principal">
              Principal amount
            </label>
            <input
              id="scheme-principal"
              type="number"
              step="0.01"
              min="0"
              required
              {...register('principal')}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="scheme-interest">
              Interest rate (%)
            </label>
            <input
              id="scheme-interest"
              type="number"
              step="0.01"
              min="0"
              required
              {...register('interest_rate')}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="scheme-term">
              Term (months)
            </label>
            <input
              id="scheme-term"
              type="number"
              min="1"
              required
              {...register('term_months')}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {createMutation.isPending ? 'Creating…' : 'Create scheme'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Existing schemes</h2>
        <p className="text-xs text-muted">Toggle availability or review loan parameters.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Lender</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Principal</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Interest</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Term</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">Loading schemes…</td>
                </tr>
              ) : schemes.length ? (
                schemes.map((scheme) => (
                  <tr key={scheme.id}>
                    <td className="px-4 py-3 text-slate-700">{scheme.name}</td>
                    <td className="px-4 py-3 text-slate-600">{scheme.lender_name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(scheme.principal)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{scheme.interest_rate}%</td>
                    <td className="px-4 py-3 text-center text-slate-600">{scheme.term_months} months</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${scheme.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {scheme.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggle(scheme)}
                        disabled={toggleMutation.isPending}
                        className="inline-flex items-center justify-center rounded-lg border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                      >
                        {scheme.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">No loan schemes have been configured yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default LoanSchemes;
