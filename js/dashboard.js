// Configuración global
const CONFIG = {
    APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyI4TwH2l1rrjl5-wR27HRNjRu7jzroC8W5Buf8UasI7Qq2yg0ruGnx9SEzrU5wQTorpA/exec",
    DEBUG_MODE: true
};

// Variables globales
let signaturePad;

// Elementos del DOM
const elements = {
    registerForm: document.getElementById('registerForm'),
    registerFormPanel: document.getElementById('registerFormPanel'),
    optionsPanel: document.querySelector('.options-panel'),
    registerUserBtn: document.getElementById('registerUserBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    formMessage: document.getElementById('formMessage')
};

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    log('Dashboard cargado');
    checkSession();
    initUI();
    initSignaturePad();
});

// Función mejorada para enviar datos a Google Script
async function sendToGoogleScript(data) {
    const APPS_SCRIPT_URL = CONFIG.APPS_SCRIPT_URL;
    
    try {
        // 1. Verificar conexión a Internet
        if (!navigator.onLine) {
            throw new Error("Sin conexión a Internet");
        }

        // 2. Mostrar datos que se enviarán
        log("Datos a enviar a Google Script:");
        console.table(data);

        // 3. Realizar la petición con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout de 10 segundos
        
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        // 4. Manejar respuesta no OK
        if (!response.ok) {
            const errorDetail = await response.text().catch(() => 'Sin detalles');
            log("Respuesta no OK:", {
                status: response.status,
                statusText: response.statusText,
                detail: errorDetail
            });
            throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
        }

        // 5. Procesar respuesta exitosa
        const result = await response.json();
        log("Respuesta exitosa:", result);
        return result;

    } catch (error) {
        log("Error en sendToGoogleScript:");
        console.error("Tipo de error:", error.name);
        console.error("Mensaje:", error.message);
        
        if (error.name === 'AbortError') {
            log("La solicitud tardó demasiado");
        }
        
        // Mensajes amigables para el usuario
        const userMessages = {
            AbortError: "La solicitud tardó demasiado. Intenta nuevamente",
            TypeError: "Error de conexión. Verifica tu red",
            DOMException: "Problema con la solicitud. Recarga la página",
            SyntaxError: "Error procesando la respuesta del servidor"
        };
        
        throw new Error(userMessages[error.name] || 
            `Error al conectar con el servidor: ${error.message}`);
    }
}

// Resto de funciones del dashboard...

function checkSession() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    
    if (!isLoggedIn || isLoggedIn !== 'true' || !userEmail || !userRole) {
        redirectToLogin();
        return;
    }
    
    document.getElementById('userEmail').textContent = userEmail;
    log('Sesión verificada para:', userEmail);
}

function initUI() {
    // Navegación
    if (elements.registerUserBtn) {
        elements.registerUserBtn.addEventListener('click', showRegisterForm);
    }
    
    if (elements.cancelBtn) {
        elements.cancelBtn.addEventListener('click', hideRegisterForm);
    }
    
    // Cerrar sesión
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', logout);
    }
    
    // Validación de contraseña
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
    
    // Formulario
    if (elements.registerForm) {
        elements.registerForm.addEventListener('submit', handleFormSubmit);
    }
}

function initSignaturePad() {
    const canvas = document.getElementById('signaturePad');
    if (canvas) {
        signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });
        
        document.getElementById('clearSignature').addEventListener('click', function() {
            signaturePad.clear();
        });
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Validación básica
        if (!signaturePad || signaturePad.isEmpty()) {
            throw new Error('Debe proporcionar su firma');
        }
        
        // Mostrar estado de carga
        submitBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Guardando...';
        submitBtn.disabled = true;
        showMessage('Guardando información...', 'loading');
        
        // Preparar datos
        const formData = prepareFormData();
        log('Datos del formulario:', formData);
        
        // Enviar datos
        const response = await sendToGoogleScript(formData);
        log('Respuesta del servidor:', response);
        
        showMessage(response.message || 'Usuario registrado correctamente', 'success');
        setTimeout(() => {
            hideRegisterForm();
        }, 1500);
    } catch (error) {
        console.error('Error al enviar formulario:', error);
        showMessage(error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function prepareFormData() {
    return {
        action: 'saveUserData',
        id: document.getElementById('userId').value,
        rol: document.getElementById('userRole').value,
        nombre: document.getElementById('fullName').value,
        firma: signaturePad.toDataURL('image/png').split(',')[1],
        numero_colaborador: document.getElementById('employeeNumber').value,
        fecha_ingreso: document.getElementById('hireDate').value,
        email: document.getElementById('email').value,
        contraseña: document.getElementById('password').value,
        vacaciones: document.getElementById('vacationAuth').value,
        jefe_directo: document.getElementById('managerName').value,
        correo_jefe: document.getElementById('managerEmail').value,
        titulo_evento: document.getElementById('eventTitle').value || '',
        correos_invitados: document.getElementById('guestEmails').value || '',
        descripcion: document.getElementById('description').value || '',
        mensaje: document.getElementById('message').value || ''
    };
}

function showRegisterForm() {
    elements.optionsPanel.style.display = 'none';
    elements.registerFormPanel.style.display = 'block';
    generateUserId();
    log('Mostrando formulario de registro');
}

function hideRegisterForm() {
    elements.registerFormPanel.style.display = 'none';
    elements.optionsPanel.style.display = 'grid';
    resetForm();
    log('Ocultando formulario de registro');
}

function generateUserId() {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    document.getElementById('userId').value = `USR-${timestamp}-${randomNum}`;
}

function checkPasswordStrength() {
    const password = this.value;
    const strengthBar = document.getElementById('passwordStrength');
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/\d/.test(password)) strength++;
    if (/[a-zA-Z]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    const width = strength * 25;
    let color = '#e53e3e';
    if (strength >= 3) color = '#f6ad55';
    if (strength >= 4) color = '#38a169';
    
    strengthBar.style.width = `${width}%`;
    strengthBar.style.backgroundColor = color;
}

function resetForm() {
    if (elements.registerForm) elements.registerForm.reset();
    if (signaturePad) signaturePad.clear();
    const strengthBar = document.getElementById('passwordStrength');
    if (strengthBar) {
        strengthBar.style.width = '0%';
        strengthBar.style.backgroundColor = '#e53e3e';
    }
    elements.formMessage.textContent = '';
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    redirectToLogin();
}

function redirectToLogin() {
    window.location.href = "index.html";
}

function showMessage(text, type) {
    elements.formMessage.textContent = text;
    elements.formMessage.className = `form-message ${type}`;
}

function log(...args) {
    if (CONFIG.DEBUG_MODE) {
        console.log('[DEBUG]', ...args);
    }
}

// Inicialización de componentes
if (elements.registerFormPanel) {
    elements.registerFormPanel.style.display = 'none';
}
