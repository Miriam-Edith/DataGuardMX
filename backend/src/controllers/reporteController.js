const Reporte = require('../models/Reporte');

exports.createReporte = async (req, res) => {
  try {
    const { tipo_contaminante, ubicacion, descripcion, latitud, longitud } = req.body;
    
    console.log('📝 Creando nuevo reporte:', { tipo_contaminante, ubicacion, latitud, longitud });
    
    const reporte = await Reporte.create({ 
      user_id: req.user.id, 
      tipo_contaminante, 
      ubicacion, 
      descripcion,
      latitud,
      longitud
    });
    
    console.log('✅ Reporte creado:', reporte.id);
    res.status(201).json(reporte);
  } catch (error) {
    console.error('❌ Error al crear reporte:', error);
    res.status(500).json({ message: 'Error al crear reporte' });
  }
};

exports.getMyReportes = async (req, res) => {
  try {
    const reportes = await Reporte.findByUser(req.user.id);
    console.log(`📊 Enviando ${reportes.length} reportes al frontend`);
    
    const conCoords = reportes.filter(r => r.latitud && r.longitud).length;
    console.log(`📍 Reportes con coordenadas: ${conCoords}`);
    
    res.json(reportes);
  } catch (error) {
    console.error('❌ Error al obtener reportes:', error);
    res.status(500).json({ message: 'Error al obtener reportes' });
  }
};

exports.getAllReportes = async (req, res) => {
  try {
    // ✅ ELIMINAR la verificación de admin - ahora cualquier usuario autenticado puede ver todos
    const reportes = await Reporte.getAll();
    console.log(`📊 Enviando ${reportes.length} reportes de TODOS los usuarios`);
    res.json(reportes);
  } catch (error) {
    console.error('❌ Error al obtener reportes:', error);
    res.status(500).json({ message: 'Error al obtener reportes' });
  }
};

// Obtener conteo de reportes por userId (para chatbot)
exports.getReportesCountByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar permisos (solo admin o el propio usuario)
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    
    const count = await Reporte.countByUser(userId);
    res.json({ count });
  } catch (error) {
    console.error('❌ Error al obtener conteo de reportes:', error);
    res.status(500).json({ message: 'Error al obtener conteo de reportes' });
  }
};