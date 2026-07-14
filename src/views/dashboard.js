// Dashboard view — stat cards + recent movements.
import {
  totals,
  allMovements,
  getCategory,
  paymentIcon,
} from '../store.js';
import { formatCurrency, formatDateShort, escapeHtml, monthLabel, currentMonthKey } from '../utils.js';
import { monthTotals } from '../store.js';

export function renderDashboard(root, { user }) {
  const t = totals(user.id);
  const mt = monthTotals(user.id, currentMonthKey());
  const recent = allMovements(user.id).slice(0, 6);

  root.innerHTML = `
    <div class="fc-section-head">
      <div>
        <h2 class="fc-page-title">Dashboard</h2>
        <p class="fc-page-subtitle">Visão geral das suas finanças · ${monthLabel(currentMonthKey())}</p>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-sm-6 col-xl-3">
        <div class="fc-stat fc-stat-balance">
          <div class="fc-stat-icon"><i class="bi bi-wallet2"></i></div>
          <p class="fc-stat-label">Saldo atual</p>
          <p class="fc-stat-value ${t.balance < 0 ? 'text-expense' : 'text-income'}">${formatCurrency(t.balance)}</p>
          <p class="fc-stat-sub">Total acumulado</p>
        </div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="fc-stat fc-stat-income">
          <div class="fc-stat-icon"><i class="bi bi-arrow-down-circle"></i></div>
          <p class="fc-stat-label">Total receitas</p>
          <p class="fc-stat-value text-income">${formatCurrency(t.income)}</p>
          <p class="fc-stat-sub">Este mês: ${formatCurrency(mt.income)}</p>
        </div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="fc-stat fc-stat-expense">
          <div class="fc-stat-icon"><i class="bi bi-arrow-up-circle"></i></div>
          <p class="fc-stat-label">Total despesas</p>
          <p class="fc-stat-value text-expense">${formatCurrency(t.expense)}</p>
          <p class="fc-stat-sub">Este mês: ${formatCurrency(mt.expense)}</p>
        </div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="fc-stat fc-stat-profit">
          <div class="fc-stat-icon"><i class="bi bi-graph-up-arrow"></i></div>
          <p class="fc-stat-label">Lucro do período</p>
          <p class="fc-stat-value ${mt.profit < 0 ? 'text-expense' : 'text-income'}">${formatCurrency(mt.profit)}</p>
          <p class="fc-stat-sub">Resultado do mês</p>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-lg-7">
        <div class="fc-card fc-card-pad h-100">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0 fw-bold">Últimas movimentações</h5>
            <span class="fc-badge fc-badge-neutral">${recent.length} recentes</span>
          </div>
          ${
            recent.length === 0
              ? emptyState('Nenhuma movimentação ainda.', 'Registre sua primeira receita ou despesa.')
              : recent.map((m) => moveRow(user, m)).join('')
          }
        </div>
      </div>
      <div class="col-lg-5">
        <div class="fc-card fc-card-pad h-100">
          <h5 class="mb-3 fw-bold">Resumo do mês</h5>
          <div class="mb-3">
            <div class="d-flex justify-content-between mb-1">
              <span class="fc-sub-text">Receitas</span>
              <strong class="text-income">${formatCurrency(mt.income)}</strong>
            </div>
            <div class="progress" style="height:8px">
              <div class="progress-bar bg-success" style="width:${pct(mt.income, mt.income + mt.expense)}%"></div>
            </div>
          </div>
          <div class="mb-3">
            <div class="d-flex justify-content-between mb-1">
              <span class="fc-sub-text">Despesas</span>
              <strong class="text-expense">${formatCurrency(mt.expense)}</strong>
            </div>
            <div class="progress" style="height:8px">
              <div class="progress-bar bg-danger" style="width:${pct(mt.expense, mt.income + mt.expense)}%"></div>
            </div>
          </div>
          <hr class="fc-divider" />
          <div class="d-flex justify-content-between align-items-center">
            <span class="fw-semibold">Lucro</span>
            <strong class="fs-5 ${mt.profit < 0 ? 'text-expense' : 'text-income'}">${formatCurrency(mt.profit)}</strong>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <span class="fc-sub-text">Total de movimentações</span>
            <strong>${allMovements(user.id).length}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

function pct(part, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

function moveRow(user, m) {
  const cat = getCategory(user.id, m.categoryId);
  const isIn = m.type === 'income';
  return `
    <div class="fc-list-move-item">
      <span class="fc-list-move-icon ${m.type}">
        <i class="bi ${isIn ? 'bi-arrow-down' : 'bi-arrow-up'}"></i>
      </span>
      <div class="fc-list-move-meta">
        <p class="fc-list-move-title">${escapeHtml(m.description)}</p>
        <p class="fc-list-move-sub">
          ${escapeHtml(cat?.name || 'Sem categoria')} ·
          <i class="bi ${paymentIcon(m.payment)}"></i> ${m.payment} · ${formatDateShort(m.date)}
        </p>
      </div>
      <span class="fc-list-move-amount ${isIn ? 'text-income' : 'text-expense'}">
        ${isIn ? '+' : '−'} ${formatCurrency(m.value)}
      </span>
    </div>
  `;
}

function emptyState(title, sub) {
  return `
    <div class="fc-empty">
      <i class="bi bi-inboxes"></i>
      <h5>${title}</h5>
      <p class="mb-0">${sub}</p>
    </div>
  `;
}
