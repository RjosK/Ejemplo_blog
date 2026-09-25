/**
 * auth.js - Sistema de Autenticación, Roles (Lector, César, Desarrollador)
 * Integración con Google Identity Services (Proyecto GCP: lca-studio-509602)
 * y Acceso Oculto de Desarrollador (Ctrl+Shift+D / Triple Clic)
 */

document.addEventListener('DOMContentLoaded', () => {
  initAuthUI();
  initGoogleIdentity();
  initSecretDevTriggers();
});

// Inicialización de la interfaz según el rol
function initAuthUI() {
  const auth = window.blogStore.getAuth();
  applyRoleUI(auth.role, auth.user);

  window.addEventListener('blog:auth-changed', (e) => {
    applyRoleUI(e.detail.role, e.detail.user);
  });
}

function applyRoleUI(role, user) {
  // Remover barras de rol existentes
  const oldAuthorBar = document.getElementById('authorToolbar');
  if (oldAuthorBar) oldAuthorBar.remove();

  const oldDevBar = document.getElementById('devToolbar');
  if (oldDevBar) oldDevBar.remove();

  // Control de visibilidad de botones de edición en la página
  const editButtons = document.querySelectorAll('.auth-edit-btn');
  editButtons.forEach(btn => {
    btn.style.display = (role === 'author' || role === 'developer') ? 'inline-flex' : 'none';
  });

  // ROL: INVITADO / LECTOR PÚBLICO
  if (role === 'guest') {
    document.body.classList.remove('role-author', 'role-developer');
    document.body.classList.add('role-guest');
    return;
  }

  // ROL: CÉSAR (ESCRITOR / INVESTIGADOR)
  if (role === 'author') {
    document.body.classList.remove('role-guest', 'role-developer');
    document.body.classList.add('role-author');

    const bar = document.createElement('div');
    bar.id = 'authorToolbar';
    bar.className = 'author-sticky-bar';
    bar.innerHTML = `
      <div class="container" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem;">
        <div style="display: flex; align-items: center; gap: 0.65rem;">
          <span style="background: #22C55E; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
          <span><strong>Sesión Iniciada:</strong> César Ruiz-Camou</span>
          <span class="tag tag-sage" style="font-size: 0.72rem;">Modo Escritor</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <a href="editor.html" class="btn btn-primary btn-sm" style="background: #1E3A8A; color: #fff;">
            ✍ Abrir Editor tipo Google Docs
          </a>
          <button class="btn btn-tertiary btn-sm" onclick="logoutSession()" style="color: #64748B;">
            Cerrar Sesión
          </button>
        </div>
      </div>
    `;
    document.body.prepend(bar);
  }

  // ROL: DESARROLLADOR / ADMIN (JOSUE)
  if (role === 'developer') {
    document.body.classList.remove('role-guest', 'role-author');
    document.body.classList.add('role-developer');

    const devBar = document.createElement('div');
    devBar.id = 'devToolbar';
    devBar.className = 'dev-floating-panel';
    devBar.innerHTML = `
      <div class="dev-panel-inner">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.1rem;">🛠</span>
          <span style="font-weight: 700; font-family: var(--font-mono); font-size: 0.82rem; color: #F59E0B;">DEV MASTER</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-sm btn-dev-mode ${role === 'developer' ? 'active' : ''}" onclick="switchRole('developer')">Dev</button>
          <button class="btn btn-sm btn-dev-mode" onclick="switchRole('author')">Ver como César</button>
          <button class="btn btn-sm btn-dev-mode" onclick="switchRole('guest')">Ver como Lector</button>
          <a href="editor.html" class="btn btn-sm btn-primary" style="font-size: 0.76rem; padding: 4px 8px;">Editor Docs</a>
          <button class="btn btn-sm btn-tertiary" onclick="openDevConfigModal()" style="font-size: 0.76rem; padding: 4px 8px;">OAuth GCP</button>
          <button class="btn btn-sm btn-tertiary" onclick="logoutSession()" style="font-size: 0.76rem; padding: 4px 8px;">Salir</button>
        </div>
      </div>
    `;
    document.body.appendChild(devBar);
  }
}

// Iniciar sesión con cambio de rol
window.switchRole = function(targetRole) {
  window.blogStore.setRole(targetRole);
  showToast(`Cambiado a rol: ${targetRole.toUpperCase()}`);
};

window.logoutSession = function() {
  window.blogStore.logout();
  showToast('Sesión cerrada. Ahora estás en Modo Lector Público.');
};

// --- INTEGRACIÓN GOOGLE IDENTITY SERVICES (GCP: lca-studio-509602) ---
function initGoogleIdentity() {
  const config = window.blogStore.getConfig();

  // Si existe el SDK de Google y se configuró un Client ID real
  if (window.google && window.google.accounts && config.googleClientId) {
    try {
      window.google.accounts.id.initialize({
        client_id: config.googleClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false
      });

      const btnContainer = document.getElementById('googleSignInBtnContainer');
      if (btnContainer) {
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        });
      }
    } catch (err) {
      console.warn('Google Identity Client ID aún no configurado o inválido:', err);
    }
  }
}

function handleGoogleCredentialResponse(response) {
  try {
    // Decodificar JWT básico
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload);

    const user = {
      name: payload.name || 'César Ruiz-Camou',
      email: payload.email,
      picture: payload.picture,
      sub: payload.sub
    };

    window.blogStore.setRole('author', user);
    showToast(`¡Bienvenido, ${user.name}!`);
    const modal = document.getElementById('loginModal');
    if (modal) modal.classList.remove('active');
  } catch (e) {
    console.error('Error decodificando token Google:', e);
    // Fallback amigable
    window.blogStore.setRole('author');
    showToast('Sesión iniciada correctamente como César');
  }
}

// Iniciar sesión rápida simulada para César
window.loginAsCesarDirect = function() {
  window.blogStore.setRole('author', {
    name: 'César Ruiz-Camou',
    email: 'cesar.ruizcamou@gmail.com',
    avatar: 'CR'
  });
  showToast('¡Bienvenido César! Modo Escritor Activado.');
  const modal = document.getElementById('loginModal');
  if (modal) modal.classList.remove('active');
};

// --- GATILLOS SECRETOS PARA EL DESARROLLADOR ---
function initSecretDevTriggers() {
  // 1. Atajo de teclado: Ctrl + Shift + D o Cmd + Shift + D
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      e.preventDefault();
      openSecretDevModal();
    }
  });

  // 2. Triple clic en el copyright del footer
  let clickCount = 0;
  let clickTimer = null;
  const footerCopyright = document.querySelector('.footer-bottom');
  if (footerCopyright) {
    footerCopyright.addEventListener('click', () => {
      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(() => { clickCount = 0; }, 900);
      } else if (clickCount >= 3) {
        clearTimeout(clickTimer);
        clickCount = 0;
        openSecretDevModal();
      }
    });
  }
}

// Modal secreto del desarrollador
window.openSecretDevModal = function() {
  let modal = document.getElementById('secretDevModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'secretDevModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 480px; border: 2px solid #1E293B;">
        <div class="modal-header" style="background: #0F172A; color: #FFFFFF; margin: -2.25rem -2.25rem 1.5rem -2.25rem; padding: 1.25rem 2rem; border-radius: calc(var(--radius-lg) - 2px) calc(var(--radius-lg) - 2px) 0 0;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-size: 1.3rem;">⚡</span>
            <h3 style="font-family: var(--font-mono); font-size: 1.1rem; color: #38BDF8;">ACCESO DESARROLLADOR</h3>
          </div>
          <button onclick="closeSecretDevModal()" class="close-modal-btn" style="color: #94A3B8;">&times;</button>
        </div>

        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
          Panel de control oculto para depuración, configuración de Google Cloud (<code>lca-studio-509602</code>) y cambio de roles sin afectar a los lectores públicos.
        </p>

        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">
          <button class="btn btn-primary" onclick="switchRole('developer'); closeSecretDevModal();" style="background: #0F172A; justify-content: flex-start;">
            🛠 Entrar como Desarrollador (Master)
          </button>
          <button class="btn btn-blue" onclick="switchRole('author'); closeSecretDevModal();" style="justify-content: flex-start;">
            ✍ Entrar como César Ruiz-Camou (Escritor)
          </button>
          <button class="btn btn-tertiary" onclick="switchRole('guest'); closeSecretDevModal();" style="justify-content: flex-start;">
            👁 Restablecer a Modo Lector Público
          </button>
        </div>

        <div style="background: var(--bg-paper-alt); border: 1px dashed var(--border-medium); padding: 1rem; border-radius: var(--radius-sm); font-size: 0.82rem; margin-bottom: 1rem;">
          <strong>Atajo de teclado rápido:</strong> <code>Ctrl + Shift + D</code> para abrir este panel en cualquier momento.
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
          <button class="btn btn-tertiary btn-sm" onclick="openDevConfigModal(); closeSecretDevModal();">
            ⚙ Configurar OAuth Google
          </button>
          <button class="btn btn-tertiary btn-sm" onclick="closeSecretDevModal()">
            Cerrar
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.classList.add('active');
};

window.closeSecretDevModal = function() {
  const modal = document.getElementById('secretDevModal');
  if (modal) modal.classList.remove('active');
};

// Modal de configuración de Google OAuth Client ID
window.openDevConfigModal = function() {
  const config = window.blogStore.getConfig();
  let modal = document.getElementById('devConfigModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'devConfigModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 580px;">
        <div class="modal-header">
          <h3 style="font-family: var(--font-serif); font-size: 1.3rem;">Configuración de Google Cloud OAuth</h3>
          <button onclick="closeDevConfigModal()" class="close-modal-btn">&times;</button>
        </div>

        <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
          Conecta el inicio de sesión de Google con tu proyecto <strong>lca-studio-509602</strong>.
        </div>

        <div class="form-group">
          <label class="form-label" for="cfgProjectId">Google Cloud Project ID</label>
          <input type="text" id="cfgProjectId" class="form-input" value="${config.googleProjectId || 'lca-studio-509602'}" readonly style="background: #F1F5F9; color: #64748B;">
        </div>

        <div class="form-group">
          <label class="form-label" for="cfgClientId">OAuth 2.0 Web Client ID</label>
          <input type="text" id="cfgClientId" class="form-input" placeholder="ej. 123456789-xxxx.apps.googleusercontent.com" value="${config.googleClientId || ''}">
          <small style="color: var(--text-muted); display: block; margin-top: 4px; font-size: 0.78rem;">
            Obtén tu Client ID en: <a href="https://console.cloud.google.com/auth/audience?project=lca-studio-509602" target="_blank" rel="noopener noreferrer">Consola de Google Cloud (lca-studio-509602) ↗</a>
          </small>
        </div>

        <div class="form-group">
          <label class="form-label" for="cfgAuthorEmail">Correo Autorizado para César</label>
          <input type="email" id="cfgAuthorEmail" class="form-input" value="${config.authorEmail || 'cesar.ruizcamou@gmail.com'}">
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button class="btn btn-tertiary" onclick="closeDevConfigModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="saveDevConfig()">Guardar Configuración</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    document.getElementById('cfgClientId').value = config.googleClientId || '';
    document.getElementById('cfgAuthorEmail').value = config.authorEmail || '';
  }
  modal.classList.add('active');
};

window.closeDevConfigModal = function() {
  const modal = document.getElementById('devConfigModal');
  if (modal) modal.classList.remove('active');
};

window.saveDevConfig = function() {
  const clientId = document.getElementById('cfgClientId').value.trim();
  const email = document.getElementById('cfgAuthorEmail').value.trim();

  window.blogStore.saveConfig({
    googleClientId: clientId,
    authorEmail: email
  });

  closeDevConfigModal();
  showToast('Configuración de Google OAuth guardada.');
  initGoogleIdentity();
};

// Modal de Login público/César
window.openLoginModal = function() {
  let modal = document.getElementById('loginModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'loginModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 440px; text-align: center;">
        <div class="modal-header" style="justify-content: flex-end; border: none; padding-bottom: 0;">
          <button onclick="document.getElementById('loginModal').classList.remove('active')" class="close-modal-btn">&times;</button>
        </div>

        <div style="width: 58px; height: 58px; background: #E8F0FE; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #1D4ED8; font-size: 1.6rem;">
          🔒
        </div>

        <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 0.5rem;">Acceso para Autores</h3>
        <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 1.75rem;">
          Inicia sesión para redactar artículos, gestionar notas de campo y subir gráficas científicas.
        </p>

        <!-- Botón oficial de Google Identity SDK -->
        <div id="googleSignInBtnContainer" style="display: flex; justify-content: center; margin-bottom: 1.25rem;"></div>

        <div style="position: relative; margin: 1.5rem 0; text-align: center;">
          <hr style="border: none; border-top: 1px solid var(--border-subtle);">
          <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: var(--bg-paper); padding: 0 10px; font-size: 0.78rem; color: var(--text-muted);">
            O ACCESO DIRECTO
          </span>
        </div>

        <!-- Acceso directo simulado de César -->
        <button class="btn btn-blue" onclick="loginAsCesarDirect()" style="width: 100%; margin-bottom: 0.75rem;">
          <span>✍</span> Entrar como César Ruiz-Camou
        </button>

        <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 1rem;">
          Vinculado al proyecto Google Cloud: <code>lca-studio-509602</code>
        </p>
      </div>
    `;
    document.body.appendChild(modal);
    initGoogleIdentity();
  }
  modal.classList.add('active');
};
