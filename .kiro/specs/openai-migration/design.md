# Design Document - Migración a OpenAI

## Overview

Este diseño describe la migración del sistema de detección de IA académica desde OpenRouter/DeepSeek hacia la API oficial de OpenAI. La migración se enfoca en crear un nuevo servicio OpenAI que reemplace completamente el servicio DeepSeek existente, manteniendo la misma interfaz y funcionalidad.

## Architecture

### Current Architecture
```
DetectionService -> DeepseekService -> OpenRouter API (Qwen model)
                 -> ApiConfig
```

### New Architecture
```
DetectionService -> OpenAIService -> OpenAI API (GPT-4)
                 -> ApiConfig (updated)
```

### Migration Strategy
- Crear un nuevo `OpenAIService` que reemplace `DeepseekService`
- Actualizar `apiConfig.js` para usar configuración de OpenAI
- Modificar `DetectionService` para usar el nuevo servicio
- Mantener la misma interfaz pública para evitar cambios en controladores

## Components and Interfaces

### OpenAIService Class

**Ubicación:** `src/services/openaiService.js`

**Métodos públicos (mantener interfaz idéntica):**
- `analyzeText(text, context)` - Analiza texto para detectar IA
- `generateQuestions(text, context)` - Genera preguntas de verificación
- `processResponse(data)` - Procesa respuestas de la API

**Funcionalidad a mantener:**
- Uso de `apiConfig.buildPrompt()` para análisis
- Uso de `apiConfig.buildQuestionPrompt()` para preguntas
- Logging de tokens con `tokenLogger.logTokenUsage()`
- Mismo formato de respuesta que DeepseekService
- Manejo de context.studentName para logging

**Configuración:**
- Base URL: `https://api.openai.com/v1`
- Modelo: `gpt-4`
- Headers: Authorization con Bearer token
- Content-Type: application/json

### API Configuration Updates

**Archivo:** `src/config/apiConfig.js`

**Cambios requeridos:**
```javascript
api: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    maxTokens: 10000, // Mantener valor actual
    temperature: 0.5, // Mantener valor actual
    apiKey: process.env.OPENAI_API_KEY // Cambio de variable
}
```

**Funciones de construcción de prompts (mantener sin cambios):**
- `buildPrompt(text, context)` - Construye prompt para análisis de IA
- `buildQuestionPrompt(text, context)` - Construye prompt para generación de preguntas
- Mantener todos los prompts existentes exactamente igual
- Conservar la estructura de mensajes system/user
- No modificar la lógica de construcción de prompts

### DetectionService Integration

**Archivo:** `src/services/detectionService.js`

**Cambios mínimos:**
- Cambiar import de `deepseekService` a `openaiService`
- Actualizar referencia en constructor
- Mantener toda la lógica existente

## Data Models

### Request Format (OpenAI)
```javascript
{
    model: "gpt-4",
    messages: [
        {
            role: "system",
            content: "System prompt"
        },
        {
            role: "user", 
            content: "User prompt with text"
        }
    ],
    max_tokens: 4000,
    temperature: 0.5
}
```

### Response Format (OpenAI)
```javascript
{
    id: "chatcmpl-...",
    object: "chat.completion",
    created: 1234567890,
    model: "gpt-4",
    choices: [
        {
            index: 0,
            message: {
                role: "assistant",
                content: "Analysis response"
            },
            finish_reason: "stop"
        }
    ],
    usage: {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300
    }
}
```

### Internal Response Format (Maintained)
```javascript
{
    content: "Analysis response",
    usage: {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300
    },
    model: "gpt-4"
}
```

## Error Handling

### OpenAI Specific Errors
- **401 Unauthorized:** API key inválida o faltante
- **429 Too Many Requests:** Rate limiting - implementar retry con backoff
- **400 Bad Request:** Parámetros inválidos o prompt demasiado largo
- **500 Internal Server Error:** Error del servidor de OpenAI

### Error Response Strategy
```javascript
try {
    // API call
} catch (error) {
    if (error.status === 429) {
        // Implement exponential backoff
        await this.retryWithBackoff(request);
    } else if (error.status === 401) {
        throw new Error('API key de OpenAI inválida o faltante');
    } else {
        throw new Error(`Error de OpenAI: ${error.status} - ${error.message}`);
    }
}
```

### Rate Limiting Strategy
- Implementar retry automático con exponential backoff
- Máximo 3 reintentos
- Delays: 1s, 2s, 4s
- Log de rate limiting para monitoreo

## Testing Strategy

### Unit Tests
- **OpenAIService Tests:**
  - Verificar construcción correcta de requests
  - Validar procesamiento de responses
  - Probar manejo de errores específicos de OpenAI
  - Mock de fetch para evitar llamadas reales

### Integration Tests
- **DetectionService Integration:**
  - Verificar que analyzeFile funciona con OpenAI
  - Confirmar que generateQuestions mantiene funcionalidad
  - Validar que el logging de tokens funciona correctamente

### Migration Tests
- **Backward Compatibility:**
  - Verificar que la interfaz pública no cambia
  - Confirmar que el formato de respuesta se mantiene
  - Validar que la extracción de porcentajes funciona

### Environment Tests
- **Configuration Tests:**
  - Verificar carga correcta de OPENAI_API_KEY
  - Confirmar configuración de modelo GPT-4
  - Validar parámetros de API (max_tokens, temperature)

## Migration Plan

### Phase 1: Service Creation
1. Crear `openaiService.js` basado en `deepseekService.js`
2. Actualizar `apiConfig.js` con configuración de OpenAI
3. Implementar manejo de errores específico de OpenAI

### Phase 2: Integration
1. Actualizar `detectionService.js` para usar OpenAI
2. Verificar que el token logging funciona
3. Probar extracción de porcentajes con respuestas de GPT-4

### Phase 3: Testing & Validation
1. Ejecutar tests unitarios e integración
2. Validar respuestas con documentos de prueba
3. Confirmar que el formato de análisis se mantiene

### Phase 4: Environment Update
1. Actualizar variables de entorno
2. Documentar el cambio de OPENROUTER_API_KEY a OPENAI_API_KEY
3. Verificar funcionamiento en producción