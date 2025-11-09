import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { repaymentSchema } from '../utils/validators.js';

const defaultValues = {
  amount: '',
  paid_on: '',
  notes: ''
};

const LoanRepayForm = ({ defaultData, onSubmit, isSubmitting = false }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(repaymentSchema),
    defaultValues: defaultData ?? defaultValues
  });

  useEffect(() => {
    if (defaultData) {
      reset({ ...defaultValues, ...defaultData });
    }
  }, [defaultData, reset]);

  const submitHandler = (values) => {
    onSubmit?.({
      ...values,
      amount: Number(values.amount)
    });
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="repay-amount">
          Amount
        </label>
        <input
          id="repay-amount"
          type="number"
          step="0.01"
          min="0"
          {...register('amount')}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="0.00"
        />
        {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="repay-date">
          Payment date
        </label>
        <input
          id="repay-date"
          type="date"
          {...register('paid_on')}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {errors.paid_on && <p className="mt-1 text-xs text-red-600">{errors.paid_on.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="repay-notes">
          Notes
        </label>
        <textarea
          id="repay-notes"
          rows={3}
          {...register('notes')}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Optional details about this repayment"
        />
        {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? 'Submitting…' : 'Submit repayment'}
      </button>
    </form>
  );
};

export default LoanRepayForm;
