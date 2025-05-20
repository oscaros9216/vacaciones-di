// Configuración global
const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyI4TwH2l1rrjl5-wR27HRNjRu7jzroC8W5Buf8UasI7Qq2yg0ruGnx9SEzrU5wQTorpA/exec",
  DEBUG_MODE: true
};

// Variables globales
let signaturePad;

// Referencias a elementos del DOM
const elements = {
  registerForm: document.getElementById('registerForm'),
  registerFormPanel: document.getElementById('registerFormPanel'),
  optionsPanel: document.getElementById('optionsPanel'),
  registerUserBtn: document.getElementById('registerUserBtn'),
  cancelBtn: document.getElementById('cancelBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  formMessage: document.getElementById('formMessage'),
  passwordStrength: document.getElementById('passwordStrength'),
  clearSignatureBtn: document.getElementById('clearSignature')
};

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  console.log('Dashboard cargado - Inicializando...');
  checkSession();
  initUI();
  initSignaturePad();
  console.log('Inicialización completada');
});

// Función para enviar datos al backend
async function sendToGoogleScript(data) {
  try {
    if (!navigator.onLine) {
      throw new Error("❌ No hay conexión a Internet");
    }

    console.log("📤 Enviando datos:", data);

    const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data),
      redirect: 'follow'
    });

    if (response.redirected) {
      const redirectedResponse = await fetch(response.url);
      return await redirectedResponse.json();
    }
    
    return await response.json();

  } catch (error) {
    console.error("❌ Error completo:", error);
    throw new Error(`🚨 Error al enviar datos: ${error.message}`);
  }
}

// Manejo del formulario de registro
async function handleFormSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  try {
    // Validaciones
    if (!signaturePad || signaturePad.isEmpty()) {
      throw new Error("✍️ Debes proporcionar tu firma");
    }

    const password = document.getElementById('password').value;
    if (password.length < 4) {
      throw new Error("La contraseña debe tener al menos 4 caracteres");
    }

    // Mostrar estado de carga
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Guardando...';
    showMessage("⏳ Guardando información...", "loading");

    // Preparar datos
    const formData = {
      action: 'saveUserData',
      id: generateUserId(),
      rol: document.getElementById('userRole').value,
      nombre: document.getElementById('fullName').value,
      firma: signaturePad.toDataURL('image/png').split(',')[1],
      numero_colaborador: document.getElementById('employeeNumber').value,
      fecha_ingreso: document.getElementById('hireDate').value,
      email: document.getElementById('email').value,
      contraseña: password,
      vacaciones: document.getElementById('vacationAuth').value,
      jefe_directo: document.getElementById('managerName').value,
      correo_jefe: document.getElementById('managerEmail').value,
      titulo_evento: document.getElementById('eventTitle').value || '',
      correos_invitados: document.getElementById('guestEmails').value || '',
      descripcion: document.getElementById('description').value || '',
      mensaje: document.getElementById('message').value || ''
    };
    
    console.log("Datos a enviar:", formData);

    // Enviar datos
    const response = await sendToGoogleScript(formData);
    console.log("Respuesta del servidor:", response);
    
    // Mostrar resultado
    showMessage("✅ " + response.message, "success");
    setTimeout(() => {
      hideRegisterForm();
      resetForm();
    }, 1500);

  } catch (error) {
    console.error("Error en el formulario:", error);
    showMessage(`❌ Error: ${error.message}`, "error");
    elements.registerForm.classList.add('shake');
    setTimeout(() => elements.registerForm.classList.remove('shake'), 500);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Funciones auxiliares
function generateUserId() {
  return `USR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
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
  if (signaturePad) signaturePad.clear();
  elements.passwordStrength.style.width = '0%';
}

function checkSession() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userEmail = localStorage.getItem('userEmail');

  if (!isLoggedIn || !userEmail) {
    redirectToLogin();
  } else {
    document.getElementById('userEmail').textContent = userEmail;
  }
}

function initUI() {
  // Event listeners
  elements.registerUserBtn?.addEventListener('click', showRegisterForm);
  elements.cancelBtn?.addEventListener('click', hideRegisterForm);
  elements.logoutBtn?.addEventListener('click', logout);
  elements.clearSignatureBtn?.addEventListener('click', () => signaturePad?.clear());
  
  document.getElementById('password')?.addEventListener('input', checkPasswordStrength);
  elements.registerForm?.addEventListener('submit', handleFormSubmit);
}

function initSignaturePad() {
  const canvas = document.getElementById('signaturePad');
  
  if (!canvas) {
    console.error('Canvas para firma no encontrado');
    return;
  }

  signaturePad = new SignaturePad(canvas, {
    backgroundColor: 'rgb(255, 255, 255)',
    penColor: 'rgb(0, 0, 0)',
    minWidth: 1,
    maxWidth: 3
  });

  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);
    signaturePad.clear();
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
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
  if (elements.formMessage) {
    elements.formMessage.textContent = text;
    elements.formMessage.className = `form-message ${type}`;
  }
}

function checkPasswordStrength() {
  const password = this.value;
  let strength = 0;
  
  if (password.length >= 4) strength++;
  if (/\d/.test(password)) strength++;
  if (/[A-Za-z]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const colors = ['#e53e3e', '#f6ad55', '#68d391', '#38a169'];
  elements.passwordStrength.style.width = `${strength * 25}%`;
  elements.passwordStrength.style.backgroundColor = colors[strength - 1] || '#e53e3e';
}
