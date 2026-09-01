import React from 'react';
import { FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon = FolderOpen,
  title = 'No data found',
  description = 'There are no items to display at this time.',
  action,
  className,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-muted bg-card/50 my-4', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export default EmptyState;
