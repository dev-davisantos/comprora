import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * MoneyInput handles converting Portuguese currency input (e.g. "1234,56")
 * into normalized decimal string ("1234.56") with 2 decimal places.
 */
export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, value = '', onChange, onBlur, ...props }, ref) => {
    // Internal display value so user can type naturally with commas
    const [displayValue, setDisplayValue] = React.useState<string>(() => {
      if (!value) return '';
      return value.replace('.', ',');
    });

    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(value.replace('.', ','));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow only digits, comma and dot
      const filtered = raw.replace(/[^\d.,]/g, '');
      setDisplayValue(filtered);

      // Normalize for parent (replace comma with dot)
      const normalized = filtered.replace(',', '.');
      onChange?.(normalized);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const num = parseFloat(displayValue.replace(',', '.'));
      if (!isNaN(num)) {
        const formatted = num.toFixed(2);
        setDisplayValue(formatted.replace('.', ','));
        onChange?.(formatted);
      }
      onBlur?.(e);
    };

    return (
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 text-sm text-muted-foreground">
          R$
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="0,00"
          className={cn('pl-9 font-mono', className)}
          {...props}
        />
      </div>
    );
  },
);
MoneyInput.displayName = 'MoneyInput';
