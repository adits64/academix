import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className, size = 'default', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-muted-foreground', className)}>
      <Loader2 className={cn('animate-spin text-primary mb-2', sizeClasses[size])} />
      {text && <p className="text-xs font-medium">{text}</p>}
    </div>
  );
}

export default LoadingSpinner;
