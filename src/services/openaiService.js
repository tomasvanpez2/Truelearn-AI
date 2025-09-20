const fetch = require('node-fetch');
const apiConfig = require('../config/apiConfig');
const tokenLogger = require('../utils/tokenLogger');

class OpenAIService {
    constructor() {
        this.baseUrl = apiConfig.api.baseUrl;
        this.model = apiConfig.api.model;
        this.maxTokens = apiConfig.api.maxTokens;
        this.temperature = apiConfig.api.temperature;
        this.apiKey = apiConfig.api.apiKey;
        this.maxRetries = 3;
        this.baseDelay = 1000; // 1 second
    }

    async analyzeText(text, context) {
        try {
            const prompt = apiConfig.buildPrompt(text, context);
            console.log('Enviando solicitud a OpenAI con texto de longitud:', text.length);
            
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
            
            const data = await this.makeAPIRequest(`${this.baseUrl}/chat/completions`, requestBody);
            
            // Registrar el uso de tokens si hay un nombre de estudiante en el contexto
            if (context && context.studentName) {
                const documentInfo = `Análisis de texto - ${context.studentGrade || 'Sin grado'}`;
                await tokenLogger.logTokenUsage(context.studentName, data.usage, documentInfo);
            }
            
            // Los tokens se actualizan en el controlador, no aquí para evitar duplicación
            
            return this.processResponse(data);
        } catch (error) {
            console.error('Error en el análisis con OpenAI:', error);
            throw error;
        }
    }

    async generateQuestions(text, context) {
        try {
            const prompt = apiConfig.buildQuestionPrompt(text, context);
            
            const requestBody = {
                model: this.model,
                messages: prompt.messages,
                max_tokens: this.maxTokens,
                temperature: this.temperature
            };
            
            const data = await this.makeAPIRequest(`${this.baseUrl}/chat/completions`, requestBody);
            
            // Registrar el uso de tokens si hay un nombre de estudiante en el contexto
            if (context && context.studentName) {
                const documentInfo = `Generación de preguntas - ${context.studentGrade || 'Sin grado'}`;
                await tokenLogger.logTokenUsage(context.studentName, data.usage, documentInfo);
            }
            
            // Los tokens se actualizan en el controlador, no aquí para evitar duplicación
            
            return this.processResponse(data);
        } catch (error) {
            console.error('Error generando preguntas con OpenAI:', error);
            throw error;
        }
    }

    async retryWithBackoff(requestFn, attempt = 1) {
        try {
            return await requestFn();
        } catch (error) {
            if (error.status === 429 && attempt <= this.maxRetries) {
                const delay = this.baseDelay * Math.pow(2, attempt - 1);
                console.log(`Rate limit alcanzado. Reintentando en ${delay}ms (intento ${attempt}/${this.maxRetries})`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.retryWithBackoff(requestFn, attempt + 1);
            }
            throw error;
        }
    }

    async makeAPIRequest(url, requestBody) {
        const requestFn = async () => {
            // Log para diagnosticar: key parcial y headers
            const keyPreview = this.apiKey ? `${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 10)}` : 'undefined';
            console.log('🔍 [DEBUG] API Key preview:', keyPreview);
            console.log('🔍 [DEBUG] Request URL:', url);
            console.log('🔍 [DEBUG] Request headers:', {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${keyPreview}`
            });

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [502-DEBUG] Error en la respuesta de OpenAI:', response.status, errorText);
                console.error('❌ [502-DEBUG] Full error response:', errorText);
                console.error('❌ [502-DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));
                console.error('❌ [502-DEBUG] Response status text:', response.statusText);
                console.error('❌ [502-DEBUG] Request body length:', JSON.stringify(requestBody).length);

                // Create error object with status for retry logic
                const error = new Error();
                error.status = response.status;

                // Handle OpenRouter specific errors
                if (response.status === 401) {
                    error.message = 'API key de OpenRouter inválida o faltante';
                    console.error('❌ [502-DEBUG] Error 401: API key inválida');
                } else if (response.status === 429) {
                    error.message = 'Rate limit excedido. Reintentando automáticamente...';
                    console.error('❌ [502-DEBUG] Error 429: Rate limit excedido');
                } else if (response.status === 400) {
                    error.message = 'Solicitud inválida a OpenAI. Verifica los parámetros del prompt o la longitud del texto.';
                    console.error('❌ [502-DEBUG] Error 400: Solicitud inválida');
                } else if (response.status === 502) {
                    error.message = 'Error 502: Bad Gateway - El servidor upstream devolvió una respuesta inválida';
                    console.error('❌ [502-DEBUG] Error 502 detectado: Bad Gateway');
                } else if (response.status === 503) {
                    error.message = 'Error 503: Service Unavailable - El servicio no está disponible temporalmente';
                    console.error('❌ [502-DEBUG] Error 503: Service Unavailable');
                } else {
                    error.message = `Error de OpenAI: ${response.status} - ${errorText}`;
                    console.error('❌ [502-DEBUG] Error desconocido:', response.status);
                }

                throw error;
            }

            console.log('✅ [502-DEBUG] Respuesta OK de OpenAI, status:', response.status);

            return response.json();
        };

        return this.retryWithBackoff(requestFn);
    }

    processResponse(data) {
        if (!data.choices || data.choices.length === 0) {
            throw new Error('Respuesta inválida de OpenAI');
        }

        return {
            content: data.choices[0].message.content,
            usage: data.usage || {},
            model: data.model
        };
    }
}

module.exports = new OpenAIService();