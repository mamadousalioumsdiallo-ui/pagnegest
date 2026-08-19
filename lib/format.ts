export function formatMoney(amount: number): string {
  const safe = Math.round(Number.isFinite(amount) ? amount : 0);
  const formatted = Math.abs(safe)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${safe < 0 ? '-' : ''}${formatted} F`;
}

export function parseMoney(input: string): number {
  const digits = input.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

export function formatQty(quantity: number): string {
  if (!Number.isFinite(quantity)) return '0';
  const rounded = Math.round(quantity * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded).replace('.', ',');
}

export function parseQty(input: string): number {
  const normalized = input.replace(/\s/g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function startOfDayISO(date = new Date()): string {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value.toISOString();
}

export function startOfMonthISO(date = new Date()): string {
  const value = new Date(date.getFullYear(), date.getMonth(), 1);
  value.setHours(0, 0, 0, 0);
  return value.toISOString();
}

export function daysAgoISO(days: number, date = new Date()): string {
  const value = new Date(date);
  value.setDate(value.getDate() - days);
  value.setHours(0, 0, 0, 0);
  return value.toISOString();
}

export function paymentLabel(method: string): string {
  if (method === 'cash') return 'Comptant';
  if (method === 'credit') return 'Crédit';
  if (method === 'mixed') return 'Acompte';
  return method;
}
