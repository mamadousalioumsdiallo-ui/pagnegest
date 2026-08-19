export type SaleBalance = {
  id: string;
  total: number;
  paid: number;
  created_at: string;
};

export type PaymentAmount = {
  amount: number;
};

export function lineTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice);
}

export function cartTotal(items: { quantity: number; unitPrice: number }[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item.quantity, item.unitPrice), 0);
}

export function remainingAfterPayment(total: number, paid: number): number {
  return Math.max(0, Math.round(total) - Math.round(paid));
}

export function paymentMethod(total: number, paid: number): 'cash' | 'credit' | 'mixed' {
  const remaining = remainingAfterPayment(total, paid);
  if (remaining === 0) return 'cash';
  if (paid <= 0) return 'credit';
  return 'mixed';
}

export function customerBalance(sales: SaleBalance[], payments: PaymentAmount[]): number {
  const owed = sales.reduce((sum, sale) => sum + remainingAfterPayment(sale.total, sale.paid), 0);
  const later = payments.reduce((sum, payment) => sum + Math.max(0, payment.amount), 0);
  return Math.max(0, owed - later);
}

export function remainingBySale(
  sales: SaleBalance[],
  payments: PaymentAmount[]
): Record<string, number> {
  const ordered = [...sales].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const remaining: Record<string, number> = {};
  for (const sale of ordered) {
    remaining[sale.id] = remainingAfterPayment(sale.total, sale.paid);
  }

  let pool = payments.reduce((sum, payment) => sum + Math.max(0, payment.amount), 0);
  for (const sale of ordered) {
    if (pool <= 0) break;
    const take = Math.min(remaining[sale.id], pool);
    remaining[sale.id] -= take;
    pool -= take;
  }
  return remaining;
}
