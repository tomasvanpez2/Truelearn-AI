const express = require('express');
const router = express.Router();
const aiAnalysisTracker = require('../../procesos/ai-analysis-tracker');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Obtener historial de análisis de IA (solo admins)
router.get('/history', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const history = await aiAnalysisTracker.getAnalysisHistory();
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Error obteniendo historial de IA:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo historial de análisis de IA'
        });
    }
});

// Obtener estadísticas del sistema de IA (solo admins)
router.get('/stats', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const stats = await aiAnalysisTracker.getSystemStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas de IA:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas de IA'
        });
    }
});

// Obtener historial de un estudiante específico (solo admins)
router.get('/student/:studentName', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { studentName } = req.params;
        const studentHistory = await aiAnalysisTracker.getStudentHistory(studentName);
        
        if (!studentHistory) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron análisis para este estudiante'
            });
        }

        res.json({
            success: true,
            data: studentHistory
        });
    } catch (error) {
        console.error('Error obteniendo historial del estudiante:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo historial del estudiante'
        });
    }
});

module.exports = router;