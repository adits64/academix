import { format as formatDateFn, isValid, parseISO } from 'date-fns';


export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rs. 0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0,
  }).format(amount).replace('NPR', 'Rs.');
}


export function formatDate(dateInput, formatStr = 'MMM dd, yyyy') {
  if (!dateInput) return 'N/A';
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) return 'Invalid Date';
  return formatDateFn(date, formatStr);
}


export function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
