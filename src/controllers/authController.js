const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRATION } = process.env;

const userConfig = require('../../users.config.js');

const authController = {
    signup: async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario y contraseña son requeridos'
                });
            }

            const envPath = path.resolve(__dirname, '../../.env');
            let envContent = fs.readFileSync(envPath, 'utf8');

            envContent = envContent.replace(/^APP_USERNAME=.*/m, `APP_USERNAME=${username}`);
            envContent = envContent.replace(/^APP_PASSWORD=.*/m, `APP_PASSWORD=${password}`);

            fs.writeFileSync(envPath, envContent);

            return res.status(200).json({
                success: true,
                message: 'Usuario registrado exitosamente'
            });
        } catch (error) {
            console.error('Error en signup:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    register: async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario y contraseña son requeridos'
                });
            }

            // No permitir registrar el admin principal
            if (username === process.env.APP_USERNAME) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede registrar el usuario admin principal'
                });
            }

            const envPath = path.resolve(__dirname, '../../.env');
            let envContent = fs.readFileSync(envPath, 'utf8');

            // Buscar slots disponibles
            let slot = null;
            for (let i = 1; i <= 5; i++) {
                const userKey = `APP_USERNAME${i}`;
                const passKey = `APP_PASSWORD${i}`;
                const userRegex = new RegExp(`^${userKey}=(.*)$`, 'm');
                const passRegex = new RegExp(`^${passKey}=(.*)$`, 'm');
                const userMatch = envContent.match(userRegex);
                const passMatch = envContent.match(passRegex);
                
                // Verificar si el slot está vacío (sin valor después del =)
                if (userMatch && passMatch && (!userMatch[1] || userMatch[1].trim() === '') && (!passMatch[1] || passMatch[1].trim() === '')) {
                    slot = i;
                    break;
                }
                // Evitar duplicados
                if (userMatch && userMatch[1] && userMatch[1].trim() === username) {
                    return res.status(400).json({
                        success: false,
                        message: 'El usuario ya existe'
                    });
                }
            }
            if (!slot) {
                return res.status(400).json({
                    success: false,
                    message: 'No hay más slots disponibles para usuarios (máximo 5 usuarios normales)'
                });
            }

            // Escribir usuario y contraseña en el slot encontrado
            envContent = envContent.replace(new RegExp(`^APP_USERNAME${slot}=.*$`, 'm'), `APP_USERNAME${slot}=${username}`);
            envContent = envContent.replace(new RegExp(`^APP_PASSWORD${slot}=.*$`, 'm'), `APP_PASSWORD${slot}=${password}`);
            fs.writeFileSync(envPath, envContent);

            return res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente'
            });
        } catch (error) {
            console.error('Error en registro:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario y contraseña son requeridos'
                });
            }

            let user = null;
            let role = 'user';
            if (username === process.env.APP_USERNAME && password === process.env.APP_PASSWORD) {
                user = { username, role: 'admin' };
                role = 'admin';
            } else {
                // Verificar slots de usuarios
                for (let i = 1; i <= 5; i++) {
                    if (
                        username === process.env[`APP_USERNAME${i}`] &&
                        password === process.env[`APP_PASSWORD${i}`] &&
                        process.env[`APP_USERNAME${i}`] && 
                        process.env[`APP_USERNAME${i}`].trim() !== ''
                    ) {
                        user = { username, role: 'user' };
                        break;
                    }
                }
            }
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            const token = jwt.sign(
                {
                    username: user.username,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRATION }
            );

            return res.json({
                success: true,
                token,
                role: user.role
            });
        } catch (error) {
            console.error('Error en login:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    }
};

module.exports = authController;