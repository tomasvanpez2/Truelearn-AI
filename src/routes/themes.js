const express = require('express');
const router = express.Router();
const { loadThemes, saveThemes } = require('../utils/themes');


// Obtener temas de una materia de un curso
router.get('/:courseId/:subjectId', (req, res) => {
    const { courseId, subjectId } = req.params;
    const themes = loadThemes();
    res.json((themes[courseId] && themes[courseId][subjectId]) ? themes[courseId][subjectId] : []);
});

// Agregar tema a una materia de un curso
router.post('/:courseId/:subjectId', (req, res) => {
    const { courseId, subjectId } = req.params;
    const { topic } = req.body;
    if (!topic || !topic.trim()) {
        return res.status(400).json({ success: false, message: 'Tema inválido' });
    }
    const themes = loadThemes();
    if (!themes[courseId]) themes[courseId] = {};
    if (!themes[courseId][subjectId]) themes[courseId][subjectId] = [];
    if (!themes[courseId][subjectId].includes(topic)) {
        themes[courseId][subjectId].push(topic);
        saveThemes(themes);
    }
    res.json({ success: true, topics: themes[courseId][subjectId] });
});

// Eliminar tema de una materia de un curso
router.delete('/:courseId/:subjectId', (req, res) => {
    const { courseId, subjectId } = req.params;
    const { topic } = req.body;
    const themes = loadThemes();
    if (themes[courseId] && themes[courseId][subjectId]) {
        themes[courseId][subjectId] = themes[courseId][subjectId].filter(t => t !== topic);
        saveThemes(themes);
    }
    res.json({ success: true, topics: (themes[courseId] && themes[courseId][subjectId]) ? themes[courseId][subjectId] : [] });
});

module.exports = router;
