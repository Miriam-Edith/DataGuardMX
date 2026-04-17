const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const { 
  getAllUsers, 
  updateUserStatus,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  resetUserPassword
} = require('../controllers/userController');

const router = express.Router();

// Todas las rutas requieren autenticación y rol admin
router.use(verifyToken);
router.use(checkRole(['admin']));

// Listar usuarios
router.get('/', getAllUsers);

// Obtener usuario por ID
router.get('/:id', getUserById);

// Crear usuario
router.post('/', createUser);

// Actualizar usuario
router.put('/:id', updateUser);

// Actualizar estado (activar/desactivar)
router.patch('/:id/status', updateUserStatus);

// Resetear contraseña
router.post('/:id/reset-password', resetUserPassword);

// Eliminar usuario (soft delete)
router.delete('/:id', deleteUser);

module.exports = router;