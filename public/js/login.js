document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Validación básica del lado del cliente
        if (!username || !password) {
            errorMessage.textContent = 'Por favor, ingrese usuario y contraseña';
            return;
        }
        
        // Enviar las credenciales al servidor para validación
        
        // Si las credenciales no coinciden con las hardcodeadas, intentar con el servidor
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
                // Guardar token y rol en localStorage
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userRole', data.role);
                localStorage.setItem('username', username);
                
                // Redireccionar al dashboard
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    window.location.href = '/selector.html'; // Redirigir a la nueva página de selección
                } else {
                    errorMessage.textContent = data.message;
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


});