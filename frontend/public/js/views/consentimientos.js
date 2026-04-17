// ============================================
// CONSENTIMIENTOS VIEW - DATA GUARD MX
// ============================================

async function cargarConsentimientos() {
  try {
    const list = await api.getConsentimientos();
    const tbody = document.getElementById('consentTableBody');
    
    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i class="fas fa-hand-peace"></i>No hay consentimientos registrados.</div></td></tr>`;
      return;
    }
    
    tbody.innerHTML = list.map(c => `
      <tr>
        <td><strong>${escapeHtml(c.empresa)}</strong></td>
        <td>${escapeHtml(c.finalidad || '—')}</td>
        <td>${c.vigencia ? new Date(c.vigencia).toLocaleDateString() : 'Indefinida'}</td>
        <td><span class="badge ${c.estado === 'activo' ? 'badge-active' : 'badge-revoked'}">${c.estado.toUpperCase()}</span></td>
        <td>
          <button class="btn-red btn-sm" onclick="revocarConsentimiento(${c.id})">
            <i class="fas fa-trash"></i> Revocar
          </button>
        </td>
      </tr>
    `).join('');
    
  } catch (err) {
    console.error('Error cargando consentimientos:', err);
    showToast(err.message, 'error');
  }
}

window.revocarConsentimiento = async (id) => {
  if (!confirm('¿Estás seguro de que deseas revocar este consentimiento?')) return;
  
  try {
    await api.revokeConsentimiento(id);
    showToast('✅ Consentimiento revocado', 'success');
    await cargarConsentimientos();
  } catch (err) {
    showToast(`❌ ${err.message}`, 'error');
  }
};

window.refreshConsentimientos = cargarConsentimientos;

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

cargarConsentimientos();