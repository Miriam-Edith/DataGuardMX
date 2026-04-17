const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { 
  checkMyEmailBreaches, 
  performFullSecurityCheck,
  getLatestBreaches,
  checkEmailBreaches
} = require('../controllers/securityController');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Verificar filtraciones del usuario autenticado
router.get('/breaches/me', checkMyEmailBreaches);

// Chequeo completo de seguridad
router.get('/full-check', performFullSecurityCheck);

// Últimas filtraciones globales (DESDE BD)
router.get('/breaches/latest', getLatestBreaches);

// Verificar email específico (solo admin)
router.get('/breaches/email/:email', checkEmailBreaches);

module.exports = router;