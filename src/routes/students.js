const express = require('express');
const router = express.Router();
const studentConfig = require('../../students.config');
const { verifyToken } = require('../middleware/authMiddleware');

// Obtener estudiantes por curso
router.get('/', verifyToken, (req, res) => {
    const { course } = req.query;
    if (!course) {
        return res.status(400).json({ success: false, message: 'El curso es requerido' });
    }
    const students = studentConfig.getStudentsByCourse(course);
    res.json(students);
});

// Agregar un nuevo estudiante
router.post('/', verifyToken, (req, res) => {
    const result = studentConfig.addStudent(req.body);
    if (result.success) {
        res.status(201).json(result);
    } else {
        res.status(400).json(result);
    }
});

// Actualizar un estudiante
router.put('/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const result = studentConfig.updateStudent(id, req.body);
    if (result.success) {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
});

// Eliminar un estudiante
router.delete('/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const result = studentConfig.deleteStudent(id);
    if (result.success) {
        res.json(result);
    } else {
        res.status(404).json(result);
    }
});

module.exports = router;