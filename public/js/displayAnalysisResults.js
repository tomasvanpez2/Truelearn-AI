/**
 * Muestra los resultados del análisis en la interfaz de usuario
 * @param {Object} analysisData - Datos del análisis recibidos del servidor
 */
function displayAnalysisResults(analysisData) {
    // Crear o limpiar el contenedor de resultados
    let resultsContainer = document.getElementById('analysis-results');
    
    // Si no existe el contenedor, crearlo
    if (!resultsContainer) {
        resultsContainer = document.createElement('section');
        resultsContainer.id = 'analysis-results';
        resultsContainer.className = 'analysis-results-section';
        
        // Insertar después de la sección de subida
        const uploadSection = document.querySelector('.upload-section');
        if (uploadSection && uploadSection.parentNode) {
            uploadSection.parentNode.insertBefore(resultsContainer, uploadSection.nextSibling);
        } else {
            // Si no se encuentra la sección de subida, añadir al final del contenedor principal
            const container = document.querySelector('.container');
            if (container) {
                container.appendChild(resultsContainer);
            }
        }
    } else {
        // Limpiar el contenedor si ya existe
        resultsContainer.innerHTML = '';
    }
    
    // Crear el título de la sección
    const title = document.createElement('h3');
    title.textContent = 'Resultados del Análisis';
    resultsContainer.appendChild(title);
    
    // Crear el contenedor para los detalles del análisis
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'analysis-details';
    
    // Verificar que analysisData tenga la estructura esperada
    if (analysisData && analysisData.analysis && analysisData.analysis.content) {
        // Extraer el contenido del análisis
        const content = analysisData.analysis.content;
        
        // Extraer las tres secciones del contenido
        const sections = extractSections(content);
        
        // Crear sección de probabilidad
        const probabilitySection = createSection(
            'Probabilidad de IA', 
            formatProbabilitySection(sections.probability),
            'probability-section'
        );
        detailsContainer.appendChild(probabilitySection);
        
        // Crear sección de referencias específicas
        const referencesSection = createSection(
            'Referencias Específicas', 
            formatReferencesSection(sections.references),
            'references-section'
        );
        detailsContainer.appendChild(referencesSection);
        
        // Crear sección de preguntas para el estudiante
        const questionsSection = createSection(
            'Preguntas para el Estudiante', 
            formatQuestionsSection(sections.questions),
            'questions-section'
        );
        detailsContainer.appendChild(questionsSection);
        
        // Mostrar información de uso si está disponible
        if (analysisData.analysis.usage) {
            const usageInfo = document.createElement('p');
            usageInfo.className = 'usage-info';
            usageInfo.textContent = `Tokens utilizados: ${JSON.stringify(analysisData.analysis.usage)}`;
            detailsContainer.appendChild(usageInfo);
        }
    } else {
        // Mostrar mensaje de error si los datos no tienen la estructura esperada
        const errorMessage = document.createElement('p');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'No se pudieron cargar los resultados del análisis. Formato de datos inesperado.';
        detailsContainer.appendChild(errorMessage);
        
        // Mostrar los datos recibidos para depuración
        const debugInfo = document.createElement('pre');
        debugInfo.className = 'debug-info';
        debugInfo.textContent = JSON.stringify(analysisData, null, 2);
        detailsContainer.appendChild(debugInfo);
    }
    
    // Añadir el contenedor de detalles a la sección de resultados
    resultsContainer.appendChild(detailsContainer);
    
    // Hacer scroll hasta los resultados
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Extrae las tres secciones del contenido del análisis
 * @param {string} content - Contenido completo del análisis
 * @returns {Object} - Objeto con las tres secciones separadas
 */
function extractSections(content) {
    // Inicializar objeto de secciones
    const sections = {
        probability: '',
        references: '',
        questions: ''
    };
    
    // Buscar las secciones en el contenido
    const probabilityMatch = content.match(/SECCIÓN 1 - PROBABILIDAD DE IA:(.*?)(?=SECCIÓN 2|$)/s);
    const referencesMatch = content.match(/SECCIÓN 2 - REFERENCIAS ESPECÍFICAS:(.*?)(?=SECCIÓN 3|$)/s);
    const questionsMatch = content.match(/SECCIÓN 3 - PREGUNTAS PARA EL ESTUDIANTE:(.*?)$/s);
    
    // Asignar contenido a cada sección si se encontró
    if (probabilityMatch && probabilityMatch[1]) {
        sections.probability = probabilityMatch[1].trim();
    }
    
    if (referencesMatch && referencesMatch[1]) {
        sections.references = referencesMatch[1].trim();
    }
    
    if (questionsMatch && questionsMatch[1]) {
        sections.questions = questionsMatch[1].trim();
    }
    
    // Si no se encontraron las secciones, intentar dividir el contenido por secciones genéricas
    if (!sections.probability && !sections.references && !sections.questions) {
        const parts = content.split(/\n\s*\n/);
        if (parts.length >= 3) {
            sections.probability = parts[0];
            sections.references = parts[1];
            sections.questions = parts.slice(2).join('\n\n');
        } else {
            // Si no se puede dividir, mostrar todo el contenido en la primera sección
            sections.probability = content;
        }
    }
    
    return sections;
}

/**
 * Crea una sección de resultados con título y contenido
 * @param {string} title - Título de la sección
 * @param {string} content - Contenido de la sección
 * @param {string} className - Clase CSS adicional para la sección
 * @returns {HTMLElement} - Elemento de sección creado
 */
function createSection(title, content, className = '') {
    const section = document.createElement('div');
    section.className = `result-section ${className}`;
    
    const sectionTitle = document.createElement('h4');
    sectionTitle.textContent = title;
    section.appendChild(sectionTitle);
    
    const sectionContent = document.createElement('div');
    sectionContent.className = 'section-content';
    sectionContent.innerHTML = content.replace(/\n/g, '<br>');
    section.appendChild(sectionContent);
    
    return section;
}

/**
 * Formatea el contenido de la sección de probabilidad
 * @param {string} content - Contenido de la sección de probabilidad
 * @returns {string} - Contenido formateado en HTML
 */
function formatProbabilitySection(content) {
    // Extraer el porcentaje de probabilidad si existe
    const percentageMatch = content.match(/(\d+(\.\d+)?%?)/i);
    let formattedContent = content;
    
    if (percentageMatch && percentageMatch[1]) {
        const percentage = percentageMatch[1];
        const percentageValue = parseFloat(percentage);
        
        // Crear barra de porcentaje
        const percentageBar = `
            <div class="percentage-indicator">
                <div class="percentage-bar">
                    <div class="percentage-fill" style="width: ${percentageValue}%"></div>
                </div>
                <span class="percentage-value">${percentage}</span>
            </div>
        `;
        
        // Resaltar el porcentaje en el texto
        formattedContent = formattedContent.replace(/(\d+(\.\d+)?%?)/i, 
            `<strong class="probability">${percentage}</strong>`);
        
        // Añadir la barra de porcentaje al contenido
        formattedContent += percentageBar;
    }
    
    // Resaltar nivel de confianza si existe
    formattedContent = formattedContent.replace(/Confianza:\s*(Alta|Media|Baja)/gi, 
        'Confianza: <strong class="confidence">$1</strong>');
    
    return formattedContent;
}

/**
 * Formatea el contenido de la sección de referencias
 * @param {string} content - Contenido de la sección de referencias
 * @returns {string} - Contenido formateado en HTML
 */
function formatReferencesSection(content) {
    // Convertir referencias a lista si no lo están ya
    if (!content.includes('<li>')) {
        const lines = content.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 1) {
            content = '<ul>' + 
                lines.map(line => `<li>${line}</li>`).join('') + 
                '</ul>';
        }
    }
    
    // Resaltar menciones de párrafos y versos
    content = content.replace(/(párrafo|parrafo|verso)\s*(\d+)/gi, 
        '<span class="reference-highlight">$1 $2</span>');
    
    return content;
}

/**
 * Formatea el contenido de la sección de preguntas
 * @param {string} content - Contenido de la sección de preguntas
 * @returns {string} - Contenido formateado en HTML
 */
function formatQuestionsSection(content) {
    // Convertir preguntas a lista numerada si no lo están ya
    if (!content.includes('<li>')) {
        const lines = content.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 1) {
            content = '<ol>' + 
                lines.map(line => `<li>${line}</li>`).join('') + 
                '</ol>';
        }
    }
    
    return content;
}