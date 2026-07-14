// Shared movement form used by Receitas and Despesas (Bootstrap modal, no reload).
import { openModal } from '../modal.js';
import { toast } from '../toast.js';
import {
  getCategories,
  addIncome,
  updateIncome,
  addExpense,
  updateExpense,
  PAYMENT_METHODS,
  paymentIcon,
} from '../store.js';
import { todayISO, formatDate, escapeHtml, attachCurrencyMask, parseCurrency, formatCurrencyInput } from '../utils.js';

const FIELD_LABELS = {
  income: {
    title: 'Receita', singular: 'receita', btn: 'btn-income',
    icon: 'bi-arrow-down-circle', actionAdd: 'Registrar receita', actionEdit: 'Salvar alterações',
  },
  expense: {
    title: 'Despesa', singular: 'despesa', btn: 'btn-expense',
    icon: 'bi-arrow-up-circle', actionAdd: 'Registrar despesa', actionEdit: 'Salvar alterações',
  },
};

function buildFormHTML(type, cats, existing) {
  const catOptions = cats
    .map(
      (c) =>
        `<option value="${c.id}" ${existing?.categoryId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
    )
    .join('');
  const payOptions = PAYMENT_METHODS.map(
    (p) =>
      `<option value="${p}" ${existing?.payment === p ? 'selected' : ''}>${p}</option>`
  ).join('');

  return `
    <form id="moveForm" novalidate>
      <div class="row g-3">
        <div class="col-12">
          <label class="form-label" for="mValue">Valor (R$) *</label>
          <div class="input-group">
            <span class="input-group-text">R$</span>
            <input type="text" inputmode="numeric" class="form-control fc-currency" id="mValue"
              value="${existing?.value != null ? formatCurrencyInput(existing.value) : ''}" placeholder="0,00" required />
          </div>
          <div class="invalid-feedback">Informe um valor maior que zero.</div>
        </div>

        <div class="col-12">
          <label class="form-label" for="mDesc">Descrição *</label>
          <input type="text" class="form-control" id="mDesc"
            value="${existing ? escapeHtml(existing.description) : ''}" placeholder="Ex.: Projeto site institucional" required />
          <div class="invalid-feedback">Informe uma descrição.</div>
        </div>

        <div class="col-md-6">
          <label class="form-label" for="mCat">Categoria *</label>
          <select class="form-select" id="mCat" required>
            <option value="">Selecione…</option>
            ${catOptions}
          </select>
          <div class="invalid-feedback">Selecione uma categoria.</div>
        </div>

        <div class="col-md-6">
          <label class="form-label" for="mPay">Forma de pagamento *</label>
          <select class="form-select" id="mPay" required>
            <option value="">Selecione…</option>
            ${payOptions}
          </select>
          <div class="invalid-feedback">Selecione a forma de pagamento.</div>
        </div>

        <div class="col-md-6">
          <label class="form-label" for="mDate">Data *</label>
          <input type="date" class="form-control" id="mDate"
            value="${existing?.date || todayISO()}" required />
          <div class="invalid-feedback">Informe uma data válida.</div>
        </div>
      </div>
    </form>
  `;
}

export function openMovementModal({ type, userId, existing = null, onSaved }) {
  const L = FIELD_LABELS[type];
  const cats = getCategories(userId).filter((c) => c.type === type);
  const isEdit = !!existing;

  const m = openModal({
    title: `${isEdit ? 'Editar' : 'Nova'} ${L.singular}`,
    bodyHTML: buildFormHTML(type, cats, existing),
    footerHTML: `
      <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
      <button type="button" class="btn ${L.btn}" id="moveSave">
        <i class="bi ${L.icon}"></i> ${isEdit ? L.actionEdit : L.actionAdd}
      </button>
    `,
  });

  const valueInp = m.el.querySelector('#mValue');
  const descInp = m.el.querySelector('#mDesc');
  const catInp = m.el.querySelector('#mCat');
  const payInp = m.el.querySelector('#mPay');
  const dateInp = m.el.querySelector('#mDate');

  const getValue = attachCurrencyMask(valueInp);

  if (existing?.payment) payInp.value = existing.payment;

  const saveBtn = m.el.querySelector('#moveSave');
  saveBtn.addEventListener('click', () => {
    [valueInp, descInp, catInp, payInp, dateInp].forEach((el) =>
      el.classList.remove('is-invalid')
    );

    let valid = true;
    const value = getValue();
    if (!value || value <= 0 || isNaN(value)) {
      valueInp.classList.add('is-invalid');
      valid = false;
    }
    if (descInp.value.trim().length < 2) {
      descInp.classList.add('is-invalid');
      valid = false;
    }
    if (!catInp.value) {
      catInp.classList.add('is-invalid');
      valid = false;
    }
    if (!payInp.value) {
      payInp.classList.add('is-invalid');
      valid = false;
    }
    if (!dateInp.value || isNaN(new Date(dateInp.value + 'T00:00:00').getTime())) {
      dateInp.classList.add('is-invalid');
      valid = false;
    }
    if (!valid) return;

    const payload = {
      value: Number(value.toFixed(2)),
      description: descInp.value.trim(),
      categoryId: catInp.value,
      payment: payInp.value,
      date: dateInp.value,
    };

    let result;
    if (type === 'income') {
      result = isEdit
        ? updateIncome(userId, existing.id, payload)
        : addIncome(userId, payload);
    } else {
      result = isEdit
        ? updateExpense(userId, existing.id, payload)
        : addExpense(userId, payload);
    }

    m.close();
    toast(
      `${L.title} ${isEdit ? 'atualizada' : 'registrada'} com sucesso.`,
      'success'
    );
    onSaved(result, isEdit ? 'edit' : 'add');
  });
}

export { FIELD_LABELS, paymentIcon, formatDate };
