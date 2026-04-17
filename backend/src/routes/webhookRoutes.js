const express = require('express');
const { n8nWebhook } = require('../controllers/webhookController');
const router = express.Router();

router.post('/n8n', n8nWebhook);

module.exports = router;