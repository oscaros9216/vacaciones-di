const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzPWDLF1oxRpIFr25HH52lC4pu91lumsKTmwf7KVziU-QOKkf8kI0izrwBxEpfGuGwjbw/exec";

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    const loginBtn = document.querySelector('.login-btn');
    
    // Mostrar estado de carga
    showMessage("Verificando credenciales...", "loading");
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="loading-spinner"></span> Procesando...';
    
    // Validación básica del cliente
    if (!email || !password) {
        showMessage("Por favor complete todos los campos", "error");
        loginBtn.disabled = false;
        loginBtn.textContent = "Ingresar";
        document.getElementById('loginForm').classList.add('shake');
        setTimeout(() => {
            document.getElementById('loginForm').classList.remove('shake');
        }, 500);
        return;
    }
    
    try {
        const url = `${APPS_SCRIPT_URL}?action=validateLogin&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
        
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            }
        });
        
        let data;
        if (response.redirected) {
            const redirectedResponse = await fetch(response.url);
            data = await redirectedResponse.json();
        } else {
            data = await response.json();
        }
        
        if (data.success) {
            showMessage("¡Inicio de sesión exitoso! Redirigiendo...", "success");
            
            // Guardar datos de sesión
            localStorage.setItem('userEmail', data.email);
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('isLoggedIn', 'true');
            
            // Redirigir después de 1.5 segundos
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1500);
        } else {
            showMessage(data.message || "Credenciales incorrectas", "error");
            loginBtn.disabled = false;
            loginBtn.textContent = "Ingresar";
            document.getElementById('loginForm').classList.add('shake');
            setTimeout(() => {
                document.getElementById('loginForm').classList.remove('shake');
            }, 500);
        }
    } catch (error) {
        console.error("Error en la solicitud:", error);
        showMessage("Error al conectar con el servidor. Intente nuevamente.", "error");
        loginBtn.disabled = false;
        loginBtn.textContent = "Ingresar";
    }
});

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `login-message message-${type} show`;
    
    // Auto-ocultar mensajes después de 5 segundos (excepto success)
    if (type !== 'success' && type !== 'loading') {
        setTimeout(() => {
            messageDiv.classList.remove('show');
        }, 5000);
    }
}
