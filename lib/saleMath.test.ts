import { createId } from './id';
import { cartTotal, customerBalance, paymentMethod, remainingAfterPayment } from './saleMath';

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

assertEqual(cartTotal([{ quantity: 2, unitPrice: 8500 }]), 17000, 'cartTotal wax');
assertEqual(cartTotal([{ quantity: 1.5, unitPrice: 4000 }]), 6000, 'cartTotal voile');
assertEqual(remainingAfterPayment(28000, 10000), 18000, 'remaining');
assertEqual(paymentMethod(17000, 17000), 'cash', 'cash method');
assertEqual(paymentMethod(28000, 0), 'credit', 'credit method');
assertEqual(paymentMethod(28000, 10000), 'mixed', 'mixed method');
assertEqual(
  customerBalance(
    [
      { id: 'a', total: 28000, paid: 10000, created_at: '2026-01-01' },
      { id: 'b', total: 36000, paid: 0, created_at: '2026-01-02' },
    ],
    [{ amount: 5000 }]
  ),
  49000,
  'customer balance'
);

const id = createId();
if (!id || id.length < 8) {
  throw new Error('createId should return an identifier');
}

console.log('saleMath checks passed');
