// Toast notification helper (no dependency on Bootstrap JS)

let wrapEl = null;

const ensureWrap = () => {
  if (wrapEl && document.body.contains(wrapEl)) return wrapEl;
  wrapEl = document.createElement('div');
  wrapEl.className = 'fc-toast-wrap';
  document.body.appendChild(wrapEl);
  return wrapEl;
};

const ICONS = {
  success: 'bi-check-circle-fill',
  error: 'bi-x-circle-fill',
  warning: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
};

export function toast(message, type = 'info', title = null) {
  const wrap = ensureWrap();
  const el = document.createElement('div');
  el.className = `fc-toast ${type}`;
  const titles = { success: 'Sucesso', error: 'Erro', warning: 'Atenção', info: 'Aviso' };
  el.innerHTML = `
    <i class="bi ${ICONS[type] || ICONS.info} fc-toast-icon"></i>
    <div class="fc-toast-body">
      <p class="fc-toast-title">${title || titles[type] || 'Aviso'}</p>
      <p class="fc-toast-msg">${message}</p>
    </div>
  `;
  wrap.appendChild(el);
  const remove = () => {
    el.classList.add('hide');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  };
  const timer = setTimeout(remove, 3200);
  el.addEventListener('click', () => {
    clearTimeout(timer);
    remove();
  });
}
