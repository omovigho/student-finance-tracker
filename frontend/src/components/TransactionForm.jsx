import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { transactionSchema } from '../utils/validators.js';
import api from '../api/api.js';

const defaultFormValues = {
  source: '',
  merchant: '',
  date_received: '',
  date_spent: '',
  amount: '',
  notes: '',
  category: ''
};

const TransactionForm = ({
  type = 'income',
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  isSubmitting = false
}) => {
  const dateField = useMemo(() => (type === 'income' ? 'date_received' : 'date_spent'), [type]);
  const primaryField = useMemo(() => (type === 'income' ? 'source' : 'merchant'), [type]);

  const form = useForm({
    resolver: yupResolver(transactionSchema(type)),
    defaultValues: defaultValues ?? defaultFormValues
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = form;

  const { data: categoriesData } = useQuery({
    queryKey: ['finance', 'categories', 'options'],
    queryFn: async () => {
      const { data } = await api.get('/api/finance/categories/');
      return data;
    },
    enabled: type === 'expense'
  });

  const categories = useMemo(() => {
    if (!categoriesData) return [];
    if (Array.isArray(categoriesData.results)) return categoriesData.results;
    if (Array.isArray(categoriesData)) return categoriesData;
    return [];
  }, [categoriesData]);

  useEffect(() => {
    if (defaultValues) {
      reset({ ...defaultFormValues, ...defaultValues });
    }
  }, [defaultValues, reset]);

  const submitHandler = (values) => {
    const payload = {
      amount: values.amount,
      notes: values.notes ?? ''
    };

    if (type === 'income') {
      payload.source = values.source;
      payload.date_received = values.date_received;
    } else {
      payload.merchant = values.merchant;
      payload.date_spent = values.date_spent;
      const categoryValue = Number.isNaN(values.category) ? null : values.category;
      payload.category = categoryValue;
    }

    onSubmit?.(payload, form);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor={`${type}-${primaryField}`}>
            {type === 'income' ? 'Source' : 'Merchant'}
          </label>
          <input
            id={`${type}-${primaryField}`}
            type="text"
            {...register(primaryField)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder={type === 'income' ? 'e.g. Research Grant' : 'e.g. Bookstore'}
          />
          {errors[primaryField] && <p className="mt-1 text-xs text-red-600">{errors[primaryField].message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor={`${type}-${dateField}`}>
            {type === 'income' ? 'Date received' : 'Date spent'}
          </label>
          <input
            id={`${type}-${dateField}`}
            type="date"
            {...register(dateField)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {errors[dateField] && <p className="mt-1 text-xs text-red-600">{errors[dateField].message}</p>}
        </div>
      </div>

      {type === 'expense' && (
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="expense-category">
            Category
          </label>
          <select
            id="expense-category"
            {...register('category', { valueAsNumber: true })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name ?? category.category}
              </option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
          {!categories.length && (
            <p className="mt-1 text-xs text-muted">
              Ask an administrator to add categories before logging expenses.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor={`${type}-amount`}>
            Amount
          </label>
          <input
            id={`${type}-amount`}
            type="number"
            step="0.01"
            min="0"
            {...register('amount')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="0.00"
          />
          {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor={`${type}-notes`}>
          Notes <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id={`${type}-notes`}
          rows={3}
          {...register('notes')}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Add helpful context"
        />
        {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>}
      </div>

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={() => onCancel?.()}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
