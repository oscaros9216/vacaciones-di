const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzPWDLF1oxRpIFr25HH52lC4pu91lumsKTmwf7KVziU-QOKkf8kI0izrwBxEpfGuGwjbw/exec";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

// Elementos del DOM
const elements = {
    loginForm: document.getElementById('loginForm'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    messageDiv: document.getElementById('message'),
    loginBtn: document.querySelector('.login-btn'),
    forgotPasswordLink: document.getElementById('forgotPasswordLink')
};

// Verificar si ya está autenticado
if (localStorage.getItem('isLoggedIn') {
    const lastActivity = localStorage.getItem('lastActivity');
    const currentTime = new Date().getTime();
    
    if (lastActivity && (currentTime - parseInt(lastActivity) < SESSION_TIMEOUT)) {
        redirectToDashboard();
    } else {
        clearSession();
    }
}

// Event listeners
elements.loginForm.addEventListener('submit', handleLogin);
elements.forgotPasswordLink.addEventListener('click', handleForgotPassword);

async function handleLogin(e) {
    e.preventDefault();
    
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;
    
    // Validación del cliente
    if (!email || !password) {
        showMessage("Por favor complete todos los campos", "error");
        shakeForm();
        return;
    }

    // Mostrar estado de carga
    showMessage("Verificando credenciales...", "loading");
    setLoadingState(true);

    try {
        const response = await sendLoginRequest(email, password);
        
        if (response.success) {
            // Guardar datos de sesión
            saveSessionData(response);
            showMessage("¡Inicio de sesión exitoso! Redirigiendo...", "success");
            
            // Redirigir después de 1.5 segundos
            setTimeout(redirectToDashboard, 1500);
        } else {
            throw new Error(response.message || "Credenciales incorrectas");
        }
    } catch (error) {
        showMessage(error.message, "error");
        shakeForm();
        setLoadingState(false);
    }
}

async function sendLoginRequest(email, password) {
    const data = {
        action: 'validateLogin',
        email: email,
        password: password
    };

    const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error("Error en la conexión con el servidor");
    }

    return await response.json();
}

function saveSessionData(response) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', response.email);
    localStorage.setItem('userRole', response.role);
    localStorage.setItem('userName', response.name);
    localStorage.setItem('lastActivity', new Date().getTime());
}

function clearSession() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('lastActivity');
}

function redirectToDashboard() {
    window.location.href = "dashboard.html";
}

function handleForgotPassword(e) {
    e.preventDefault();
    showMessage("Por favor contacte al administrador del sistema para restablecer su contraseña", "info");
}

function showMessage(text, type) {
    elements.messageDiv.textContent = text;
    elements.messageDiv.className = `login-message message-${type} show`;
    
    if (type !== 'success' && type !== 'loading') {
        setTimeout(() => {
            elements.messageDiv.classList.remove('show');
        }, 5000);
    }
}

function setLoadingState(isLoading) {
    elements.loginBtn.disabled = isLoading;
    elements.loginBtn.innerHTML = isLoading 
        ? '<span class="loading-spinner"></span> Procesando...' 
        : 'Ingresar';
}

function shakeForm() {
    elements.loginForm.classList.add('shake');
    setTimeout(() => {
        elements.loginForm.classList.remove('shake');
    }, 500);
}
