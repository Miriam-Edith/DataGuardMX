const supabase = require('../config/supabase');

const SolicitudEmpresa = {
  // Crear nueva solicitud
  async create(data) {
    const { data: solicitud, error } = await supabase
      .from('solicitudes_empresas')
      .insert([{
        nombre_empresa: data.nombre_empresa,
        rfc: data.rfc.toUpperCase(),
        email_contacto: data.email_contacto.toLowerCase(),
        telefono: data.telefono,
        nombre_contacto: data.nombre_contacto,
        puesto_contacto: data.puesto_contacto,
        estatus: 'pendiente'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return solicitud;
  },

  // Obtener solicitud por ID
  async findById(id) {
    const { data, error } = await supabase
      .from('solicitudes_empresas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Obtener todas las solicitudes (admin)
  async getAll(filters = {}) {
    let query = supabase
      .from('solicitudes_empresas')
      .select('*')
      .order('fecha_solicitud', { ascending: false });
    
    if (filters.estatus) {
      query = query.eq('estatus', filters.estatus);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Actualizar estatus de solicitud
  async updateStatus(id, estatus, observaciones = null, password_generada = null, usuario_creado_id = null) {
    const updateData = {
      estatus,
      fecha_respuesta: new Date().toISOString()
    };
    
    if (observaciones) updateData.observaciones = observaciones;
    if (password_generada) updateData.password_generada = password_generada;
    if (usuario_creado_id) updateData.usuario_creado_id = usuario_creado_id;
    
    const { data, error } = await supabase
      .from('solicitudes_empresas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Agregar documento a la solicitud
  async addDocumento(solicitud_id, documento_id, archivo_url, nombre_archivo) {
    const { data, error } = await supabase
      .from('solicitud_documentos')
      .insert([{
        solicitud_id,
        documento_id,
        archivo_url,
        nombre_archivo
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Obtener documentos de una solicitud
  async getDocumentos(solicitud_id) {
    const { data, error } = await supabase
      .from('solicitud_documentos')
      .select(`
        *,
        documento:documento_id (nombre_documento, descripcion)
      `)
      .eq('solicitud_id', solicitud_id);
    
    if (error) throw error;
    return data;
  },

  // Obtener documentos requeridos
  async getDocumentosRequeridos() {
    const { data, error } = await supabase
      .from('documentos_requeridos')
      .select('*')
      .order('orden', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};

module.exports = SolicitudEmpresa;