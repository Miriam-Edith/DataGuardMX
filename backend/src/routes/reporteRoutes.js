const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { 
  createReporte, 
  getMyReportes, 
  getAllReportes,
  getReportesCountByUserId 
} = require('../controllers/reporteController');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Crear un nuevo reporte
router.post('/', createReporte);

// Obtener MIS reportes (solo los del usuario logueado)
router.get('/', getMyReportes);

// Obtener TODOS los reportes (para mapa y buscador) - AHORA PÚBLICO PARA USUARIOS AUTENTICADOS
router.get('/all', getAllReportes);

// Obtener conteo de reportes por userId (para chatbot)
router.get('/user/:userId/count', getReportesCountByUserId);

module.exports = router;