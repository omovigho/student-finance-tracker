import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { motion, useReducedMotion } from 'framer-motion';
import { formatCurrency, formatDate } from '../utils/format.js';

const tableVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 }
};

const TransactionTable = ({
  type = 'income',
  items = [],
  loading = false,
  onEdit
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-10 text-sm text-muted">
        Loading transactions…
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-12 text-sm text-muted">
        No transactions found for the selected filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[540px] overflow-y-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">{type === 'income' ? 'Source' : 'Merchant'}</th>
              {type === 'expense' && (
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Category</th>
              )}
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">Notes</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-600">Amount</th>
              <th scope="col" className="px-3 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((item) => (
              <motion.tr
                key={item.id ?? `${item.amount}-${item.created_at}`}
                initial={shouldReduceMotion ? false : tableVariants.hidden}
                animate={shouldReduceMotion ? { opacity: 1 } : tableVariants.visible}
                className="transition hover:bg-primary/5"
              >
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(type === 'income' ? item.date_received : item.date_spent)}</td>
                <td className="px-4 py-3 text-slate-700">{type === 'income' ? item.source : item.merchant}</td>
                {type === 'expense' && (
                  <td className="px-4 py-3 text-slate-500">{item.category_name ?? item.category_label ?? '—'}</td>
                )}
                <td className="px-4 py-3 text-slate-500">{item.notes ?? '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                  {formatCurrency(item.amount)}
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit?.(item)}
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    aria-label="Edit transaction"
                  >
                    <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
