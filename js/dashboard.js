// Configuración
const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyI4TwH2l1rrjl5-wR27HRNjRu7jzroC8W5Buf8UasI7Qq2yg0ruGnx9SEzrU5wQTorpA/exec",
  DEBUG: true
};

// Elementos del DOM
const elements = {
  form: document.getElementById('registerForm'),
  message: document.getElementById('formMessage')
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  if (elements.form) {
    elements.form.addEventListener('submit', handleFormSubmit);
  }
});

// Manejador del formulario
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  try {
    // Mostrar estado de carga
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Guardando...';
    showMessage('Enviando datos...', 'loading');

    // Preparar datos
    const formData = {
      action: 'saveUserData',
      id: document.getElementById('userId').value,
      rol: document.getElementById('userRole').value,
      nombre: document.getElementById('fullName').value,
      firma: signaturePad.toDataURL().split(',')[1],
      numero_colaborador: document.getElementById('employeeNumber').value,
      fecha_ingreso: document.getElementById('hireDate').value,
      email: document.getElementById('email').value,
      contraseña: document.getElementById('password').value,
      vacaciones: document.getElementById('vacationAuth').value,
      jefe_directo: document.getElementById('managerName').value,
      correo_jefe: document.getElementById('managerEmail').value
    };

    log('Datos a enviar:', formData);

    // Enviar datos
    const response = await sendToGoogleScript(formData);
    log('Respuesta recibida:', response);

    if (response.success) {
      showMessage(response.message, 'success');
      setTimeout(() => {
        hideRegisterForm();
        resetForm();
      }, 1500);
    } else {
      throw new Error(response.message || 'Error desconocido');
    }
  } catch (error) {
    console.error('Error al guardar:', error);
    showMessage(error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Función para enviar datos a Google Script
async function sendToGoogleScript(data) {
  try {
    const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    log('Error en la solicitud:', error);
    throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
  }
}

// Funciones auxiliares
function showMessage(text, type) {
  if (elements.message) {
    elements.message.textContent = text;
    elements.message.className = `form-message ${type}`;
  }
}

function log(...args) {
  if (CONFIG.DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

// Funciones de UI (asegúrate de que existan)
function hideRegisterForm() {
  document.getElementById('registerFormPanel').style.display = 'none';
  document.querySelector('.options-panel').style.display = 'grid';
}

function resetForm() {
  elements.form.reset();
  signaturePad.clear();
}
