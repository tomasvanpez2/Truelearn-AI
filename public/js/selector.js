document.addEventListener('DOMContentLoaded', () => {
    const courseSelect = document.getElementById('course-select');
    const subjectSelectGroup = document.getElementById('subject-select-group');
    const subjectSelect = document.getElementById('subject-select');
    const studentManagementSection = document.getElementById('student-management');
    const studentSelect = document.getElementById('student-select');
    const addStudentBtn = document.getElementById('add-student-btn');
    const editStudentBtn = document.getElementById('edit-student-btn');
    const deleteStudentBtn = document.getElementById('delete-student-btn');
    const continueToDashboardBtn = document.getElementById('continue-to-dashboard');
    const studentModal = document.getElementById('student-modal');
    const studentForm = document.getElementById('student-form');
    const studentModalTitle = document.getElementById('student-modal-title');
    const cancelStudentModalBtn = document.getElementById('cancel-student-modal');
    const studentNameInput = document.getElementById('student-name');
    const studentIdInput = document.getElementById('student-id');

    // Elementos para gestión de temas
    const topicManagementSection = document.getElementById('topic-management');
    const topicList = document.getElementById('topic-list');
    const addTopicBtn = document.getElementById('add-topic-btn');
    const deleteTopicBtn = document.getElementById('delete-topic-btn');
    const proceedToStudentBtn = document.getElementById('proceed-to-student-btn');
    const courseHoursGroup = document.getElementById('course-hours-group');
    const courseHoursInput = document.getElementById('course-hours');

    let topics = [];
    let selectedTopicIndex = null;

    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    // Mostrar botón de administración solo para admins
    if (userRole === 'admin') {
        document.getElementById('admin-section').style.display = 'block';
    }


    // Lógica para cargar cursos (grados)
    function loadCourses() {
        fetch('/courses.json')
            .then(res => res.json())
            .then(data => {
                courseSelect.innerHTML = '<option value="" disabled selected>Seleccione un grado</option>';
                Object.keys(data).forEach(curso => {
                    const option = document.createElement('option');
                    option.value = curso;
                    option.textContent = curso;
                    courseSelect.appendChild(option);
                });
            });
    }

    // Mostrar la sección de temas al seleccionar curso y cargar temas desde backend
    courseSelect.addEventListener('change', () => {
        if (courseSelect.value) {
            // Mostrar selector de materia
            fetch('/courses.json')
                .then(res => res.json())
                .then(data => {
                    const materias = Object.keys(data[courseSelect.value] || {});
                    subjectSelect.innerHTML = '<option value="" disabled selected>Seleccione una materia</option>';
                    materias.forEach(materia => {
                        const option = document.createElement('option');
                        option.value = materia;
                        option.textContent = materia;
                        subjectSelect.appendChild(option);
                    });
                    subjectSelectGroup.style.display = 'block';
                    topicManagementSection.style.display = 'none';
                    studentManagementSection.style.display = 'none';
                });
        } else {
            subjectSelectGroup.style.display = 'none';
            topicManagementSection.style.display = 'none';
            studentManagementSection.style.display = 'none';
        }
    });

    // Guardar el valor de horas totales por materia y grado en localStorage cuando se edite
    courseHoursInput.addEventListener('input', () => {
        if (courseSelect.value && subjectSelect.value && courseHoursInput.value && parseInt(courseHoursInput.value) > 0) {
            const key = `courseHours_${courseSelect.value}_${subjectSelect.value}`;
            localStorage.setItem(key, courseHoursInput.value);
        }
    });

    subjectSelect.addEventListener('change', () => {
        if (subjectSelect.value) {
            topicManagementSection.style.display = 'block';
            courseHoursGroup.style.display = 'block';
            studentManagementSection.style.display = 'none';
            // Restaurar el valor guardado para la materia y grado seleccionados
            const key = `courseHours_${courseSelect.value}_${subjectSelect.value}`;
            const savedHours = localStorage.getItem(key);
            if (savedHours) {
                courseHoursInput.value = savedHours;
            } else {
                courseHoursInput.value = '';
            }
        } else {
            topicManagementSection.style.display = 'none';
            courseHoursGroup.style.display = 'none';
            studentManagementSection.style.display = 'none';
        }
    });

    // Renderizar la lista de temas
    function renderTopics() {
        topicList.innerHTML = '';
        topics.forEach((topic, idx) => {
            const li = document.createElement('li');
            li.textContent = topic;
            li.style.cursor = 'pointer';
            li.style.background = idx === selectedTopicIndex ? 'var(--color-tertiary)' : 'transparent';
            li.onclick = () => {
                selectedTopicIndex = idx;
                renderTopics();
            };
            topicList.appendChild(li);
        });
    }

    // Agregar tema (persistente)
    addTopicBtn.addEventListener('click', () => {
        const tema = prompt('Ingrese el nombre del tema trabajado:');
        if (tema && tema.trim()) {
            fetch(`/api/themes/${courseSelect.value}/${subjectSelect.value}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: tema.trim() })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    topics = data.topics;
                    renderTopics();
                } else {
                    alert('No se pudo agregar el tema.');
                }
            })
            .catch(() => alert('Error al agregar tema.'));
        }
    });

    // Eliminar tema seleccionado (persistente)
    deleteTopicBtn.addEventListener('click', () => {
        if (selectedTopicIndex !== null && topics[selectedTopicIndex] !== undefined) {
            if (confirm(`¿Eliminar el tema "${topics[selectedTopicIndex]}"?`)) {
                fetch(`/api/themes/${courseSelect.value}/${subjectSelect.value}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic: topics[selectedTopicIndex] })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        topics = data.topics;
                        selectedTopicIndex = null;
                        renderTopics();
                    } else {
                        alert('No se pudo eliminar el tema.');
                    }
                })
                .catch(() => alert('Error al eliminar tema.'));
            }
        } else {
            alert('Seleccione un tema para eliminar.');
        }
    });

    // Proceder a la selección del estudiante
    proceedToStudentBtn.addEventListener('click', () => {
        if (topics.length === 0) {
            alert('Agregue al menos un tema antes de continuar.');
            return;
        }
        if (!courseHoursInput.value || parseInt(courseHoursInput.value) < 1) {
            alert('Ingrese las horas totales del curso antes de continuar.');
            return;
        }
        // Guardar el valor actual por materia y grado antes de continuar
        const key = `courseHours_${courseSelect.value}_${subjectSelect.value}`;
        localStorage.setItem(key, courseHoursInput.value);
        localStorage.setItem('selectedCourseHours', courseHoursInput.value); // Para compatibilidad con otros módulos
        // Guardar los temas en localStorage (opcional, para usarlos después)
        localStorage.setItem('selectedCourseTopics', JSON.stringify(topics));
        localStorage.setItem('selectedSubject', subjectSelect.value);
        localStorage.setItem('selectedSubjectName', subjectSelect.options[subjectSelect.selectedIndex].text);
        topicManagementSection.style.display = 'none';
        courseHoursGroup.style.display = 'none';
        loadStudents(courseSelect.value);
    });



    // Lógica para cargar estudiantes de un curso (desde el backend)
    function loadStudents(courseId) {
        studentManagementSection.style.display = 'block';
        fetch(`/api/students?course=${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(students => {
            studentSelect.innerHTML = '<option value="" disabled selected>Seleccione un estudiante</option>';
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = student.name;
                studentSelect.appendChild(option);
            });
            studentSelect.value = '';
            editStudentBtn.disabled = true;
            deleteStudentBtn.disabled = true;
            continueToDashboardBtn.style.display = 'none';
        })
        .catch(error => console.error('Error al cargar estudiantes:', error));
    }


    studentSelect.addEventListener('change', () => {
        const studentSelected = !!studentSelect.value;
        editStudentBtn.disabled = !studentSelected;
        deleteStudentBtn.disabled = !studentSelected;
        continueToDashboardBtn.style.display = studentSelected ? 'block' : 'none';
    });

    function openStudentModal(title, student = {}) {
        studentModalTitle.textContent = title;
        studentIdInput.value = student.id || '';
        studentNameInput.value = student.name || '';
        studentModal.style.display = 'flex';
    }

    function closeStudentModal() {
        studentModal.style.display = 'none';
        studentForm.reset();
    }

    addStudentBtn.addEventListener('click', () => {
        openStudentModal('Agregar Estudiante');
    });

    editStudentBtn.addEventListener('click', () => {
        const studentId = studentSelect.value;
        const studentName = studentSelect.options[studentSelect.selectedIndex].text;
        openStudentModal('Editar Estudiante', { id: studentId, name: studentName });
    });

    deleteStudentBtn.addEventListener('click', () => {
        const studentId = studentSelect.value;
        if (confirm('¿Está seguro de que desea eliminar a este estudiante?')) {
            fetch(`/api/students/${studentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    loadStudents(courseSelect.value);
                } else {
                    alert(result.message);
                }
            })
            .catch(error => console.error('Error al eliminar estudiante:', error));
        }
    });

    studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const studentId = studentIdInput.value;
        const studentData = {
            name: studentNameInput.value,
            course: courseSelect.value
        };

        const isEdit = !!studentId;
        const url = isEdit ? `/api/students/${studentId}` : '/api/students';
        const method = isEdit ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(studentData)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                closeStudentModal();
                loadStudents(courseSelect.value);
            } else {
                alert(result.message);
            }
        })
        .catch(error => console.error('Error al guardar estudiante:', error));
    });

    cancelStudentModalBtn.addEventListener('click', closeStudentModal);

    continueToDashboardBtn.addEventListener('click', () => {
        const courseId = courseSelect.value;
        const subjectId = subjectSelect.value;
        const studentId = studentSelect.value;
        if (courseId && subjectId && studentId) {
            // Guardar en localStorage y redirigir
            localStorage.setItem('selectedCourse', courseId);
            localStorage.setItem('selectedSubject', subjectId);
            localStorage.setItem('selectedStudent', studentId);
            localStorage.setItem('selectedStudentName', studentSelect.options[studentSelect.selectedIndex].text);
            localStorage.setItem('selectedCourseName', courseSelect.options[courseSelect.selectedIndex].text);
            localStorage.setItem('selectedSubjectName', subjectSelect.options[subjectSelect.selectedIndex].text);
            window.location.href = '/dashboard.html';
        }
    });

    loadCourses();
});