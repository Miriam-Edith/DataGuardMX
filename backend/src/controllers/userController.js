const User = require('../models/User');
const bcrypt = require('bcryptjs');
const emailService = require('../services/emailService');

// Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
  try {
    const { role, is_active, search } = req.query;
    let users = await User.getAll();
    
    // Aplicar filtros
    if (role) {
      users = users.filter(u => u.role === role);
    }
    if (is_active !== undefined) {
      users = users.filter(u => u.is_active === (is_active === 'true'));
    }
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u => 
        u.email.toLowerCase().includes(searchLower) ||
        (u.nombre && u.nombre.toLowerCase().includes(searchLower)) ||
        (u.empresa_nombre && u.empresa_nombre.toLowerCase().includes(searchLower))
      );
    }
    
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// Obtener usuario por ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
};

// Crear usuario
exports.createUser = async (req, res) => {
  try {
    const { email, password, role, nombre, empresa_nombre, telefono, direccion } = req.body;
    
    // Validar email
    if (!email) {
      return res.status(400).json({ message: 'El email es requerido' });
    }
    
    // Verificar si ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }
    
    // Generar contraseña si no se proporciona
    let finalPassword = password;
    let generatedPassword = false;
    if (!finalPassword) {
      finalPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
      generatedPassword = true;
    }
    
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(finalPassword, 10);
    
    // Crear usuario
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: role || 'ciudadano',
      nombre,
      empresa_nombre,
      telefono,
      direccion,
      is_active: true
    });
    
    // Enviar email con credenciales si se generó contraseña o se solicitó
    if (generatedPassword || req.body.enviar_email) {
      await emailService.sendWelcomeEmail({
        email,
        nombre: nombre || email,
        password: finalPassword,
        role: role || 'ciudadano'
      });
    }
    
    res.status(201).json({ 
      message: 'Usuario creado exitosamente',
      user: { ...newUser, password_generada: generatedPassword ? finalPassword : undefined }
    });
    
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, direccion, empresa_nombre, role, is_active } = req.body;
    
    // Verificar si existe
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Actualizar usuario
    const { data, error } = await supabase
      .from('users')
      .update({
        nombre,
        telefono,
        direccion,
        empresa_nombre,
        role,
        is_active,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ message: 'Usuario actualizado', user: data });
    
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

// Actualizar estado del usuario
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    const updated = await User.updateStatus(id, is_active);
    if (!updated) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json({ message: `Usuario ${is_active ? 'activado' : 'desactivado'}`, user: updated });
    
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
};

// Resetear contraseña
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { nueva_password, enviar_email } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Generar nueva contraseña si no se proporciona
    let finalPassword = nueva_password;
    let generatedPassword = false;
    if (!finalPassword) {
      finalPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
      generatedPassword = true;
    }
    
    const hashedPassword = await bcrypt.hash(finalPassword, 10);
    
    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword, updated_at: new Date() })
      .eq('id', id);
    
    if (error) throw error;
    
    // Enviar email con nueva contraseña
    if (enviar_email !== false) {
      await emailService.sendPasswordResetEmail(user, null, finalPassword);
    }
    
    res.json({ 
      message: 'Contraseña actualizada',
      nueva_password: generatedPassword ? finalPassword : undefined
    });
    
  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    res.status(500).json({ message: 'Error al resetear contraseña' });
  }
};

// Eliminar usuario (soft delete - desactivar)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Soft delete - solo desactivar
    const updated = await User.updateStatus(id, false);
    
    res.json({ message: 'Usuario desactivado', user: updated });
    
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};