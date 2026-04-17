const express = require('express');
const { 
  register, 
  login, 
  forgotPassword, 
  verifyResetToken, 
  resetPassword 
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/verify-reset-token/:token', verifyResetToken);
router.post('/reset-password', resetPassword);

module.exports = router;