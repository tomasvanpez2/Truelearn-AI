const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const studentsFilePath = path.join(__dirname, 'students.json');

// Función para cargar estudiantes desde el archivo JSON
function loadStudents() {
    if (fs.existsSync(studentsFilePath)) {
        try {
            const data = fs.readFileSync(studentsFilePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error al cargar students.json:', error);
            return [];
        }
    }    return [];
}

// Función para guardar estudiantes en el archivo JSON
function saveStudents(students) {
    try {
        fs.writeFileSync(studentsFilePath, JSON.stringify(students, null, 2), 'utf8');
    } catch (error) {
        console.error('Error al guardar en students.json:', error);
    }
}

module.exports = {
    // Obtener todos los estudiantes de un curso
    getStudentsByCourse: function(course) {
        const students = loadStudents();
        return students.filter(s => s.course === course);
    },

    // Agregar un nuevo estudiante
    addStudent: function(studentData) {
        const { name, course } = studentData;
        if (!name || !course) {
            return { success: false, message: 'Datos incompletos' };
        }

        const students = loadStudents();
        const newStudent = {
            id: uuidv4(),
            name,
            course
        };

        students.push(newStudent);
        saveStudents(students);
        return { success: true, student: newStudent };
    },

    // Actualizar un estudiante existente
    updateStudent: function(studentId, updatedData) {
        const students = loadStudents();
        const studentIndex = students.findIndex(s => s.id === studentId);
        if (studentIndex === -1) {
            return { success: false, message: 'Estudiante no encontrado' };
        }

        students[studentIndex] = { ...students[studentIndex], ...updatedData };
        saveStudents(students);
        return { success: true, student: students[studentIndex] };
    },

    // Eliminar un estudiante
    deleteStudent: function(studentId) {
        let students = loadStudents();
        const initialLength = students.length;
        students = students.filter(s => s.id !== studentId);
        if (students.length === initialLength) {
            return { success: false, message: 'Estudiante no encontrado' };
        }

        saveStudents(students);
        return { success: true, message: 'Estudiante eliminado correctamente' };
    },
    
    // Obtener un estudiante por su ID
    getStudentById: function(studentId) {
        const students = loadStudents();
        return students.find(s => s.id === studentId) || null;
    }
};