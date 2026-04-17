const supabase = require('../config/supabase');

exports.getProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, nombre, empresa_nombre, telefono, direccion, created_at')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { nombre, telefono, direccion, empresa_nombre } = req.body;
    const { data, error } = await supabase
      .from('users')
      .update({ nombre, telefono, direccion, empresa_nombre, updated_at: new Date() })
      .eq('id', req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ message: 'Perfil actualizado', user: data });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const bcrypt = require('bcrypt');
    const { data: user } = await supabase
      .from('users')
      .select('password')
      .eq('id', req.user.id)
      .single();
    
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    
    const hashed = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
      .from('users')
      .update({ password: hashed })
      .eq('id', req.user.id);
    
    if (error) throw error;
    res.json({ message: 'Contraseña actualizada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar contraseña' });
  }
};