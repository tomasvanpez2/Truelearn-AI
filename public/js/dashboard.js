document.addEventListener('DOMContentLoaded', function() {
    // Función para verificar si el token es válido
    function isValidToken(token) {
        if (!token) return false;
        
        // Verificar si el token ha expirado (decodificando sin verificar)
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const payload = JSON.parse(jsonPayload);
            const expirationTime = payload.exp * 1000; // Convertir a milisegundos
            
            return Date.now() < expirationTime;
        } catch (e) {
            console.error('Error al decodificar token:', e);
            return false;
        }
    }
    // Verificar si el usuario está autenticado
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const selectedCourseName = localStorage.getItem('selectedCourseName');
    const selectedStudentName = localStorage.getItem('selectedStudentName');

    // Eliminar la verificación de acceso directo para evitar doble inicio de sesión
    
    // Verificar si el token existe y es válido
    if (!authToken || !isValidToken(authToken)) {
        // Limpiar el token por seguridad
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        // Redirigir al login
        window.location.href = '/index.html';
        return;
    }
    
    const welcomeSection = document.querySelector('.welcome-section h2');
    if (welcomeSection && selectedStudentName && selectedCourseName) {
        welcomeSection.textContent = `Bienvenido al dashboard de ${selectedStudentName} del curso ${selectedCourseName}`;

        // Rellenar los campos del formulario
        const studentNameInput = document.getElementById('student-name');
        const studentGradeInput = document.getElementById('student-grade');

        if (studentNameInput) {
            studentNameInput.value = selectedStudentName;
        }
        if (studentGradeInput) {
            studentGradeInput.value = selectedCourseName;
        }
        
        const backButton = document.createElement('button');
        backButton.textContent = 'Cambiar Estudiante/Curso';
        backButton.className = 'btn btn-secondary';
        backButton.style.marginLeft = '20px';
        backButton.onclick = () => window.location.href = '/epanel.html';
        welcomeSection.parentNode.insertBefore(backButton, welcomeSection.nextSibling);
    }
    
    // Mejorar la experiencia del input de archivo
    const fileInput = document.getElementById('document-upload');
    const fileLabel = document.querySelector('.custom-file-label');
    
    if (fileInput && fileLabel) {
        fileInput.addEventListener('change', function() {
            if (fileInput.files.length > 0) {
                const fileName = fileInput.files[0].name;
                fileLabel.textContent = fileName;
                fileLabel.parentElement.classList.add('file-selected');
            } else {
                fileLabel.textContent = 'Seleccionar archivo';
                fileLabel.parentElement.classList.remove('file-selected');
            }
        });
    }

    // Mostrar el nombre de usuario y configurar la interfaz según el rol
    const usernameDisplay = document.getElementById('username-display');
    const adminSection = document.getElementById('admin-section');
    
    if (usernameDisplay) {
        const username = localStorage.getItem('username');
        usernameDisplay.textContent = username || 'Usuario';
    }

    // Mostrar/ocultar sección de administración según el rol
    if (adminSection) {
        if (userRole === 'admin') {
            adminSection.style.display = 'block';
            initializeAdminInterface();
            loadAdminStats();
        } else {
            adminSection.style.display = 'none';
        }
    }

    // Configurar el botón de logout
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Eliminar datos de autenticación
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('username');
            localStorage.removeItem('selectedCourse');
            localStorage.removeItem('selectedSubject');
            localStorage.removeItem('selectedStudent');
            localStorage.removeItem('selectedStudentName');
            localStorage.removeItem('selectedCourseName');
            localStorage.removeItem('selectedSubjectName');
            // Redirigir al login
            window.location.href = '/index.html';
        });
    }

    // Configurar el botón de añadir tema y cargar temas del curso
    const addTopicBtn = document.getElementById('add-topic-btn');
    const topicsContainer = document.getElementById('topics-container');

    // Función para crear un input de tema
    function createTopicInput(value = '') {
        const topicItem = document.createElement('div');
        topicItem.className = 'topic-item';
        const topicInput = document.createElement('input');
        topicInput.type = 'text';
        topicInput.name = 'topics[]';
        topicInput.placeholder = 'Ingrese un tema expuesto en clase';
        topicInput.value = value;
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-topic-btn';
        removeBtn.textContent = 'X';
        removeBtn.addEventListener('click', function() {
            topicsContainer.removeChild(topicItem);
        });
        topicItem.appendChild(topicInput);
        topicItem.appendChild(removeBtn);
        return topicItem;
    }

    // Cargar temas del admin actual
    function loadCourseTopics() {
        const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!authToken) return;
        
        fetch('/api/themes/', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && Array.isArray(data.themes)) {
                topicsContainer.innerHTML = '';
                // Si hay temas guardados, mostrarlos
                if (data.themes.length > 0) {
                    data.themes.forEach(theme => {
                        topicsContainer.appendChild(createTopicInput(theme.name));
                    });
                } else {
                    // Si no hay temas, mostrar un input vacío
                    topicsContainer.appendChild(createTopicInput(''));
                }
            } else {
                // Si hay error o no hay temas, mostrar un input vacío
                topicsContainer.innerHTML = '';
                topicsContainer.appendChild(createTopicInput(''));
            }
        })
        .catch(error => {
            console.error('Error cargando temas:', error);
            // En caso de error, mostrar un input vacío
            topicsContainer.innerHTML = '';
            topicsContainer.appendChild(createTopicInput(''));
        });
    }

    if (addTopicBtn && topicsContainer) {
        addTopicBtn.addEventListener('click', function() {
            topicsContainer.appendChild(createTopicInput(''));
        });
        // Cargar los temas al cargar la página
        loadCourseTopics();
    }

    // Configurar el formulario de subida de archivos
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('document-upload');
            if (!fileInput.files.length) {
                alert('Por favor, seleccione un archivo para analizar');
                return;
            }

            const formData = new FormData();
            formData.append('document', fileInput.files[0]);

            // Enviar el archivo al servidor
            console.log('🔍 [DEBUG] Enviando archivo al servidor...');
            fetch('/api/analysis/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            })
            .then(response => {
                console.log('🔍 [DEBUG] Respuesta HTTP status:', response.status);
                console.log('🔍 [DEBUG] Respuesta OK:', response.ok);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('🔍 [DEBUG] Datos recibidos:', data);
                if (data.success) {
                    alert('Archivo subido correctamente. Iniciando análisis...');
                    // Aquí podríamos redirigir a una página de resultados
                } else {
                    alert(data.message || 'Error al subir el archivo');
                }
            })
            .catch(error => {
                console.error('❌ [DEBUG] Error en fetch:', error);
                console.error('❌ [DEBUG] Tipo de error:', error.constructor.name);
                alert('Error al conectar con el servidor: ' + error.message);
            });
        });
    }

    // Funciones de administración de usuarios
    function initializeAdminInterface() {
        const addUserBtn = document.getElementById('add-user-btn');
        const userModal = document.getElementById('user-modal');
        const userForm = document.getElementById('user-form');
        const usersTableBody = document.getElementById('users-table-body');

        // Solo inicializar si los elementos existen
        if (!addUserBtn || !userModal || !userForm || !usersTableBody) {
            console.log('Elementos de gestión de usuarios no encontrados, saltando inicialización');
            return;
        }

        // Cargar lista de usuarios
        loadUsers();

        // Configurar modal de usuario
        addUserBtn.addEventListener('click', () => {
            // Comprobar el número de usuarios antes de abrir el modal
            if (usersTableBody.rows.length >= 6) {
                alert('Se ha alcanzado el límite de 6 usuarios (1 admin + 5 usuarios normales).');
                return;
            }
            userModal.style.display = 'block';
            userForm.reset();
            userForm.dataset.mode = 'create';
        });

        // Manejar envío del formulario
        userForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(userForm);
            const userData = {
                username: formData.get('username'),
                role: formData.get('role'),
                active: formData.get('active') === 'true'
            };

            const password = formData.get('password');
            if (password) {
                userData.password = password;
            }

            const mode = userForm.dataset.mode;
            const userId = userForm.dataset.userId;
            
            let url = '/api/users';
            let method = 'POST';

            if (mode === 'edit') {
                url = `/api/users/${userId}`;
                method = 'PUT';
            }

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(userData)
                });

                if (response.ok) {
                    closeUserModal();
                    loadUsers();
                } else {
                    const error = await response.json();
                    alert(error.message || 'Error al guardar usuario');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al conectar con el servidor');
            }
        });
    }

    let users = []; // Declarar users en un ámbito más alto

    function loadUsers() {
        const usersTableBody = document.getElementById('users-table-body');
        const addUserBtn = document.getElementById('add-user-btn');

        // Verificar si los elementos existen
        if (!usersTableBody || !addUserBtn) {
            console.log('Elementos de tabla de usuarios no encontrados');
            return;
        }

        fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success === false) {
                throw new Error(data.message || 'Error en la respuesta del servidor');
            }
            users = data.users || data; // Manejar tanto el formato nuevo como el anterior
            usersTableBody.innerHTML = '';
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.username}</td>
                    <td>${user.role}</td>
                    <td>${user.active ? 'Activo' : 'Inactivo'}</td>
                    <td class="user-actions">
                        <button class="btn-edit" onclick="editUser('${user.id}')">Editar</button>
                        <button class="btn-delete" onclick="deleteUser('${user.id}')">Eliminar</button>
                    </td>
                `;
                usersTableBody.appendChild(row);
            });

            // Desactivar el botón de añadir si se ha alcanzado el límite
            if (users.length >= 6) {
                addUserBtn.disabled = true;
                addUserBtn.title = 'Límite de usuarios alcanzado (máximo 6)';
            } else {
                addUserBtn.disabled = false;
                addUserBtn.title = '';
            }
        })
        .catch(error => {
            console.error('Error cargando usuarios:', error);
            usersTableBody.innerHTML = '<tr><td colspan="4">Error al cargar usuarios. Verifique la consola para más detalles.</td></tr>';
        });
    }

    function editUser(userId) {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        const userModal = document.getElementById('user-modal');
        const userForm = document.getElementById('user-form');
        document.getElementById('modal-title').innerText = 'Editar Usuario';
        document.getElementById('modal-title').innerText = 'Editar Usuario';
        document.getElementById('username').value = user.username;
        // La contraseña no se debe pre-rellenar por seguridad
        document.getElementById('password').value = ''; 
        document.getElementById('password').placeholder = 'Dejar en blanco para no cambiar';
        document.getElementById('role').value = user.role;
        document.getElementById('active').value = user.active;

        userForm.dataset.mode = 'edit';
        userForm.dataset.userId = userId;
        userModal.style.display = 'block';
    }

    function deleteUser(userId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
            return;
        }

        fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => {
            if (response.ok) {
                loadUsers();
            } else {
                alert('Error al eliminar usuario');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al conectar con el servidor');
        });
    }

    function closeUserModal() {
        document.getElementById('user-modal').style.display = 'none';
    }

    // Cargar estadísticas del admin
    async function loadAdminStats() {
        try {
            const response = await fetch('/api/platform/stats', {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                displayAdminStats(data.stats);
            } else {
                console.error('Error cargando estadísticas');
                displayAdminStats(null);
            }
        } catch (error) {
            console.error('Error:', error);
            displayAdminStats(null);
        }
    }

    // Mostrar estadísticas del admin
    function displayAdminStats(stats) {
        const statsContent = document.getElementById('admin-stats-content');
        
        if (!stats) {
            statsContent.innerHTML = '<p>Error cargando estadísticas</p>';
            return;
        }
        
        statsContent.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-number">${stats.teachers.total}</div>
                    <div class="stat-label">Profesores Total</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.teachers.active}</div>
                    <div class="stat-label">Profesores Activos</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.courses.total}</div>
                    <div class="stat-label">Cursos</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.themes.total}</div>
                    <div class="stat-label">Temas</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.tokens.used}/${stats.tokens.limit}</div>
                    <div class="stat-label">Tokens Usados</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.requests.count}/${stats.requests.limit}</div>
                    <div class="stat-label">Requests</div>
                </div>
            </div>
        `;
    }

    // Exponer funciones necesarias globalmente
    window.editUser = editUser;
    window.deleteUser = deleteUser;
    window.closeUserModal = closeUserModal;
});