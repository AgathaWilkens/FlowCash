// App shell — sidebar, topbar, router, view container.
import { getCurrentUser, logout } from '../store.js';
import { initials, escapeHtml } from '../utils.js';
import { toast } from '../toast.js';
import { confirmDialog } from '../modal.js';

import { renderDashboard } from './dashboard.js';
import { renderIncomes } from './incomes.js';
import { renderExpenses } from './expenses.js';
import { renderCategories } from './categories.js';
import { renderReports } from './reports.js';
import { renderProfile } from './profile.js';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill' },
  { id: 'incomes', label: 'Receitas', icon: 'bi-arrow-down-circle-fill' },
  { id: 'expenses', label: 'Despesas', icon: 'bi-arrow-up-circle-fill' },
  { id: 'categories', label: 'Categorias', icon: 'bi-tags-fill' },
  { id: 'reports', label: 'Relatórios', icon: 'bi-bar-chart-fill' },
  { id: 'profile', label: 'Perfil', icon: 'bi-person-fill' },
];

const VIEW_RENDERERS = {
  dashboard: renderDashboard,
  incomes: renderIncomes,
  expenses: renderExpenses,
  categories: renderCategories,
  reports: renderReports,
  profile: renderProfile,
};

let currentView = 'dashboard';
let state = { user: null };

export function startApp() {
  state.user = getCurrentUser();
  if (!state.user) return false;
  buildShell();
  navigate('dashboard');
  return true;
}

function buildShell() {
  const root = document.getElementById('app');
  const u = state.user;
  root.innerHTML = `
    <div class="fc-layout">
      <aside class="fc-sidebar" id="fcSidebar">
        <button class="fc-sidebar-close" id="fcSidebarClose" aria-label="Fechar menu"><i class="bi bi-x-lg"></i></button>
        <div class="fc-brand">
          <span class="fc-brand-mark"><i class="bi bi-cash-coin"></i></span>
          FlowCash
        </div>
        <nav class="fc-nav" id="fcNav">
          <div class="fc-nav-section">Menu</div>
          ${NAV.map(
            (n) => `
              <button class="fc-nav-item" data-view="${n.id}">
                <i class="bi ${n.icon}"></i> ${n.label}
              </button>
            `
          ).join('')}
        </nav>
        <div class="fc-sidebar-footer">
          <div class="fc-user-chip">
            <span class="fc-avatar">${initials(u.name)}</span>
            <div class="fc-user-meta">
              <div class="fc-user-name">${escapeHtml(u.name)}</div>
              <div class="fc-user-email">${escapeHtml(u.email)}</div>
            </div>
          </div>
          <button class="fc-nav-item mt-2" id="fcLogout">
            <i class="bi bi-box-arrow-right"></i> Sair
          </button>
        </div>
      </aside>

      <div class="fc-backdrop" id="fcBackdrop"></div>

      <div class="fc-main">
        <header class="fc-topbar">
          <button class="fc-icon-btn" id="fcMenuBtn" aria-label="Abrir menu"><i class="bi bi-list"></i></button>
          <strong class="mb-0">FlowCash</strong>
        </header>
        <main class="fc-content" id="fcContent"></main>
      </div>
    </div>
  `;

  document.getElementById('fcNav').addEventListener('click', (e) => {
    const btn = e.target.closest('.fc-nav-item[data-view]');
    if (!btn) return;
    navigate(btn.dataset.view);
    closeSidebar();
  });

  document.getElementById('fcLogout').addEventListener('click', handleLogout);

  document.getElementById('fcMenuBtn').addEventListener('click', openSidebar);
  document.getElementById('fcSidebarClose').addEventListener('click', closeSidebar);
  document.getElementById('fcBackdrop').addEventListener('click', closeSidebar);
}

function openSidebar() {
  document.getElementById('fcSidebar').classList.add('open');
  document.getElementById('fcBackdrop').classList.add('show');
}
function closeSidebar() {
  document.getElementById('fcSidebar').classList.remove('open');
  document.getElementById('fcBackdrop').classList.remove('show');
}

export function navigate(viewId) {
  if (!VIEW_RENDERERS[viewId]) viewId = 'dashboard';
  currentView = viewId;
  document.querySelectorAll('.fc-nav-item[data-view]').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === viewId);
  });
  const content = document.getElementById('fcContent');
  content.innerHTML = '';
  const viewEl = document.createElement('div');
  viewEl.className = 'fc-view';
  content.appendChild(viewEl);
  VIEW_RENDERERS[viewId](viewEl, { user: state.user, refresh: () => navigate(viewId) });
  content.scrollIntoView({ block: 'start' });
  window.scrollTo(0, 0);
}

export function getUser() {
  return state.user;
}

export function setUser(user) {
  state.user = user;
  const nameEl = document.querySelector('.fc-user-name');
  const emailEl = document.querySelector('.fc-user-email');
  const avatarEl = document.querySelector('.fc-user-chip .fc-avatar');
  if (nameEl) nameEl.textContent = user.name;
  if (emailEl) emailEl.textContent = user.email;
  if (avatarEl) avatarEl.textContent = initials(user.name);
}

async function handleLogout() {
  const ok = await confirmDialog({
    title: 'Sair da conta',
    message: 'Deseja realmente encerrar a sessão? Seus dados permanecem salvos neste navegador.',
    confirmText: 'Sair',
    danger: true,
  });
  if (!ok) return;
  logout();
  toast('Sessão encerrada.', 'info');
  location.reload();
}
