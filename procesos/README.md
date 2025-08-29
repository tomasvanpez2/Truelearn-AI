# Sistema de Monitoreo de Tokens

Este sistema registra automáticamente el consumo de tokens de cada usuario cuando utiliza el detector de IA.

## Estructura de Archivos

### Logs de Usuarios
- **Ubicación**: `procesos/`
- **Formato**: `{nombre_usuario}_tokens.txt`
- **Contenido**: Registro detallado de cada solicitud con timestamps y consumo de tokens

### Reportes
- **Ubicación**: `procesos/reportes/`
- **Tipos**:
  - `reporte_diario_YYYY-MM-DD.txt`: Reporte completo del día
  - `reporte_{usuario}_YYYY-MM-DD.txt`: Reporte individual por usuario

## Cómo Funciona

1. **Registro Automático**: Cada vez que un usuario analiza un documento, el sistema registra:
   - Timestamp de la operación
   - Información del documento
   - Tokens de entrada (prompt)
   - Tokens de salida (completion)
   - Total de tokens consumidos

2. **Almacenamiento**: Los datos se guardan en archivos de texto individuales por usuario

3. **Visualización**: Puedes ver los datos a través de:
   - Dashboard web: `/tokens-dashboard.html`
   - API endpoints
   - Reportes en texto

## API Endpoints

### Estadísticas del Sistema
```
GET /api/tokens/stats
```
Devuelve estadísticas generales del sistema.

### Resumen de Todos los Usuarios
```
GET /api/tokens/summary/all
```
Lista todos los usuarios con su consumo de tokens.

### Resumen de Usuario Específico
```
GET /api/tokens/summary/:studentName
```
Obtiene el resumen de consumo de un usuario específico.

### Log Completo de Usuario
```
GET /api/tokens/log/:studentName
```
Obtiene el log completo de un usuario específico.

## Generar Reportes

### Reporte Diario
```bash
node procesos/generate-report.js
```
Genera un reporte completo con todos los usuarios del día.

### Reporte Individual
```bash
node procesos/generate-report.js --user "Nombre del Usuario"
```
Genera un reporte detallado para un usuario específico.

## Dashboard Web

Accede a `/tokens-dashboard.html` para ver:
- Estadísticas generales del sistema
- Tabla con todos los usuarios y su consumo
- Botones para ver logs individuales
- Actualización automática cada 30 segundos

## Formato de Log

Cada entrada en los archivos de log tiene este formato:
```
[2024-01-15T10:30:00.000Z] | Documento: Análisis de texto - 5to grado | Tokens de entrada: 1250 | Tokens de salida: 450 | Total de tokens: 1700 | ---
```

## Ejemplos de Uso

### Ver consumo de todos los usuarios
1. Abre tu navegador
2. Ve a `http://localhost:3001/tokens-dashboard.html`
3. Inicia sesión si es necesario

### Generar reporte diario
```bash
cd procesos
node generate-report.js
```

### Ver log de un usuario específico
```bash
cd procesos
node generate-report.js --user "Juan Pérez"
```

### Consultar via API
```bash
# Obtener estadísticas
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/tokens/stats

# Obtener todos los usuarios
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/tokens/summary/all
```

## Notas Importantes

- Los archivos de log se crean automáticamente cuando un usuario hace su primera solicitud
- Los nombres de archivo se sanitizan (espacios se convierten en guiones bajos)
- El sistema es tolerante a fallos - si no puede escribir un log, no afecta la funcionalidad principal
- Los reportes se guardan en la carpeta `procesos/reportes/`
- El dashboard requiere autenticación (token JWT)

## Mantenimiento

- Los archivos de log crecen con el tiempo - considera implementar rotación de logs
- Los reportes se acumulan en la carpeta `reportes/` - puedes limpiarlos periódicamente
- Revisa los logs del servidor para detectar errores en el registro de tokens