// Shared list renderer for Receitas and Despesas (search + filters + table + CRUD).
import {
  getIncomes,
  getExpenses,
  getCategory,
  getCategories,
  deleteIncome,
  deleteExpense,
  paymentIcon,
  PAYMENT_METHODS,
} from '../store.js';
import { formatCurrency, formatDate, escapeHtml, debounce } from '../utils.js';
import { toast } from '../toast.js';
import { confirmDialog } from '../modal.js';
import { openMovementModal } from './movement-modal.js';

export function renderMovementList(root, { user, type, refresh }) {
  const isIn = type === 'income';
  const T = {
    income: { title: 'Receitas', subtitle: 'Entradas de dinheiro do seu trabalho', btn: 'btn-income', add: 'Nova receita', icon: 'bi-arrow-down-circle-fill' },
    expense: { title: 'Despesas', subtitle: 'Saídas e custos da sua operação', btn: 'btn-expense', add: 'Nova despesa', icon: 'bi-arrow-up-circle-fill' },
  }[type];

  const getList = () => (isIn ? getIncomes(user.id) : getExpenses(user.id));

  root.innerHTML = `
    <div class="fc-section-head">
      <div>
        <h2 class="fc-page-title"><i class="bi ${T.icon} me-1"></i>${T.title}</h2>
        <p class="fc-page-subtitle">${T.subtitle}</p>
      </div>
      <button class="btn ${T.btn}" id="addMoveBtn"><i class="bi bi-plus-lg"></i> ${T.add}</button>
    </div>

    <div class="fc-card fc-card-pad mb-4">
      <div class="fc-toolbar">
        <div class="fc-search">
          <i class="bi bi-search"></i>
          <input type="text" class="form-control" id="filterSearch" placeholder="Buscar por descrição…" />
        </div>
        <select class="form-select" id="filterCat" style="max-width:200px">
          <option value="">Todas categorias</option>
        </select>
        <select class="form-select" id="filterPay" style="max-width:170px">
          <option value="">Pagamento</option>
          ${PAYMENT_METHODS.map((p) => `<option value="${p}">${p}</option>`).join('')}
        </select>
        <div class="d-flex align-items-center gap-2">
          <input type="date" class="form-control" id="filterFrom" title="De" style="max-width:160px" />
          <input type="date" class="form-control" id="filterTo" title="Até" style="max-width:160px" />
        </div>
        <button class="btn btn-light" id="clearFilters"><i class="bi bi-x-lg"></i></button>
      </div>
    </div>

    <div class="fc-card">
      <div class="fc-table-wrap">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Pagamento</th>
              <th class="text-end">Valor</th>
              <th class="text-end">Ações</th>
            </tr>
          </thead>
          <tbody id="moveBody"></tbody>
        </table>
      </div>
      <div id="moveEmpty"></div>
    </div>
  `;

  // populate category filter
  const catSel = root.querySelector('#filterCat');
  getCategories(user.id)
    .filter((c) => c.type === type)
    .forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      catSel.appendChild(opt);
    });

  const body = root.querySelector('#moveBody');
  const empty = root.querySelector('#moveEmpty');

  const filters = { search: '', cat: '', pay: '', from: '', to: '' };

  const applyFilters = debounce(() => renderRows(), 150);

  function getFiltered() {
    const q = filters.search.toLowerCase();
    return getList()
      .filter((m) => {
        if (q && !m.description.toLowerCase().includes(q)) return false;
        if (filters.cat && m.categoryId !== filters.cat) return false;
        if (filters.pay && m.payment !== filters.pay) return false;
        if (filters.from && m.date < filters.from) return false;
        if (filters.to && m.date > filters.to) return false;
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }

  function renderRows() {
    const items = getFiltered();
    if (!items.length) {
      body.innerHTML = '';
      empty.innerHTML = `
        <div class="fc-empty">
          <i class="bi bi-inboxes"></i>
          <h5>Nenhuma ${isIn ? 'receita' : 'despesa'} encontrada</h5>
          <p class="mb-0">Ajuste os filtros ou cadastre uma nova ${isIn ? 'receita' : 'despesa'}.</p>
        </div>`;
      return;
    }
    empty.innerHTML = '';
    body.innerHTML = items.map((m) => rowHTML(m)).join('');
  }

  function rowHTML(m) {
    const cat = getCategory(user.id, m.categoryId);
    const badgeClass = isIn ? 'fc-badge-income' : 'fc-badge-expense';
    return `
      <tr>
        <td class="fc-sub-text">${formatDate(m.date)}</td>
        <td class="fc-desc">${escapeHtml(m.description)}</td>
        <td><span class="fc-badge ${badgeClass}">${escapeHtml(cat?.name || '—')}</span></td>
        <td><span class="fc-pay"><i class="bi ${paymentIcon(m.payment)}"></i> ${m.payment}</span></td>
        <td class="text-end fc-mono ${isIn ? 'text-income' : 'text-expense'}">
          ${isIn ? '+' : '−'} ${formatCurrency(m.value)}
        </td>
        <td>
          <div class="fc-row-actions">
            <button class="fc-icon-btn" data-edit="${m.id}" title="Editar"><i class="bi bi-pencil"></i></button>
            <button class="fc-icon-btn danger" data-del="${m.id}" title="Excluir"><i class="bi bi-trash3"></i></button>
          </div>
        </td>
      </tr>
    `;
  }

  // events
  root.querySelector('#addMoveBtn').addEventListener('click', () => {
    openMovementModal({ type, userId: user.id, existing: null, onSaved: () => refresh() });
  });

  root.querySelector('#filterSearch').addEventListener('input', (e) => {
    filters.search = e.target.value;
    applyFilters();
  });
  root.querySelector('#filterCat').addEventListener('change', (e) => {
    filters.cat = e.target.value;
    renderRows();
  });
  root.querySelector('#filterPay').addEventListener('change', (e) => {
    filters.pay = e.target.value;
    renderRows();
  });
  root.querySelector('#filterFrom').addEventListener('change', (e) => {
    filters.from = e.target.value;
    renderRows();
  });
  root.querySelector('#filterTo').addEventListener('change', (e) => {
    filters.to = e.target.value;
    renderRows();
  });
  root.querySelector('#clearFilters').addEventListener('click', () => {
    filters.search = filters.cat = filters.pay = filters.from = filters.to = '';
    root.querySelector('#filterSearch').value = '';
    root.querySelector('#filterCat').value = '';
    root.querySelector('#filterPay').value = '';
    root.querySelector('#filterFrom').value = '';
    root.querySelector('#filterTo').value = '';
    renderRows();
  });

  body.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-edit]');
    const delBtn = e.target.closest('[data-del]');
    if (editBtn) {
      const m = getList().find((x) => x.id === editBtn.dataset.edit);
      if (m) openMovementModal({ type, userId: user.id, existing: m, onSaved: () => refresh() });
    }
    if (delBtn) {
      const m = getList().find((x) => x.id === delBtn.dataset.del);
      if (!m) return;
      const ok = await confirmDialog({
        title: `Excluir ${isIn ? 'receita' : 'despesa'}`,
        message: `Deseja excluir "${escapeHtml(m.description)}" (${formatCurrency(m.value)})? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
      });
      if (!ok) return;
      isIn ? deleteIncome(user.id, m.id) : deleteExpense(user.id, m.id);
      toast(`${isIn ? 'Receita' : 'Despesa'} excluída.`, 'success');
      refresh();
    }
  });

  renderRows();
}
