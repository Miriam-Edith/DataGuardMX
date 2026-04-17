// ============================================
// DASHBOARD MODULE - DATA GUARD MX
// ============================================

import { initChatbot } from './chatbot.js';
import { initModals, openModal, showToast, closeModal } from './ui.js';
import { initAuth } from './auth.js';

let currentUser = null;
let currentView = 'riesgo';

// Inicialización principal del dashboard
export async function initDashboard() {
  try {
    const token = api.getToken();
    if (!token) {
      window.location.href = 'index.html';
      return false;
    }

    currentUser = api.getUser();
    if (!currentUser || !currentUser.id) {
      const userData = await api.getProfile();
      currentUser = userData;
      api.setUser(userData);
    }

    updateUserInterface();
    initializeEventListeners();
    
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
    showToast(`${greeting}, ${currentUser.nombre || 'Usuario'}`, 'success');
    
    return true;

  } catch (error) {
    console.error('Error en inicialización:', error);
    showToast('Error al cargar el dashboard', 'error');
    return false;
  }
}

// Cargar vista
export async function loadView(view) {
  const main = document.getElementById('mainPanel');
  if (!main) return;
  
  currentView = view;
  
  main.innerHTML = `
    <div class="empty-state fade-in">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Cargando vista ${view}...</p>
    </div>
  `;
  
  try {
    const response = await fetch(`/views/${view}.html`);
    if (!response.ok) throw new Error(`Vista no encontrada: ${view}`);
    
    const html = await response.text();
    main.innerHTML = html;
    
    // Remover script anterior si existe
    const oldScript = document.querySelector(`script[data-view="${view}"]`);
    if (oldScript) {
      oldScript.remove();
    }
    
    // Cargar script de la vista
    const script = document.createElement('script');
    script.src = `js/views/${view}.js`;
    script.type = 'module';
    script.setAttribute('data-view', view);
    document.body.appendChild(script);
    
    // Esperar un momento y luego forzar el refresh específico
    setTimeout(() => {
      if (view === 'riesgo' && typeof window.refreshRiesgo === 'function') {
        console.log('Forzando refresh de riesgo');
        window.refreshRiesgo();
      } else if (view === 'consentimientos' && typeof window.refreshConsentimientos === 'function') {
        window.refreshConsentimientos();
      } else if (view === 'incidentes' && typeof window.refreshIncidentes === 'function') {
        window.refreshIncidentes();
      } else if (view === 'alertas' && typeof window.refreshAlertas === 'function') {
        window.refreshAlertas();
      } else if (view === 'mapa' && typeof window.refreshMapa === 'function') {
        window.refreshMapa();
      } else if (view === 'buscador' && typeof window.refreshBuscador === 'function') {
        window.refreshBuscador();
      }
    }, 200);
    
    main.classList.add('fade-in');
    setTimeout(() => main.classList.remove('fade-in'), 400);
    
  } catch (error) {
    console.error('Error cargando vista:', error);
    main.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar la vista</p>
        <small>${error.message}</small>
        <button class="btn-outline mt-2" onclick="location.reload()">Reintentar</button>
      </div>
    `;
  }
}

// Obtener usuario actual
export function getCurrentUser() {
  return currentUser;
}

// Actualizar interfaz de usuario
function updateUserInterface() {
  const roleBadge = document.getElementById('userRoleBadge');
  if (roleBadge) {
    const roleText = currentUser?.role === 'empresa' ? '👔 EMPRESA' : '👤 CIUDADANO';
    roleBadge.textContent = roleText;
  }

  const profileName = document.querySelector('.profile-text');
  if (profileName && currentUser?.nombre) {
    profileName.textContent = currentUser.nombre.split(' ')[0];
  }
}

// Inicializar event listeners
function initializeEventListeners() {
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
  
  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  menuBtn?.addEventListener('click', () => sidebar?.classList.toggle('open'));
  
  document.getElementById('profileBtn')?.addEventListener('click', mostrarFormularioPerfil);
  
  // Navegación
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const view = btn.getAttribute('data-view');
      
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      btn.classList.add('active');
      
      await loadView(view);
      
      if (window.innerWidth < 768) {
        sidebar?.classList.remove('open');
      }
    });
  });
  
  document.addEventListener('click', (e) => {
    if (window.innerWidth < 768) {
      const sidebar = document.getElementById('sidebar');
      const menuBtn = document.getElementById('menuBtn');
      if (sidebar && menuBtn && !sidebar.contains(e.target) && !menuBtn.contains(e.target) && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    }
  });
  
  initializeModalListeners();
  
  // Event listeners para los botones de guardar
  const saveConsentBtn = document.getElementById('saveConsentimientoBtn');
  if (saveConsentBtn) {
    saveConsentBtn.addEventListener('click', saveConsentimiento);
  }
  
  const saveIncidenteBtn = document.getElementById('saveIncidenteBtn');
  if (saveIncidenteBtn) {
    saveIncidenteBtn.addEventListener('click', saveIncidente);
  }
  
  const savePerfilBtn = document.getElementById('savePerfilBtn');
  if (savePerfilBtn) {
    savePerfilBtn.addEventListener('click', savePerfil);
  }
}

// Cerrar sesión
function handleLogout() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    showToast('Cerrando sesión...', 'info');
    setTimeout(() => {
      api.removeToken();
      api.removeUser();
      window.location.href = 'index.html';
    }, 500);
  }
}

// Inicializar modales
function initializeModalListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(modal => {
        closeModal(modal.id);
      });
    }
  });
  
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) closeModal(modal.id);
    });
  });
  
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) closeModal(modal.id);
    });
  });
}

// Mostrar formulario de perfil
async function mostrarFormularioPerfil() {
  try {
    const perfil = await api.getProfile();
    
    const nombreInput = document.getElementById('perfilNombre');
    const emailInput = document.getElementById('perfilEmail');
    const telefonoInput = document.getElementById('perfilTelefono');
    const direccionInput = document.getElementById('perfilDireccion');
    
    if (nombreInput) nombreInput.value = perfil.nombre || '';
    if (emailInput) emailInput.value = perfil.email || '';
    if (telefonoInput) telefonoInput.value = perfil.telefono || '';
    if (direccionInput) direccionInput.value = perfil.direccion || '';
    
    const empresaField = document.getElementById('perfilEmpresaField');
    const empresaInput = document.getElementById('perfilEmpresa');
    
    if (currentUser?.role === 'empresa' && empresaField) {
      empresaField.style.display = 'block';
      if (empresaInput) empresaInput.value = perfil.empresa_nombre || '';
    } else if (empresaField) {
      empresaField.style.display = 'none';
    }
    
    const passActual = document.getElementById('perfilPasswordActual');
    const passNueva = document.getElementById('perfilPasswordNueva');
    const passConfirm = document.getElementById('perfilPasswordConfirm');
    
    if (passActual) passActual.value = '';
    if (passNueva) passNueva.value = '';
    if (passConfirm) passConfirm.value = '';
    
    openModal('modalPerfil');
    
  } catch (err) {
    showToast(`Error al cargar perfil: ${err.message}`, 'error');
  }
}

// Guardar perfil
async function savePerfil(e) {
  const btn = e.target;
  const originalText = btn.innerHTML;
  
  try {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    btn.disabled = true;
    
    const nombre = document.getElementById('perfilNombre')?.value.trim() || '';
    const telefono = document.getElementById('perfilTelefono')?.value.trim() || '';
    const direccion = document.getElementById('perfilDireccion')?.value.trim() || '';
    const empresa_nombre = document.getElementById('perfilEmpresa')?.value.trim() || '';
    
    await api.updateProfile({ nombre, telefono, direccion, empresa_nombre });
    
    const passwordActual = document.getElementById('perfilPasswordActual')?.value || '';
    const nuevaPassword = document.getElementById('perfilPasswordNueva')?.value || '';
    const confirmPassword = document.getElementById('perfilPasswordConfirm')?.value || '';
    
    if (passwordActual || nuevaPassword || confirmPassword) {
      if (!passwordActual || !nuevaPassword || !confirmPassword) {
        throw new Error('Para cambiar la contraseña, completa todos los campos');
      }
      if (nuevaPassword !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      if (nuevaPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }
      await api.changePassword({ currentPassword: passwordActual, newPassword: nuevaPassword });
      showToast('🔐 Contraseña actualizada', 'success');
    }
    
    const updatedUser = await api.getProfile();
    api.setUser({ ...currentUser, ...updatedUser });
    currentUser = api.getUser();
    updateUserInterface();
    
    showToast('✅ Perfil actualizado', 'success');
    closeModal('modalPerfil');
    
  } catch (err) {
    showToast(`❌ ${err.message}`, 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Guardar consentimiento
async function saveConsentimiento(e) {
  const btn = e.target;
  const originalText = btn.innerHTML;
  
  try {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    btn.disabled = true;
    
    const empresa = document.getElementById('consentEmpresa')?.value.trim();
    if (!empresa) throw new Error('El nombre de la empresa es obligatorio');
    
    const finalidad = document.getElementById('consentFinalidad')?.value.trim() || '';
    const vigencia = document.getElementById('consentVigencia')?.value || null;
    
    await api.createConsentimiento({ empresa, finalidad, vigencia });
    showToast('✅ Consentimiento registrado', 'success');
    closeModal('modalConsentimiento');
    
    if (currentView === 'consentimientos' && window.refreshConsentimientos) {
      await window.refreshConsentimientos();
    }
    
  } catch (err) {
    showToast(`❌ ${err.message}`, 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Guardar incidente
async function saveIncidente(e) {
  const btn = e.target;
  const originalText = btn.innerHTML;
  
  try {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    btn.disabled = true;
    
    const tipo = document.getElementById('incidenteTipo')?.value || 'Otro';
    const entidad = document.getElementById('incidenteEntidad')?.value.trim() || '';
    const descripcion = document.getElementById('incidenteDescripcion')?.value.trim();
    const fecha = document.getElementById('incidenteFecha')?.value || new Date().toISOString().split('T')[0];
    const latitud = parseFloat(document.getElementById('incidenteLatitud')?.value);
    const longitud = parseFloat(document.getElementById('incidenteLongitud')?.value);
    
    if (!descripcion) throw new Error('La descripción es obligatoria');
    
    await api.createReporte({
      tipo_contaminante: tipo,
      ubicacion: entidad || 'No especificada',
      descripcion,
      fecha: fecha,
      latitud: isNaN(latitud) ? null : latitud,
      longitud: isNaN(longitud) ? null : longitud
    });
    
    showToast('🚨 Incidente reportado', 'success');
    closeModal('modalIncidente');
    
    if (currentView === 'incidentes' && window.refreshIncidentes) {
      await window.refreshIncidentes();
    }
    if (currentView === 'mapa' && window.refreshMapa) {
      window.refreshMapa();
    }
    
  } catch (err) {
    showToast(`❌ ${err.message}`, 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Funciones globales para modales
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.mostrarFormularioConsentimientoModal = () => openModal('modalConsentimiento');
window.mostrarFormularioIncidenteModal = () => openModal('modalIncidente');

// Exportar funciones de actualización de badges
window.updateBadges = async function() {
  try {
    const alertas = await api.getAlertas();
    const noLeidas = alertas.filter(a => !a.leida).length;
    document.getElementById('alertBadge').textContent = noLeidas;
    document.getElementById('notificationBadge').textContent = noLeidas;
    
    const consentimientos = await api.getConsentimientos();
    document.getElementById('consentBadge').textContent = consentimientos.length;
    
    const incidentes = await api.getMyReportes();
    document.getElementById('incidentBadge').textContent = incidentes.length;
    
    const user = api.getUser();
    if (user.role === 'empresa') {
      document.getElementById('exportARCOBtn').style.display = 'flex';
    }
  } catch (error) {
    console.error('Error actualizando badges:', error);
  }
};

// Configuración inicial al cargar el DOM
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const isAuth = await initAuth();
    if (!isAuth) {
      window.location.href = 'index.html';
      return;
    }
    
    await initDashboard();
    initChatbot();
    initModals();
    
    // Configurar navegación
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        const view = item.dataset.view;
        await loadView(view);
        
        if (window.innerWidth < 768) {
          document.getElementById('sidebar').classList.remove('open');
        }
      });
    });
    
    // Configurar exportaciones
    document.getElementById('exportConsentimientosBtn')?.addEventListener('click', () => {
      window.exportarConsentimientos();
    });
    document.getElementById('exportIncidentesBtn')?.addEventListener('click', () => {
      window.exportarIncidentes();
    });
    document.getElementById('exportARCOBtn')?.addEventListener('click', () => {
      if (typeof window.exportarCertificadoARCO === 'function') {
        window.exportarCertificadoARCO();
      }
    });
    
    // Configurar notificaciones
    const btn = document.getElementById('notificationsBtn');
    const panel = document.getElementById('notificationsPanel');
    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('open');
    });
    document.addEventListener('click', () => {
      panel?.classList.remove('open');
    });
    document.getElementById('markAllRead')?.addEventListener('click', async () => {
      showToast('Notificaciones marcadas como leídas', 'success');
    });
    
    // Configurar estado de conexión
    const statusEl = document.getElementById('connectionStatus');
    function checkConnection() {
      if (navigator.onLine) {
        statusEl.className = 'connection-status online';
        statusEl.innerHTML = '<i class="fas fa-circle"></i><span>Conectado</span>';
      } else {
        statusEl.className = 'connection-status offline';
        statusEl.innerHTML = '<i class="fas fa-circle"></i><span>Sin conexión</span>';
      }
    }
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    checkConnection();
    
    // Cargar vista inicial
    await loadView('riesgo');
    
    // Actualizar badges periódicamente
    window.updateBadges();
    setInterval(window.updateBadges, 30000);
    
    // Configurar pestañas del perfil
    document.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
      });
    });
    
    // Medidor de fortaleza de contraseña
    const passInput = document.getElementById('perfilPasswordNueva');
    if (passInput) {
      passInput.addEventListener('input', (e) => {
        const strength = calculatePasswordStrength(e.target.value);
        const strengthEl = document.getElementById('passwordStrength');
        const texts = ['Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];
        const colors = ['#e74c3c', '#e74c3c', '#f0a500', '#2ecc71', '#2ecc71'];
        strengthEl.innerHTML = texts[strength];
        strengthEl.style.color = colors[strength];
      });
    }
    
  } catch (error) {
    console.error('Error en inicialización:', error);
    showToast('Error al cargar el dashboard', 'error');
  }
});

function calculatePasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}