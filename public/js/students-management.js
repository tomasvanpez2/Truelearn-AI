// Gestión de estudiantes - JavaScript

let currentStudentId = null;
let isEditMode = false;
let students = []; // Almacenar estudiantes localmente

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadStudents();
    setupEventListeners();
});

// Verificar autenticación
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');

    if (!token || (userRole !== 'admin' && userRole !== 'teacher')) {
        window.location.href = '/index.html';
        return;
    }

    document.getElementById('username-display').textContent = username || 'Usuario';
}

// Configurar event listeners
function setupEventListeners() {
    // Botones principales
    document.getElementById('add-student-btn').addEventListener('click', openAddStudentModal);
    document.getElementById('refresh-students-btn').addEventListener('click', loadStudents);
    document.getElementById('logout-button').addEventListener('click', logout);

    // Formulario de estudiante
    document.getElementById('student-form').addEventListener('submit', handleStudentSubmit);

    // Cerrar modales con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeStudentModal();
            closeDeleteModal();
        }
    });
}

// Cargar lista de estudiantes
async function loadStudents() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/students', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data) {
            students = data; // Guardar datos localmente
            displayStudents(students);
        } else {
            showError('Error cargando estudiantes: ' + (data.message || 'Error desconocido'));
            // No vaciar la tabla si ya hay datos locales
            if (students.length === 0) {
                displayStudents([]);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al cargar estudiantes');
        displayStudents([]);
    }
}

// Mostrar estudiantes en la tabla
function displayStudents(students) {
    const tbody = document.getElementById('students-table-body');

    if (!students || students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty">No hay estudiantes registrados</td></tr>';
        return;
    }

    tbody.innerHTML = students.map(student => `
        <tr>
            <td>${escapeHtml(student.name)}</td>
            <td>${student.course}° Grado</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="openEditStudentModal('${student.id}')" title="Editar">
                        ✎
                    </button>
                    <button class="action-btn delete" onclick="openDeleteModal('${student.id}', '${escapeHtml(student.name)}')" title="Eliminar">
                        ×
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Abrir modal para agregar estudiante
function openAddStudentModal() {
    isEditMode = false;
    currentStudentId = null;

    document.getElementById('modal-title').textContent = 'Agregar Estudiante';
    document.getElementById('submit-btn').textContent = 'Crear Estudiante';

    // Limpiar formulario
    document.getElementById('student-form').reset();

    document.getElementById('student-modal').style.display = 'flex';
}

// Abrir modal para editar estudiante
function openEditStudentModal(studentId) {
    const student = students.find(s => s.id === studentId);

    if (student) {
        isEditMode = true;
        currentStudentId = studentId;

        document.getElementById('modal-title').textContent = 'Editar Estudiante';
        document.getElementById('submit-btn').textContent = 'Actualizar Estudiante';

        // Llenar formulario con datos del estudiante
        document.getElementById('student-name').value = student.name;
        document.getElementById('student-course').value = student.course;

        document.getElementById('student-modal').style.display = 'flex';
    } else {
        showError('Estudiante no encontrado');
    }
}

// Manejar envío del formulario
async function handleStudentSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const studentData = {
        name: formData.get('name').trim(),
        course: formData.get('course')
    };

    // Validaciones básicas
    if (!studentData.name) {
        showError('El nombre es obligatorio');
        return;
    }

    if (!studentData.course) {
        showError('Debe seleccionar un curso');
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const url = isEditMode
            ? `/api/students/${currentStudentId}`
            : '/api/students';
        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        });

        const data = await response.json();

        if (data.success) {
            showSuccess(data.message);
            closeStudentModal();

            if (isEditMode) {
                // Actualizar estudiante existente localmente
                const index = students.findIndex(s => s.id === currentStudentId);
                if (index !== -1) {
                    students[index] = { ...students[index], ...studentData, updatedAt: new Date().toISOString() };
                }
            } else {
                // Agregar nuevo estudiante localmente
                const newStudent = {
                    id: data.student.id,
                    name: studentData.name,
                    course: studentData.course,
                    createdAt: new Date().toISOString()
                };
                students.push(newStudent);
            }

            displayStudents(students);
        } else {
            showError(data.message || 'Error al guardar estudiante');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

// Abrir modal de confirmación para eliminar
function openDeleteModal(studentId, studentName) {
    currentStudentId = studentId;
    document.getElementById('delete-student-name').textContent = studentName;
    document.getElementById('delete-modal').style.display = 'flex';

    // Configurar botón de confirmación
    document.getElementById('confirm-delete-btn').onclick = () => deleteStudent(studentId);
}

// Eliminar estudiante
async function deleteStudent(studentId) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/students/${studentId}`, {
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

            // Eliminar estudiante localmente
            const index = students.findIndex(s => s.id === studentId);
            if (index !== -1) {
                students.splice(index, 1);
            }

            displayStudents(students);
        } else {
            showError(data.message || 'Error al eliminar estudiante');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión al eliminar estudiante');
    }
}

// Cerrar modal de estudiante
function closeStudentModal() {
    document.getElementById('student-modal').style.display = 'none';
    document.getElementById('student-form').reset();
    currentStudentId = null;
    isEditMode = false;
}

// Cerrar modal de eliminación
function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    currentStudentId = null;
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
        notification.remove();
    }, 5000);
}