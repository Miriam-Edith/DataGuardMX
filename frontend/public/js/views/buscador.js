// ============================================
// BUSCADOR MEJORADO - ESTILO GOOGLE
// Búsqueda en tiempo real mientras escribes
// AHORA MUESTRA TODOS LOS REPORTES DE LA COMUNIDAD
// ============================================

let allReportes = [];
let searchTimeout = null;
let currentFilter = 'all';
let currentQuery = '';

// Inicializar buscador
async function initBuscador() {
  console.log('🔍 Inicializando buscador de comunidad...');
  
  await cargarTodosLosReportes();
  setupEventListeners();
  setupFilterChips();
}

// Cargar TODOS los reportes de la comunidad (NO solo los del usuario)
async function cargarTodosLosReportes() {
  const resultsDiv = document.getElementById('searchResults');
  const statusDiv = document.getElementById('searchStatus');
  
  statusDiv.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Cargando incidentes de la comunidad...</p></div>';
  
  try {
    // ✅ CAMBIO IMPORTANTE: Usar getAllReportesPublicos para ver TODOS los reportes
    allReportes = await api.getAllReportesPublicos();
    console.log(`📊 Cargados ${allReportes.length} reportes de la comunidad`);
    
    if (allReportes.length === 0) {
      resultsDiv.innerHTML = `
        <div class="no-results">
          <i class="fas fa-inbox" style="font-size: 3rem; opacity: 0.3;"></i>
          <p>No hay incidentes reportados en la comunidad.</p>
          <button class="btn-teal" onclick="window.mostrarFormularioIncidenteModal()">
            <i class="fas fa-plus"></i> Reportar mi primer incidente
          </button>
        </div>
      `;
      statusDiv.innerHTML = '';
    } else {
      await realizarBusqueda();
    }
    
  } catch (error) {
    console.error('Error cargando reportes:', error);
    statusDiv.innerHTML = '';
    resultsDiv.innerHTML = `
      <div class="no-results">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--red);"></i>
        <p>Error al cargar los incidentes: ${error.message}</p>
        <button class="btn-outline" onclick="cargarTodosLosReportes()">
          <i class="fas fa-redo-alt"></i> Reintentar
        </button>
      </div>
    `;
  }
}

// Configurar event listeners
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  const suggestionsDiv = document.getElementById('searchSuggestions');
  
  // Búsqueda en tiempo real (debounced)
  searchInput.addEventListener('input', (e) => {
    currentQuery = e.target.value;
    
    // Mostrar/ocultar botón de limpiar
    if (clearBtn) {
      clearBtn.style.display = currentQuery.length > 0 ? 'block' : 'none';
    }
    
    // Mostrar sugerencias mientras escribe
    if (currentQuery.length >= 1) {
      showSuggestions(currentQuery);
    } else {
      suggestionsDiv.style.display = 'none';
    }
    
    // Debounce para búsqueda
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      realizarBusqueda();
    }, 300);
  });
  
  // Limpiar búsqueda
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      currentQuery = '';
      clearBtn.style.display = 'none';
      suggestionsDiv.style.display = 'none';
      realizarBusqueda();
      searchInput.focus();
    });
  }
  
  // Cerrar sugerencias al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      suggestionsDiv.style.display = 'none';
    }
  });
}

// Mostrar sugerencias en tiempo real
function showSuggestions(query) {
  const suggestionsDiv = document.getElementById('searchSuggestions');
  const queryLower = query.toLowerCase();
  
  // Buscar coincidencias en TODOS los reportes
  const matches = allReportes.filter(r => {
    return r.tipo_contaminante?.toLowerCase().includes(queryLower) ||
           r.ubicacion?.toLowerCase().includes(queryLower) ||
           r.descripcion?.toLowerCase().includes(queryLower);
  }).slice(0, 5); // Solo top 5 sugerencias
  
  if (matches.length === 0) {
    suggestionsDiv.style.display = 'none';
    return;
  }
  
  // Mostrar sugerencias
  suggestionsDiv.innerHTML = matches.map(r => `
    <div class="suggestion-item" onclick="selectSuggestion('${escapeHtml(r.tipo_contaminante || '')}')">
      <div class="suggestion-icon">
        <i class="fas ${getIconForType(r.tipo_contaminante)}"></i>
      </div>
      <div class="suggestion-content">
        <div class="suggestion-title">${highlightText(r.tipo_contaminante || 'Sin tipo', query)}</div>
        <div class="suggestion-subtitle">${highlightText(r.ubicacion || 'Sin ubicación', query)}</div>
      </div>
      <div class="suggestion-type">${r.tipo_contaminante || 'Incidente'}</div>
    </div>
  `).join('');
  
  suggestionsDiv.style.display = 'block';
}

// Seleccionar una sugerencia
window.selectSuggestion = function(text) {
  const searchInput = document.getElementById('searchInput');
  searchInput.value = text;
  currentQuery = text;
  document.getElementById('searchSuggestions').style.display = 'none';
  realizarBusqueda();
  searchInput.focus();
};

// Configurar filtros rápidos
function setupFilterChips() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      // Actualizar active
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      
      // Actualizar filtro
      currentFilter = chip.dataset.filter;
      realizarBusqueda();
    });
  });
}

// Realizar búsqueda principal
async function realizarBusqueda() {
  const resultsDiv = document.getElementById('searchResults');
  const statusDiv = document.getElementById('searchStatus');
  const query = currentQuery.toLowerCase();
  
  // Filtrar reportes
  let filtered = [...allReportes];
  
  // Filtro por tipo
  if (currentFilter !== 'all') {
    filtered = filtered.filter(r => r.tipo_contaminante === currentFilter);
  }
  
  // Búsqueda por texto
  if (query) {
    filtered = filtered.filter(r => {
      return (r.tipo_contaminante?.toLowerCase().includes(query) ||
              r.ubicacion?.toLowerCase().includes(query) ||
              r.descripcion?.toLowerCase().includes(query));
    });
  }
  
  // Ordenar por fecha (más recientes primero)
  filtered.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
  
  // Actualizar estado
  if (filtered.length === 0) {
    statusDiv.innerHTML = `
      <div style="text-align: center; padding: 1rem;">
        <i class="fas fa-search" style="color: var(--muted);"></i>
        <p>No se encontraron resultados para "${escapeHtml(query) || 'esta búsqueda'}"</p>
      </div>
    `;
    resultsDiv.innerHTML = '';
    return;
  }
  
  statusDiv.innerHTML = `
    <div style="text-align: center; padding: 0.5rem;">
      <span style="color: var(--cyan);">${filtered.length}</span> resultado(s) encontrado(s) en la comunidad
    </div>
  `;
  
  // Renderizar resultados
  resultsDiv.innerHTML = filtered.map(r => `
    <div class="result-card" onclick="verDetalleIncidente(${r.id})">
      <div class="result-header">
        <span class="result-type">
          <i class="fas ${getIconForType(r.tipo_contaminante)}"></i>
          ${escapeHtml(r.tipo_contaminante || 'Incidente')}
        </span>
        <span class="result-date">
          <i class="far fa-calendar-alt"></i>
          ${new Date(r.creado_en).toLocaleDateString('es-MX')}
        </span>
      </div>
      <div class="result-title">
        ${highlightText(r.tipo_contaminante || 'Incidente de datos', query)}
      </div>
      <div class="result-description">
        ${highlightText(r.descripcion?.substring(0, 200) || 'Sin descripción', query)}${r.descripcion?.length > 200 ? '...' : ''}
      </div>
      <div class="result-meta">
        <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(r.ubicacion || 'Ubicación no especificada')}</span>
        <span><i class="fas fa-user"></i> Reportado por: ${escapeHtml(r.usuario_email || 'Usuario')}</span>
        <span><i class="fas fa-clock"></i> ${formatRelativeTime(r.creado_en)}</span>
      </div>
    </div>
  `).join('');
}

// Ver detalle del incidente
window.verDetalleIncidente = function(id) {
  const incidente = allReportes.find(r => r.id === id);
  if (incidente) {
    alert(`📋 DETALLE DEL INCIDENTE\n\nTipo: ${incidente.tipo_contaminante}\nUbicación: ${incidente.ubicacion}\nFecha: ${new Date(incidente.creado_en).toLocaleString()}\nReportado por: ${incidente.usuario_email || 'Usuario anónimo'}\n\nDescripción:\n${incidente.descripcion}`);
  }
};

// Obtener ícono según tipo de incidente
function getIconForType(tipo) {
  if (!tipo) return 'fa-shield-alt';
  if (tipo.includes('Filtración')) return 'fa-database';
  if (tipo.includes('Acceso')) return 'fa-door-open';
  if (tipo.includes('Suplantación')) return 'fa-mask';
  if (tipo.includes('Pérdida')) return 'fa-trash-alt';
  return 'fa-exclamation-triangle';
}

// Formatear tiempo relativo
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} minuto(s)`;
  if (diffHours < 24) return `Hace ${diffHours} hora(s)`;
  if (diffDays < 7) return `Hace ${diffDays} día(s)`;
  return date.toLocaleDateString('es-MX');
}

// Resaltar texto coincidente
function highlightText(text, query) {
  if (!text || !query) return escapeHtml(text);
  
  const escapedText = escapeHtml(text);
  const escapedQuery = escapeHtml(query);
  
  const regex = new RegExp(`(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escapedText.replace(regex, '<mark>$1</mark>');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Exportar para uso global
window.refreshBuscador = cargarTodosLosReportes;

// Inicializar
initBuscador();