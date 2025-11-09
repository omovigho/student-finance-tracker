import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BanknotesIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { formatCurrency, formatDate, formatPercent } from '../utils/format.js';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-emerald-100 text-emerald-700',
  paid: 'bg-slate-900 text-white',
  closed: 'bg-red-100 text-red-700',
  defaulted: 'bg-red-200 text-red-700'
};

const LoanCard = ({ loan, onView, onPay, isPaying = false }) => {
  const shouldReduceMotion = useReducedMotion();

  const {
    label,
    lender,
    principal,
    interestRate,
    totalDue,
    outstanding,
    dueDate,
    progress
  } = useMemo(() => {
    const name = loan?.scheme?.name ?? loan?.name ?? loan?.title ?? 'Loan';
    const lenderName = loan?.scheme?.lender_name ?? loan?.lender_name ?? loan?.lender ?? 'Campus Finance Partner';
    const principalAmount = Number(loan?.principal ?? loan?.principal_amount ?? loan?.total_amount ?? 0);
    const interest = Number(loan?.interest_rate ?? 0);
    const total = Number(loan?.total_payable ?? loan?.total_amount ?? loan?.expected_amount ?? principalAmount);
    const outstandingBalance = Number(
      loan?.outstanding_balance ?? loan?.current_amount_due ?? loan?.balance ?? 0
    );
    const paid = Math.max(total - outstandingBalance, 0);
    const percentage = total > 0 ? Math.min((paid / total) * 100, 100) : loan?.progress ?? 0;
    return {
      label: name,
      lender: lenderName,
      principal: principalAmount,
      interestRate: interest,
      totalDue: total,
      outstanding: Math.max(outstandingBalance, 0),
      dueDate: loan?.due_date ?? loan?.next_due_date ?? loan?.expected_payment_date,
      progress: percentage
    };
  }, [loan]);

  const status = loan?.status ?? 'pending';

  return (
    <motion.article
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 text-primary">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <BanknotesIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{label}</h3>
            <p className="text-sm text-muted">{lender}</p>
          </div>
        </div>
        <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold capitalize', STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600')}>
          {status}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Principal</dt>
          <dd className="font-semibold text-slate-900">{formatCurrency(principal)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Total to repay</dt>
          <dd className="font-semibold text-slate-900">{formatCurrency(totalDue)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Interest rate</dt>
          <dd className="font-semibold text-slate-900">{interestRate ? `${interestRate}%` : '—'}</dd>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Due date</dt>
            <dd className="font-semibold text-slate-900">{formatDate(dueDate)}</dd>
          </div>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Outstanding</dt>
          <dd className="font-semibold text-slate-900">{formatCurrency(outstanding)}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-semibold text-muted">
          <span>Progress</span>
          <span>{formatPercent(progress)}</span>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.min(progress, 100)}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => onView?.(loan)}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          View details
        </button>
        {onPay && status === 'active' && (
          <button
            type="button"
            onClick={() => onPay?.(loan)}
            disabled={isPaying}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isPaying ? 'Processing…' : `Pay ${formatCurrency(outstanding || totalDue)}`}
          </button>
        )}
      </div>
    </motion.article>
  );
};

export default LoanCard;
