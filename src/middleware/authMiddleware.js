const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

/**
 * Middleware para verificar la autenticación mediante JWT
 */
const verifyToken = (req, res, next) => {
    // Obtener el token del header de autorización
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado. Token no proporcionado.'
        });
    }
    
    try {
        // Verificar el token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado',
            error: error.message
        });
    }
};

/**
 * Middleware para verificar roles de usuario
 * @param {Array} roles - Roles permitidos
 */
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        
        if (roles.includes(req.user.role)) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para acceder a este recurso'
            });
        }
    };
};

/**
 * Middleware específico para verificar que el usuario sea administrador
 */
const verifyAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado'
        });
    }
    
    if (req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren permisos de administrador.'
        });
    }
};

module.exports = {
    verifyToken,
    checkRole,
    verifyAdmin
};