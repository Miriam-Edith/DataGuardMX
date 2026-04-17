const supabase = require('../config/supabase');

const User = {
  async create({ email, password, role, nombre, empresa_nombre, telefono, direccion, is_active = true }) {
    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        email, 
        password, 
        role, 
        nombre, 
        empresa_nombre, 
        telefono,
        direccion,
        is_active 
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, nombre, empresa_nombre, is_active, created_at, updated_at, telefono, direccion')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id, is_active) {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, nombre, empresa_nombre, is_active, created_at, updated_at, telefono, direccion')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  
  async update(id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

module.exports = User;