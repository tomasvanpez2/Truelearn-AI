document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('upload-form');
    
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Verificar que se haya seleccionado un archivo
            const fileInput = document.getElementById('document-upload');
            if (!fileInput.files.length) {
                alert('Por favor, seleccione un archivo para analizar');
                return;
            }
            
            // Obtener el token de autenticación
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                alert('Sesión expirada. Por favor, inicie sesión nuevamente.');
                window.location.href = '/index.html';
                return;
            }
            
            // Crear FormData y añadir el archivo
            const formData = new FormData();
            formData.append('document', fileInput.files[0]);
            
            // Añadir información académica del estudiante
            formData.append('studentName', document.getElementById('student-name').value);
            formData.append('studentGrade', document.getElementById('student-grade').value);
            formData.append('attendanceHours', document.getElementById('attendance-hours').value);
            formData.append('totalHours', document.getElementById('total-hours').value);
            
            // Recopilar temas de clase
            const topicInputs = document.querySelectorAll('input[name="topics[]"]');
            const topics = [];
            topicInputs.forEach(input => {
                if (input.value.trim()) {
                    topics.push(input.value.trim());
                }
            });
            formData.append('topics', JSON.stringify(topics));
            
            // Añadir contexto adicional
            formData.append('context', document.getElementById('context').value);
            
            // Verificar tokens antes del análisis
            checkTokensBeforeAnalysis(authToken)
            .then(canAnalyze => {
                if (!canAnalyze) {
                    return; // La función ya mostró el mensaje de error
                }
                
                // Mostrar indicador de carga
                const submitButton = uploadForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.textContent = 'Analizando...';
                submitButton.disabled = true;
                
                // Enviar el archivo al servidor con el token
                fetch('/api/analysis/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    // Restaurar el botón
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                    
                    if (data.success) {
                        alert('Documento analizado correctamente.');
                        // Mostrar los resultados del análisis en la página
                        displayAnalysisResults(data.analysis);
                        
                        // Actualizar estado de tokens después del análisis
                        updateTokenDisplay(authToken);
                    } else if (data.tokenExhausted) {
                        // Mostrar mensaje específico de tokens agotados
                        showTokenExhaustedAlert(data);
                    } else {
                        alert(data.message || 'Error al analizar el documento');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error al conectar con el servidor');
                    
                    // Restaurar el botón
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                });
            });
        });
    }
});

// Función para verificar tokens antes del análisis
async function checkTokensBeforeAnalysis(authToken) {
    try {
        const response = await fetch('/api/platform/tokens/status', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.tokenStatus) {
            const tokenStatus = data.tokenStatus;
            
            // Actualizar display de tokens si existe
            updateTokenDisplayInfo(tokenStatus);
            
            if (!tokenStatus.canAnalyze) {
                showTokenExhaustedAlert({
                    message: tokenStatus.message,
                    details: {
                        tokensUsados: tokenStatus.used,
                        limite: tokenStatus.limit,
                        tokensRestantes: tokenStatus.remaining,
                        porcentaje: tokenStatus.percentage
                    }
                });
                return false;
            }
            
            // Mostrar advertencia si está cerca del límite
            if (tokenStatus.status === 'warning' || tokenStatus.status === 'critical') {
                const proceed = confirm(`${tokenStatus.message}\n\nTokens usados: ${tokenStatus.used.toLocaleString()}/${tokenStatus.limit.toLocaleString()}\nTokens restantes: ${tokenStatus.remaining.toLocaleString()}\n\n¿Deseas continuar con el análisis?`);
                return proceed;
            }
            
            return true;
        } else {
            console.warn('No se pudo verificar el estado de tokens');
            return true; // Permitir análisis si no se puede verificar
        }
    } catch (error) {
        console.error('Error verificando tokens:', error);
        return true; // Permitir análisis si hay error en la verificación
    }
}

// Función para mostrar alerta de tokens agotados
function showTokenExhaustedAlert(data) {
    const details = data.details || {};
    const message = `
🚫 TOKENS AGOTADOS

${data.message || 'No tienes suficientes tokens para realizar este análisis'}

📊 Detalles de tu cuenta:
• Tokens usados: ${(details.tokensUsados || 0).toLocaleString()}
• Límite total: ${(details.limite || 0).toLocaleString()}
• Tokens restantes: ${(details.tokensRestantes || 0).toLocaleString()}
• Porcentaje usado: ${(details.porcentaje || 0).toFixed(1)}%

💡 Para continuar usando el sistema, contacta con tu administrador para aumentar tu límite de tokens.
    `;
    
    alert(message);
}

// Función para actualizar el display de tokens en la interfaz
function updateTokenDisplayInfo(tokenStatus) {
    // Buscar elementos de display de tokens en la página
    const tokenDisplay = document.getElementById('token-status');
    const tokenProgress = document.getElementById('token-progress');
    const tokenText = document.getElementById('token-text');
    
    if (tokenDisplay) {
        let statusClass = 'token-normal';
        if (tokenStatus.status === 'warning') statusClass = 'token-warning';
        if (tokenStatus.status === 'critical') statusClass = 'token-critical';
        if (tokenStatus.status === 'exhausted') statusClass = 'token-exhausted';
        
        tokenDisplay.className = `token-status ${statusClass}`;
    }
    
    if (tokenProgress) {
        tokenProgress.style.width = `${Math.min(tokenStatus.percentage, 100)}%`;
        tokenProgress.className = `token-progress-bar ${tokenStatus.status}`;
    }
    
    if (tokenText) {
        tokenText.textContent = `${tokenStatus.used.toLocaleString()}/${tokenStatus.limit.toLocaleString()} tokens (${tokenStatus.percentage.toFixed(1)}%)`;
    }
}

// Función para actualizar el display después del análisis
async function updateTokenDisplay(authToken) {
    try {
        const response = await fetch('/api/platform/tokens/status', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        if (data.success && data.tokenStatus) {
            updateTokenDisplayInfo(data.tokenStatus);
        }
    } catch (error) {
        console.error('Error actualizando display de tokens:', error);
    }
}