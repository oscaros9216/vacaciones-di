// Verificar sesión al cargar
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    setupUI();
    initializeSignaturePad();
});

// Elementos del DOM
let signaturePad;
const registerForm = document.getElementById('registerForm');
const registerFormPanel = document.getElementById('registerFormPanel');
const registerUserBtn = document.getElementById('registerUserBtn');
const cancelBtn = document.getElementById('cancelBtn');
const passwordInput = document.getElementById('password');
const passwordStrength = document.getElementById('passwordStrength');

// Verificar sesión
function checkSession() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    
    if (!isLoggedIn || isLoggedIn !== 'true' || !userEmail || !userRole) {
        window.location.href = "index.html";
        return;
    }
    
    document.getElementById('userEmail').textContent = userEmail;
}

// Configurar UI
function setupUI() {
    // Mostrar/ocultar formulario de registro
    registerUserBtn.addEventListener('click', function() {
        document.querySelector('.options-panel').style.display = 'none';
        registerFormPanel.style.display = 'block';
        generateUserId();
    });
    
    // Botón cancelar
    cancelBtn.addEventListener('click', function() {
        registerFormPanel.style.display = 'none';
        document.querySelector('.options-panel').style.display = 'grid';
        resetForm();
    });
    
    // Validar contraseña en tiempo real
    passwordInput.addEventListener('input', checkPasswordStrength);
}

// Generar ID único
function generateUserId() {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    document.getElementById('userId').value = `USR-${timestamp}-${randomNum}`;
}

// Inicializar firma digital
function initializeSignaturePad() {
    const canvas = document.getElementById('signaturePad');
    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });
    
    // Limpiar firma
    document.getElementById('clearSignature').addEventListener('click', function() {
        signaturePad.clear();
    });
}

// Validar fortaleza de contraseña
function checkPasswordStrength() {
    const password = passwordInput.value;
    let strength = 0;
    
    // Longitud mínima
    if (password.length >= 8) strength += 1;
    // Contiene números
    if (/\d/.test(password)) strength += 1;
    // Contiene letras
    if (/[a-zA-Z]/.test(password)) strength += 1;
    // Contiene caracteres especiales
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    // Actualizar barra visual
    const strengthBar = passwordStrength.querySelector('::after');
    const width = strength * 25;
    let color = '#e53e3e'; // Rojo
    
    if (strength >= 3) color = '#f6ad55'; // Amarillo
    if (strength >= 4) color = '#38a169'; // Verde
    
    passwordStrength.style.setProperty('--strength-width', `${width}%`);
    passwordStrength.style.setProperty('--strength-color', color);
}

// Resetear formulario
function resetForm() {
    registerForm.reset();
    signaturePad.clear();
    passwordStrength.style.setProperty('--strength-width', '0%');
}

// Enviar formulario
registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!signaturePad.isEmpty()) {
        // Obtener datos del formulario
        const formData = {
            id: document.getElementById('userId').value,
            rol: document.getElementById('userRole').value,
            nombre: document.getElementById('fullName').value,
            numero_colaborador: document.getElementById('employeeNumber').value,
            fecha_ingreso: document.getElementById('hireDate').value,
            email: document.getElementById('email').value,
            contraseña: document.getElementById('password').value,
            vacaciones: document.getElementById('vacationAuth').value,
            jefe_directo: document.getElementById('managerName').value,
            correo_jefe: document.getElementById('managerEmail').value,
            titulo_evento: document.getElementById('eventTitle').value,
            correos_invitados: document.getElementById('guestEmails').value,
            descripcion: document.getElementById('description').value,
            mensaje: document.getElementById('message').value,
            firma: signaturePad.toDataURL() // Convertir firma a base64
        };
        
        // Mostrar estado de carga
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Guardando...';
        submitBtn.disabled = true;
        
        // Enviar datos a Google Sheets
        saveToGoogleSheets(formData)
            .then(response => {
                alert('Usuario registrado correctamente');
                resetForm();
                registerFormPanel.style.display = 'none';
                document.querySelector('.options-panel').style.display = 'grid';
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al guardar: ' + error.message);
            })
            .finally(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
    } else {
        alert('Por favor proporcione su firma');
    }
});

// Guardar en Google Sheets
function saveToGoogleSheets(data) {
    return new Promise((resolve, reject) => {
        google.script.run
            .withSuccessHandler(resolve)
            .withFailureHandler(reject)
            .saveUserData(data);
    });
}

// Cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    window.location.href = "index.html";
});
