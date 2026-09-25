/**
 * auth.js - Sistema de Autenticación Exclusivo por Google Sign-In
 * Cuentas autorizadas:
 * - Desarrollador: josuearenteriaz09@gmail.com -> Rol: 'developer'
 * - Autor: cesar.ruizcamou@gmail.com -> Rol: 'author'
 * Sin atajos de teclado públicos ni botones de simulación.
 */

document.addEventListener('DOMContentLoaded', () => {
  initAuthUI();
  initGoogleIdentity();
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
  // Limpiar barras previas
  const oldAuthorBar = document.getElementById('authorToolbar');
  if (oldAuthorBar) oldAuthorBar.remove();

  const oldDevBar = document.getElementById('devToolbar');
  if (oldDevBar) oldDevBar.remove();

  // Control de visibilidad de botones de edición en la página
  const editButtons = document.querySelectorAll('.auth-edit-btn');
  editButtons.forEach(btn => {
    btn.style.display = (role === 'author' || role === 'developer') ? 'inline-flex' : 'none';
  });

  // 1. ROL: LECTOR PÚBLICO (GUEST)
  if (role === 'guest' || !role) {
    document.body.classList.remove('role-author', 'role-developer');
    document.body.classList.add('role-guest');
    return;
  }

  // 2. ROL: CÉSAR RUIZ-CAMOU (ESCRITOR / AUTOR)
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
          <span><strong>Sesión Iniciada:</strong> ${user && user.name ? user.name : 'César Ruiz-Camou'}</span>
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

  // 3. ROL: DESARROLLADOR / ADMIN (JOSUE)
  if (role === 'developer') {
    document.body.classList.remove('role-guest', 'role-author');
    document.body.classList.add('role-developer');

    // Barra superior de desarrollador
    const bar = document.createElement('div');
    bar.id = 'authorToolbar';
    bar.className = 'author-sticky-bar';
    bar.style.borderBottomColor = '#F59E0B';
    bar.innerHTML = `
      <div class="container" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem;">
        <div style="display: flex; align-items: center; gap: 0.65rem;">
          <span style="background: #F59E0B; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
          <span><strong>Desarrollador:</strong> ${user && user.name ? user.name : 'Josue Renteria'}</span>
          <span class="tag tag-terracotta" style="font-size: 0.72rem;">Master Admin</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <a href="editor.html" class="btn btn-primary btn-sm" style="background: #0F172A; color: #fff;">
            ✍ Editor Docs
          </a>
          <button class="btn btn-tertiary btn-sm" onclick="logoutSession()" style="color: #64748B;">
            Cerrar Sesión
          </button>
        </div>
      </div>
    `;
    document.body.prepend(bar);

    // Panel flotante rápido inferior para Josue
    const devBar = document.createElement('div');
    devBar.id = 'devToolbar';
    devBar.className = 'dev-floating-panel';
    devBar.innerHTML = `
      <div class="dev-panel-inner">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span>🛠</span>
          <span style="font-weight: 700; font-family: var(--font-mono); font-size: 0.82rem; color: #F59E0B;">JOSUE (DEV)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-sm btn-dev-mode active" onclick="switchRole('developer')">Modo Dev</button>
          <button class="btn btn-sm btn-dev-mode" onclick="switchRole('author')">Ver como César</button>
          <button class="btn btn-sm btn-dev-mode" onclick="switchRole('guest')">Ver como Lector</button>
          <a href="editor.html" class="btn btn-sm btn-primary" style="font-size: 0.76rem; padding: 4px 8px;">Editor Docs</a>
          <button class="btn btn-sm btn-tertiary" onclick="logoutSession()" style="font-size: 0.76rem; padding: 4px 8px;">Salir</button>
        </div>
      </div>
    `;
    document.body.appendChild(devBar);
  }
}

// Iniciar sesión con cambio de rol (solo para desarrollador autenticado)
window.switchRole = function(targetRole) {
  window.blogStore.setRole(targetRole);
  showToast(`Vista cambiada a: ${targetRole.toUpperCase()}`);
};

window.logoutSession = function() {
  window.blogStore.logout();
  showToast('Sesión cerrada. Ahora estás en Modo Lector.');
};

// --- INTEGRACIÓN EXCLUSIVA CON GOOGLE SIGN-IN ---
function initGoogleIdentity() {
  const config = window.blogStore.getConfig();
  const clientId = config.googleClientId || '968718859059-81u6bj6l4op1e0dsnblqg73ego8ns59j.apps.googleusercontent.com';

  if (window.google && window.google.accounts) {
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false
      });

      const btnContainer = document.getElementById('googleSignInBtnContainer');
      if (btnContainer) {
        btnContainer.innerHTML = '';
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 320
        });
      }
    } catch (err) {
      console.warn('Google Identity aún cargando o no inicializado:', err);
    }
  } else {
    // Reintentar si el script de Google tarda un momento en cargar
    setTimeout(initGoogleIdentity, 400);
  }
}

// Procesar respuesta del inicio de sesión con Google
function handleGoogleCredentialResponse(response) {
  try {
    // Decodificar el token JWT de Google
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload);

    const email = (payload.email || '').toLowerCase().trim();
    const name = payload.name || payload.given_name || 'Usuario';
    const picture = payload.picture || '';

    const config = window.blogStore.getConfig();
    const devEmail = (config.developerEmail || 'josuearenteriaz09@gmail.com').toLowerCase().trim();
    const authorEmail = (config.authorEmail || 'cesar.ruizcamou@gmail.com').toLowerCase().trim();

    // 1. ¿Es Josue (Desarrollador)?
    if (email === devEmail || email === 'josuearenteriaz09@gmail.com') {
      window.blogStore.setRole('developer', {
        name: name,
        email: email,
        picture: picture,
        role: 'developer'
      });
      showToast(`¡Bienvenido Josue! Has iniciado sesión como Desarrollador.`);
      closeLoginModal();
      return;
    }

    // 2. ¿Es César Ruiz-Camou (Autor / Escritor)?
    if (email === authorEmail || email === 'cesar.ruizcamou@gmail.com') {
      window.blogStore.setRole('author', {
        name: name,
        email: email,
        picture: picture,
        role: 'author'
      });
      showToast(`¡Bienvenido César! Modo Escritor activado.`);
      closeLoginModal();
      return;
    }

    // 3. Cualquier otra cuenta queda rechazada
    alert(`Acceso denegado: El correo "${email}" no está registrado como autor ni desarrollador en este blog.`);
    window.blogStore.logout();

  } catch (e) {
    console.error('Error procesando credencial de Google:', e);
    alert('Ocurrió un error al verificar tu cuenta con Google. Por favor intenta de nuevo.');
  }
}

// Modal de Login oficial (Únicamente botón de Google, sin botones de simulación)
window.openLoginModal = function() {
  let modal = document.getElementById('loginModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'loginModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 440px; text-align: center; padding: 2.5rem 2rem;">
        <div class="modal-header" style="justify-content: flex-end; border: none; padding-bottom: 0; margin-top: -1rem; margin-right: -0.5rem;">
          <button onclick="closeLoginModal()" class="close-modal-btn">&times;</button>
        </div>

        <div style="width: 58px; height: 58px; background: #E8F0FE; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; color: #1D4ED8; font-size: 1.6rem;">
          🔒
        </div>

        <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 0.5rem;">Acceso al Blog</h3>
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 2rem; line-height: 1.5;">
          Inicia sesión con tu cuenta de Google autorizada (César o Josue) para redactar o administrar publicaciones.
        </p>

        <!-- Botón oficial de Google Sign-In -->
        <div id="googleSignInBtnContainer" style="display: flex; justify-content: center; min-height: 48px; margin-bottom: 1.5rem;">
          <div style="font-size: 0.82rem; color: var(--text-muted);">Cargando botón de Google...</div>
        </div>

        <div style="font-size: 0.78rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 1rem; margin-top: 1rem;">
          Autenticación segura con Google Identity Services
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.classList.add('active');
  initGoogleIdentity();
};

window.closeLoginModal = function() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.classList.remove('active');
};
