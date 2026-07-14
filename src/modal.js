// Reusable Bootstrap modal helper — builds modal markup, returns controls.
import { escapeHtml } from './utils.js';

let counter = 0;

export function openModal({ title, bodyHTML, footerHTML = '', size = '' }) {
  const id = `fcModal${++counter}`;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="modal fade" id="${id}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog ${size} modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${escapeHtml(title)}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">${bodyHTML}</div>
          ${
            footerHTML
              ? `<div class="modal-footer">${footerHTML}</div>`
              : ''
          }
        </div>
      </div>
    </div>
  `;
  const el = wrap.firstElementChild;
  document.body.appendChild(el);
  const modal = new bootstrap.Modal(el);
  el.addEventListener('hidden.bs.modal', () => el.remove());
  modal.show();
  return {
    el,
    modal,
    close: () => modal.hide(),
    on: (evt, cb) => el.addEventListener(evt, cb),
  };
}

export function confirmDialog({ title = 'Confirmar', message, confirmText = 'Excluir', danger = true }) {
  return new Promise((resolve) => {
    const m = openModal({
      title,
      bodyHTML: `<p class="mb-0 text-secondary">${message}</p>`,
      footerHTML: `
        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirmYes">${confirmText}</button>
      `,
    });
    m.el.querySelector('#confirmYes').addEventListener('click', () => {
      m.close();
      resolve(true);
    });
    m.el.addEventListener('hidden.bs.modal', () => resolve(false), { once: true });
  });
}
