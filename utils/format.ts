/**
 * Formats a number as Indonesian Rupiah (IDR)
 * @param amount - The number to format
 * @param compact - Whether to use compact notation (e.g., 1jt instead of 1.000.000)
 * @returns Formatted currency string
 */
export const formatIDR = (amount: number, compact: boolean = false): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...(compact ? { notation: "compact", compactDisplay: "short" } : {}),
  }).format(amount);
};

/**
 * Formats a number with IDR style decimal/thousand separators but without the Rp prefix
 * Useful for inputs or simple labels
 */
export const formatNumberID = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
