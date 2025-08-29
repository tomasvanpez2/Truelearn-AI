/**
 * Middleware para proteger rutas del frontend
 * Este middleware verifica si hay un token en la cookie o en el localStorage
 * y redirige al login si no hay token
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const path = require('path');

const protectDashboardRoute = (req, res, next) => {
    // Para rutas del frontend como dashboard.html, verificamos si hay un token en la cookie
    // Si no hay token, redirigimos al login
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // Si es una solicitud al dashboard y no hay token, redirigir al login
    if (req.path.includes('dashboard')) {
        if (!token) {
            return res.redirect('/');
        }
        
        try {
            // Verificar el token
            jwt.verify(token, JWT_SECRET);
            next();
        } catch (error) {
            // Si el token es inválido, redirigir al login
            return res.redirect('/');
        }
    } else {
        // Para otras rutas, continuar
        next();
    }
};

module.exports = {
    protectDashboardRoute
};