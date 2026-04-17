const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, changePassword } = require('../controllers/profileController');
const router = express.Router();

router.use(verifyToken);
router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/change-password', changePassword);

module.exports = router;