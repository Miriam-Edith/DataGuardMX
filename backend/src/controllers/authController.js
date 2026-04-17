const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const emailService = require('../services/emailService');  // ← Agrega esta línea

// Inicializar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.register = async (req, res) => {
  try {
    const { email, password, role, nombre, empresa_nombre, telefono } = req.body;

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Hashear contraseña
    const hashed = await bcrypt.hash(password, 10);

    // Crear usuario
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email,
        password: hashed,
        role: role || 'ciudadano',
        nombre,
        empresa_nombre,
        telefono,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ 
      message: 'Usuario registrado exitosamente', 
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        nombre: newUser.nombre
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (!user.is_active) {
      return res.status(401).json({ message: 'Cuenta desactivada' });
    }

    // Verificar contraseña
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        nombre: user.nombre, 
        empresa_nombre: user.empresa_nombre 
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// ============================================
// RECUPERACIÓN DE CONTRASEÑA (ACTUALIZADO)
// ============================================

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email requerido' });
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, nombre')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error || !user) {
      // Por seguridad, no revelamos si el email existe o no
      return res.json({ message: 'Si el email existe, recibirás un enlace de recuperación.' });
    }
    
    // Generar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hora
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires.toISOString()
      })
      .eq('id', user.id);
    
    if (updateError) throw updateError;
    
    // Construir URL de recuperación
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;
    
    // Enviar email usando el servicio
    const emailSent = await emailService.sendPasswordResetEmail(user, resetUrl);
    
    if (!emailSent) {
      console.error(`❌ No se pudo enviar email a ${email}`);
    }
    
    res.json({ message: 'Si el email existe, recibirás un enlace de recuperación.' });
    
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
};

exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('reset_token', token)
      .gt('reset_token_expires', new Date().toISOString())
      .single();
    
    if (error || !user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }
    
    res.json({ valid: true, email: user.email });
    
  } catch (error) {
    console.error('Error en verifyResetToken:', error);
    res.status(500).json({ message: 'Error al verificar token' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token y contraseña requeridos' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('reset_token', token)
      .gt('reset_token_expires', new Date().toISOString())
      .single();
    
    if (userError || !user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
        updated_at: new Date()
      })
      .eq('id', user.id);
    
    if (updateError) throw updateError;
    
    res.json({ message: 'Contraseña actualizada correctamente' });
    
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ message: 'Error al restablecer contraseña' });
  }
};