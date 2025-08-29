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
    }
});