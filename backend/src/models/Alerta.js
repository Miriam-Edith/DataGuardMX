const supabase = require('../config/supabase');

const Alerta = {
  async create({ user_id, mensaje, severidad }) {
    const { data, error } = await supabase
      .from('alertas')
      .insert([{ user_id, mensaje, severidad, leida: false }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findByUser(user_id) {
    const { data, error } = await supabase
      .from('alertas')
      .select('*')
      .eq('user_id', user_id)
      .order('creada_en', { ascending: false });
    if (error) throw error;
    return data;
  },

  async markAsRead(id, user_id) {
    const { data, error } = await supabase
      .from('alertas')
      .update({ leida: true })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

module.exports = Alerta;