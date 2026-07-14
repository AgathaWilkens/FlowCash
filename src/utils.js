// Utility helpers for FlowCash

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);

export const formatDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

export const formatDateShort = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const monthKey = (iso) => iso.slice(0, 7); // YYYY-MM

export const currentMonthKey = () => todayISO().slice(0, 7);

export const monthLabel = (key) => {
  const [y, m] = key.split('-');
  const names = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return `${names[Number(m) - 1]} ${y}`;
};

export const escapeHtml = (str) =>
  String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

export const initials = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?';

export const debounce = (fn, ms = 250) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

// ---- Brazilian currency mask ----
// Parses a pt-BR formatted string ("1.800,00", "0,50", "1234,56") into a Number.
export const parseCurrency = (str) => {
  if (str == null) return 0;
  const clean = String(str)
    .replace(/[^\d.,-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '') // strip thousand separators (pt-BR: .)
    .replace(',', '.');
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
};

// Formats a Number into the pt-BR display string ("1.800,00").
export const formatCurrencyInput = (value) => {
  const n = Math.abs(Number(value) || 0);
  const fixed = n.toFixed(2);
  const [int, dec] = fixed.split('.');
  const intGrouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intGrouped},${dec}`;
};

// Attaches a live pt-BR currency mask to an <input> (type="text").
// Returns a getter that yields the current numeric value.
export const attachCurrencyMask = (input) => {
  const apply = () => {
    const raw = input.value.replace(/[^\d]/g, '');
    const num = raw ? parseInt(raw, 10) / 100 : 0;
    input.value = formatCurrencyInput(num);
    return num;
  };

  input.value = formatCurrencyInput(parseCurrency(input.value));

  input.addEventListener('input', () => {
    const pos = input.selectionStart;
    const before = input.value;
    apply();
    // keep caret at a sensible position after reformatting
    const delta = input.value.length - before.length;
    let next = (pos ?? input.value.length) + delta;
    if (next < 0) next = 0;
    if (next > input.value.length) next = input.value.length;
    try { input.setSelectionRange(next, next); } catch {}
  });

  input.addEventListener('blur', () => {
    const num = parseCurrency(input.value);
    input.value = formatCurrencyInput(num);
  });

  return () => parseCurrency(input.value);
};
