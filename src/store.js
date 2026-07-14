// FlowCash data store — all persistence via LocalStorage, scoped per user.
import { uid } from './utils.js';

const KEYS = {
  users: 'flowcash:users',
  session: 'flowcash:session',
  incomes: (userId) => `flowcash:${userId}:incomes`,
  expenses: (userId) => `flowcash:${userId}:expenses`,
  categories: (userId) => `flowcash:${userId}:categories`,
};

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// ---- Default categories seeded on registration ----
const DEFAULT_CATEGORIES = [
  { id: uid(), name: 'Desenvolvimento Web', type: 'income' },
  { id: uid(), name: 'Manutenção', type: 'income' },
  { id: uid(), name: 'Consultoria', type: 'income' },
  { id: uid(), name: 'Landing Page', type: 'income' },
  { id: uid(), name: 'Loja Virtual', type: 'income' },
  { id: uid(), name: 'Hospedagem', type: 'expense' },
  { id: uid(), name: 'Domínio', type: 'expense' },
  { id: uid(), name: 'Internet', type: 'expense' },
  { id: uid(), name: 'Equipamentos', type: 'expense' },
  { id: uid(), name: 'Marketing', type: 'expense' },
  { id: uid(), name: 'Energia', type: 'expense' },
  { id: uid(), name: 'Transporte', type: 'expense' },
];

export const PAYMENT_METHODS = [
  'Pix', 'Cartão', 'Boleto', 'Transferência', 'Dinheiro',
];

const PAYMENT_ICONS = {
  Pix: 'bi-phone',
  Cartão: 'bi-credit-card',
  Boleto: 'bi-receipt',
  Transferência: 'bi-bank',
  Dinheiro: 'bi-cash-coin',
};

export const paymentIcon = (m) => PAYMENT_ICONS[m] || 'bi-circle';

// ---- Users / auth ----
export const getUsers = () => read(KEYS.users, []);

const saveUsers = (users) => write(KEYS.users, users);

export const getSession = () => read(KEYS.session, null);

export const setSession = (userId) => write(KEYS.session, { userId });

export const clearSession = () => localStorage.removeItem(KEYS.session);

export const getCurrentUser = () => {
  const session = getSession();
  if (!session) return null;
  return getUsers().find((u) => u.id === session.userId) || null;
};

export const registerUser = ({ name, email, password }) => {
  const users = getUsers();
  const exists = users.some(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (exists) return { ok: false, error: 'Já existe uma conta com este e-mail.' };

  const user = {
    id: uid(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  write(KEYS.categories(user.id), DEFAULT_CATEGORIES);
  return { ok: true, user };
};

export const loginUser = ({ email, password }) => {
  const user = getUsers().find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (!user) return { ok: false, error: 'E-mail não cadastrado.' };
  if (user.password !== password)
    return { ok: false, error: 'Senha incorreta.' };
  setSession(user.id);
  return { ok: true, user };
};

export const logout = () => {
  clearSession();
};

export const updateProfile = (userId, { name, email, password }) => {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return { ok: false, error: 'Usuário não encontrado.' };
  if (
    email &&
    users.some((u) => u.id !== userId && u.email.toLowerCase() === email.toLowerCase())
  )
    return { ok: false, error: 'Este e-mail já está em uso.' };
  users[idx] = {
    ...users[idx],
    name: name ? name.trim() : users[idx].name,
    email: email ? email.trim().toLowerCase() : users[idx].email,
    password: password ? password : users[idx].password,
  };
  saveUsers(users);
  return { ok: true, user: users[idx] };
};

// ---- Generic movement collection (income / expense) ----
const listKey = (userId, type) =>
  type === 'income' ? KEYS.incomes(userId) : KEYS.expenses(userId);

const getList = (userId, type) => read(listKey(userId, type), []);

const saveList = (userId, type, list) => write(listKey(userId, type), list);

const addMovement = (userId, type, data) => {
  const list = getList(userId, type);
  const item = { id: uid(), ...data };
  list.push(item);
  saveList(userId, type, list);
  return item;
};

const updateMovement = (userId, type, id, data) => {
  const list = getList(userId, type);
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...data, id };
  saveList(userId, type, list);
  return list[idx];
};

const deleteMovement = (userId, type, id) => {
  const list = getList(userId, type).filter((m) => m.id !== id);
  saveList(userId, type, list);
};

// ---- Income API ----
export const getIncomes = (userId) => getList(userId, 'income');
export const addIncome = (userId, data) => addMovement(userId, 'income', data);
export const updateIncome = (userId, id, data) =>
  updateMovement(userId, 'income', id, data);
export const deleteIncome = (userId, id) => deleteMovement(userId, 'income', id);

// ---- Expense API ----
export const getExpenses = (userId) => getList(userId, 'expense');
export const addExpense = (userId, data) => addMovement(userId, 'expense', data);
export const updateExpense = (userId, id, data) =>
  updateMovement(userId, 'expense', id, data);
export const deleteExpense = (userId, id) => deleteMovement(userId, 'expense', id);

// ---- Categories ----
export const getCategories = (userId) => read(KEYS.categories(userId), []);

export const getCategory = (userId, catId) =>
  getCategories(userId).find((c) => c.id === catId) || null;

export const addCategory = (userId, { name, type }) => {
  const cats = getCategories(userId);
  const exists = cats.some(
    (c) => c.type === type && c.name.toLowerCase() === name.trim().toLowerCase()
  );
  if (exists) return { ok: false, error: 'Categoria já existe.' };
  const cat = { id: uid(), name: name.trim(), type };
  cats.push(cat);
  write(KEYS.categories(userId), cats);
  return { ok: true, cat };
};

export const updateCategory = (userId, id, { name, type }) => {
  const cats = getCategories(userId);
  const idx = cats.findIndex((c) => c.id === id);
  if (idx === -1) return { ok: false, error: 'Categoria não encontrada.' };
  const dup = cats.some(
    (c) => c.id !== id && c.type === type && c.name.toLowerCase() === name.trim().toLowerCase()
  );
  if (dup) return { ok: false, error: 'Já existe uma categoria com este nome.' };
  cats[idx] = { ...cats[idx], name: name.trim(), type };
  write(KEYS.categories(userId), cats);
  return { ok: true, cat: cats[idx] };
};

export const deleteCategory = (userId, id) => {
  const cats = getCategories(userId).filter((c) => c.id !== id);
  write(KEYS.categories(userId), cats);
};

export const categoryUsage = (userId, catId) => {
  const inc = getIncomes(userId).filter((m) => m.categoryId === catId).length;
  const exp = getExpenses(userId).filter((m) => m.categoryId === catId).length;
  return inc + exp;
};

// ---- Combined helpers ----
export const allMovements = (userId) => {
  const incomes = getIncomes(userId).map((m) => ({ ...m, type: 'income' }));
  const expenses = getExpenses(userId).map((m) => ({ ...m, type: 'expense' }));
  return [...incomes, ...expenses].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  );
};

export const totals = (userId) => {
  const inc = getIncomes(userId).reduce((s, m) => s + Number(m.value) || 0, 0);
  const exp = getExpenses(userId).reduce((s, m) => s + Number(m.value) || 0, 0);
  return { income: inc, expense: exp, balance: inc - exp };
};

export const monthTotals = (userId, monthKeyStr) => {
  const inMonth = (m) => m.date.slice(0, 7) === monthKeyStr;
  const inc = getIncomes(userId).filter(inMonth).reduce((s, m) => s + Number(m.value), 0);
  const exp = getExpenses(userId).filter(inMonth).reduce((s, m) => s + Number(m.value), 0);
  return { income: inc, expense: exp, profit: inc - exp };
};
