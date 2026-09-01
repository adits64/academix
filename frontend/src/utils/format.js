import { format as formatDateFn, isValid, parseISO } from 'date-fns';

/**
 * Format currency in NPR / INR or local currency
 * @param {number} amount 
 * @returns {string}
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rs. 0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0,
  }).format(amount).replace('NPR', 'Rs.');
}

/**
 * Format date string safely
 * @param {string|Date} dateInput 
 * @param {string} formatStr 
 * @returns {string}
 */
export function formatDate(dateInput, formatStr = 'MMM dd, yyyy') {
  if (!dateInput) return 'N/A';
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) return 'Invalid Date';
  return formatDateFn(date, formatStr);
}

/**
 * Get initials from full name
 * @param {string} name 
 * @returns {string}
 */
export function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
