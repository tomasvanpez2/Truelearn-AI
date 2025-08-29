const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRATION } = process.env;
const userConfig = require('../../users.config');
const authController = require('../controllers/authController');

router.post('/signup', authController.signup);

// Ruta para registro de usuarios
router.post('/register', authController.register);

// Ruta para inicio de sesión
router.post('/login', authController.login);

module.exports = router;