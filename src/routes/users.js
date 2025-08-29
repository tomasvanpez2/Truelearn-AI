const express = require('express');
const router = express.Router();
const userConfig = require('../../users.config');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Middleware para verificar que el usuario es administrador
const isAdmin = checkRole(['admin']);

// Obtener todos los usuarios (solo administradores)
router.get('/', verifyToken, isAdmin, (req, res) => {
    try {
        const users = userConfig.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios'
        });
    }
});

// Obtener un usuario específico (solo administradores)
router.get('/:username', verifyToken, isAdmin, (req, res) => {
    try {
        const { username } = req.params;
        const user = userConfig.getUserInfo(username);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario'
        });
    }
});

// Crear un nuevo usuario (solo administradores)
const authController = require('../controllers/authController');

// Crear un nuevo usuario (solo administradores)
router.post('/', verifyToken, isAdmin, authController.register);

// Actualizar un usuario existente (solo administradores)
router.put('/:id', verifyToken, isAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { password, role, active } = req.body;
        
        const updatedData = {};
        if (password) updatedData.password = password;
        if (role) updatedData.role = role;
        if (active !== undefined) updatedData.active = active;
        
        const result = userConfig.updateUser(id, updatedData);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario'
        });
    }
});

// Eliminar un usuario (solo administradores)
router.delete('/:id', verifyToken, isAdmin, (req, res) => {
    try {
        const { id } = req.params;
        
        // Opcional: Proteger al usuario administrador principal por su ID si es necesario
        // Esto requeriría conocer su ID o tener una forma de identificarlo

        const result = userConfig.deleteUser(id);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario'
        });
    }
});

module.exports = router;