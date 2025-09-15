// Gestión de profesores - JavaScript

let currentTeacherId = null;
let isEditMode = false;

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadTeachers();
    setupEventListeners();
});

// Verificar autenticación
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');
    
    if (!token || userRole !== 'admin') {
        window.location.href = '/index.html';
        return;
    }
    
    document.getElementById('username-display').textContent = username || 'Admin';
}

// Configurar event listeners
function setupEventListeners() {
    // Botones principales
    document.getElementById('add-teacher-btn').addEventListener('click', openAddTeacherModal);
    document.getElementById('refresh-teachers-btn').addEventListener('click', loadTeachers);
    document.getElementById('logout-button').addEventListener('click', logout);
    
    // Formulario de profesor
    document.getElementById('teacher-form').addEventListener('submit', handleTeacherSubmit);
    
    // Cerrar modales con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeTeacherModal();
            closeDeleteModal();
        }
    });
    // Funcionalidad de alternancia de visibilidad de contraseña
    setupPasswordToggles();
}

// Cargar lista de profesores
async function loadTeachers() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/admin/teachers', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayTeachers(data.teachers);
        } else {
            showError('Error cargando profesores: ' + data.message);
            displayTeachers([]);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al cargar profesores');
        displayTeachers([]);
    }
}

// Mostrar profesores en la tabla
function displayTeachers(teachers) {
    const tbody = document.getElementById('teachers-table-body');
    
    if (teachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty">No hay profesores registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = teachers.map(teacher => `
        <tr>
            <td>${escapeHtml(teacher.name)}</td>
            <td>${escapeHtml(teacher.email)}</td>
            <td>${escapeHtml(teacher.username)}</td>
            <td>${escapeHtml(teacher.subject || 'No especificada')}</td>
            <td>
                <span class="status-badge ${teacher.active ? 'active' : 'inactive'}">
                    ${teacher.active ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>${formatDate(teacher.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="openEditTeacherModal('${teacher.id}')" title="Editar">
                        ✎
                    </button>
                    <button class="action-btn delete" onclick="openDeleteModal('${teacher.id}', '${escapeHtml(teacher.name)}')" title="Eliminar">
                        ×
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Abrir modal para agregar profesor
function openAddTeacherModal() {
    isEditMode = false;
    currentTeacherId = null;
    
    document.getElementById('modal-title').textContent = 'Agregar Profesor';
    document.getElementById('submit-btn').textContent = 'Crear Profesor';
    document.getElementById('password-group').style.display = 'block';
    document.getElementById('active-group').style.display = 'none';
    document.getElementById('teacher-password').required = true;
    
    // Limpiar formulario
    document.getElementById('teacher-form').reset();
    
    document.getElementById('teacher-modal').style.display = 'flex';
}

// Abrir modal para editar profesor
async function openEditTeacherModal(teacherId) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/admin/teachers/${teacherId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const teacher = data.teacher;
            isEditMode = true;
            currentTeacherId = teacherId;
            
            document.getElementById('modal-title').textContent = 'Editar Profesor';
            document.getElementById('submit-btn').textContent = 'Actualizar Profesor';
            document.getElementById('password-group').style.display = 'none';
            document.getElementById('active-group').style.display = 'block';
            document.getElementById('teacher-password').required = false;
            
            // Llenar formulario con datos del profesor
            document.getElementById('teacher-name').value = teacher.name;
            document.getElementById('teacher-email').value = teacher.email;
            document.getElementById('teacher-username').value = teacher.username;
            document.getElementById('teacher-subject').value = teacher.subject || '';
            document.getElementById('teacher-active').value = teacher.active.toString();
            
            document.getElementById('teacher-modal').style.display = 'flex';
        } else {
            showError('Error cargando datos del profesor: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error cargando datos del profesor');
    }
}

// Manejar envío del formulario
async function handleTeacherSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const teacherData = {
        name: formData.get('name'),
        email: formData.get('email'),
        username: formData.get('username'),
        subject: formData.get('subject')
    };
    
    if (!isEditMode) {
        teacherData.password = formData.get('password');
    } else {
        teacherData.active = formData.get('active') === 'true';
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const url = isEditMode 
            ? `/api/admin/teachers/${currentTeacherId}`
            : '/api/admin/teachers';
        const method = isEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(teacherData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(data.message);
            closeTeacherModal();
            loadTeachers();
        } else {
            showError(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

// Abrir modal de confirmación para eliminar
function openDeleteModal(teacherId, teacherName) {
    currentTeacherId = teacherId;
    document.getElementById('delete-teacher-name').textContent = teacherName;
    document.getElementById('delete-modal').style.display = 'flex';
    
    // Configurar botón de confirmación
    document.getElementById('confirm-delete-btn').onclick = () => deleteTeacher(teacherId);
}

// Eliminar profesor
async function deleteTeacher(teacherId) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/admin/teachers/${teacherId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(data.message);
            closeDeleteModal();
            loadTeachers();
        } else {
            showError(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al eliminar profesor');
    }
}

// Cerrar modal de profesor
function closeTeacherModal() {
    document.getElementById('teacher-modal').style.display = 'none';
    document.getElementById('teacher-form').reset();
    currentTeacherId = null;
    isEditMode = false;
}

// Cerrar modal de eliminación
function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    currentTeacherId = null;
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    window.location.href = '/index.html';
}

// Utilidades
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showSuccess(message) {
    // Crear notificación de éxito
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d4edda;
        color: #155724;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        border: 1px solid #c3e6cb;
        z-index: 1001;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    // Crear notificación de error
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f8d7da;
        color: #721c24;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        border: 1px solid #f5c6cb;
        z-index: 1001;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
// Configurar alternancia de visibilidad de contraseña
function setupPasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');

    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);

            if (input.type === 'password') {
                input.type = 'text';
                this.classList.add('show');
            } else {
                input.type = 'password';
                this.classList.remove('show');
            }
        });
    });
}
        notification.remove();
    }, 5000);
}