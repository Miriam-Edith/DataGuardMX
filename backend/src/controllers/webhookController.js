const Alerta = require('../models/Alerta');
const Reporte = require('../models/Reporte');

exports.n8nWebhook = async (req, res) => {
  try {
    const { action, data } = req.body;

    if (action === 'create_alerta') {
      const { user_id, mensaje, severidad } = data;
      const alerta = await Alerta.create({ user_id, mensaje, severidad });
      return res.status(201).json({ received: true, alerta });
    }
    
    if (action === 'create_reporte_automatico') {
      const { user_id, tipo_contaminante, ubicacion, descripcion } = data;
      const reporte = await Reporte.create({ user_id, tipo_contaminante, ubicacion, descripcion });
      return res.status(201).json({ received: true, reporte });
    }

    res.status(400).json({ message: 'Acción no soportada' });
  } catch (error) {
    console.error('Error en webhook n8n:', error);
    res.status(500).json({ message: 'Error interno' });
  }
};