// Configuración de usuarios para el sistema de detección de IA
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const usersFilePath = path.join(__dirname, 'users.json');

// Función para cargar usuarios desde las variables de entorno (.env)
function loadUsers() {
    const users = [];
    // Admin principal
    if (process.env.APP_USERNAME && process.env.APP_PASSWORD) {
        users.push({
            id: 'admin',
            username: process.env.APP_USERNAME,
            password: process.env.APP_PASSWORD,
            role: 'admin',
            active: true
        });
    }
    // Usuarios normales (hasta 5 slots)
    for (let i = 1; i <= 5; i++) {
        const user = process.env[`APP_USERNAME${i}`];
        const pass = process.env[`APP_PASSWORD${i}`];
        if (user && pass) {
            users.push({
                id: `user${i}`,
                username: user,
                password: pass,
                role: 'user',
                active: true
            });
        }
    }
    return users;
}

// Función para guardar usuarios en el archivo JSON
function saveUsers(users) {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
        console.error('Error al guardar en users.json:', error);
    }
}

module.exports = {
    // Función para validar credenciales
    validateCredentials: function(username, password) {
        const users = loadUsers();
        const user = users.find(u => 
            u.username === username && 
            u.password === password && 
            u.active
        );
        return user || null;
    },

    // Función para obtener información del usuario
    getUserInfo: function(username) {
        const users = loadUsers();
        return users.find(u => u.username === username) || null;
    },

    // Función para verificar permisos
    hasPermission: function(username, permission) {
        const user = this.getUserInfo(username);
        if (!user) return false;
        
        switch(permission) {
            case 'analyze_documents':
                return ['teacher', 'admin'].includes(user.role);
            case 'manage_users':
                return user.role === 'admin';
            default:
                return false;
        }
    },
    
    // Función para agregar un nuevo usuario
    // addUser ya no se usa, la lógica de agregar usuario está en el controlador y .env
    addUser: function() {
        return { success: false, message: 'No implementado: los usuarios se agregan solo en el .env' };
    },
    
    // Función para actualizar un usuario existente
    updateUser: function(userId, updatedData) {
        const users = loadUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return { success: false, message: 'Usuario no encontrado' };
        }
        
        // Actualizar los datos del usuario
        users[userIndex] = {
            ...users[userIndex],
            ...updatedData
        };
        
        saveUsers(users);
        return { success: true, message: 'Usuario actualizado correctamente' };
    },
    
    // Función para eliminar un usuario del .env
    deleteUser: function(userId) {
        // Proteger el admin principal
        if (userId === 'admin') {
            return { success: false, message: 'No se puede eliminar el usuario principal (admin)' };
        }
        // Buscar el slot correspondiente
        const envPath = path.resolve(__dirname, '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        let found = false;
        for (let i = 1; i <= 5; i++) {
            if (userId === `user${i}`) {
                // Vaciar las variables
                envContent = envContent.replace(new RegExp(`^APP_USERNAME${i}=.*$`, 'm'), `APP_USERNAME${i}=`);
                envContent = envContent.replace(new RegExp(`^APP_PASSWORD${i}=.*$`, 'm'), `APP_PASSWORD${i}=`);
                found = true;
                break;
            }
        }
        if (!found) {
            return { success: false, message: 'Usuario no encontrado' };
        }
        fs.writeFileSync(envPath, envContent);
        return { success: true, message: 'Usuario eliminado correctamente' };
    },
    
    // Función para obtener todos los usuarios válidos del .env
    getAllUsers: function() {
        const users = loadUsers();
        return users.map(user => ({
            id: user.id,
            username: user.username,
            role: user.role,
            active: user.active
        }));
    }
};