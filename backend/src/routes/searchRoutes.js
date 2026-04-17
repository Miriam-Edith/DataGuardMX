const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { search, getFilterOptions } = require('../controllers/searchController');

const router = express.Router();

router.use(verifyToken);

// Búsqueda principal
router.get('/', search);

// Opciones de filtros
router.get('/filters', getFilterOptions);

module.exports = router;