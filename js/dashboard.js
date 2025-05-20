const CONFIG = {
    APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzPWDLF1oxRpIFr25HH52lC4pu91lumsKTmwf7KVziU-QOKkf8kI0izrwBxEpfGuGwjbw/exec",
    DEBUG_MODE: true,
    MAX_RETRIES: 2,
    RETRY_DELAY: 1000,
    REQUEST_TIMEOUT: 8000
};

// Elementos del DOM
const elements = {
    userEmail: document.getElementById('userEmail'),
    userName: document.getElementById('userName'),
    logoutBtn: document.getElementById('logoutBtn'),
    optionsPanel: document.getElementById('optionsPanel'),
    registerUserBtn: document.getElementById('registerUserBtn'),
    requestDayBtn: document.getElementById('requestDayBtn'),
    registerFormPanel: document.getElementById('registerFormPanel'),
    registerForm: document.getElementById('registerForm'),
    cancelBtn: document.getElementById('cancelBtn'),
    formMessage: document.getElementById('formMessage'),
    passwordStrength: document.getElementById('passwordStrength')
};

// Estado de la aplicación
const appState = {
    isSubmitting: false,
    currentRetries: 0,
    lastRequestTime: null
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    initUI();
    setupEventListeners();
});

function checkSession() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');

    if (!isLoggedIn || !userEmail) {
        redirectToLogin();
    } else {
        elements.userEmail.textContent = userEmail;
        elements.userName.textContent = userName || '';
        updateLastActivity();
    }
}

function updateLastActivity() {
    localStorage.setItem('lastActivity', new Date().getTime());
}

function initUI() {
    // Configurar Signature Pad si existe
    if (window.SignaturePad) {
        const canvas = document.getElementById('signaturePad');
        if (canvas) {
            const signaturePad = new SignaturePad(canvas, {
                backgroundColor: 'rgb(255, 255, 255)',
                penColor: 'rgb(0, 0, 0)'
            });

            document.getElementById('clearSignature')?.addEventListener('click', () => {
                signaturePad.clear();
            });
        }
    }
}

function setupEventListeners() {
    // Navegación
    elements.registerUserBtn?.addEventListener('click', showRegisterForm);
    elements.cancelBtn?.addEventListener('click', hideRegisterForm);
    elements.logoutBtn?.addEventListener('click', logout);

    // Formulario
    elements.registerForm?.addEventListener('submit', handleFormSubmit);
    
    // Password strength
    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.addEventListener('input', checkPasswordStrength);
    }

    // Actualizar actividad con interacción del usuario
    document.addEventListener('click', updateLastActivity);
    document.addEventListener('keypress', updateLastActivity);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (appState.isSubmitting) return;
    appState.isSubmitting = true;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Validación del cliente
        if (!validateForm()) {
            throw new Error("Por favor complete los campos requeridos correctamente");
        }

        // Mostrar estado de carga
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Guardando...';
        showFormMessage("⏳ Conectando con el servidor...", "loading");

        // Preparar datos
        const formData = prepareFormData();

        // Enviar datos
        const response = await sendWithRetry({
            action: 'saveUserData',
            ...formData
        });

        if (response.success) {
            showFormMessage(`✅ ${response.message}`, "success");
            setTimeout(() => {
                hideRegisterForm();
                resetForm();
            }, 2000);
        } else {
            throw new Error(response.message || "Error al guardar los datos");
        }
    } catch (error) {
        console.error("Error en handleFormSubmit:", error);
        showFormMessage(`❌ ${error.message}`, "error");
        elements.registerForm.classList.add('shake');
        setTimeout(() => {
            elements.registerForm.classList.remove('shake');
        }, 500);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        appState.isSubmitting = false;
    }
}

function validateForm() {
    const requiredFields = [
        'userRole', 'employeeNumber', 'fullName', 'email', 'password'
    ];
    
    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field || !field.value.trim()) {
            field?.focus();
            return false;
        }
    }
    
    // Validar email
    const email = document.getElementById('email').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return false;
    }
    
    // Validar contraseña
    const password = document.getElementById('password').value;
    if (password.length < 8) {
        return false;
    }
    
    return true;
}

function prepareFormData() {
    return {
        id: document.getElementById('userId').value,
        rol: document.getElementById('userRole').value,
        nombre: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        numero_colaborador: document.getElementById('employeeNumber').value,
        fecha_ingreso: document.getElementById('hireDate').value,
        contraseña: document.getElementById('password').value,
        vacaciones: document.getElementById('vacationAuth').value,
        jefe_directo: document.getElementById('managerName').value,
        correo_jefe: document.getElementById('managerEmail').value,
        titulo_evento: document.getElementById('eventTitle').value,
        correos_invitados: document.getElementById('guestEmails').value,
        descripcion: document.getElementById('description').value,
        mensaje: document.getElementById('message').value
    };
}

async function sendWithRetry(data, retries = CONFIG.MAX_RETRIES) {
    let lastError;
    
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await sendToGoogleScript(data);
            return response;
        } catch (error) {
            lastError = error;
            if (i < retries) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
            }
        }
    }
    
    throw lastError;
}

async function sendToGoogleScript(data) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error HTTP: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

function showRegisterForm() {
    elements.optionsPanel.style.display = 'none';
    elements.registerFormPanel.style.display = 'block';
    document.getElementById('userId').value = generateUserId();
}

function hideRegisterForm() {
    elements.registerFormPanel.style.display = 'none';
    elements.optionsPanel.style.display = 'grid';
}

function resetForm() {
    elements.registerForm.reset();
    elements.passwordStrength.style.width = '0%';
    elements.passwordStrength.style.backgroundColor = '#e53e3e';
}

function generateUserId() {
    return `USR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

function checkPasswordStrength() {
    const password = this.value;
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/\d/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const colors = ['#e53e3e', '#f6ad55', '#68d391', '#38a169'];
    elements.passwordStrength.style.width = `${strength * 25}%`;
    elements.passwordStrength.style.backgroundColor = colors[strength] || '#e53e3e';
}

function showFormMessage(text, type) {
    if (elements.formMessage) {
        elements.formMessage.innerHTML = text;
        elements.formMessage.className = `form-message ${type}`;
        elements.formMessage.style.display = 'block';
        
        if (type !== 'loading') {
            setTimeout(() => {
                elements.formMessage.style.display = 'none';
            }, 5000);
        }
    }
}

function logout() {
    if (confirm("¿Está seguro que desea cerrar sesión?")) {
        localStorage.clear();
        redirectToLogin();
    }
}

function redirectToLogin() {
    window.location.href = "index.html";
}
