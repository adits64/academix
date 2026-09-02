import React from 'react';
import { getInitials } from '@/utils/format';
import { cn } from '@/lib/utils';

/**
 * Reusable avatar component.
 * Shows the user's uploaded photo if available, otherwise falls back to initials.
 *
 * Props:
 *   user        – object with { name, avatar } (or null)
 *   size        – 'xs' | 'sm' | 'md' | 'lg' (default 'sm')
 *   className   – extra Tailwind classes for the wrapper
 *   onClick     – optional click handler
 */
const SIZE_MAP = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-20 w-20 text-2xl',
};

export function UserAvatar({ user, size = 'sm', className, onClick }) {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.sm;

  return (
    <div
      className={cn(
        'rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden shrink-0 select-none',
        sizeClass,
        onClick && 'cursor-pointer hover:ring-2 hover:ring-primary transition-all',
        className
      )}
      onClick={onClick}
    >
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user?.name || 'User'}
          className="h-full w-full object-cover"
          onError={(e) => {
            // If image fails to load, hide it and show initials instead
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        getInitials(user?.name || user?.email || '?')
      )}
    </div>
  );
}

export default UserAvatar;
