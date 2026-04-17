const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { 
  getMyConsentimientos, 
  createConsentimiento, 
  revokeConsentimiento,
  getActiveConsentimientosByUserId 
} = require('../controllers/consentimientoController');

const router = express.Router();

router.use(verifyToken);

router.get('/', getMyConsentimientos);
router.post('/', createConsentimiento);
router.delete('/:id', revokeConsentimiento);

// Nueva ruta para chatbot
router.get('/user/:userId/activos', getActiveConsentimientosByUserId);

module.exports = router;