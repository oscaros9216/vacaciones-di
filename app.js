// Configuración
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxeCKDgsL_4PgrBUZJ78iVYXacYs_XRcg4xgBudW0mSMy-pfE99yLuhVG2HYAsLG6VKUQ/exec';
const TIMEOUT = 8000; // 8 segundos para timeout de peticiones

// Variables globales
let currentUser = null;
let signaturePad = null;

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si estamos en la página de login o dashboard
  if (document.getElementById('loginForm')) {
    initLoginPage();
  } else {
    initDashboard();
  }
});

// ------------------------- FUNCIONES DE PÁGINA -------------------------

function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      showAlert('Por favor ingresa email y contraseña', 'error');
      return;
    }

    try {
      const loginBtn = document.querySelector('#loginForm button[type="submit"]');
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Iniciando...';
      
      const data = await login(email, password);
      
      if (data.token) {
        // Guardar datos de usuario
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userRole', data.rol);
        localStorage.setItem('userEmail', data.email);
        
        // Redirigir al dashboard
        window.location.href = 'dashboard.html';
      } else {
        showAlert(data.error || 'Credenciales incorrectas', 'error');
      }
    } catch (error) {
      console.error('Error en login:', error);
      showAlert(error.message || 'Error al iniciar sesión', 'error');
    } finally {
      const loginBtn = document.querySelector('#loginForm button[type="submit"]');
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Iniciar sesión';
      }
    }
  });
}

function initDashboard() {
  // Verificar autenticación
  const token = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');
  const userEmail = localStorage.getItem('userEmail');
  
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
  
  currentUser = {
    token,
    role: userRole,
    email: userEmail
  };
  
  // Mostrar email del usuario
  document.getElementById('userEmail').textContent = currentUser.email;
  
  // Mostrar opciones de admin si corresponde
  if (currentUser.role === 'admin') {
    document.getElementById('navAdmin').style.display = 'block';
  }
  
  // Configurar canvas de firma
  initSignaturePad();
  
  // Configurar eventos
  setupEventListeners();
  
  // Cargar lista de colaboradores
  loadColaboradores();
}

// ------------------------- FUNCIONES DE UI -------------------------

function initSignaturePad() {
  const canvas = document.getElementById('firmaCanvas');
  if (canvas) {
    signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)'
    });
    
    // Ajustar canvas al cambiar tamaño de ventana
    window.addEventListener('resize', resizeSignaturePad);
    resizeSignaturePad();
    
    document.getElementById('limpiarFirma').addEventListener('click', function() {
      signaturePad.clear();
    });
  }
}

function resizeSignaturePad() {
  if (signaturePad) {
    const canvas = document.getElementById('firmaCanvas');
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);
    
    signaturePad.clear(); // Limpiar y redibujar en nueva resolución
  }
}

function setupEventListeners() {
  // Navegación
  document.getElementById('navColaboradores')?.addEventListener('click', function(e) {
    e.preventDefault();
    loadColaboradores();
  });
  
  document.getElementById('navRegistro')?.addEventListener('click', function(e) {
    e.preventDefault();
    showRegistroForm();
  });
  
  document.getElementById('logoutBtn')?.addEventListener('click', function() {
    logout();
  });
  
  document.getElementById('cancelarRegistro')?.addEventListener('click', function() {
    hideRegistroForm();
  });
  
  // Formulario de colaborador
  document.getElementById('colaboradorForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    saveColaborador();
  });
}

function showAlert(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  const container = document.getElementById('alertsContainer') || document.body;
  container.prepend(alertDiv);
  
  // Auto-ocultar después de 5 segundos
  setTimeout(() => {
    alertDiv.classList.remove('show');
    setTimeout(() => alertDiv.remove(), 150);
  }, 5000);
}

// ------------------------- FUNCIONES CRUD -------------------------

async function login(email, password) {
  const response = await fetchWithTimeout(
    `${SCRIPT_URL}?action=login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    }
  );
  
  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Error en la respuesta del servidor');
  }
  
  return data;
}

async function loadColaboradores() {
  try {
    showLoading(true);
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No hay sesión activa');
    }
    
    const response = await fetchWithTimeout(
      `${SCRIPT_URL}?action=obtenerColaboradores&token=${token}`
    );
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    displayColaboradores(data);
    hideRegistroForm();
  } catch (error) {
    console.error('Error al cargar colaboradores:', error);
    
    if (error.message.includes('No autorizado') || error.message.includes('sesión')) {
      showAlert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.', 'warning');
      setTimeout(() => logout(), 2000);
    } else {
      showAlert('Error al cargar colaboradores: ' + error.message, 'error');
    }
  } finally {
    showLoading(false);
  }
}

function displayColaboradores(colaboradores) {
  const container = document.getElementById('colaboradoresList');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!colaboradores || colaboradores.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        No hay colaboradores registrados
      </div>
    `;
    return;
  }
  
  let html = `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h4>Lista de Colaboradores</h4>
        ${currentUser.role === 'admin' ? 
          '<button class="btn btn-sm btn
