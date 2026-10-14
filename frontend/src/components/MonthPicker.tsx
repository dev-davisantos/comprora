import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface MonthPickerProps {
  value?: string; // "YYYY-MM"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MonthPicker({
  value = '',
  onChange,
  className,
  disabled = false,
}: MonthPickerProps) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <CalendarIcon className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
      <Input
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="pl-9 pr-8 font-medium"
      />
      {value && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange('')}
          className="absolute right-1 h-6 w-6 text-muted-foreground hover:text-foreground"
          title="Limpar mês"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
