const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { 
  exportConsentimientosPDF,
  exportIncidentesPDF,
  exportARCOCertificate
} = require('../controllers/exportController');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Exportar consentimientos
router.get('/consentimientos', exportConsentimientosPDF);

// Exportar incidentes
router.get('/incidentes', exportIncidentesPDF);

// Exportar certificado ARCO (empresas)
router.get('/certificado-arco', exportARCOCertificate);

module.exports = router;