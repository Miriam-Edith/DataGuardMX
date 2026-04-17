// ============================================
// INCIDENTES VIEW - DATA GUARD MX
// ============================================

async function cargarIncidentes() {
  try {
    const incidentes = await api.getMyReportes();
    const div = document.getElementById('incidentesList');
    
    if (!incidentes || incidentes.length === 0) {
      div.innerHTML = `<div class="empty-state"><i class="fas fa-shield-alt"></i>No has reportado incidentes de datos aún.</div>`;
      return;
    }
    
    div.innerHTML = incidentes.map(r => `
      <div class="incidente-card fade-up">
        <div class="incidente-header">
          <span class="incidente-tipo"><i class="fas fa-exclamation-triangle"></i> ${escapeHtml(r.tipo_contaminante || 'Incidente de datos')}</span>
          <span class="incidente-date"><i class="far fa-calendar-alt"></i> ${new Date(r.creado_en).toLocaleString()}</span>
        </div>
        <div class="incidente-entity">
          <i class="fas fa-building"></i> ${escapeHtml(r.ubicacion || 'Sin ubicación')}
        </div>
        <div class="incidente-desc">${escapeHtml(r.descripcion || 'Sin descripción')}</div>
      </div>
    `).join('');
    
  } catch (err) {
    console.error('Error cargando incidentes:', err);
    showToast(err.message, 'error');
  }
}

window.refreshIncidentes = cargarIncidentes;

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

cargarIncidentes();