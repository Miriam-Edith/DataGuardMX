const Alerta = require('../models/Alerta');

// Obtener alertas del usuario autenticado
exports.getMyAlertas = async (req, res) => {
  try {
    const alertas = await Alerta.findByUser(req.user.id);
    res.json(alertas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener alertas' });
  }
};

// Marcar una alerta como leída
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const alerta = await Alerta.markAsRead(id, req.user.id);
    if (!alerta) return res.status(404).json({ message: 'Alerta no encontrada' });
    res.json(alerta);
  } catch (error) {
    res.status(500).json({ message: 'Error al marcar como leída' });
  }
};

// 🔽 NUEVO: Endpoint público para n8n (solo requiere userId por query param)
exports.getAlertasByUserId = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'Se requiere userId' });
    }
    const alertas = await Alerta.findByUser(parseInt(userId));
    res.json({ alertas });
  } catch (error) {
    console.error('Error en getAlertasByUserId:', error);
    res.status(500).json({ message: 'Error al obtener alertas' });
  }
};