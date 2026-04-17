// ============================================
// ALERTAS VIEW - DATA GUARD MX
// ============================================

async function cargarAlertas() {
  try {
    const alertas = await api.getAlertas();
    const div = document.getElementById('alertasList');
    
    if (!alertas || alertas.length === 0) {
      div.innerHTML = `<div class="empty-state"><i class="fas fa-bell-slash"></i>No hay alertas activas.</div>`;
      return;
    }
    
    div.innerHTML = alertas.map(a => `
      <div class="alerta-card ${a.severidad || 'info'} fade-up">
        <div class="alerta-content">
          <div class="alerta-sev">
            <i class="fas ${getSeverityIcon(a.severidad)}"></i> ${a.severidad?.toUpperCase() || 'INFO'}
          </div>
          <div class="alerta-title">${escapeHtml(a.mensaje)}</div>
          <div class="alerta-meta">
            <i class="far fa-clock"></i> ${new Date(a.creada_en).toLocaleString()}
          </div>
        </div>
        <div class="alerta-actions">
          ${!a.leida 
            ? `<button class="btn-teal btn-sm" onclick="marcarLeida(${a.id})">
                 <i class="fas fa-check"></i> Marcar leída
               </button>`
            : `<span class="badge badge-info"><i class="fas fa-check-circle"></i> LEÍDA</span>`
          }
        </div>
      </div>
    `).join('');
    
  } catch (err) {
    console.error('Error cargando alertas:', err);
    showToast(err.message, 'error');
  }
}

function getSeverityIcon(severity) {
  switch (severity?.toLowerCase()) {
    case 'alta': return 'fa-skull-crosswalk';
    case 'media': return 'fa-exclamation-triangle';
    case 'baja': return 'fa-info-circle';
    default: return 'fa-bell';
  }
}

window.marcarLeida = async (id) => {
  try {
    await api.markAlertaRead(id);
    showToast('✅ Alerta marcada como leída', 'success');
    await cargarAlertas();
  } catch (err) {
    showToast(`❌ ${err.message}`, 'error');
  }
};

window.refreshAlertas = cargarAlertas;

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

cargarAlertas();