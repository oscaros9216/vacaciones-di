// =============================================
// CONFIGURACIÓN GLOBAL
// =============================================
const CONFIG = {
    APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyI4TwH2l1rrjl5-wR27HRNjRu7jzroC8W5Buf8UasI7Qq2yg0ruGnx9SEzrU5wQTorpA/exec",
    DEBUG_MODE: true  // Activa logs detallados en consola
};

// =============================================
// VARIABLES GLOBALES
// =============================================
let signaturePad;  // Canvas para la firma digital

// Referencias a elementos del DOM
const elements = {
    registerForm: document.getElementById('registerForm'),
    registerFormPanel: document.getElementById('registerFormPanel'),
    optionsPanel: document.querySelector('.options-panel'),
    registerUserBtn: document.getElementById('registerUserBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    formMessage: document.getElementById('formMessage'),
    passwordStrength: document.getElementById('passwordStrength')
};

// =============================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    log('Dashboard cargado');
    checkSession();      // Verifica si el usuario está autenticado
    initUI();           // Configura eventos de la interfaz
    initSignaturePad(); // Inicializa el canvas de firma
});

// =============================================
// FUNCIÓN PRINCIPAL: ENVÍO DE DATOS A GOOGLE SCRIPT
// =============================================
async function sendToGoogleScript(data) {
    try {
        // 1. Verificar conexión a Internet
        if (!navigator.onLine) {
            throw new Error("❌ No hay conexión a Internet");
        }

        log("📤 Enviando datos:", data);

        // 2. Configurar timeout (10 segundos)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        // 3. Realizar petición POST
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: controller.signal,
            redirect: 'follow'  // Necesario para Apps Script
        });
        clearTimeout(timeoutId);

        // 4. Manejar redirección (Apps Script redirige las peticiones)
        const responseData = response.redirected 
            ? await fetch(response.url).then(res => res.json())
            : await response.json();

        // 5. Validar respuesta
        if (!responseData?.success) {
            throw new Error(responseData?.message || "⚠️ Respuesta inválida del servidor");
        }

        log("✅ Respuesta exitosa:", responseData);
        return responseData;

    } catch (error) {
        log("❌ Error en sendToGoogleScript:", error);

        // Mensajes de error amigables
        const errorMessages = {
            'AbortError': '⌛ La solicitud tardó demasiado. Intenta nuevamente.',
            'TypeError': '📡 Error de conexión. Verifica tu Internet.',
            'DOMException': '🔄 Error al procesar. Recarga la página.'
        };

        throw new Error(errorMessages[error.name] || `🚨 Error: ${error.message}`);
    }
}

// =============================================
// MANEJO DEL FORMULARIO DE REGISTRO
// =============================================
async function handleFormSubmit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        // 1. Validar firma
        if (signaturePad.isEmpty()) {
            throw new Error("✍️ Debes proporcionar tu firma");
        }

        // 2. Mostrar estado "Cargando..."
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Guardando...';
        showMessage("⏳ Guardando información...", "loading");

        // 3. Preparar datos del formulario
        const formData = {
            action: 'saveUserData',
            id: generateUserId(),
            rol: document.getElementById('userRole').value,
            nombre: document.getElementById('fullName').value,
            firma: signaturePad.toDataURL('image/png').split(',')[1],  // Base64 sin cabecera
            numero_colaborador: document.getElementById('employeeNumber').value,
            fecha_ingreso: document.getElementById('hireDate').value,
            email: document.getElementById('email').value,
            contraseña: document.getElementById('password').value,
            vacaciones: document.getElementById('vacationAuth').value || "Si",
            jefe_directo: document.getElementById('managerName').value,
            correo_jefe: document.getElementById('managerEmail').value
        };

        // 4. Enviar datos
        const response = await sendToGoogleScript(formData);
        showMessage("✅ " + response.message, "success");

        // 5. Resetear formulario después de 1.5 segundos
        setTimeout(() => {
            hideRegisterForm();
            resetForm();
        }, 1500);

    } catch (error) {
        showMessage(error.message, "error");
        console.error("Error en handleFormSubmit:", error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// =============================================
// FUNCIONES AUXILIARES
// =============================================

// Genera un ID único para el usuario
function generateUserId() {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `USR-${timestamp}-${randomNum}`;
}

// Muestra/oculta el formulario de registro
function showRegisterForm() {
    elements.optionsPanel.style.display = 'none';
    elements.registerFormPanel.style.display = 'block';
    document.getElementById('userId').value = generateUserId();
}

function hideRegisterForm() {
    elements.registerFormPanel.style.display = 'none';
    elements.optionsPanel.style.display = 'grid';
}

// Valida fortaleza de la contraseña en tiempo real
function checkPasswordStrength() {
    const password = this.value;
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/\d/.test(password)) strength++;
    if (/[A-Za-z]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const colors = ['#e53e3e', '#f6ad55', '#68d391'];
    elements.passwordStrength.style.width = `${strength * 25}%`;
    elements.passwordStrength.style.backgroundColor = colors[strength - 1] || '#e53e3e';
}

// Inicializa el canvas para firma
function initSignaturePad() {
    const canvas = document.getElementById('signaturePad');
    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });

    document.getElementById('clearSignature').addEventListener('click', () => {
        signaturePad.clear();
    });
}

// Resetear formulario
function resetForm() {
    elements.registerForm.reset();
    signaturePad.clear();
    elements.passwordStrength.style.width = '0%';
}

// =============================================
// MANEJO DE SESIÓN Y UI
// =============================================

// Verifica si el usuario está autenticado
function checkSession() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userEmail = localStorage.getItem('userEmail');

    if (!isLoggedIn || !userEmail) {
        redirectToLogin();
    } else {
        document.getElementById('userEmail').textContent = userEmail;
    }
}

// Configura eventos de la interfaz
function initUI() {
    // Botones principales
    elements.registerUserBtn?.addEventListener('click', showRegisterForm);
    elements.cancelBtn?.addEventListener('click', hideRegisterForm);
    elements.logoutBtn?.addEventListener('click', logout);

    // Validación de contraseña en tiempo real
    document.getElementById('password')?.addEventListener('input', checkPasswordStrength);

    // Envío de formulario
    elements.registerForm?.addEventListener('submit', handleFormSubmit);
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    redirectToLogin();
}

function redirectToLogin() {
    window.location.href = "index.html";
}

// Muestra mensajes al usuario
function showMessage(text, type) {
    if (elements.formMessage) {
        elements.formMessage.textContent = text;
        elements.formMessage.className = `form-message ${type}`;
    }
}

// Logs detallados (solo en modo DEBUG)
function log(...args) {
    if (CONFIG.DEBUG_MODE) {
        console.log('[DEBUG]', ...args);
    }
}

// =============================================
// INICIALIZACIÓN FINAL
// =============================================
if (elements.registerFormPanel) {
    elements.registerFormPanel.style.display = 'none';  // Ocultar formulario al inicio
}

// Añade animación CSS para el ícono de carga
const style = document.createElement('style');
style.textContent = `
    @keyframes spin { 
        100% { transform: rotate(360deg); } 
    }
    .bi-arrow-repeat.spin { 
        animation: spin 1s linear infinite; 
    }
`;
document.head.appendChild(style);
