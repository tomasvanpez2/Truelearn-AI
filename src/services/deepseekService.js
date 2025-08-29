const fetch = require('node-fetch');
const apiConfig = require('../config/apiConfig');
const tokenLogger = require('../utils/tokenLogger');

class DeepseekService {
    constructor() {
        this.baseUrl = apiConfig.api.baseUrl;
        this.model = apiConfig.api.model;
        this.maxTokens = apiConfig.api.maxTokens;
        this.temperature = apiConfig.api.temperature;
        this.apiKey = apiConfig.api.apiKey;
    }

    async analyzeText(text, context) {
        try {
            const prompt = apiConfig.buildPrompt(text, context);
            console.log('Enviando solicitud a la API con texto de longitud:', text.length);
            
            const requestBody = {
                model: this.model,
                messages: prompt.messages,
                max_tokens: this.maxTokens,
                temperature: this.temperature
            };
            
            console.log('Configuración de la solicitud:', JSON.stringify({
                url: `${this.baseUrl}/chat/completions`,
                model: this.model,
                max_tokens: this.maxTokens,
                temperature: this.temperature
            }));
            
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'https://detector-ia-academico.com',
                    'X-Title': 'Detector IA Académico'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error en la respuesta de la API:', response.status, errorText);
                throw new Error(`Error en la API: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            
            // Registrar el uso de tokens si hay un nombre de estudiante en el contexto
            if (context && context.studentName) {
                const documentInfo = `Análisis de texto - ${context.studentGrade || 'Sin grado'}`;
                await tokenLogger.logTokenUsage(context.studentName, data.usage, documentInfo);
            }
            
            return this.processResponse(data);
        } catch (error) {
            console.error('Error en el análisis:', error);
            throw error;
        }
    }

    async generateQuestions(text, context) {
        try {
            const prompt = apiConfig.buildQuestionPrompt(text, context);
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'https://detector-ia-academico.com',
                    'X-Title': 'Detector IA Académico'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: prompt.messages,
                    max_tokens: this.maxTokens,
                    temperature: this.temperature
                })
            });

            if (!response.ok) {
                throw new Error(`Error en la API: ${response.status}`);
            }

            const data = await response.json();
            
            // Registrar el uso de tokens si hay un nombre de estudiante en el contexto
            if (context && context.studentName) {
                const documentInfo = `Generación de preguntas - ${context.studentGrade || 'Sin grado'}`;
                await tokenLogger.logTokenUsage(context.studentName, data.usage, documentInfo);
            }
            
            return this.processResponse(data);
        } catch (error) {
            console.error('Error generando preguntas:', error);
            throw error;
        }
    }

    processResponse(data) {
        if (!data.choices || data.choices.length === 0) {
            throw new Error('Respuesta inválida de la API');
        }

        return {
            content: data.choices[0].message.content,
            usage: data.usage || {},
            model: data.model
        };
    }
}

module.exports = new DeepseekService();