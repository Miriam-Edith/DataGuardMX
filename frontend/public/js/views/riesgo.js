// ============================================
// RIESGO VIEW - DATA GUARD MX (COMPLETO)
// ============================================

let riskChart = null;

// ============================================
// FUNCIÓN PRINCIPAL: CARGAR RIESGO
// ============================================
async function cargarRiesgo() {
  console.log('🔄 Cargando vista de riesgo...');
  
  try {
    // Verificar que los elementos existan
    const semaforoCard = document.getElementById('semaforoCard');
    const canvas = document.getElementById('riskChart');
    
    if (!semaforoCard && !canvas) {
      console.log('⚠️ Elementos de riesgo no encontrados en el DOM');
      return;
    }
    
    // Obtener datos
    const alertas = await api.getAlertas();
    const noLeidas = alertas.filter(a => !a.leida).length;
    const total = alertas.length;
    const leidas = total - noLeidas;
    
    // Determinar nivel de riesgo
    let nivel, clase;
    if (noLeidas >= 3) {
      nivel = 'ALTO';
      clase = 'rojo';
    } else if (noLeidas >= 1) {
      nivel = 'MEDIO';
      clase = 'amarillo';
    } else {
      nivel = 'BAJO';
      clase = 'verde';
    }
    
    // Actualizar semáforo
    if (semaforoCard) {
      semaforoCard.className = `semaforo-big ${clase}`;
      semaforoCard.innerHTML = `
        <span class="semaforo-label">Nivel de riesgo</span>
        <div>● ${nivel}</div>
      `;
    }
    
    // Actualizar estadísticas
    const statsDiv = document.getElementById('riskStats');
    if (statsDiv) {
      statsDiv.innerHTML = `
        <div class="card stat-item">
          <div class="stat-value">${noLeidas}</div>
          <div class="stat-label">Alertas no leídas</div>
        </div>
        <div class="card stat-item">
          <div class="stat-value">${leidas}</div>
          <div class="stat-label">Alertas leídas</div>
        </div>
        <div class="card stat-item">
          <div class="stat-value">${total}</div>
          <div class="stat-label">Total alertas</div>
        </div>
      `;
    }
    
    // Crear gráfico
    await crearGraficoRiesgo(noLeidas, leidas);
    
    // Cargar datos adicionales
    await cargarUltimasFiltraciones();
    await verificarRolParaExportacion();
    
    console.log('✅ Vista de riesgo cargada correctamente');
    
  } catch (err) {
    console.error('❌ Error cargando riesgo:', err);
    mostrarErrorRiesgo(err);
  }
}

// ============================================
// FUNCIÓN: CREAR GRÁFICO DE DONA
// ============================================
async function crearGraficoRiesgo(noLeidas, leidas) {
  const canvas = document.getElementById('riskChart');
  if (!canvas) return;
  
  // Verificar que Chart.js esté disponible
  if (typeof Chart === 'undefined') {
    console.log('⏳ Chart.js no disponible, reintentando...');
    setTimeout(() => crearGraficoRiesgo(noLeidas, leidas), 500);
    return;
  }
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Destruir gráfico anterior si existe
  if (riskChart) {
    riskChart.destroy();
    riskChart = null;
  }
  
  // Si no hay datos, mostrar gráfico vacío
  const data = noLeidas === 0 && leidas === 0 ? [1, 1] : [noLeidas, leidas];
  const labels = noLeidas === 0 && leidas === 0 ? ['Sin datos', 'Sin datos'] : ['No leídas', 'Leídas'];
  
  riskChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ['#ff4757', '#00e5c3'],
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#7a9db5',
            font: { family: "'JetBrains Mono', monospace", size: 11 },
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: '#0d1e2b',
          titleColor: '#e8f4fb',
          bodyColor: '#b8d4e4',
          borderColor: '#1e3f58',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// ============================================
// FUNCIÓN: MOSTRAR ERROR
// ============================================
function mostrarErrorRiesgo(err) {
  const semaforoCard = document.getElementById('semaforoCard');
  if (semaforoCard) {
    semaforoCard.className = 'semaforo-big rojo';
    semaforoCard.innerHTML = `
      <span class="semaforo-label">Error</span>
      <div>● ERROR</div>
    `;
  }
  
  const statsDiv = document.getElementById('riskStats');
  if (statsDiv) {
    statsDiv.innerHTML = `
      <div class="card">
        <p style="color: var(--red);">Error al cargar datos: ${err.message}</p>
      </div>
    `;
  }
}

// ============================================
// NUEVA FUNCIÓN: VERIFICAR FILTRACIONES
// ============================================
window.verificarFiltraciones = async function() {
  const btn = document.getElementById('checkBreachesBtn');
  const resultDiv = document.getElementById('breachesResult');
  
  if (btn) {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    btn.disabled = true;
  }
  
  resultDiv.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <i class="fas fa-spinner fa-spin" style="color: var(--cyan);"></i>
      <p style="color: var(--text2);">Verificando bases de datos de filtraciones...</p>
      <p style="color: var(--muted); font-size: 0.75rem;">Esto puede tomar unos segundos</p>
    </div>
  `;
  
  try {
    const result = await api.checkMyBreaches();
    
    if (result.error) {
      resultDiv.innerHTML = `
        <div style="background: rgba(245,166,35,.1); border: 1px solid rgba(245,166,35,.3); border-radius: 8px; padding: 15px;">
          <p style="color: var(--yellow);">
            <i class="fas fa-exclamation-triangle"></i> 
            Servicio no disponible. Intenta más tarde.
          </p>
        </div>
      `;
      return;
    }
    
    if (result.found) {
      const severityColor = result.count >= 5 ? 'var(--red)' : result.count >= 2 ? 'var(--yellow)' : 'var(--amber)';
      
      let breachesHtml = result.breaches.map(b => `
        <div style="background: rgba(231,76,60,.05); border: 1px solid var(--edge); border-radius: 6px; padding: 12px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: ${severityColor};">${b.name}</strong>
            <span style="color: var(--text2); font-size: 0.75rem;">
              <i class="far fa-calendar"></i> ${new Date(b.date).toLocaleDateString('es-MX')}
            </span>
          </div>
          <p style="color: var(--text2); font-size: 0.8rem; margin-top: 5px;">${b.domain}</p>
          ${b.description ? `<p style="color: var(--text); font-size: 0.8rem; margin-top: 8px;">${b.description.substring(0, 150)}...</p>` : ''}
          <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px;">
            ${b.dataClasses?.map(dc => `
              <span style="background: var(--deep); padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; color: var(--text2);">
                ${dc}
              </span>
            `).join('') || ''}
          </div>
        </div>
      `).join('');
      
      let recommendationsHtml = '';
      if (result.recommendations && result.recommendations.length > 0) {
        recommendationsHtml = `
          <div style="margin-top: 15px; padding: 12px; background: rgba(0,229,195,.05); border-radius: 6px;">
            <p style="color: var(--cyan); margin-bottom: 8px;">
              <i class="fas fa-lightbulb"></i> Recomendaciones:
            </p>
            <ul style="color: var(--text); padding-left: 20px;">
              ${result.recommendations.map(r => `<li style="margin: 5px 0;">${r}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      resultDiv.innerHTML = `
        <div style="background: rgba(231,76,60,.1); border: 1px solid ${severityColor}; border-radius: 8px; padding: 15px;">
          <p style="color: ${severityColor}; font-size: 1.1rem; margin-bottom: 10px;">
            <i class="fas fa-exclamation-circle"></i> 
            <strong>¡Tu correo aparece en ${result.count} filtración(es)!</strong>
          </p>
          <div style="max-height: 300px; overflow-y: auto; margin: 15px 0;">
            ${breachesHtml}
          </div>
          ${recommendationsHtml}
        </div>
      `;
      
      // Actualizar el semáforo de riesgo
      setTimeout(() => cargarRiesgo(), 1000);
      
    } else {
      resultDiv.innerHTML = `
        <div style="background: rgba(46,204,113,.1); border: 1px solid var(--green); border-radius: 8px; padding: 15px;">
          <p style="color: var(--green); font-size: 1.1rem;">
            <i class="fas fa-check-circle"></i> 
            <strong>¡Buenas noticias!</strong>
          </p>
          <p style="color: var(--text); margin-top: 10px;">
            Tu correo no aparece en filtraciones de datos conocidas.
          </p>
          <p style="color: var(--text2); margin-top: 10px; font-size: 0.85rem;">
            Sigue manteniendo buenas prácticas de seguridad digital y monitoreando tus cuentas regularmente.
          </p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error verificando filtraciones:', error);
    resultDiv.innerHTML = `
      <div style="background: rgba(231,76,60,.1); border: 1px solid var(--red); border-radius: 8px; padding: 15px;">
        <p style="color: var(--red);">
          <i class="fas fa-times-circle"></i> 
          Error al verificar filtraciones: ${error.message}
        </p>
      </div>
    `;
  } finally {
    if (btn) {
      btn.innerHTML = '<i class="fas fa-sync-alt"></i> Verificar ahora';
      btn.disabled = false;
    }
  }
};

// ============================================
// NUEVA FUNCIÓN: CARGAR ÚLTIMAS FILTRACIONES
// ============================================
window.cargarUltimasFiltraciones = async function() {
  const listDiv = document.getElementById('latestBreachesList');
  if (!listDiv) return;
  
  listDiv.innerHTML = `
    <p style="color: var(--text2); text-align: center; padding: 20px;">
      <i class="fas fa-spinner fa-spin"></i> Cargando...
    </p>
  `;
  
  try {
    const breaches = await api.getLatestBreaches(5);
    
    if (!breaches || breaches.length === 0) {
      listDiv.innerHTML = '<p style="color: var(--text2); text-align: center;">No hay información disponible.</p>';
      return;
    }
    
    listDiv.innerHTML = breaches.map(b => `
      <div style="background: var(--deep); border: 1px solid var(--edge); border-radius: 6px; padding: 12px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          ${b.logo ? `<img src="https://haveibeenpwned.com${b.logo}" style="width: 24px; height: 24px;" alt="${b.name}">` : ''}
          <div style="flex: 1;">
            <strong style="color: var(--cyan);">${b.name}</strong>
            <p style="color: var(--text2); font-size: 0.75rem;">${b.domain}</p>
          </div>
          <span style="background: var(--red); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem;">
            ${b.pwnCount?.toLocaleString() || 'N/A'}
          </span>
        </div>
        <p style="color: var(--text); font-size: 0.8rem; margin-top: 8px;">${b.description?.substring(0, 100)}...</p>
        <div style="display: flex; gap: 10px; margin-top: 8px; font-size: 0.7rem; color: var(--text2);">
          <span><i class="far fa-calendar"></i> ${new Date(b.date).toLocaleDateString('es-MX')}</span>
          ${b.verified ? '<span><i class="fas fa-check-circle" style="color: var(--green);"></i> Verificado</span>' : ''}
          ${b.sensitive ? '<span><i class="fas fa-exclamation-triangle" style="color: var(--yellow);"></i> Datos sensibles</span>' : ''}
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error cargando filtraciones:', error);
    listDiv.innerHTML = '<p style="color: var(--text2); text-align: center;">Error al cargar información.</p>';
  }
};

// ============================================
// NUEVA FUNCIÓN: CHEQUEO COMPLETO DE SEGURIDAD
// ============================================
window.realizarChequeoCompleto = async function() {
  const btn = document.getElementById('fullCheckBtn');
  const resultDiv = document.getElementById('fullCheckResult');
  
  if (btn) {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analizando...';
    btn.disabled = true;
  }
  
  resultDiv.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <i class="fas fa-spinner fa-spin" style="color: var(--cyan);"></i>
      <p style="color: var(--text2);">Realizando análisis completo de seguridad...</p>
    </div>
  `;
  
  try {
    const result = await api.performFullSecurityCheck();
    
    const riskColors = {
      'alto': 'var(--red)',
      'medio': 'var(--yellow)',
      'bajo': 'var(--green)'
    };
    
    let recommendationsHtml = '';
    if (result.recommendations && result.recommendations.length > 0) {
      recommendationsHtml = `
        <div style="margin-top: 15px;">
          <p style="color: var(--cyan); margin-bottom: 8px;">
            <i class="fas fa-list-check"></i> Recomendaciones:
          </p>
          <ul style="color: var(--text); padding-left: 20px;">
            ${result.recommendations.map(r => `<li style="margin: 8px 0;">${r}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    let compromisedHtml = '';
    if (result.compromisedData && result.compromisedData.length > 0) {
      compromisedHtml = `
        <div style="margin-top: 15px; padding: 10px; background: rgba(231,76,60,.05); border-radius: 6px;">
          <p style="color: var(--red); margin-bottom: 5px;">
            <i class="fas fa-exclamation-triangle"></i> Datos potencialmente comprometidos:
          </p>
          <div style="display: flex; flex-wrap: wrap; gap: 5px;">
            ${result.compromisedData.map(d => `
              <span style="background: var(--deep); padding: 4px 10px; border-radius: 4px; font-size: 0.75rem;">
                ${d}
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    resultDiv.innerHTML = `
      <div style="border-left: 4px solid ${riskColors[result.riskLevel] || 'var(--cyan)'}; padding-left: 15px;">
        <p style="font-size: 1.2rem; margin-bottom: 10px;">
          Nivel de Riesgo: 
          <span style="color: ${riskColors[result.riskLevel] || 'var(--cyan)'}; font-weight: bold;">
            ${result.riskLevel?.toUpperCase() || 'DESCONOCIDO'}
          </span>
        </p>
        ${result.emailBreaches?.found ? `
          <p style="color: var(--text);">
            <i class="fas fa-envelope"></i> 
            Tu correo aparece en ${result.emailBreaches.count} filtración(es).
          </p>
        ` : `
          <p style="color: var(--text);">
            <i class="fas fa-check-circle" style="color: var(--green);"></i> 
            No se encontraron filtraciones para tu correo.
          </p>
        `}
        ${compromisedHtml}
        ${recommendationsHtml}
      </div>
    `;
    
    // Actualizar recomendaciones en la sección dedicada
    if (result.recommendations && result.recommendations.length > 0) {
      mostrarRecomendaciones(result.recommendations);
    }
    
    // Actualizar el semáforo de riesgo
    setTimeout(() => cargarRiesgo(), 1000);
    
  } catch (error) {
    console.error('Error en chequeo completo:', error);
    resultDiv.innerHTML = `
      <div style="color: var(--red);">
        <i class="fas fa-times-circle"></i> 
        Error al realizar el análisis: ${error.message}
      </div>
    `;
  } finally {
    if (btn) {
      btn.innerHTML = '<i class="fas fa-search"></i> Analizar ahora';
      btn.disabled = false;
    }
  }
};

// ============================================
// FUNCIÓN: MOSTRAR RECOMENDACIONES
// ============================================
function mostrarRecomendaciones(recomendaciones) {
  const section = document.getElementById('securityRecommendations');
  const listDiv = document.getElementById('recommendationsList');
  
  if (!section || !listDiv) return;
  
  listDiv.innerHTML = `
    <ul style="padding-left: 20px;">
      ${recomendaciones.map(r => `
        <li style="margin: 10px 0; color: var(--text);">
          <i class="fas fa-check-circle" style="color: var(--green); margin-right: 8px;"></i>
          ${r}
        </li>
      `).join('')}
    </ul>
  `;
  
  section.style.display = 'block';
}

// ============================================
// FUNCIONES DE EXPORTACIÓN
// ============================================
window.exportarConsentimientos = async function() {
  try {
    showToast('📄 Generando PDF de consentimientos...', 'info');
    await api.exportConsentimientosPDF();
    showToast('✅ PDF generado correctamente', 'success');
  } catch (error) {
    console.error('Error exportando:', error);
    showToast('❌ Error al generar PDF', 'error');
  }
};

window.exportarIncidentes = async function() {
  try {
    showToast('📄 Generando PDF de incidentes...', 'info');
    await api.exportIncidentesPDF();
    showToast('✅ PDF generado correctamente', 'success');
  } catch (error) {
    console.error('Error exportando:', error);
    showToast('❌ Error al generar PDF', 'error');
  }
};

window.exportarCertificadoARCO = async function() {
  try {
    showToast('📜 Generando certificado ARCO...', 'info');
    await api.exportARCOCertificate();
    showToast('✅ Certificado generado correctamente', 'success');
  } catch (error) {
    console.error('Error exportando:', error);
    showToast('❌ Error al generar certificado', 'error');
  }
};

// ============================================
// FUNCIÓN: VERIFICAR ROL PARA EXPORTACIÓN ARCO
// ============================================
async function verificarRolParaExportacion() {
  try {
    const user = api.getUser();
    const arcoBtn = document.getElementById('exportARCOBtn');
    
    if (arcoBtn && user.role === 'empresa') {
      arcoBtn.style.display = 'inline-flex';
    }
  } catch (error) {
    console.error('Error verificando rol:', error);
  }
}

// ============================================
// FUNCIÓN DE TOAST (si no está disponible globalmente)
// ============================================
function showToast(message, type = 'info') {
  if (typeof window.showToast === 'function') {
    window.showToast(message, type);
  } else {
    console.log(`[${type}] ${message}`);
  }
}

// ============================================
// REFRESH MANUAL DE LA VISTA
// ============================================
window.refreshRiesgo = function() {
  console.log('🔄 Refresh manual de vista de riesgo');
  cargarRiesgo();
};

// ============================================
// INICIALIZACIÓN
// ============================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('riskChart')) {
      cargarRiesgo();
    }
  });
} else {
  if (document.getElementById('riskChart')) {
    cargarRiesgo();
  }
}