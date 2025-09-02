// Configuración para la API de OpenAI
module.exports = {
    // Configuración de la API
    api: {
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-5',
        maxTokens: 50000,
        temperature: 0.5,
        apiKey: process.env.OPENAI_API_KEY
    },

    // Configuración de análisis
    analysis: {
        // Umbrales de detección
        thresholds: {
            lowProbability: 0.3,
            mediumProbability: 0.6,
            highProbability: 0.8
        },

        // Materias soportadas
        subjects: [
            'matemáticas',
            'ciencias naturales',
            'química',
            'español',
            'inglés',
            'poesía'
        ],

        // Tipos de documentos soportados
        supportedFileTypes: [
            '.txt',
            '.docx',
            '.pptx',
            '.xlsx'
        ]
    },

    // Configuración de prompts
    prompts: {
        // Prompt base para análisis de documentos
        baseAnalysis: `Analiza el siguiente texto académico y determina si fue generado por IA. Estructura tu respuesta en EXACTAMENTE tres secciones con los siguientes títulos:

SECCIÓN 1 - PROBABILIDAD DE IA:
Indica el porcentaje de probabilidad de que el texto haya sido generado por IA (por ejemplo, 75%). Explica brevemente por qué llegaste a esa conclusión, mencionando patrones lingüísticos, coherencia con el nivel académico y relación con el tema. Indica también tu nivel de confianza (Alta, Media o Baja).

SECCIÓN 2 - REFERENCIAS ESPECÍFICAS:
Identifica y enumera partes específicas del texto que muestran características de contenido generado por IA. Menciona párrafos y versos específicos (por ejemplo, "párrafo 2, verso 4"). Explica brevemente qué aspectos de esos fragmentos sugieren generación por IA.

SECCIÓN 3 - PREGUNTAS PARA EL ESTUDIANTE:
Proporciona 3-5 preguntas específicas que un profesor podría hacer al estudiante para verificar su comprensión y autoría del texto. Estas preguntas deben ser difíciles de responder para alguien que no haya escrito realmente el texto.`,

        // Prompt para generación de preguntas
        questionGeneration: `Basado en el contenido del documento y el contexto académico, genera:
            1. Preguntas específicas sobre el contenido
            2. Posibles respuestas esperadas
            3. Puntos clave para verificar comprensión`
    },

    // Función para construir el prompt final
    buildPrompt: function(text, context) {
        return {
            messages: [
                {
                    role: 'system',
                    content: 'Eres un experto en detección de contenido generado por IA en contextos académicos.'
                },
                {
                    role: 'user',
                    content: `${this.prompts.baseAnalysis}\n\nContexto:\n${JSON.stringify(context)}\n\nTexto:\n${text}`
                }
            ]
        };
    },

    // Función para construir el prompt de preguntas
    buildQuestionPrompt: function(text, context) {
        return {
            messages: [
                {
                    role: 'system',
                    content: 'Eres un profesor experto en evaluación académica.'
                },
                {
                    role: 'user',
                    content: `${this.prompts.questionGeneration}\n\nContexto:\n${JSON.stringify(context)}\n\nTexto:\n${text}`
                }
            ]
        };
    }
};