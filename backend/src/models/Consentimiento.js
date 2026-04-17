const supabase = require('../config/supabase');

const Consentimiento = {
  async create({ user_id, empresa, finalidad, vigencia }) {
    const { data, error } = await supabase
      .from('consentimientos')
      .insert([{ user_id, empresa, finalidad, vigencia, estado: 'activo' }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findByUser(user_id) {
    const { data, error } = await supabase
      .from('consentimientos')
      .select('*')
      .eq('user_id', user_id)
      .order('otorgado_en', { ascending: false });
    if (error) throw error;
    return data;
  },

  async findActiveByUser(user_id) {
    const { data, error } = await supabase
      .from('consentimientos')
      .select('*')
      .eq('user_id', user_id)
      .eq('estado', 'activo')
      .order('otorgado_en', { ascending: false });
    if (error) throw error;
    return data;
  },

  async countByUser(user_id) {
    const { count, error } = await supabase
      .from('consentimientos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('estado', 'activo');
    if (error) throw error;
    return count;
  },

  async revoke(id, user_id) {
    const { data, error } = await supabase
      .from('consentimientos')
      .update({ estado: 'revocado' })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

module.exports = Consentimiento;