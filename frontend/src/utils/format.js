const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});

export const formatCurrency = (value) => {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return '₦0';
  try {
    return currencyFormatter.format(amount);
  } catch (error) {
    return `₦${amount.toLocaleString()}`;
  }
};

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateFormatter.format(date);
};

export const formatPercent = (value) => {
  if (value == null) return '0%';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '0%';
  const percent = numeric > 1 && numeric <= 100 ? numeric : numeric * 100;
  return `${percent.toFixed(1)}%`;
};

export const statusColor = (status) => {
  const normalised = String(status ?? '').toLowerCase();
  switch (normalised) {
    case 'approved':
    case 'completed':
      return 'bg-emerald-100 text-emerald-700';
    case 'pending':
    case 'in_review':
      return 'bg-amber-100 text-amber-700';
    case 'rejected':
    case 'overdue':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};
