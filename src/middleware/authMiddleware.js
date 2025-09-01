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
 * @param {Array} roles - Roles permitidos ['admin', 'teacher']
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
 * Middleware específico para verificar que el usuario sea profesor
 */
const verifyTeacher = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado'
        });
    }
    
    if (req.user.role === 'teacher') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Solo profesores pueden acceder.'
        });
    }
};

/**
 * Middleware específico para verificar que el usuario sea administrador
 * IMPORTANTE: En este sistema SOLO existen administradores.
 * Los "students" son datos gestionados por cada admin, no usuarios del sistema.
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
            message: 'Acceso denegado. Solo administradores pueden acceder.'
        });
    }
};

/**
 * Middleware para verificar que el usuario accede solo a sus propios datos
 */
const verifyOwnership = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado'
        });
    }
    
    // Los admins pueden acceder a sus propios datos
    if (req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado.'
        });
    }
};

/**
 * Middleware para requerir un rol específico
 * @param {string} role - Rol requerido ('admin', 'teacher')
 */
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        
        if (req.user.role === role) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: `Acceso denegado. Se requiere rol de ${role}`
            });
        }
    };
};

module.exports = {
    verifyToken,
    checkRole,
    verifyAdmin,
    verifyTeacher,
    verifyOwnership,
    requireRole
};