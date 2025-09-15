document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.getElementById('registerBtn');
    const modal = document.getElementById('registerModal');
    const closeBtn = document.getElementsByClassName('close')[0];
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const registerErrorMessage = document.getElementById('register-error-message');
    const registerSuccessMessage = document.getElementById('register-success-message');

    // Manejar login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Limpiar mensajes
        errorMessage.textContent = '';
        successMessage.textContent = '';
        
        // Validación básica del lado del cliente
        if (!username || !password) {
            errorMessage.textContent = 'Por favor, ingrese usuario y contraseña';
            return;
        }
        
        // Enviar las credenciales al servidor para validación
        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Guardar token y datos del usuario en localStorage
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('username', data.user.username);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('token', data.token);
                
                // Redireccionar según el rol
                if (data.user.role === 'admin') {
                    window.location.href = '/teachers-management.html';
                } else {
                    window.location.href = '/epanel.html';
                }
            } else {
                errorMessage.textContent = data.message || 'Credenciales inválidas';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorMessage.textContent = 'Error al conectar con el servidor';
        });
    });

    // Manejar apertura del modal de registro
    registerBtn.addEventListener('click', function() {
        modal.style.display = 'block';
        // Limpiar formulario y mensajes
        registerForm.reset();
        registerErrorMessage.textContent = '';
        registerSuccessMessage.textContent = '';
    });

    // Manejar cierre del modal
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Manejar registro
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        
        // Limpiar mensajes
        registerErrorMessage.textContent = '';
        registerSuccessMessage.textContent = '';
        
        // Validaciones
        if (!name || !email || !username || !password || !confirmPassword) {
            registerErrorMessage.textContent = 'Todos los campos son requeridos';
            return;
        }
        
        if (password !== confirmPassword) {
            registerErrorMessage.textContent = 'Las contraseñas no coinciden';
            return;
        }
        
        if (password.length < 6) {
            registerErrorMessage.textContent = 'La contraseña debe tener al menos 6 caracteres';
            return;
        }
        
        // Enviar datos de registro al servidor
        fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name, 
                email, 
                username, 
                password, 
                role: 'admin' 
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                registerSuccessMessage.textContent = 'Registro exitoso. Ahora puedes iniciar sesión.';
                setTimeout(() => {
                    modal.style.display = 'none';
                    // Llenar automáticamente el formulario de login
                    document.getElementById('username').value = username;
                    successMessage.textContent = 'Cuenta creada exitosamente. Inicia sesión para continuar.';
                }, 2000);
            } else {
                registerErrorMessage.textContent = data.message || 'Error en el registro';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            registerErrorMessage.textContent = 'Error al conectar con el servidor';
        });
    });
    // Funcionalidad de alternancia de visibilidad de contraseña
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
});