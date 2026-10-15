import { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const months = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

interface MonthYearPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MonthYearPicker({
  value,
  onChange,
  className,
}: MonthYearPickerProps) {
  const [yearPart, monthPart] = value.split('-');
  const selectedYear = Number(yearPart);
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = Math.min(currentYear - 10, selectedYear || currentYear);
    const endYear = Math.max(currentYear + 5, selectedYear || currentYear);
    return Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => startYear + index,
    );
  }, [selectedYear]);

  function updateMonthYear(month: string, year: string) {
    if (month && year) onChange(`${year}-${month}`);
  }

  return (
    <div className={cn('grid grid-cols-[minmax(0,1fr)_7rem] gap-2', className)}>
      <Select
        value={monthPart}
        onValueChange={(month) => updateMonthYear(month, yearPart)}
      >
        <SelectTrigger aria-label="Mês">
          <Calendar className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          {months.map((month, index) => (
            <SelectItem
              key={month}
              value={String(index + 1).padStart(2, '0')}
            >
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={yearPart}
        onValueChange={(year) => updateMonthYear(monthPart, year)}
      >
        <SelectTrigger aria-label="Ano">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
