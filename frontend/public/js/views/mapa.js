// ============================================
// MAPA CON TODOS LOS REPORTES DE TODOS LOS USUARIOS
// ============================================

let map = null;
let markers = [];
let isInitializing = false;
let currentFilter = 'all';
let allIncidentes = [];

async function initMapa() {
  if (isInitializing) {
    console.log('⚠️ Mapa ya inicializando...');
    return;
  }
  
  if (map) {
    console.log('🗺️ Limpiando marcadores existentes...');
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    await cargarIncidentesMapa();
    return;
  }
  
  isInitializing = true;
  console.log('🗺️ Inicializando mapa...');
  
  if (typeof L === 'undefined') {
    console.log('⏳ Esperando Leaflet...');
    setTimeout(() => { isInitializing = false; initMapa(); }, 500);
    return;
  }
  
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.error('❌ Contenedor del mapa no encontrado');
    isInitializing = false;
    return;
  }
  
  try {
    map = L.map('map').setView([23.6345, -102.5528], 5);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
      minZoom: 4
    }).addTo(map);
    
    console.log('✅ Mapa creado');
    await cargarIncidentesMapa();
    setupMapControls();
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    isInitializing = false;
  }
}

async function cargarIncidentesMapa() {
  const listDiv = document.getElementById('incidentesList');
  const countSpan = document.getElementById('incidentesCount');
  
  if (listDiv) {
    listDiv.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Cargando incidentes de la comunidad...</div>';
  }
  
  try {
    console.log('📡 Obteniendo TODOS los reportes de la comunidad...');
    
    // ✅ CAMBIO IMPORTANTE: Usar getAllReportesPublicos para ver TODOS los reportes
    allIncidentes = await api.getAllReportesPublicos();
    
    console.log(`📊 Total reportes en la comunidad: ${allIncidentes?.length || 0}`);
    
    if (!allIncidentes || allIncidentes.length === 0) {
      if (listDiv) {
        listDiv.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: var(--muted);">
            <i class="fas fa-map-marker-alt" style="font-size: 2rem;"></i>
            <p>No hay incidentes reportados en la comunidad.</p>
            <button class="btn-teal btn-sm" onclick="window.mostrarFormularioIncidenteModal()">
              <i class="fas fa-plus"></i> Reportar mi primer incidente
            </button>
          </div>
        `;
      }
      if (countSpan) countSpan.textContent = '0 incidentes';
      return;
    }
    
    if (countSpan) countSpan.textContent = `${allIncidentes.length} incidentes en la comunidad`;
    
    // Aplicar filtro si existe
    let incidentesMostrar = allIncidentes;
    if (currentFilter !== 'all') {
      incidentesMostrar = allIncidentes.filter(i => i.tipo_contaminante === currentFilter);
      console.log(`🔍 Filtrados por ${currentFilter}: ${incidentesMostrar.length} incidentes`);
    }
    
    // Filtrar los que tienen coordenadas
    const incidentesConCoords = incidentesMostrar.filter(i => i.latitud && i.longitud);
    console.log(`📍 Incidentes con coordenadas: ${incidentesConCoords.length}`);
    
    if (incidentesConCoords.length === 0) {
      console.warn('⚠️ No hay incidentes con coordenadas');
      if (listDiv) {
        listDiv.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: var(--yellow);">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Los incidentes no tienen coordenadas asignadas.</p>
            <small>Actualiza los reportes con ubicaciones específicas.</small>
          </div>
        `;
      }
      return;
    }
    
    // Agregar marcadores al mapa
    agregarMarcadores(incidentesConCoords);
    
    // Mostrar lista de incidentes
    mostrarListaIncidentes(incidentesMostrar);
    
  } catch (error) {
    console.error('❌ Error cargando incidentes:', error);
    if (listDiv) {
      listDiv.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--red);">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error: ${error.message}</p>
          <button class="btn-outline btn-sm" onclick="cargarIncidentesMapa()">
            <i class="fas fa-redo-alt"></i> Reintentar
          </button>
        </div>
      `;
    }
  }
}

function agregarMarcadores(incidentes) {
  if (!map) return;
  
  // Limpiar marcadores existentes
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];
  
  const bounds = L.latLngBounds([]);
  
  incidentes.forEach(incidente => {
    // Usar coordenadas de la BD
    const lat = parseFloat(incidente.latitud);
    const lng = parseFloat(incidente.longitud);
    
    if (isNaN(lat) || isNaN(lng)) {
      console.warn(`⚠️ Coordenadas inválidas para: ${incidente.ubicacion}`);
      return;
    }
    
    const color = getColorByType(incidente.tipo_contaminante);
    
    // Crear marcador
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: `<div style="width: 16px; height: 16px; background: ${color}; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 8px ${color}; cursor: pointer;"></div>`,
        iconAnchor: [8, 8],
        popupAnchor: [0, -12]
      })
    });
    
    // Popup con información
    marker.bindPopup(`
      <div style="max-width: 280px; font-family: monospace;">
        <strong style="color: ${color};">${escapeHtml(incidente.tipo_contaminante || 'Incidente')}</strong><br>
        <small>📍 ${escapeHtml(incidente.ubicacion || 'Sin ubicación')}</small><br>
        <small>📅 ${new Date(incidente.creado_en).toLocaleDateString('es-MX')}</small>
        <small>👤 Reportado por: ${escapeHtml(incidente.usuario_email || 'Usuario')}</small>
        <p style="font-size: 0.75rem; margin-top: 8px; color: #c8dde8;">${escapeHtml(incidente.descripcion?.substring(0, 100))}...</p>
        <button onclick="verDetalleIncidente(${incidente.id})" style="background: ${color}; color: #080f14; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; margin-top: 5px; width: 100%;">
          Ver detalles
        </button>
      </div>
    `);
    
    marker.addTo(map);
    markers.push(marker);
    bounds.extend([lat, lng]);
  });
  
  if (markers.length > 0) {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
  }
  
  console.log(`✅ Agregados ${markers.length} marcadores al mapa`);
}

function mostrarListaIncidentes(incidentes) {
  const listDiv = document.getElementById('incidentesList');
  if (!listDiv) return;
  
  if (incidentes.length === 0) {
    listDiv.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--muted);">No hay incidentes</div>';
    return;
  }
  
  listDiv.innerHTML = incidentes.map(i => `
    <div class="incidente-list-item" onclick="centrarEnIncidente(${i.id})" style="padding: 12px; border-bottom: 1px solid var(--edge); cursor: pointer; transition: background 0.2s;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="width: 10px; height: 10px; background: ${getColorByType(i.tipo_contaminante)}; border-radius: 50%;"></span>
        <div style="flex: 1;">
          <strong style="color: var(--cyan); font-size: 0.85rem;">${escapeHtml(i.tipo_contaminante || 'Incidente')}</strong>
          <p style="font-size: 0.7rem; color: var(--text2); margin: 2px 0;">📍 ${escapeHtml(i.ubicacion || 'Sin ubicación')}</p>
          <small style="color: var(--muted);">👤 ${escapeHtml(i.usuario_email || 'Anónimo')}</small>
        </div>
        <small style="color: var(--muted);">${new Date(i.creado_en).toLocaleDateString()}</small>
      </div>
    </div>
  `).join('');
  
  // Agregar hover effect
  document.querySelectorAll('.incidente-list-item').forEach(el => {
    el.addEventListener('mouseenter', () => el.style.background = 'var(--deep)');
    el.addEventListener('mouseleave', () => el.style.background = 'transparent');
  });
}

// Centrar mapa en un incidente específico
window.centrarEnIncidente = function(id) {
  const incidente = allIncidentes.find(i => i.id === id);
  if (incidente && incidente.latitud && incidente.longitud) {
    map.setView([parseFloat(incidente.latitud), parseFloat(incidente.longitud)], 13);
    // Abrir el popup del marcador correspondiente
    const marker = markers.find(m => {
      const latLng = m.getLatLng();
      return latLng.lat === parseFloat(incidente.latitud) && latLng.lng === parseFloat(incidente.longitud);
    });
    if (marker) marker.openPopup();
  }
};

// Ver detalle del incidente
window.verDetalleIncidente = function(id) {
  const incidente = allIncidentes.find(i => i.id === id);
  if (incidente) {
    alert(`📋 DETALLE DEL INCIDENTE\n\nTipo: ${incidente.tipo_contaminante}\nUbicación: ${incidente.ubicacion}\nFecha: ${new Date(incidente.creado_en).toLocaleString()}\nReportado por: ${incidente.usuario_email || 'Usuario anónimo'}\n\nDescripción:\n${incidente.descripcion}`);
  }
};

function getColorByType(tipo) {
  const colors = {
    'Filtración de datos': '#ff4757',
    'Acceso no autorizado': '#f5a623',
    'Pérdida de información': '#f0a500',
    'Suplantación de identidad': '#e74c3c',
    'default': '#00e5c3'
  };
  return colors[tipo] || colors.default;
}

function setupMapControls() {
  // Reset vista
  document.getElementById('resetMapView')?.addEventListener('click', () => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    } else {
      map.setView([23.6345, -102.5528], 5);
    }
  });
  
  // Filtros por tipo
  document.querySelectorAll('.map-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.map-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.type;
      cargarIncidentesMapa();
    });
  });
  
  // Búsqueda en mapa
  const searchInput = document.getElementById('mapSearchInput');
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', (e) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => buscarEnMapa(e.target.value), 500);
    });
  }
}

async function buscarEnMapa(query) {
  if (!query || query.length < 3) return;
  
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', México')}&limit=1`);
    const data = await response.json();
    
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      map.setView([lat, lon], 12);
      
      // Marcador temporal
      const tempMarker = L.marker([lat, lon], {
        icon: L.divIcon({
          html: `<div style="width: 20px; height: 20px; background: var(--cyan); border-radius: 50%; border: 2px solid #fff; animation: pulse 1s infinite;"></div>`,
          iconAnchor: [10, 10]
        })
      }).addTo(map);
      
      setTimeout(() => map.removeLayer(tempMarker), 3000);
    }
  } catch (error) {
    console.error('Error en búsqueda:', error);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Refresh
window.refreshMapa = function() {
  console.log('🔄 Refrescando mapa...');
  cargarIncidentesMapa();
};

// Inicializar
initMapa();