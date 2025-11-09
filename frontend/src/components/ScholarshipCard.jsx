import { Link } from 'react-router-dom';
import { AcademicCapIcon, CheckCircleIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { motion, useReducedMotion } from 'framer-motion';
import { formatCurrency, formatDate } from '../utils/format.js';

const ScholarshipCard = ({ scholarship, onApply }) => {
  const shouldReduceMotion = useReducedMotion();
  const isOpen = Boolean(scholarship?.is_open);
  const hasApplied = Boolean(scholarship?.has_applied);

  return (
    <motion.article
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <AcademicCapIcon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{scholarship.name}</h3>
          <p className="text-sm text-muted">{scholarship.provider ?? 'Sponsored program'}</p>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm text-slate-600">{scholarship.description}</p>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <CurrencyDollarIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Award</dt>
            <dd className="font-semibold text-slate-900">{formatCurrency(scholarship.amount)}</dd>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Deadline</dt>
            <dd className="font-semibold text-slate-900">{formatDate(scholarship.deadline)}</dd>
          </div>
        </div>
      </dl>

      {hasApplied && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
          Already applied
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onApply?.(scholarship)}
          disabled={!isOpen || hasApplied}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {hasApplied ? 'Application submitted' : isOpen ? 'Apply now' : 'Closed'}
        </button>
        <Link
          to={`/scholarships/${scholarship.id}`}
          className="inline-flex items-center justify-center rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          View details
        </Link>
      </div>
    </motion.article>
  );
};

export default ScholarshipCard;
