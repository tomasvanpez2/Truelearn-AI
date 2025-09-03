const fs = require('fs');
const path = require('path');

// Simulación de datos de usuario para desarrollo sin MongoDB
class DataService {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data');
        this.usersFile = path.join(this.dataPath, 'users.json');
        this.ensureDataDirectory();
        this.initializeDefaultData();
    }

    ensureDataDirectory() {
        if (!fs.existsSync(this.dataPath)) {
            fs.mkdirSync(this.dataPath, { recursive: true });
        }
    }

    // Función auxiliar para asegurar la estructura correcta de platformData
    ensurePlatformDataStructure(user) {
        if (!user.platformData) {
            user.platformData = {};
        }

        // Estructura base para todos los roles
        if (!user.platformData.tokens) {
            user.platformData.tokens = { used: 0, limit: 0 };
        }

        // Estructura específica según el rol
        if (user.role === 'admin') {
            if (!user.platformData.students) user.platformData.students = [];
            if (!user.platformData.courses) user.platformData.courses = [];
            if (!user.platformData.themes) user.platformData.themes = [];
            if (!user.platformData.rankings) user.platformData.rankings = [];
            
            // Los admins tienen límite de tokens
            if (user.platformData.tokens.limit === 0) {
                user.platformData.tokens.limit = 900000;
            }
        } else if (user.role === 'teacher') {
            if (!user.platformData.themes) user.platformData.themes = [];
            // Los profesores no tienen límite propio de tokens
            user.platformData.tokens.limit = 0;
        } else if (user.role === 'student') {
            // Los estudiantes no tienen límite de tokens
            user.platformData.tokens.limit = 0;
        }

        return user;
    }

    initializeDefaultData() {
        if (!fs.existsSync(this.usersFile)) {
            const defaultUsers = [
                {
                    id: '1',
                    name: 'Administrador',
                    email: 'admin@platform.com',
                    username: 'admin',
                    password: '$2b$10$9LAu23UPtsvOmYZweu6CSuyLR0/91nc5UafM2AaN5lpM6pz9D.2TG', // password: admin123
                    role: 'admin',
                    active: true,
                    platformData: {
                        tokens: { used: 0, limit: 5000 },
                        students: [],
                        courses: [],
                        themes: [],
                        rankings: []
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            this.saveUsers(defaultUsers);
        } else {
            // Migrar datos existentes para asegurar estructura correcta
            this.migrateExistingData();
        }
    }

    // Migración para corregir datos existentes
    migrateExistingData() {
        try {
            const users = this.loadUsers();
            let needsSave = false;

            users.forEach((user, index) => {
                const originalUser = JSON.stringify(user);
                users[index] = this.ensurePlatformDataStructure(user);
                
                if (JSON.stringify(users[index]) !== originalUser) {
                    needsSave = true;
                }
            });

            if (needsSave) {
                this.saveUsers(users);
                console.log('Datos de usuarios migrados correctamente');
            }
        } catch (error) {
            console.error('Error durante la migración de datos:', error);
        }
    }

    loadUsers() {
        try {
            const data = fs.readFileSync(this.usersFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    }

    saveUsers(users) {
        try {
            fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    findUserById(id) {
        const users = this.loadUsers();
        return users.find(user => user.id === id);
    }

    findUserByUsername(username) {
        const users = this.loadUsers();
        return users.find(user => user.username === username);
    }

    findUserByEmail(email) {
        const users = this.loadUsers();
        return users.find(user => user.email === email);
    }

    findUserByUsernameWithPassword(username) {
        const users = this.loadUsers();
        return users.find(user => user.username === username);
    }

    createUser(userData) {
        const users = this.loadUsers();
        
        // Estructura base para platformData sin requests
        let platformData = {};
        if (userData.role === 'admin') {
            platformData = {
                tokens: { used: 0, limit: 900000 },
                students: [],
                courses: [],
                themes: [],
                rankings: []
            };
        } else if (userData.role === 'teacher') {
            platformData = {
                tokens: { used: 0, limit: 0 } // Los profesores no tienen límite propio, usan el del admin
            };
        } else if (userData.role === 'student') {
            platformData = {
                tokens: { used: 0, limit: 0 } // Los estudiantes no tienen límite de tokens
            };
        }

        const newUser = {
            id: Date.now().toString(),
            ...userData,
            platformData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        users.push(newUser);
        this.saveUsers(users);
        return newUser;
    }

    updateUser(id, updateData) {
        const users = this.loadUsers();
        const userIndex = users.findIndex(user => user.id === id);
        if (userIndex === -1) return null;

        users[userIndex] = {
            ...users[userIndex],
            ...updateData,
            updatedAt: new Date().toISOString()
        };
        this.saveUsers(users);
        return users[userIndex];
    }

    deleteUser(id) {
        const users = this.loadUsers();
        const userToDelete = users.find(user => user.id === id);
        const filteredUsers = users.filter(user => user.id !== id);
        this.saveUsers(filteredUsers);
        return userToDelete;
    }

    // Métodos específicos para profesores
    findTeachersByAdmin(adminId) {
        const users = this.loadUsers();
        return users.filter(u => u.role === 'teacher' && u.adminId === adminId);
    }

    findTeacherById(teacherId, adminId) {
        const users = this.loadUsers();
        const teacher = users.find(u => u.id === teacherId && u.role === 'teacher' && u.adminId === adminId);
        return teacher || null;
    }

    // Métodos para cursos
    addCourse(adminId, courseData) {
        const users = this.loadUsers();
        const userIndex = users.findIndex(u => u.id === adminId);
        if (userIndex === -1) return null;

        const course = {
            id: Date.now().toString(),
            name: courseData.name,
            description: courseData.description || '',
            createdAt: new Date().toISOString()
        };

        // Asegurar que la estructura de platformData esté completa
        users[userIndex] = this.ensurePlatformDataStructure(users[userIndex]);

        users[userIndex].platformData.courses.push(course);
        users[userIndex].updatedAt = new Date().toISOString();
        this.saveUsers(users);
        return course;
    }

    getCourses(adminId) {
        const users = this.loadUsers();
        const user = users.find(u => u.id === adminId);
        return user && user.platformData ? user.platformData.courses : [];
    }

    // Métodos para temas
    addTheme(userId, themeData) {
        const users = this.loadUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) return null;

        const theme = {
            id: Date.now().toString(),
            name: themeData.name,
            description: themeData.description || '',
            createdAt: new Date().toISOString()
        };

        // Asegurar que la estructura de platformData esté completa
        users[userIndex] = this.ensurePlatformDataStructure(users[userIndex]);

        // Agregar el tema al array correspondiente
        users[userIndex].platformData.themes.push(theme);
        users[userIndex].updatedAt = new Date().toISOString();
        this.saveUsers(users);
        return theme;
    }

    getThemes(userId) {
        const users = this.loadUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return [];
        
        // Asegurar estructura antes de devolver datos
        const updatedUser = this.ensurePlatformDataStructure(user);
        return updatedUser.platformData.themes || [];
    }

    // Métodos para estudiantes por admin
    addStudent(adminId, studentData) {
        const users = this.loadUsers();
        const userIndex = users.findIndex(u => u.id === adminId);
        if (userIndex === -1) return null;

        const student = {
            id: Date.now().toString(),
            name: studentData.name,
            course: studentData.course || '',
            adminId: adminId, // Asociar estudiante con admin
            createdAt: new Date().toISOString()
        };

        // Asegurar que la estructura de platformData esté completa
        users[userIndex] = this.ensurePlatformDataStructure(users[userIndex]);

        users[userIndex].platformData.students.push(student);
        users[userIndex].updatedAt = new Date().toISOString();
        this.saveUsers(users);
        return student;
    }

    getStudents(adminId) {
        const users = this.loadUsers();
        const user = users.find(u => u.id === adminId);
        if (!user || !user.platformData) return [];

        // Obtener estudiantes con tokens reales desde archivos
        const studentsData = this.getAdminStudentsTokensFromFiles(adminId);
        return studentsData.students;
    }

    updateStudentTokens(adminId, studentId, tokensUsed) {
        const users = this.loadUsers();
        const userIndex = users.findIndex(u => u.id === adminId);
        if (userIndex === -1) return null;

        const studentIndex = users[userIndex].platformData.students.findIndex(s => s.id === studentId);
        if (studentIndex === -1) return null;

        users[userIndex].platformData.students[studentIndex].tokens.used += tokensUsed;
        
        // Actualizar tokens totales del admin
        users[userIndex].platformData.tokens.used += tokensUsed;
        
        users[userIndex].updatedAt = new Date().toISOString();
        this.saveUsers(users);
        
        return users[userIndex].platformData.students[studentIndex];
    }

    // Métodos para rankings por admin
    addRanking(adminId, rankingData) {
        const users = this.loadUsers();
        const userIndex = users.findIndex(u => u.id === adminId);
        if (userIndex === -1) return null;

        const ranking = {
            id: Date.now().toString(),
            themeId: rankingData.themeId,
            themeName: rankingData.themeName,
            studentId: rankingData.studentId,
            studentName: rankingData.studentName,
            score: rankingData.score || 0,
            tokensUsed: rankingData.tokensUsed || 0,
            createdAt: new Date().toISOString()
        };

        // Asegurar que la estructura de platformData esté completa
        users[userIndex] = this.ensurePlatformDataStructure(users[userIndex]);

        users[userIndex].platformData.rankings.push(ranking);
        users[userIndex].updatedAt = new Date().toISOString();
        this.saveUsers(users);
        return ranking;
    }

    getRankings(adminId, themeId = null) {
        const users = this.loadUsers();
        const user = users.find(u => u.id === adminId);
        if (!user || !user.platformData) return [];
        
        let rankings = user.platformData.rankings || [];
        
        if (themeId) {
            rankings = rankings.filter(r => r.themeId === themeId);
        }
        
        return rankings.sort((a, b) => b.score - a.score);
    }

    // Leer tokens desde archivos .txt en procesos/
    readStudentTokensFromFile(studentName) {
        const fs = require('fs');
        const path = require('path');
        
        try {
            const fileName = `${studentName.replace(/\s+/g, '_')}_tokens.txt`;
            const filePath = path.join(__dirname, '../../procesos', fileName);
            
            if (!fs.existsSync(filePath)) {
                return { used: 0, entries: [] };
            }
            
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            let totalTokens = 0;
            const entries = [];
            
            lines.forEach(line => {
                const match = line.match(/Total de tokens: (\d+)/);
                if (match) {
                    const tokens = parseInt(match[1]);
                    totalTokens += tokens;
                    
                    // Extraer información adicional de la línea
                    const dateMatch = line.match(/\[(.*?)\]/);
                    const docMatch = line.match(/Documento: (.*?) \|/);
                    const inputMatch = line.match(/Tokens de entrada: (\d+)/);
                    const outputMatch = line.match(/Tokens de salida: (\d+)/);
                    
                    entries.push({
                        date: dateMatch ? dateMatch[1] : '',
                        document: docMatch ? docMatch[1] : '',
                        inputTokens: inputMatch ? parseInt(inputMatch[1]) : 0,
                        outputTokens: outputMatch ? parseInt(outputMatch[1]) : 0,
                        totalTokens: tokens
                    });
                }
            });
            
            return { used: totalTokens, entries };
        } catch (error) {
            console.error(`Error leyendo tokens para ${studentName}:`, error);
            return { used: 0, entries: [] };
        }
    }

    // Obtener tokens totales de todos los estudiantes de un admin
    getAdminStudentsTokensFromFiles(adminId) {
        const users = this.loadUsers();
        const user = users.find(u => u.id === adminId);
        if (!user || !user.platformData || !user.platformData.students) {
            return { totalUsed: 0, students: [] };
        }

        let totalUsed = 0;
        const studentsWithTokens = [];

        user.platformData.students.forEach(student => {
            const tokenData = this.readStudentTokensFromFile(student.name);
            totalUsed += tokenData.used;
            
            studentsWithTokens.push({
                ...student,
                tokens: {
                    used: tokenData.used,
                    limit: 0, // Sin límite para estudiantes
                    entries: tokenData.entries
                }
            });
        });

        return { totalUsed, students: studentsWithTokens };
    }

    // Los estudiantes NO tienen límite de tokens - solo información
    getStudentTokenInfo(adminId, studentId) {
        const users = this.loadUsers();
        const user = users.find(u => u.id === adminId);
        if (!user || !user.platformData) return { student: null };

        const student = user.platformData.students.find(s => s.id === studentId);
        if (!student) return { student: null };

        const tokenData = this.readStudentTokensFromFile(student.name);

        return {
            student: {
                ...student,
                tokens: {
                    used: tokenData.used,
                    limit: 0, // Sin límite para estudiantes
                    entries: tokenData.entries
                }
            }
        };
    }

    // Métodos para estadísticas
    getAdminStats(adminId) {
        const users = this.loadUsers();
        const user = users.find(u => u.id === adminId);
        if (!user) return null;

        const teachers = users.filter(u => u.role === 'teacher' && u.adminId === adminId);
        const activeTeachers = teachers.filter(t => t.active);
        const recentTeachers = teachers.filter(t => 
            new Date(t.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );

        // Obtener tokens con uso acumulado para admins
        const tokensData = user.role === 'admin' 
            ? this.getAdminTokensWithAccumulatedUsage(adminId)
            : user.platformData?.tokens || { used: 0, limit: 900000 };

        // Obtener tokens reales de estudiantes desde archivos (solo informativo)
        const studentsTokenData = this.getAdminStudentsTokensFromFiles(adminId);
        const studentsWithTokensExhausted = 0; // Los estudiantes no tienen límite

        return {
            tokens: {
                ...tokensData,
                studentsUsed: studentsTokenData.totalUsed // Tokens usados por estudiantes
            },
            students: {
                total: user.platformData?.students?.length || 0,
                withTokensExhausted: studentsWithTokensExhausted,
                totalTokensUsed: studentsTokenData.totalUsed
            },
            teachers: {
                total: teachers.length,
                active: activeTeachers.length,
                recent: recentTeachers.length,
                tokensUsed: teachers.reduce((total, teacher) => {
                    return total + (teacher.platformData?.tokens?.used || 0);
                }, 0)
            },
            courses: {
                total: user.platformData?.courses?.length || 0
            },
            themes: {
                total: user.platformData?.themes?.length || 0
            },
            rankings: {
                total: user.platformData?.rankings?.length || 0
            }
        };
    }

    // Método para calcular los tokens usados totales del admin (admin + profesores SOLAMENTE)
    // Los estudiantes NO cuentan para el límite del admin
    calculateAdminTotalUsedTokens(adminId) {
        const users = this.loadUsers();
        const admin = users.find(u => u.id === adminId);
        const teachers = users.filter(u => u.role === 'teacher' && u.adminId === adminId);
        
        // Tokens usados directamente por el admin
        const adminUsedTokens = admin?.platformData?.tokens?.used || 0;
        
        // Sumar todos los tokens usados por los profesores
        const totalTeachersUsedTokens = teachers.reduce((total, teacher) => {
            const teacherTokens = teacher.platformData?.tokens?.used || 0;
            return total + teacherTokens;
        }, 0);

        // Los estudiantes NO se incluyen en el límite del admin
        return adminUsedTokens + totalTeachersUsedTokens;
    }

    // Método para obtener tokens del admin con uso acumulado
    getAdminTokensWithAccumulatedUsage(adminId) {
        const users = this.loadUsers();
        const admin = users.find(u => u.id === adminId);
        if (!admin) return null;

        const totalUsedTokens = this.calculateAdminTotalUsedTokens(adminId);
    const adminLimit = admin.platformData?.tokens?.limit || 900000;
        const adminDirectUsage = admin.platformData?.tokens?.used || 0;
        
        // Obtener uso de profesores
        const teachers = users.filter(u => u.role === 'teacher' && u.adminId === adminId);
        const teachersUsage = teachers.reduce((total, teacher) => {
            return total + (teacher.platformData?.tokens?.used || 0);
        }, 0);
        
        // Obtener uso de estudiantes desde archivos (solo para información, NO para límite)
        const studentsTokenData = this.getAdminStudentsTokensFromFiles(adminId);
        const studentsUsage = studentsTokenData.totalUsed;

        return {
            used: totalUsedTokens, // Total usado (admin + profesores SOLAMENTE)
            limit: adminLimit, // Límite fijo del admin
            adminDirectUsage: adminDirectUsage, // Uso directo del admin
            teachersUsage: teachersUsage, // Uso de los profesores
            studentsUsage: studentsUsage, // Uso de los estudiantes (solo informativo)
            remaining: adminLimit - totalUsedTokens // Tokens restantes
        };
    }

    // Método para actualizar tokens
    updateTokens(adminId, tokenData) {
        const users = this.loadUsers();
        const userIndex = users.findIndex(u => u.id === adminId);
        if (userIndex === -1) return null;

        // Asegurar que la estructura de platformData esté completa
        users[userIndex] = this.ensurePlatformDataStructure(users[userIndex]);

        if (tokenData.used !== undefined) {
            users[userIndex].platformData.tokens.used = tokenData.used;
        }
        if (tokenData.limit !== undefined) {
            users[userIndex].platformData.tokens.limit = tokenData.limit;
        }

        users[userIndex].updatedAt = new Date().toISOString();
        this.saveUsers(users);
        
        // Si es admin del sistema, devolver tokens con uso acumulado
        if (users[userIndex].role === 'admin') {
            return this.getAdminTokensWithAccumulatedUsage(adminId);
        }
        
        return users[userIndex].platformData.tokens;
    }

    // Método específico para actualizar tokens de profesores
    updateTeacherTokens(teacherId, tokenData) {
        const users = this.loadUsers();
        const teacherIndex = users.findIndex(u => u.id === teacherId && u.role === 'teacher');
        if (teacherIndex === -1) return null;

        if (!users[teacherIndex].platformData) {
            users[teacherIndex].platformData = {
                tokens: { used: 0, limit: 900000 }
            };
        }

        if (tokenData.used !== undefined) {
            users[teacherIndex].platformData.tokens.used = tokenData.used;
        }
        if (tokenData.limit !== undefined) {
            users[teacherIndex].platformData.tokens.limit = tokenData.limit;
        }

        users[teacherIndex].updatedAt = new Date().toISOString();
        this.saveUsers(users);
        
        return users[teacherIndex].platformData.tokens;
    }

    // Método para verificar si un admin puede permitir el uso de tokens adicionales
    canAdminAllowTokenUsage(adminId, additionalTokens) {
        const adminTokens = this.getAdminTokensWithAccumulatedUsage(adminId);
        if (!adminTokens) return { allowed: false, reason: 'Admin no encontrado' };

        const newTotal = adminTokens.used + additionalTokens;
        const wouldExceed = newTotal > adminTokens.limit;

        return {
            allowed: !wouldExceed,
            currentUsed: adminTokens.used,
            limit: adminTokens.limit,
            remaining: adminTokens.remaining,
            requestedTokens: additionalTokens,
            newTotal: newTotal,
            excess: wouldExceed ? newTotal - adminTokens.limit : 0,
            reason: wouldExceed ? `Excedería el límite por ${newTotal - adminTokens.limit} tokens` : 'Permitido'
        };
    }

    // Método para obtener información del servicio
    getServiceInfo() {
        return {
            service: 'DataService (JSON)',
            connected: true,
            database: 'users.json',
            host: 'localhost',
            port: 'file'
        };
    }
}

module.exports = new DataService();