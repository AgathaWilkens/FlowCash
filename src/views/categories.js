// Categorias view — CRUD for custom categories (income/expense type).
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  categoryUsage,
} from '../store.js';
import { escapeHtml } from '../utils.js';
import { toast } from '../toast.js';
import { confirmDialog, openModal } from '../modal.js';

export function renderCategories(root, { user, refresh }) {
  render();

  function render() {
    const cats = getCategories(user.id);
    const incomeCats = cats.filter((c) => c.type === 'income');
    const expenseCats = cats.filter((c) => c.type === 'expense');

    root.innerHTML = `
      <div class="fc-section-head">
        <div>
          <h2 class="fc-page-title"><i class="bi bi-tags-fill me-1"></i>Categorias</h2>
          <p class="fc-page-subtitle">Organize suas receitas e despesas por categoria</p>
        </div>
        <button class="btn btn-primary" id="addCatBtn"><i class="bi bi-plus-lg"></i> Nova categoria</button>
      </div>

      <div class="row g-3">
        <div class="col-lg-6">
          ${card('Categorias de receita', 'bi-arrow-down-circle-fill', 'income', incomeCats)}
        </div>
        <div class="col-lg-6">
          ${card('Categorias de despesa', 'bi-arrow-up-circle-fill', 'expense', expenseCats)}
        </div>
      </div>
    `;

    root.querySelector('#addCatBtn').addEventListener('click', () =>
      openCatModal(null, () => render())
    );

    root.querySelectorAll('[data-edit-cat]').forEach((b) =>
      b.addEventListener('click', () => {
        const cat = cats.find((c) => c.id === b.dataset.editCat);
        if (cat) openCatModal(cat, () => render());
      })
    );

    root.querySelectorAll('[data-del-cat]').forEach((b) =>
      b.addEventListener('click', async () => {
        const cat = cats.find((c) => c.id === b.dataset.delCat);
        if (!cat) return;
        const used = categoryUsage(user.id, cat.id);
        const msg = used
          ? `"${escapeHtml(cat.name)}" está em uso em ${used} movimentação(ões). Excluir a categoria não remove essas movimentações, mas elas ficarão sem categoria. Continuar?`
          : `Excluir a categoria "${escapeHtml(cat.name)}"? Esta ação não pode ser desfeita.`;
        const ok = await confirmDialog({ title: 'Excluir categoria', message: msg, confirmText: 'Excluir' });
        if (!ok) return;
        deleteCategory(user.id, cat.id);
        toast('Categoria excluída.', 'success');
        render();
      })
    );
  }

  function card(title, icon, type, items) {
    return `
      <div class="fc-card fc-card-pad h-100">
        <h5 class="fw-bold mb-3">
          <i class="bi ${icon} ${type === 'income' ? 'text-income' : 'text-expense'}"></i>
          ${title}
          <span class="fc-badge fc-badge-neutral ms-1">${items.length}</span>
        </h5>
        ${
          items.length === 0
            ? `<div class="fc-empty"><i class="bi bi-tag"></i><h5>Sem categorias</h5><p class="mb-0">Clique em "Nova categoria".</p></div>`
            : `<ul class="list-group list-group-flush">
                ${items
                  .map(
                    (c) => `
                  <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                    <div>
                      <span class="fw-semibold">${escapeHtml(c.name)}</span>
                      <span class="fc-sub-text ms-2">${categoryUsage(user.id, c.id)} uso(s)</span>
                    </div>
                    <div class="fc-row-actions">
                      <button class="fc-icon-btn" data-edit-cat="${c.id}" title="Editar"><i class="bi bi-pencil"></i></button>
                      <button class="fc-icon-btn danger" data-del-cat="${c.id}" title="Excluir"><i class="bi bi-trash3"></i></button>
                    </div>
                  </li>
                `
                  )
                  .join('')}
              </ul>`
        }
      </div>
    `;
  }

  function openCatModal(existing, onDone) {
    const isEdit = !!existing;
    const m = openModal({
      title: `${isEdit ? 'Editar' : 'Nova'} categoria`,
      bodyHTML: `
        <form id="catForm" novalidate>
          <div class="mb-3">
            <label class="form-label" for="catName">Nome *</label>
            <input type="text" class="form-control" id="catName" value="${existing ? escapeHtml(existing.name) : ''}" placeholder="Ex.: Design Gráfico" />
            <div class="invalid-feedback">Informe um nome.</div>
          </div>
          <div class="mb-1">
            <label class="form-label" for="catType">Tipo *</label>
            <select class="form-select" id="catType">
              <option value="income" ${existing?.type === 'income' ? 'selected' : ''}>Receita</option>
              <option value="expense" ${existing?.type === 'expense' ? 'selected' : ''}>Despesa</option>
            </select>
          </div>
        </form>
      `,
      footerHTML: `
        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-primary" id="catSave">${isEdit ? 'Salvar' : 'Criar categoria'}</button>
      `,
    });

    const nameInp = m.el.querySelector('#catName');
    const typeInp = m.el.querySelector('#catType');
    m.el.querySelector('#catSave').addEventListener('click', () => {
      nameInp.classList.remove('is-invalid');
      if (nameInp.value.trim().length < 2) {
        nameInp.classList.add('is-invalid');
        return;
      }
      const payload = { name: nameInp.value, type: typeInp.value };
      const res = isEdit
        ? updateCategory(user.id, existing.id, payload)
        : addCategory(user.id, payload);
      if (!res.ok) {
        toast(res.error, 'error');
        return;
      }
      m.close();
      toast(`Categoria ${isEdit ? 'atualizada' : 'criada'} com sucesso.`, 'success');
      onDone();
    });
  }
}
