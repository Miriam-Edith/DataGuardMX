const supabase = require('../config/supabase');

const Reporte = {
  async create({ user_id, tipo_contaminante, ubicacion, descripcion, latitud, longitud }) {
    const { data, error } = await supabase
      .from('reportes')
      .insert([{ 
        user_id, 
        tipo_contaminante, 
        ubicacion, 
        descripcion,
        latitud,
        longitud
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findByUser(user_id) {
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .eq('user_id', user_id)
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return data;
  },

  async countByUser(user_id) {
    const { count, error } = await supabase
      .from('reportes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);
    if (error) throw error;
    return count;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('reportes')
      .select(`
        *,
        user:user_id (
          email
        )
      `)
      .order('creado_en', { ascending: false });
    if (error) throw error;
    
    // Formatear para incluir usuario_email
    return data.map(r => ({ 
      ...r, 
      usuario_email: r.user?.email || 'Usuario desconocido'
    }));
  }
};

module.exports = Reporte;