# Implementation Plan

- [x] 1. Actualizar configuración de API para OpenAI





  - Modificar src/config/apiConfig.js para cambiar baseUrl a OpenAI
  - Cambiar modelo de 'qwen/qwen3-235b-a22b:free' a 'gpt-4'
  - Actualizar apiKey para usar process.env.OPENAI_API_KEY
  - Mantener todas las funciones buildPrompt y buildQuestionPrompt sin cambios
  - _Requirements: 1.3, 3.1, 3.2_

- [x] 2. Crear servicio OpenAI basado en DeepseekService





  - Crear src/services/openaiService.js copiando la estructura de deepseekService.js
  - Actualizar constructor para usar configuración de OpenAI
  - Mantener métodos analyzeText y generateQuestions con la misma interfaz
  - Conservar el uso de apiConfig.buildPrompt() y apiConfig.buildQuestionPrompt()
  - Mantener el logging de tokens con tokenLogger.logTokenUsage()
  - _Requirements: 1.1, 2.1, 5.1_

- [x] 3. Implementar manejo de errores específico de OpenAI





  - Agregar manejo específico para errores 401 (API key inválida)
  - Implementar retry con exponential backoff para errores 429 (rate limiting)
  - Crear mensajes de error claros para errores 400 (bad request)
  - Mantener logging de errores existente
  - _Requirements: 4.2_

- [x] 4. Actualizar DetectionService para usar OpenAI





  - Cambiar import de deepseekService a openaiService en src/services/detectionService.js
  - Actualizar referencia en constructor de DetectionService
  - Verificar que extractAIPercentage funciona con respuestas de GPT-4
  - Mantener toda la lógica de análisis y tracking existente
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 5. Crear tests unitarios para OpenAIService





  - Escribir tests para analyzeText con mocks de fetch
  - Crear tests para generateQuestions con respuestas simuladas
  - Probar manejo de errores específicos de OpenAI
  - Verificar que processResponse funciona correctamente
  - _Requirements: 4.1_

- [x] 6. Verificar integración completa del sistema





  - Probar que DetectionService.analyzeFile funciona con OpenAI
  - Verificar que el logging de tokens funciona correctamente
  - Confirmar que la extracción de porcentajes de IA funciona
  - Validar que generateQuestions mantiene la funcionalidad
  - _Requirements: 2.2, 2.3, 2.4_