// ============================================
// AUTH MODULE - DATA GUARD MX (MEJORADO)
// ============================================

export async function initAuth() {
  const token = api.getToken();
  if (!token) return false;
  
  try {
    const user = api.getUser();
    if (user && user.id) {
      return true;
    }
    const profile = await api.getProfile();
    api.setUser(profile);
    return true;
  } catch (error) {
    console.error('Auth error:', error);
    return false;
  }
}

export function getUserRole() {
  const user = api.getUser();
  return user?.role || 'ciudadano';
}

export function getCurrentUser() {
  return api.getUser();
}

// Inicialización solo para página de login
if (document.getElementById('loginForm')) {
  document.addEventListener('DOMContentLoaded', () => {
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginDiv = document.getElementById('loginForm');
    const registerDiv = document.getElementById('registerForm');
    const empresaMensaje = document.getElementById('empresaMensaje');
    const empresaField = document.getElementById('empresaField');
    const registerBtn = document.getElementById('doRegister');

    // Verificar sesión activa
    const token = api.getToken();
    if (token && !window.location.pathname.includes('index.html')) {
      const user = api.getUser();
      if (user?.role === 'admin') {
        window.location.href = 'admin.html';
      } else if (user?.role) {
        window.location.href = 'dashboard.html';
      }
    }

    // Cambio de tabs
    if (tabLogin && tabRegister) {
      tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginDiv.classList.add('active');
        registerDiv.classList.remove('active');
      });

      tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerDiv.classList.add('active');
        loginDiv.classList.remove('active');
      });
    }

    // Cambio de tipo de cuenta (Ciudadano/Empresa)
    const roleSelect = document.getElementById('regRole');
    if (roleSelect) {
      roleSelect.addEventListener('change', (e) => {
        const isEmpresa = e.target.value === 'empresa';
        
        if (empresaField) {
          empresaField.style.display = isEmpresa ? 'block' : 'none';
        }
        
        if (empresaMensaje) {
          empresaMensaje.style.display = isEmpresa ? 'block' : 'none';
        }
        
        if (registerBtn) {
          registerBtn.disabled = isEmpresa;
          registerBtn.style.opacity = isEmpresa ? '0.5' : '1';
          registerBtn.title = isEmpresa ? 'Las empresas deben contactar por WhatsApp' : '';
        }
      });
    }

    // LOGIN
    const doLogin = document.getElementById('doLogin');
    if (doLogin) {
      doLogin.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
          showMessage('Por favor, completa todos los campos', 'error');
          return;
        }

        const btn = doLogin;
        const originalText = btn.innerHTML;
        
        try {
          btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
          btn.disabled = true;

          const data = await api.login({ email, password });
          api.setToken(data.token);
          api.setUser(data.user);
          
          window.location.href = data.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
          
        } catch (err) {
          showMessage(err.message, 'error');
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      });
    }

    // REGISTRO
    const doRegister = document.getElementById('doRegister');
    if (doRegister) {
      doRegister.addEventListener('click', async () => {
        const role = document.getElementById('regRole')?.value;
        
        // Si es empresa, mostrar mensaje de WhatsApp
        if (role === 'empresa') {
          showMessage('📋 Las cuentas empresariales requieren verificación. Contáctanos por WhatsApp.', 'error');
          return;
        }
        
        const email = document.getElementById('regEmail')?.value;
        const password = document.getElementById('regPassword')?.value;
        const nombre = document.getElementById('regNombre')?.value;
        const telefono = document.getElementById('regTelefono')?.value;
        const terminos = document.getElementById('terminos')?.checked;

        if (!email || !password || !nombre || !telefono) {
          showMessage('Por favor, completa los campos obligatorios', 'error');
          return;
        }

        if (!terminos) {
          showMessage('Debes aceptar los términos y condiciones', 'error');
          return;
        }

        if (password.length < 6) {
          showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
          return;
        }

        const btn = doRegister;
        const originalText = btn.innerHTML;
        
        try {
          btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
          btn.disabled = true;

          await api.register({ 
            email, 
            password, 
            role: 'ciudadano', 
            nombre, 
            telefono,
            empresa_nombre: null 
          });
          
          showMessage('✅ Registro exitoso. Ahora inicia sesión.', 'success');
          
          // Limpiar formulario
          document.getElementById('regEmail').value = '';
          document.getElementById('regPassword').value = '';
          document.getElementById('regPassword2').value = '';
          document.getElementById('regNombre').value = '';
          document.getElementById('regTelefono').value = '';
          document.getElementById('terminos').checked = false;
          
          // Cambiar a pestaña login
          if (tabLogin) tabLogin.click();
          
        } catch (err) {
          showMessage(err.message, 'error');
        } finally {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      });
    }

    // Enter key support
    const loginPassword = document.getElementById('loginPassword');
    if (loginPassword) {
      loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doLogin?.click();
      });
    }
  });
}

function showMessage(message, type = 'info') {
  const statusDiv = document.getElementById('registerStatus');
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = type === 'error' ? 'auth-error' : 'auth-success';
    statusDiv.style.display = 'block';
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  } else {
    alert(message);
  }
}