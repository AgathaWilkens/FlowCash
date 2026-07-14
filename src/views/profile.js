// Perfil view — edit name, email, password.
import { updateProfile } from '../store.js';
import { initials, escapeHtml } from '../utils.js';
import { toast } from '../toast.js';
import { setUser } from './app.js';

export function renderProfile(root, { user, refresh }) {
  root.innerHTML = `
    <div class="fc-section-head">
      <div>
        <h2 class="fc-page-title"><i class="bi bi-person-fill me-1"></i>Perfil</h2>
        <p class="fc-page-subtitle">Gerencie suas informações de conta</p>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-lg-4">
        <div class="fc-card fc-card-pad text-center">
          <div class="fc-avatar-lg mx-auto mb-3" id="profAvatar">${initials(user.name)}</div>
          <h5 class="mb-0 fw-bold" id="profName">${escapeHtml(user.name)}</h5>
          <p class="fc-sub-text mb-2" id="profEmail">${escapeHtml(user.email)}</p>
          <span class="fc-badge fc-badge-info">Conta local · FlowCash</span>
          <hr class="fc-divider" />
          <p class="fc-sub-text mb-0">Membro desde ${new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      <div class="col-lg-8">
        <div class="fc-card fc-card-pad mb-3">
          <h5 class="fw-bold mb-3">Dados pessoais</h5>
          <form id="profileForm" novalidate>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label" for="pName">Nome completo *</label>
                <input type="text" class="form-control" id="pName" value="${escapeHtml(user.name)}" />
                <div class="invalid-feedback">Informe seu nome.</div>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="pEmail">E-mail *</label>
                <input type="email" class="form-control" id="pEmail" value="${escapeHtml(user.email)}" />
                <div class="invalid-feedback">Informe um e-mail válido.</div>
              </div>
            </div>
            <button type="submit" class="btn btn-primary mt-3"><i class="bi bi-check-lg"></i> Salvar alterações</button>
          </form>
        </div>

        <div class="fc-card fc-card-pad">
          <h5 class="fw-bold mb-1">Alterar senha</h5>
          <p class="fc-sub-text mb-3">Deixe em branco para manter a senha atual.</p>
          <form id="passForm" novalidate>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label" for="pCurPass">Senha atual</label>
                <input type="password" class="form-control" id="pCurPass" placeholder="••••••" />
              </div>
              <div class="col-md-4">
                <label class="form-label" for="pNewPass">Nova senha</label>
                <input type="password" class="form-control" id="pNewPass" placeholder="••••••" />
                <div class="invalid-feedback">A nova senha deve ter ao menos 4 caracteres.</div>
              </div>
              <div class="col-md-4">
                <label class="form-label" for="pNewPass2">Confirmar</label>
                <input type="password" class="form-control" id="pNewPass2" placeholder="••••••" />
                <div class="invalid-feedback">As senhas não coincidem.</div>
              </div>
            </div>
            <button type="submit" class="btn btn-primary mt-3"><i class="bi bi-shield-lock"></i> Atualizar senha</button>
          </form>
        </div>
      </div>
    </div>
  `;

  const profileForm = root.querySelector('#profileForm');
  const nameInp = root.querySelector('#pName');
  const emailInp = root.querySelector('#pEmail');

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    [nameInp, emailInp].forEach((el) => el.classList.remove('is-invalid'));
    let valid = true;
    if (nameInp.value.trim().length < 2) { nameInp.classList.add('is-invalid'); valid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInp.value.trim())) {
      emailInp.classList.add('is-invalid');
      valid = false;
    }
    if (!valid) return;
    const res = updateProfile(user.id, { name: nameInp.value, email: emailInp.value });
    if (!res.ok) { toast(res.error, 'error'); return; }
    setUser(res.user);
    root.querySelector('#profName').textContent = res.user.name;
    root.querySelector('#profEmail').textContent = res.user.email;
    root.querySelector('#profAvatar').textContent = initials(res.user.name);
    toast('Dados atualizados com sucesso.', 'success');
  });

  const passForm = root.querySelector('#passForm');
  const curInp = root.querySelector('#pCurPass');
  const newInp = root.querySelector('#pNewPass');
  const new2Inp = root.querySelector('#pNewPass2');

  passForm.addEventListener('submit', (e) => {
    e.preventDefault();
    [newInp, new2Inp].forEach((el) => el.classList.remove('is-invalid'));
    if (curInp.value !== user.password) {
      toast('A senha atual está incorreta.', 'error');
      return;
    }
    let valid = true;
    if (newInp.value.length < 4) { newInp.classList.add('is-invalid'); valid = false; }
    if (newInp.value !== new2Inp.value) { new2Inp.classList.add('is-invalid'); valid = false; }
    if (!valid) return;
    const res = updateProfile(user.id, { password: newInp.value });
    if (!res.ok) { toast(res.error, 'error'); return; }
    curInp.value = newInp.value = new2Inp.value = '';
    toast('Senha atualizada com sucesso.', 'success');
  });
}
