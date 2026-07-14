// Auth view — login & register screens
import { registerUser, loginUser } from '../store.js';
import { toast } from '../toast.js';

export function renderAuth(onAuthed) {
  let mode = 'login';

  const root = document.getElementById('app');
  root.innerHTML = `
    <div class="fc-auth">
      <div class="fc-auth-card">
        <div class="fc-auth-brand">
          <span class="fc-brand-mark"><i class="bi bi-cash-coin"></i></span>
          <h1>FlowCash</h1>
        </div>
        <p class="fc-auth-tagline">Controle financeiro para freelancers e autônomos</p>

        <form id="authForm" novalidate>
          <div id="nameWrap" class="mb-3" style="display:none">
            <label class="form-label" for="authName">Nome completo</label>
            <input type="text" class="form-control" id="authName" autocomplete="name" />
            <div class="invalid-feedback">Informe seu nome.</div>
          </div>

          <div class="mb-3">
            <label class="form-label" for="authEmail">E-mail</label>
            <input type="email" class="form-control" id="authEmail" autocomplete="email" placeholder="voce@exemplo.com" />
            <div class="invalid-feedback">Informe um e-mail válido.</div>
          </div>

          <div class="mb-3">
            <label class="form-label" for="authPass">Senha</label>
            <input type="password" class="form-control" id="authPass" autocomplete="current-password" placeholder="••••••••" />
            <div class="invalid-feedback">A senha deve ter ao menos 4 caracteres.</div>
          </div>

          <div id="pass2Wrap" class="mb-3" style="display:none">
            <label class="form-label" for="authPass2">Confirmar senha</label>
            <input type="password" class="form-control" id="authPass2" autocomplete="new-password" placeholder="••••••••" />
            <div class="invalid-feedback">As senhas não coincidem.</div>
          </div>

          <button type="submit" class="btn btn-primary w-100" id="authSubmit">Entrar</button>
        </form>

        <p class="fc-auth-toggle" id="authToggle">
          Não tem conta? <button type="button">Cadastre-se</button>
        </p>
      </div>
    </div>
  `;

  const form = document.getElementById('authForm');
  const nameWrap = document.getElementById('nameWrap');
  const pass2Wrap = document.getElementById('pass2Wrap');
  const submitBtn = document.getElementById('authSubmit');
  const toggle = document.getElementById('authToggle');
  const emailInp = document.getElementById('authEmail');
  const passInp = document.getElementById('authPass');

  const setMode = (m) => {
    mode = m;
    nameWrap.style.display = m === 'register' ? '' : 'none';
    pass2Wrap.style.display = m === 'register' ? '' : 'none';
    submitBtn.textContent = m === 'register' ? 'Criar conta' : 'Entrar';
    toggle.innerHTML =
      m === 'register'
        ? 'Já tem conta? <button type="button">Entrar</button>'
        : 'Não tem conta? <button type="button">Cadastre-se</button>';
    form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  };

  toggle.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') setMode(mode === 'login' ? 'register' : 'login');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));

    const email = emailInp.value.trim();
    const pass = passInp.value;
    let valid = true;

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) { emailInp.classList.add('is-invalid'); valid = false; }
    if (pass.length < 4) { passInp.classList.add('is-invalid'); valid = false; }

    if (mode === 'register') {
      const nameInp = document.getElementById('authName');
      const pass2Inp = document.getElementById('authPass2');
      if (nameInp.value.trim().length < 2) { nameInp.classList.add('is-invalid'); valid = false; }
      if (pass2Inp.value !== pass) { pass2Inp.classList.add('is-invalid'); valid = false; }
      if (!valid) return;
      const res = registerUser({ name: nameInp.value, email, password: pass });
      if (!res.ok) { toast(res.error, 'error'); return; }
      loginUser({ email, password: pass });
      toast(`Bem-vindo, ${res.user.name.split(' ')[0]}! Sua conta foi criada.`, 'success');
      onAuthed();
      return;
    }

    if (!valid) return;
    const res = loginUser({ email, password: pass });
    if (!res.ok) { toast(res.error, 'error'); return; }
    toast(`Olá, ${res.user.name.split(' ')[0]}!`, 'success');
    onAuthed();
  });
}
