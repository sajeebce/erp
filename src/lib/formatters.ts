export function formatBDT(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCrore(amount: number): string {
  const crore = amount / 10000000;
  return `৳${crore.toFixed(1)} Cr`;
}

export function formatLakh(amount: number): string {
  const lakh = amount / 100000;
  return `৳${lakh.toFixed(1)} L`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
