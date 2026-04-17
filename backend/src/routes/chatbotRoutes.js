const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { chatbotMessage } = require('../controllers/chatbotController');

const router = express.Router();

// Aplica verifyToken a todas las rutas de chatbot
router.use(verifyToken);

// Ruta principal del chatbot
router.post('/message', chatbotMessage);

module.exports = router;