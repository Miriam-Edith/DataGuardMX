const Consentimiento = require('../models/Consentimiento');

exports.getMyConsentimientos = async (req, res) => {
  try {
    const list = await Consentimiento.findByUser(req.user.id);
    res.json(list);
  } catch (error) {
    console.error('Error al obtener consentimientos:', error);
    res.status(500).json({ message: 'Error al obtener consentimientos' });
  }
};

exports.createConsentimiento = async (req, res) => {
  try {
    const { empresa, finalidad, vigencia } = req.body;
    const nuevo = await Consentimiento.create({ user_id: req.user.id, empresa, finalidad, vigencia });
    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al crear consentimiento:', error);
    res.status(500).json({ message: 'Error al crear consentimiento' });
  }
};

exports.revokeConsentimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const revocado = await Consentimiento.revoke(id, req.user.id);
    if (!revocado) return res.status(404).json({ message: 'Consentimiento no encontrado' });
    res.json(revocado);
  } catch (error) {
    console.error('Error al revocar:', error);
    res.status(500).json({ message: 'Error al revocar' });
  }
};

// NUEVO: Obtener consentimientos activos por userId (para chatbot)
exports.getActiveConsentimientosByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar permisos (solo admin o el propio usuario)
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    
    const list = await Consentimiento.findActiveByUser(userId);
    res.json(list);
  } catch (error) {
    console.error('Error al obtener consentimientos activos:', error);
    res.status(500).json({ message: 'Error al obtener consentimientos' });
  }
};