// ============================================
// API MODULE - DATA GUARD MX (COMPLETO)
// ============================================

const API_BASE = '/api';

const api = {
  async request(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);
    
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await res.json();
      
      if (!res.ok) {
        // Manejo específico de errores
        if (res.status === 401) {
          this.removeToken();
          this.removeUser();
          if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
          }
        }
        throw new Error(data.message || 'Error en la petición');
      }
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
      }
      throw error;
    }
  },

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================
  setToken(token) { 
    localStorage.setItem('token', token); 
  },
  
  getToken() { 
    return localStorage.getItem('token'); 
  },
  
  removeToken() { 
    localStorage.removeItem('token'); 
  },

  // ============================================
  // USER MANAGEMENT
  // ============================================
  getUser() { 
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  },
  
  setUser(user) { 
    localStorage.setItem('user', JSON.stringify(user)); 
  },
  
  removeUser() { 
    localStorage.removeItem('user'); 
  },

  // ============================================
  // AUTH ENDPOINTS
  // ============================================
  register(data) { 
    return this.request('/auth/register', 'POST', data); 
  },
  
  login(data) { 
    return this.request('/auth/login', 'POST', data); 
  },

  // ============================================
  // CONSENTIMIENTOS
  // ============================================
  getConsentimientos() { 
    return this.request('/consentimientos', 'GET', null, this.getToken()); 
  },
  
  createConsentimiento(data) { 
    return this.request('/consentimientos', 'POST', data, this.getToken()); 
  },
  
  revokeConsentimiento(id) { 
    return this.request(`/consentimientos/${id}`, 'DELETE', null, this.getToken()); 
  },

  // ============================================
  // REPORTES / INCIDENTES
  // ============================================
  createReporte(data) { 
    return this.request('/reportes', 'POST', data, this.getToken()); 
  },
  
  getMyReportes() { 
    return this.request('/reportes', 'GET', null, this.getToken()); 
  },
  
  getAllReportes() { 
    return this.request('/reportes/all', 'GET', null, this.getToken()); 
  },

  // ✅ NUEVO MÉTODO: Obtener todos los reportes públicos (para mapa y buscador)
  getAllReportesPublicos() {
    return this.request('/reportes/all', 'GET', null, this.getToken());
  },

  // ============================================
  // ALERTAS
  // ============================================
  getAlertas() { 
    return this.request('/alertas', 'GET', null, this.getToken()); 
  },
  
  markAlertaRead(id) { 
    return this.request(`/alertas/${id}/read`, 'PATCH', null, this.getToken()); 
  },

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================
  getUsers() { 
    return this.request('/users', 'GET', null, this.getToken()); 
  },
  
  updateUserStatus(id, is_active) { 
    return this.request(`/users/${id}/status`, 'PATCH', { is_active }, this.getToken()); 
  },

  // ============================================
  // PROFILE
  // ============================================
  async getProfile() {
    return this.request('/profile', 'GET', null, this.getToken());
  },

  async updateProfile(data) {
    return this.request('/profile', 'PUT', data, this.getToken());
  },

  async changePassword(data) {
    return this.request('/profile/change-password', 'POST', data, this.getToken());
  },

  // ============================================
  // CHATBOT
  // ============================================
  async sendChatbotMessage(message, context = {}, history = []) {
    return this.request('/chatbot/message', 'POST', {
      message,
      userId: this.getUser().id,
      context,
      history
    }, this.getToken());
  },

  // ============================================
  // SEGURIDAD - VERIFICACIÓN DE FILTRACIONES
  // ============================================
  
  /**
   * Verifica si el email del usuario autenticado aparece en filtraciones
   */
  async checkMyBreaches() {
    return this.request('/security/breaches/me', 'GET', null, this.getToken());
  },

  /**
   * Realiza un chequeo completo de seguridad
   */
  async performFullSecurityCheck() {
    return this.request('/security/full-check', 'GET', null, this.getToken());
  },

  /**
   * Obtiene las últimas filtraciones globales
   */
  async getLatestBreaches(limit = 10) {
    return this.request(`/security/breaches/latest?limit=${limit}`, 'GET', null, this.getToken());
  },

  // ============================================
  // EXPORTACIÓN DE PDFs
  // ============================================
  
  /**
   * Exporta consentimientos a PDF (abre descarga en nueva ventana)
   */
  exportConsentimientosPDF() {
    const token = this.getToken();
    window.open(`${API_BASE}/export/consentimientos?token=${encodeURIComponent(token)}`, '_blank');
    return Promise.resolve({ success: true });
  },

  /**
   * Exporta incidentes a PDF (abre descarga en nueva ventana)
   */
  exportIncidentesPDF() {
    const token = this.getToken();
    window.open(`${API_BASE}/export/incidentes?token=${encodeURIComponent(token)}`, '_blank');
    return Promise.resolve({ success: true });
  },

  /**
   * Exporta certificado ARCO (solo empresas)
   */
  exportARCOCertificate() {
    const token = this.getToken();
    window.open(`${API_BASE}/export/certificado-arco?token=${encodeURIComponent(token)}`, '_blank');
    return Promise.resolve({ success: true });
  },

  // ============================================
  // BÚSQUEDA SIMPLE Y AVANZADA
  // ============================================
  
  /**
   * Realiza una búsqueda en incidentes y consentimientos
   * @param {Object} params - Parámetros de búsqueda
   * @param {string} params.q - Texto a buscar
   * @param {string} params.category - Categoría (Incidentes/Consentimientos)
   * @param {string} params.type - Tipo (incidente/consentimiento)
   * @param {string} params.tags - Etiquetas separadas por coma
   * @param {string} params.sort - Orden (relevance/newest/oldest/title)
   * @param {number} params.page - Página
   * @param {number} params.limit - Resultados por página
   */
  async search(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/search?${queryString}`, 'GET', null, this.getToken());
  },

  /**
   * Obtiene las opciones disponibles para los filtros de búsqueda
   */
  async getSearchFilterOptions() {
    return this.request('/search/filters', 'GET', null, this.getToken());
  },

  // ============================================
  // UTILIDADES
  // ============================================
  
  /**
   * Verifica el estado de salud del servidor
   */
  async healthCheck() {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Obtiene estadísticas del dashboard
   */
  async getDashboardStats() {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const [alertas, reportes, consentimientos] = await Promise.all([
        this.getAlertas(),
        this.getMyReportes(),
        this.getConsentimientos()
      ]);
      
      return {
        alertas: alertas || [],
        reportes: reportes || [],
        consentimientos: consentimientos || [],
        totalAlertas: alertas?.length || 0,
        alertasNoLeidas: alertas?.filter(a => !a.leida).length || 0,
        totalReportes: reportes?.length || 0,
        totalConsentimientos: consentimientos?.length || 0,
        consentimientosActivos: consentimientos?.filter(c => c.estado === 'activo').length || 0
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }
};

// Exponer globalmente para compatibilidad
window.api = api;

// Verificar token al cargar
(function checkAuthOnLoad() {
  const token = api.getToken();
  const publicPages = ['index.html', 'register.html', ''];
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  if (!token && !publicPages.includes(currentPage)) {
    window.location.href = 'index.html';
  }
})();