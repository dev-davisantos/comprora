import type { DecimalString, IsoDate } from '@/api/types';

const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** "1234.56" → "R$ 1.234,56" */
export function formatMoney(value: DecimalString): string {
  return moneyFormatter.format(Number(value));
}

/** ISO string → "dd/mm/aaaa" */
export function formatDate(iso: IsoDate): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** ISO string → "YYYY-MM" */
export function toMonthString(iso: IsoDate): string {
  return iso.slice(0, 7);
}

