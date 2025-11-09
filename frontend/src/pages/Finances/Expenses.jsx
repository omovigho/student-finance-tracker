import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import api from '../../api/api.js';
import TransactionForm from '../../components/TransactionForm.jsx';
import TransactionTable from '../../components/TransactionTable.jsx';
import { useToast } from '../../components/Toast.jsx';

const Expenses = () => {
  const [filters, setFilters] = useState({ search: '', start_date: '', end_date: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const queryFilters = useMemo(() => {
    const cleaned = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {});
    return cleaned;
  }, [filters]);

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['finance', 'expenses', queryFilters],
    queryFn: async () => {
      const { data } = await api.get('/api/finance/expenses/', { params: queryFilters });
      return data;
    }
  });

  const expenses = useMemo(() => {
    if (!expensesData) return [];
    if (Array.isArray(expensesData.results)) return expensesData.results;
    if (Array.isArray(expensesData)) return expensesData;
    return [];
  }, [expensesData]);

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/api/finance/expenses/', payload),
    onSuccess: () => {
      pushToast('Expense logged successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] });
    },
    onError: () => {
      pushToast('Unable to log expense. Try again.', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/api/finance/expenses/${id}/`, payload),
    onSuccess: () => {
      pushToast('Expense updated.', 'success');
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] });
      setSelectedTransaction(null);
      setIsEditing(false);
    },
    onError: () => {
      pushToast('Unable to update expense.', 'error');
    }
  });

  const handleCreate = async (payload, form) => {
    await createMutation.mutateAsync(payload);
    form.reset();
  };

  const handleUpdate = async (payload) => {
    if (!selectedTransaction) return;
    await updateMutation.mutateAsync({ id: selectedTransaction.id, payload });
  };

  const handleEditRequest = (transaction) => {
    const normalised = {
      id: transaction.id,
      amount: transaction.amount,
      merchant: transaction.merchant,
      notes: transaction.notes ?? '',
      date_spent: transaction.date_spent,
      category: transaction.category ?? ''
    };
    setSelectedTransaction(normalised);
    setIsEditing(true);
  };

  const closeModal = () => {
    setIsEditing(false);
    setSelectedTransaction(null);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Expense tracker</h1>
          <p className="text-sm text-muted">Monitor outflows and stay within budget limits.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <input
            type="search"
            placeholder="Search merchant or notes"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Search expenses"
          />
          <input
            type="date"
            value={filters.start_date}
            onChange={(event) => setFilters((prev) => ({ ...prev, start_date: event.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Start date"
          />
          <input
            type="date"
            value={filters.end_date}
            onChange={(event) => setFilters((prev) => ({ ...prev, end_date: event.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="End date"
          />
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-base font-semibold text-slate-900">Log a new expense</h2>
          <p className="mt-1 text-xs text-muted">Categorise spending to surface optimisation opportunities.</p>
          <div className="mt-4">
            <TransactionForm
              type="expense"
              onSubmit={handleCreate}
              submitLabel={createMutation.isPending ? 'Saving…' : 'Save expense'}
              isSubmitting={createMutation.isPending}
            />
          </div>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
        >
          <TransactionTable type="expense" items={expenses} loading={isLoading} onEdit={handleEditRequest} />
        </motion.div>
      </section>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Edit expense</h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-muted hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
              <div className="mt-4">
                <TransactionForm
                  type="expense"
                  defaultValues={selectedTransaction}
                  onSubmit={handleUpdate}
                  onCancel={closeModal}
                  submitLabel={updateMutation.isPending ? 'Updating…' : 'Update expense'}
                  isSubmitting={updateMutation.isPending}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Expenses;
