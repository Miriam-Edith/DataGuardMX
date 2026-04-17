// ============================================
// CONTROLADOR DE SEGURIDAD Y FILTRACIONES
// USA BASE DE DATOS REAL
// ============================================

const breachService = require('../services/breachService');
const emailService = require('../services/emailService');
const Alerta = require('../models/Alerta');

/**
 * Verifica filtraciones para el email del usuario autenticado
 * USA REPORTES DE LA BD
 */
exports.checkMyEmailBreaches = async (req, res) => {
  try {
    const user = req.user;
    console.log(`🔍 Verificando reportes para: ${user.email}`);
    
    const result = await breachService.checkEmailBreaches(user.email);
    
    // Si hay reportes, crear una alerta automáticamente
    if (result.found && result.count > 0) {
      const severidad = result.count >= 5 ? 'alta' : result.count >= 2 ? 'media' : 'baja';
      
      const alerta = await Alerta.create({
        user_id: user.id,
        mensaje: `📋 Tienes ${result.count} incidente(s) reportado(s) en tu cuenta. Revisa los detalles en la sección de Incidentes.`,
        severidad: severidad
      });
      
      // Enviar email de alerta si está configurado
      if (process.env.FEATURE_EMAIL_NOTIFICATIONS === 'true') {
        await emailService.sendSecurityAlert(
          { ...user, email: user.email, nombre: user.nombre },
          alerta
        );
      }
      
      // Añadir recomendaciones específicas
      const advice = breachService.getSecurityAdvice(
        result.breaches.flatMap(b => b.dataClasses || [])
      );
      
      result.recommendations = advice;
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error verificando reportes:', error);
    res.status(500).json({ 
      message: 'Error verificando reportes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Realiza un chequeo completo de seguridad
 */
exports.performFullSecurityCheck = async (req, res) => {
  try {
    const user = req.user;
    console.log(`🔍 Realizando chequeo completo para: ${user.email}`);
    
    const results = await breachService.performFullSecurityCheck(user);
    
    // Crear alerta si el nivel de riesgo es alto o medio
    if (results.riskLevel === 'alto' || results.riskLevel === 'medio') {
      await Alerta.create({
        user_id: user.id,
        mensaje: `🔍 Chequeo de seguridad: Nivel de riesgo ${results.riskLevel.toUpperCase()}. Revisa las recomendaciones.`,
        severidad: results.riskLevel
      });
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error en chequeo de seguridad:', error);
    res.status(500).json({ 
      message: 'Error realizando chequeo de seguridad'
    });
  }
};

/**
 * Obtiene las últimas filtraciones globales
 * DESDE LA BASE DE DATOS (reportes reales)
 */
exports.getLatestBreaches = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    console.log(`📊 Obteniendo últimas ${limit} filtraciones desde BD...`);
    
    const breaches = await breachService.getLatestBreaches(limit);
    
    console.log(`✅ Devueltos ${breaches.length} registros`);
    res.json(breaches);
  } catch (error) {
    console.error('Error obteniendo filtraciones:', error);
    res.status(500).json({ message: 'Error obteniendo filtraciones' });
  }
};

/**
 * Verifica un email específico (solo admin)
 */
exports.checkEmailBreaches = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    
    console.log(`🔍 Admin verificando email: ${email}`);
    const result = await breachService.checkEmailBreaches(email);
    res.json(result);
  } catch (error) {
    console.error('Error verificando email:', error);
    res.status(500).json({ message: 'Error verificando email' });
  }
};