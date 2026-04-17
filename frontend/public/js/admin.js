// ============================================
// ADMIN MODULE - DATA GUARD MX (COMPLETO)
// ============================================

let currentEditUserId = null;
let currentResetUserId = null;
let allUsers = [];

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  const token = api.getToken();
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
  
  const user = api.getUser();
  if (user.role !== 'admin') {
    window.location.href = 'dashboard.html';
    return;
  }

  // Configurar botón de logout
  document.getElementById('logoutAdmin')?.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      api.removeToken();
      api.removeUser();
      window.location.href = 'index.html';
    }
  });

  // Configurar navegación por pestañas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panelId = `panel-${btn.dataset.tab}`;
      document.getElementById(panelId)?.classList.add('active');
    });
  });

  // Inicializar formularios
  initFormularioUsuario();
  initFormularioEmpresa();
  
  // Event listener para cambio de rol en crear usuario
  document.getElementById('usuarioRol')?.addEventListener('change', (e) => {
    const empresaField = document.getElementById('usuarioEmpresaField');
    if (empresaField) {
      empresaField.style.display = e.target.value === 'empresa' ? 'block' : 'none';
    }
  });

  // Cargar datos
  await Promise.all([
    cargarUsuarios(),
    cargarReportesAdmin(),
    cargarEmpresas(),
    cargarDashboardStats()
  ]);
});

// ============================================
// DASHBOARD Y ESTADÍSTICAS
// ============================================

async function cargarDashboardStats() {
  try {
    const users = await api.request('/users', 'GET', null, api.getToken());
    allUsers = users;
    
    const reportes = await api.getAllReportes();
    const alertas = await api.getAlertas();
    
    const empresas = users.filter(u => u.role === 'empresa');
    
    document.getElementById('statTotal').textContent = users.length;
    document.getElementById('statActivos').textContent = users.filter(u => u.is_active).length;
    document.getElementById('statInactivos').textContent = users.filter(u => !u.is_active).length;
    document.getElementById('statEmpresas').textContent = empresas.length;
    document.getElementById('statReportes').textContent = reportes?.length || 0;
    document.getElementById('statAlertas').textContent = alertas?.length || 0;
    
    document.getElementById('usersCount').textContent = users.length;
    document.getElementById('empresasCount').textContent = empresas.length;
    document.getElementById('reportesCount').textContent = reportes?.length || 0;
    
    // Actividad reciente
    const recentActivity = document.getElementById('recentActivity');
    const recentUsers = [...users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
    const recentReports = [...(reportes || [])].sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en)).slice(0, 5);
    
    recentActivity.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div>
          <h4 style="color: var(--cyan); margin-bottom: 0.5rem;">📝 Últimos usuarios</h4>
          ${recentUsers.map(u => `
            <div style="padding: 0.5rem 0; border-bottom: 1px solid var(--edge);">
              <strong>${escapeHtml(u.email)}</strong>
              <small style="color: var(--muted); display: block;">${new Date(u.created_at).toLocaleDateString()}</small>
            </div>
          `).join('') || '<p class="muted">No hay usuarios recientes</p>'}
        </div>
        <div>
          <h4 style="color: var(--cyan); margin-bottom: 0.5rem;">📋 Últimos reportes</h4>
          ${recentReports.map(r => `
            <div style="padding: 0.5rem 0; border-bottom: 1px solid var(--edge);">
              <strong>${escapeHtml(r.tipo_contaminante || 'Reporte')}</strong>
              <small style="color: var(--muted); display: block;">${new Date(r.creado_en).toLocaleDateString()}</small>
            </div>
          `).join('') || '<p class="muted">No hay reportes recientes</p>'}
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error('Error cargando dashboard:', error);
  }
}

// ============================================
// FUNCIONES PARA USUARIOS
// ============================================

let currentFilters = { role: '', status: '', search: '' };

async function cargarUsuarios() {
  try {
    const params = new URLSearchParams();
    if (currentFilters.role) params.append('role', currentFilters.role);
    if (currentFilters.status === 'activo') params.append('is_active', 'true');
    if (currentFilters.status === 'inactivo') params.append('is_active', 'false');
    if (currentFilters.search) params.append('search', currentFilters.search);
    
    const queryString = params.toString();
    const url = queryString ? `/users?${queryString}` : '/users';
    
    const users = await api.request(url, 'GET', null, api.getToken());
    allUsers = users;
    
    const tbody = document.getElementById('usersTableBody');
    document.getElementById('usersMeta').textContent = `${users.length} registros encontrados`;
    
    if (!users || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No hay usuarios registrados</td></tr>';
      return;
    }
    
    tbody.innerHTML = users.map(u => {
      let roleClass = 'badge-user';
      let roleIcon = '👤';
      if (u.role === 'admin') {
        roleClass = 'badge-admin';
        roleIcon = '👑';
      } else if (u.role === 'empresa') {
        roleClass = 'badge-empresa';
        roleIcon = '🏢';
      }
      
      return `
        <tr>
          <td class="id-cell">#${u.id}</td>
          <td class="email-cell">${escapeHtml(u.email)}</td>
          <td>${escapeHtml(u.nombre || '—')}</td>
          <td><span class="badge ${roleClass}">${roleIcon} ${u.role.toUpperCase()}</span></td>
          <td>${escapeHtml(u.empresa_nombre || '—')}</td>
          <td><span class="badge ${u.is_active ? 'badge-active' : 'badge-inactive'}">${u.is_active ? 'ACTIVO' : 'INACTIVO'}</span></td>
          <td class="id-cell">${new Date(u.created_at).toLocaleDateString()}</td>
          <td class="actions-cell">
            <button class="btn-icon" onclick="editarUsuario(${u.id})" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" onclick="resetPassword(${u.id}, '${escapeHtml(u.email)}')" title="Resetear contraseña">
              <i class="fas fa-key"></i>
            </button>
            <button class="btn-icon ${u.is_active ? 'btn-deactivate' : 'btn-activate'}" onclick="toggleUserStatus(${u.id}, ${!u.is_active})" title="${u.is_active ? 'Desactivar' : 'Activar'}">
              <i class="fas ${u.is_active ? 'fa-ban' : 'fa-check-circle'}"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
  } catch (err) {
    console.error('Error cargando usuarios:', err);
    showToast(err.message, 'error');
  }
}

function aplicarFiltros() {
  currentFilters = {
    role: document.getElementById('filtroRol')?.value || '',
    status: document.getElementById('filtroStatus')?.value || '',
    search: document.getElementById('filtroSearch')?.value || ''
  };
  cargarUsuarios();
}

function limpiarFiltros() {
  if (document.getElementById('filtroRol')) document.getElementById('filtroRol').value = '';
  if (document.getElementById('filtroStatus')) document.getElementById('filtroStatus').value = '';
  if (document.getElementById('filtroSearch')) document.getElementById('filtroSearch').value = '';
  currentFilters = { role: '', status: '', search: '' };
  cargarUsuarios();
}

window.editarUsuario = async (id) => {
  try {
    const user = await api.request(`/users/${id}`, 'GET', null, api.getToken());
    currentEditUserId = id;
    
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editNombre').value = user.nombre || '';
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editTelefono').value = user.telefono || '';
    document.getElementById('editDireccion').value = user.direccion || '';
    document.getElementById('editRol').value = user.role;
    document.getElementById('editEmpresaNombre').value = user.empresa_nombre || '';
    document.getElementById('editActivo').checked = user.is_active;
    
    const empresaField = document.getElementById('editEmpresaField');
    if (empresaField) {
      empresaField.style.display = user.role === 'empresa' ? 'block' : 'none';
    }
    
    openModal('modalEditUser');
  } catch (error) {
    showToast('Error al cargar usuario: ' + error.message, 'error');
  }
};

window.guardarEdicionUsuario = async () => {
  const id = document.getElementById('editUserId').value;
  const data = {
    nombre: document.getElementById('editNombre').value,
    telefono: document.getElementById('editTelefono').value,
    direccion: document.getElementById('editDireccion').value,
    role: document.getElementById('editRol').value,
    empresa_nombre: document.getElementById('editEmpresaNombre').value,
    is_active: document.getElementById('editActivo').checked
  };
  
  try {
    await api.request(`/users/${id}`, 'PUT', data, api.getToken());
    showToast('Usuario actualizado correctamente', 'success');
    closeModal('modalEditUser');
    await Promise.all([cargarUsuarios(), cargarEmpresas(), cargarDashboardStats()]);
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
};

window.toggleUserStatus = async (id, newStatus) => {
  try {
    await api.updateUserStatus(id, newStatus);
    showToast(`Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente`, 'success');
    await Promise.all([cargarUsuarios(), cargarEmpresas(), cargarDashboardStats()]);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.resetPassword = (id, email) => {
  currentResetUserId = id;
  document.getElementById('resetUserId').value = id;
  document.getElementById('resetUserEmail').textContent = email;
  generarNuevaPassword();
  openModal('modalResetPassword');
};

function generarNuevaPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById('resetPasswordValue').value = password;
}

window.confirmarResetPassword = async () => {
  const id = currentResetUserId;
  const nuevaPassword = document.getElementById('resetPasswordValue').value;
  const enviarEmail = document.getElementById('resetEnviarEmail').checked;
  
  try {
    await api.request(`/users/${id}/reset-password`, 'POST', { 
      nueva_password: nuevaPassword,
      enviar_email: enviarEmail 
    }, api.getToken());
    showToast(`Contraseña actualizada. Nueva: ${nuevaPassword}`, 'success');
    closeModal('modalResetPassword');
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
};

// ============================================
// FUNCIONES PARA CREAR USUARIO
// ============================================

function initFormularioUsuario() {
  const form = document.getElementById('formCrearUsuario');
  if (!form) return;
  
  const generarPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('usuarioPassword').value = password;
  };
  
  document.getElementById('generarPasswordUsuario')?.addEventListener('click', generarPassword);
  generarPassword();
  
  document.getElementById('limpiarFormUsuario')?.addEventListener('click', () => {
    document.getElementById('usuarioNombre').value = '';
    document.getElementById('usuarioEmail').value = '';
    document.getElementById('usuarioTelefono').value = '';
    document.getElementById('usuarioDireccion').value = '';
    document.getElementById('usuarioRol').value = 'ciudadano';
    document.getElementById('usuarioEmpresa').value = '';
    document.getElementById('usuarioEmpresaField').style.display = 'none';
    generarPassword();
    document.getElementById('usuarioResultado').style.display = 'none';
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await crearUsuario();
  });
}

async function crearUsuario() {
  const nombre = document.getElementById('usuarioNombre')?.value.trim();
  const email = document.getElementById('usuarioEmail')?.value.trim().toLowerCase();
  const telefono = document.getElementById('usuarioTelefono')?.value.trim();
  const direccion = document.getElementById('usuarioDireccion')?.value.trim();
  const role = document.getElementById('usuarioRol')?.value;
  const empresa_nombre = document.getElementById('usuarioEmpresa')?.value.trim();
  const password = document.getElementById('usuarioPassword')?.value;
  const enviarCorreo = document.getElementById('usuarioEnviarEmail')?.checked;
  
  const resultadoDiv = document.getElementById('usuarioResultado');
  
  if (!email || !password) {
    resultadoDiv.className = 'status-message error';
    resultadoDiv.innerHTML = '❌ Email y contraseña son obligatorios';
    resultadoDiv.style.display = 'block';
    return;
  }
  
  const btn = document.getElementById('crearUsuarioBtn');
  const originalText = btn.innerHTML;
  
  try {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
    btn.disabled = true;
    
    const response = await api.request('/users', 'POST', {
      email,
      password,
      role,
      nombre,
      empresa_nombre: role === 'empresa' ? empresa_nombre : null,
      telefono,
      direccion,
      enviar_email: enviarCorreo
    }, api.getToken());
    
    resultadoDiv.className = 'status-message success';
    resultadoDiv.innerHTML = `✅ Usuario creado exitosamente<br>📧 ${email}<br>🔑 ${response.user?.password_generada || password}`;
    resultadoDiv.style.display = 'block';
    
    document.getElementById('limpiarFormUsuario')?.click();
    await Promise.all([cargarUsuarios(), cargarEmpresas(), cargarDashboardStats()]);
    
    // Cambiar a pestaña de usuarios
    document.querySelector('.tab-btn[data-tab="users"]').click();
    
  } catch (error) {
    resultadoDiv.className = 'status-message error';
    resultadoDiv.innerHTML = `❌ Error: ${error.message}`;
    resultadoDiv.style.display = 'block';
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ============================================
// FUNCIONES PARA EMPRESAS
// ============================================

function initFormularioEmpresa() {
  const form = document.getElementById('formCrearEmpresa');
  if (!form) return;
  
  const generarPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('empresaPassword').value = password;
  };
  
  document.getElementById('generarPassword')?.addEventListener('click', generarPassword);
  generarPassword();
  
  document.getElementById('limpiarFormEmpresa')?.addEventListener('click', () => {
    document.getElementById('empresaNombre').value = '';
    document.getElementById('empresaRFC').value = '';
    document.getElementById('empresaEmail').value = '';
    document.getElementById('empresaTelefono').value = '';
    document.getElementById('empresaContacto').value = '';
    document.getElementById('empresaPuesto').value = '';
    generarPassword();
    document.getElementById('empresaResultado').style.display = 'none';
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await crearEmpresa();
  });
}

async function crearEmpresa() {
  const nombre = document.getElementById('empresaNombre')?.value.trim();
  const rfc = document.getElementById('empresaRFC')?.value.trim().toUpperCase();
  const email = document.getElementById('empresaEmail')?.value.trim().toLowerCase();
  const telefono = document.getElementById('empresaTelefono')?.value.trim();
  const contacto = document.getElementById('empresaContacto')?.value.trim();
  const password = document.getElementById('empresaPassword')?.value;
  const enviarCorreo = document.getElementById('empresaEnviarCredenciales')?.checked;
  
  const resultadoDiv = document.getElementById('empresaResultado');
  
  if (!nombre || !email || !telefono || !contacto) {
    resultadoDiv.className = 'status-message error';
    resultadoDiv.innerHTML = '❌ Completa todos los campos obligatorios';
    resultadoDiv.style.display = 'block';
    return;
  }
  
  const btn = document.getElementById('crearEmpresaBtn');
  const originalText = btn.innerHTML;
  
  try {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
    btn.disabled = true;
    
    const response = await api.request('/users', 'POST', {
      email,
      password,
      role: 'empresa',
      nombre: contacto,
      empresa_nombre: nombre,
      telefono,
      rfc: rfc,
      enviar_email: enviarCorreo
    }, api.getToken());
    
    resultadoDiv.className = 'status-message success';
    resultadoDiv.innerHTML = `✅ Empresa creada exitosamente<br>📧 ${email}<br>🔑 ${response.user?.password_generada || password}<br>🏢 RFC: ${rfc}`;
    resultadoDiv.style.display = 'block';
    
    document.getElementById('limpiarFormEmpresa')?.click();
    await Promise.all([cargarUsuarios(), cargarEmpresas(), cargarDashboardStats()]);
    
  } catch (error) {
    resultadoDiv.className = 'status-message error';
    resultadoDiv.innerHTML = `❌ Error: ${error.message}`;
    resultadoDiv.style.display = 'block';
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

async function cargarEmpresas() {
  try {
    const users = await api.request('/users?role=empresa', 'GET', null, api.getToken());
    const tbody = document.getElementById('empresasTableBody');
    const meta = document.getElementById('empresasMeta');
    
    if (meta) meta.textContent = `${users.length} empresas registradas`;
    
    if (!users || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No hay empresas registradas</td></tr>';
      return;
    }
    
    tbody.innerHTML = users.map(e => `
      <tr>
        <td class="id-cell">#${e.id}</td>
        <td><strong>${escapeHtml(e.empresa_nombre || e.nombre || '—')}</strong></td>
        <td class="id-cell">${escapeHtml(e.rfc || '—')}</td>
        <td class="email-cell">${escapeHtml(e.email)}</td>
        <td>${escapeHtml(e.nombre || '—')}</td>
        <td>${escapeHtml(e.telefono || '—')}</td>
        <td><span class="badge ${e.is_active ? 'badge-active' : 'badge-inactive'}">${e.is_active ? 'ACTIVO' : 'INACTIVO'}</span></td>
        <td class="actions-cell">
          <button class="btn-icon" onclick="editarUsuario(${e.id})" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon" onclick="resetPassword(${e.id}, '${escapeHtml(e.email)}')" title="Resetear contraseña">
            <i class="fas fa-key"></i>
          </button>
        </td>
      </tr>
    `).join('');
    
  } catch (err) {
    console.error('Error cargando empresas:', err);
  }
}

// ============================================
// FUNCIONES PARA REPORTES
// ============================================

async function cargarReportesAdmin() {
  try {
    const reportes = await api.getAllReportes();
    const tbody = document.getElementById('reportesTableBody');
    
    document.getElementById('reportesMeta').textContent = `${reportes?.length || 0} reportes en el sistema`;
    
    if (!reportes || reportes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay reportes registrados</td></tr>';
      return;
    }
    
    tbody.innerHTML = reportes.map(r => `
      <tr>
        <td class="id-cell">#${r.id}</td>
        <td class="email-cell">${escapeHtml(r.usuario_email || 'Desconocido')}</td>
        <td><span class="badge badge-info">${escapeHtml(r.tipo_contaminante || 'No especificado')}</span></td>
        <td>${escapeHtml(r.ubicacion || 'No especificada')}</td>
        <td class="id-cell">${new Date(r.creado_en).toLocaleString()}</td>
        <td>
          <button class="btn-icon" onclick="verDetalleReporte(${r.id})" title="Ver detalles">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `).join('');
    
  } catch (err) {
    console.error('Error cargando reportes:', err);
    showToast(err.message, 'error');
  }
}

window.verDetalleReporte = async (id) => {
  try {
    const reportes = await api.getAllReportes();
    const reporte = reportes.find(r => r.id === id);
    
    if (reporte) {
      const content = document.getElementById('reporteDetailContent');
      content.innerHTML = `
        <div class="field">
          <label>Tipo de incidente</label>
          <p><strong>${escapeHtml(reporte.tipo_contaminante || 'No especificado')}</strong></p>
        </div>
        <div class="field">
          <label>Ubicación</label>
          <p>${escapeHtml(reporte.ubicacion || 'No especificada')}</p>
        </div>
        <div class="field">
          <label>Fecha del reporte</label>
          <p>${new Date(reporte.creado_en).toLocaleString()}</p>
        </div>
        <div class="field">
          <label>Reportado por</label>
          <p>${escapeHtml(reporte.usuario_email || 'Usuario desconocido')}</p>
        </div>
        <div class="field">
          <label>Descripción completa</label>
          <p style="white-space: pre-wrap; background: var(--deep); padding: 1rem; border-radius: 8px;">${escapeHtml(reporte.descripcion || 'Sin descripción')}</p>
        </div>
      `;
      openModal('modalReporteDetail');
    }
  } catch (error) {
    showToast('Error al cargar detalle', 'error');
  }
};

// ============================================
// MODALES Y UTILIDADES
// ============================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

function showToast(message, type = 'info') {
  const toast = document.getElementById('adminToast');
  if (toast) {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  } else {
    alert(message);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Exponer funciones globales
window.aplicarFiltros = aplicarFiltros;
window.limpiarFiltros = limpiarFiltros;
window.editarUsuario = editarUsuario;
window.guardarEdicionUsuario = guardarEdicionUsuario;
window.toggleUserStatus = toggleUserStatus;
window.resetPassword = resetPassword;
window.generarNuevaPassword = generarNuevaPassword;
window.confirmarResetPassword = confirmarResetPassword;
window.verDetalleReporte = verDetalleReporte;