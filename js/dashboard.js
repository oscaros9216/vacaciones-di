// Verificar sesión al cargar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard cargado');
    checkSession();
    initUI();
    initSignaturePad();
});

// Elementos del DOM
let signaturePad;
const registerForm = document.getElementById('registerForm');
const registerFormPanel = document.getElementById('registerFormPanel');
const optionsPanel = document.querySelector('.options-panel');
const registerUserBtn = document.getElementById('registerUserBtn');
const requestDayBtn = document.getElementById('requestDayBtn');
const cancelBtn = document.getElementById('cancelBtn');
const logoutBtn = document.getElementById('logoutBtn');

// 1. Verificación de sesión
function checkSession() {
    console.log('Verificando sesión...');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    
    if (!isLoggedIn || isLoggedIn !== 'true' || !userEmail || !userRole) {
        console.warn('Sesión no válida, redirigiendo...');
        window.location.href = "index.html";
        return;
    }
    
    console.log('Usuario autenticado:', userEmail);
    document.getElementById('userEmail').textContent = userEmail;
}

// 2. Inicialización de UI
function initUI() {
    console.log('Inicializando UI...');
    
    // Mostrar formulario de registro
    if (registerUserBtn) {
        registerUserBtn.addEventListener('click', function() {
            console.log('Clic en Registrar Usuario');
            optionsPanel.style.display = 'none';
            registerFormPanel.style.display = 'block';
            generateUserId();
        });
    } else {
        console.error('Botón registerUserBtn no encontrado');
    }

    // Botón cancelar
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            console.log('Clic en Cancelar');
            registerFormPanel.style.display = 'none';
            optionsPanel.style.display = 'grid';
            resetForm();
        });
    }

    // Cerrar sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            console.log('Clic en Cerrar Sesión');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
            window.location.href = "index.html";
        });
    } else {
        console.error('Botón logoutBtn no encontrado');
    }

    // Validar contraseña en tiempo real
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
}

// 3. Firma digital
function initSignaturePad() {
    console.log('Inicializando SignaturePad...');
    const canvas = document.getElementById('signaturePad');
    if (canvas) {
        signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });
        
        document.getElementById('clearSignature').addEventListener('click', function() {
            signaturePad.clear();
        });
    } else {
        console.error('Canvas signaturePad no encontrado');
    }
}

// 4. Generar ID de usuario
function generateUserId() {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    document.getElementById('userId').value = `USR-${timestamp}-${randomNum}`;
    console.log('ID generado:', document.getElementById('userId').value);
}

// 5. Validar fortaleza de contraseña
function checkPasswordStrength() {
    const password = this.value;
    const strengthBar = document.getElementById('passwordStrength');
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/\d/.test(password)) strength++;
    if (/[a-zA-Z]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    const width = strength * 25;
    let color = '#e53e3e'; // Rojo
    if (strength >= 3) color = '#f6ad55'; // Amarillo
    if (strength >= 4) color = '#38a169'; // Verde
    
    strengthBar.style.width = `${width}%`;
    strengthBar.style.backgroundColor = color;
}

// 6. Resetear formulario
function resetForm() {
    console.log('Reseteando formulario...');
    if (registerForm) registerForm.reset();
    if (signaturePad) signaturePad.clear();
    const strengthBar = document.getElementById('passwordStrength');
    if (strengthBar) {
        strengthBar.style.width = '0%';
        strengthBar.style.backgroundColor = '#e53e3e';
    }
}

// 7. Enviar formulario
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Enviando formulario...');
        
        if (!signaturePad || signaturePad.isEmpty()) {
            alert('Por favor proporcione su firma');
            return;
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Guardando...';
        submitBtn.disabled = true;
        
        try {
            const formData = {
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
                titulo_evento: document.getElementById('eventTitle').value,
                correos_invitados: document.getElementById('guestEmails').value,
                descripcion: document.getElementById('description').value,
                mensaje: document.getElementById('message').value
            };
            
            console.log('Datos del formulario:', formData);
            
            const response = await saveToGoogleSheets(formData);
            console.log('Respuesta del servidor:', response);
            
            if (response.success) {
                alert(response.message);
                resetForm();
                registerFormPanel.style.display = 'none';
                optionsPanel.style.display = 'grid';
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al guardar: ' + error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// 8. Guardar en Google Sheets
function saveToGoogleSheets(data) {
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyI4TwH2l1rrjl5-wR27HRNjRu7jzroC8W5Buf8UasI7Qq2yg0ruGnx9SEzrU5wQTorpA/exec";
    
    return fetch(`${APPS_SCRIPT_URL}?action=saveUserData`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        return response.json();
    })
    .then(data => {
        if (!data.success) throw new Error(data.message);
        return data;
    });
}
