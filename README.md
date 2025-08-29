# IA Co. para Trabajos Académicos

Sistema para la detección de contenido generado por Inteligencia Artificial en trabajos académicos. Esta herramienta permite analizar documentos en diferentes formatos para determinar la probabilidad de que hayan sido creados utilizando herramientas de IA.

## Características

- Análisis de textos para detectar contenido generado por IA
- Soporte para múltiples formatos de archivo (TXT, DOCX, XLSX)
- Interfaz web intuitiva
- Generación de preguntas para verificar la autoría
- Panel de administración para gestionar usuarios

## Requisitos previos

- Node.js (versión 14.0.0 o superior)
- NPM (gestor de paquetes de Node.js)

## Instalación

1. Clona o descarga este repositorio en tu equipo local

2. Navega hasta la carpeta del proyecto
   ```
   cd Detector_de_IA
   ```

3. Instala las dependencias necesarias
   ```
   npm install
   ```

## Configuración

1. Navega al archivo `.env` en la raíz del proyecto. Esto es lo que encontraras.
   ```
   # Configuración del servidor
   PORT=3000

   # Configuración de OpenRouter API
   OPENROUTER_API_KEY=tu_api_key_aquí

   # Configuración de seguridad
   JWT_SECRET=tu_clave_secreta_aquí
   JWT_EXPIRATION=24h

   # Configuración de archivos
   MAX_FILE_SIZE=1000mb
   UPLOAD_DIR=uploads

   # Configuración de análisis
   MIN_TEXT_LENGTH=10
   MAX_TEXT_LENGTH=1000000
   ```

2. Reemplaza los valores de ejemplo con tus propias credenciales:
   - `OPENROUTER_API_KEY`: Obtén una clave API de [OpenRouter](https://openrouter.ai/)
   - `JWT_SECRET`:Deja este valor en predeterminado.
  

## Ejecución

### Modo desarrollo

```
npm run dev
```

### Modo producción

```
node src/server.js
```

Una vez iniciado, el servidor estará disponible en `http://localhost:3000` (o el puerto que hayas configurado en el archivo .env).

## Uso

1. Accede a la aplicación a través de tu navegador web
2. Inicia sesión con tus credenciales
3. Sube un documento para análisis
4. Configura los parámetros de contexto académico
5. Visualiza los resultados del análisis

## Formatos de archivo soportados

- Archivos de texto (.txt)
- Documentos de Word (.docx)
- Hojas de cálculo Excel (.xlsx)

## Tecnologías utilizadas

- Node.js y Express para el backend
- HTML, CSS y JavaScript vanilla para el frontend
- API de OpenRouter con modelo Gemini para el análisis de IA
- JWT para autenticación
- Multer para gestión de archivos
- Mammoth y XLSX para procesamiento de documentos
