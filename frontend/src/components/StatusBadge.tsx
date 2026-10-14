import { Badge } from '@/components/ui/badge';
import type { OrderStatus, ProjectStatus, SegmentType } from '@/api/types';
import {
  orderStatusLabels,
  projectStatusLabels,
  segmentTypeLabels,
} from '@/utils/labels';

interface StatusBadgeProps {
  type: 'segment' | 'project' | 'order';
  value: SegmentType | ProjectStatus | OrderStatus;
}

export function StatusBadge({ type, value }: StatusBadgeProps) {
  if (type === 'segment') {
    const segmentType = value as SegmentType;
    const label = segmentTypeLabels[segmentType] || segmentType;
    const isProject = segmentType === 'PROJECT';
    return (
      <Badge
        variant="outline"
        className={
          isProject
            ? 'border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
            : 'border-slate-500/30 bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300'
        }
      >
        {label}
      </Badge>
    );
  }

  if (type === 'project') {
    const projectStatus = value as ProjectStatus;
    const label = projectStatusLabels[projectStatus] || projectStatus;
    const colorClasses = {
      ACTIVE:
        'border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
      COMPLETED:
        'border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
      CANCELLED:
        'border-red-500/30 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    }[projectStatus] || '';

    return (
      <Badge variant="outline" className={colorClasses}>
        {label}
      </Badge>
    );
  }

  if (type === 'order') {
    const orderStatus = value as OrderStatus;
    const label = orderStatusLabels[orderStatus] || orderStatus;
    const colorClasses = {
      PENDING:
        'border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
      AUTHORIZED:
        'border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
      DELIVERED:
        'border-indigo-500/30 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400',
      INVOICED:
        'border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
      CANCELLED:
        'border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
    }[orderStatus] || '';

    return (
      <Badge variant="outline" className={colorClasses}>
        {label}
      </Badge>
    );
  }

  return null;
}
