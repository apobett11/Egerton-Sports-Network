export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const formatMoney = (amount: number | null | undefined): string => {
  if (!amount || amount <= 0) return '0';
  return `KSh ${amount.toLocaleString()}`;
};
