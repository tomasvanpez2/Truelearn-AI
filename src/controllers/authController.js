const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dataService = require('../services/dataService');
const { JWT_SECRET, JWT_EXPIRATION } = process.env;

const authController = {
    // Registro de nuevos administradores
    // IMPORTANTE: Solo se pueden registrar administradores en este sistema
    // Cada admin tendrá su propia plataforma independiente para gestionar profesores
    register: async (req, res) => {
        try {
            const { username, password, role = 'admin', name, email } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario y contraseña son requeridos'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            // Verificar si el usuario ya existe
            const existingUser = await dataService.findUserByUsername(username);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'El usuario ya existe'
                });
            }

            // Verificar email si se proporciona
            if (email) {
                const existingEmail = await dataService.findUserByEmail(email);
                if (existingEmail) {
                    return res.status(400).json({
                        success: false,
                        message: 'El email ya está registrado'
                    });
                }
            }

            // Hash de la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Crear nuevo usuario
            const newUser = await dataService.createUser({
                name: name || username,
                email: email || `${username}@platform.com`,
                username,
                password: hashedPassword,
                role: role, // admin o teacher
                active: true
                // platformData se crea automáticamente en dataService.createUser()
            });

            return res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                user: {
                    id: newUser._id || newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    username: newUser.username,
                    role: newUser.role,
                    active: newUser.active,
                    platformData: newUser.platformData,
                    createdAt: newUser.createdAt,
                    updatedAt: newUser.updatedAt
                }
            });
        } catch (error) {
            console.error('Error en registro:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // Login para administradores y profesores
    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario y contraseña son requeridos'
                });
            }

            // Buscar usuario con contraseña
            const user = await dataService.findUserByUsernameWithPassword(username);
            if (!user || !user.active) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Verificar contraseña
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Generar token JWT
            const token = jwt.sign(
                {
                    userId: user._id || user.id.toString(),
                    username: user.username,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRATION }
            );

            return res.json({
                success: true,
                token,
                user: {
                    id: user._id || user.id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    active: user.active,
                    platformData: user.platformData,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            });
        } catch (error) {
            console.error('Error en login:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // Obtener perfil del usuario actual
    getProfile: async (req, res) => {
        try {
            const user = await dataService.findUserById(req.user.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            return res.json({
                success: true,
                user: {
                    id: user._id || user.id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    active: user.active,
                    platformData: user.platformData,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            });
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // Actualizar perfil del usuario
    updateProfile: async (req, res) => {
        try {
            const { password, name, email } = req.body;
            const user = await dataService.findUserById(req.user.userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const updateData = {};

            if (name) updateData.name = name;
            if (email) updateData.email = email;

            if (password) {
                if (password.length < 6) {
                    return res.status(400).json({
                        success: false,
                        message: 'La contraseña debe tener al menos 6 caracteres'
                    });
                }
                // Hash de la nueva contraseña
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(password, salt);
            }

            const updatedUser = await dataService.updateUser(req.user.userId, updateData);

            return res.json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                user: {
                    id: updatedUser._id || updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    username: updatedUser.username,
                    role: updatedUser.role,
                    active: updatedUser.active,
                    platformData: updatedUser.platformData,
                    createdAt: updatedUser.createdAt,
                    updatedAt: updatedUser.updatedAt
                }
            });
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    }
};

module.exports = authController;
