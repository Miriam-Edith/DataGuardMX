const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { 
  getMyAlertas, 
  markAsRead, 
  getAlertasByUserId      // ← nueva función importada
} = require('../controllers/alertaController');
const router = express.Router();

// Ruta pública para n8n (sin token)
router.get('/public/by-user', getAlertasByUserId);

// Rutas protegidas (requieren token)
router.use(verifyToken);
router.get('/', getMyAlertas);
router.patch('/:id/read', markAsRead);

module.exports = router;