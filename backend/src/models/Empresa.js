const supabase = require('../config/supabase');

const Empresa = {
  async create({ nombre, rfc, email_contacto, telefono }) {
    const { data, error } = await supabase
      .from('empresas')
      .insert([{ nombre, rfc, email_contacto, telefono, certificada: false }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('empresas')
      .select('*');
    if (error) throw error;
    return data;
  }
};

module.exports = Empresa;