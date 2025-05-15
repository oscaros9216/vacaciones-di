// Configuración
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwLpoig7hpTylq_MrGjP8G82I2V9Upl1JH-7pg2lp-Si45gAQlqTLWUyVgOYLqRJ2m-xw/exec';

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

function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    login(email, password)
      .then(data => {
        if (data.token) {
          // Guardar token y redirigir
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('userRole', data.rol);
          localStorage.setItem('userEmail', data.email);
          window.location.href = 'dashboard.html';
        } else {
          alert('Error: ' + (data.error || 'Credenciales incorrectas'));
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error al iniciar sesión');
      });
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
  const canvas = document.getElementById('firmaCanvas');
  if (canvas) {
    signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)'
    });
    
    document.getElementById('limpiarFirma').addEventListener('click', function() {
      signaturePad.clear();
    });
  }
  
  // Configurar eventos de navegación
  document.getElementById('navColaboradores').addEventListener('click', function(e) {
    e.preventDefault();
    loadColaboradores();
  });
  
  document.getElementById('navRegistro').addEventListener('click', function(e) {
    e.preventDefault();
    showRegistroForm();
  });
  
  document.getElementById('logoutBtn').addEventListener('click', function() {
    logout();
  });
  
  document.getElementById('cancelarRegistro').addEventListener('click', function() {
    hideRegistroForm();
  });
  
  document.getElementById('colaboradorForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveColaborador();
  });
  
  // Cargar lista de colaboradores por defecto
  loadColaboradores();
}

// Funciones de API
async function login(email, password) {
  const response = await fetch(`${SCRIPT_URL}?action=login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
  });
  
  return await response.json();
}

async function loadColaboradores() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${SCRIPT_URL}?action=obtenerColaboradores&token=${token}`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    displayColaboradores(data);
    hideRegistroForm();
  } catch (error) {
    console.error('Error al cargar colaboradores:', error);
    alert('Error al cargar colaboradores: ' + error.message);
  }
}

function displayColaboradores(colaboradores) {
  const container = document.getElementById('colaboradoresList');
  container.innerHTML = '';
  
  if (!colaboradores || colaboradores.length === 0) {
    container.innerHTML = '<p>No hay colaboradores registrados</p>';
    return;
  }
  
  let html = `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h4>Lista de Colaboradores</h4>
        ${currentUser.role === 'admin' ? 
          '<button class="btn btn-sm btn-primary" id="addColaboradorBtn">Agregar Nuevo</button>' : ''}
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Número</th>
                <th>Rol</th>
                <th>Fecha Ingreso</th>
                <th>Email</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
  `;
  
  colaboradores.forEach(col => {
    html += `
      <tr>
        <td>${col.nombre}</td>
        <td>${col.numero}</td>
        <td>${col.rol}</td>
        <td>${col.fechaIngreso}</td>
        <td>${col.email}</td>
        <td>
          ${currentUser.role === 'admin' ? `
            <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${col.id}">Editar</button>
            <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${col.id}">Eliminar</button>
          ` : '--'}
        </td>
      </tr>
    `;
  });
  
  html += `
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Agregar eventos a los botones
  if (currentUser.role === 'admin') {
    document.getElementById('addColaboradorBtn').addEventListener('click', showRegistroForm);
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        editColaborador(id);
      });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        if (confirm('¿Estás seguro de eliminar este colaborador?')) {
          deleteColaborador(id);
        }
      });
    });
  }
}

async function saveColaborador() {
  try {
    const token = localStorage.getItem('authToken');
    const form = document.getElementById('colaboradorForm');
    const id = document.getElementById('colaboradorId').value;
    
    // Obtener firma como imagen base64
    let firma = '';
    if (signaturePad && !signaturePad.isEmpty()) {
      firma = signaturePad.toDataURL();
    }
    
    const formData = {
      token: token,
      rol: document.getElementById('rol').value,
      nombre: document.getElementById('nombre').value,
      firma: firma,
      numero: document.getElementById('numero').value,
      fechaIngreso: document.getElementById('fechaIngreso').value,
      email: document.getElementById('email').value
    };
    
    let url = `${SCRIPT_URL}?action=`;
    url += id ? 'actualizarColaborador' : 'registrarColaborador';
    
    if (id) {
      formData.id = id;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: Object.keys(formData)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(formData[key])}`)
        .join('&')
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    alert('Colaborador guardado correctamente');
    form.reset();
    if (signaturePad) signaturePad.clear();
    loadColaboradores();
  } catch (error) {
    console.error('Error al guardar colaborador:', error);
    alert('Error al guardar colaborador: ' + error.message);
  }
}

// Funciones de UI
function showRegistroForm(colaborador = null) {
  const form = document.getElementById('registroForm');
  const formTitle = document.querySelector('#registroForm .card-header h4');
  const colaboradorId = document.getElementById('colaboradorId');
  
  if (colaborador) {
    formTitle.textContent = 'Editar Colaborador';
    colaboradorId.value = colaborador.id;
    document.getElementById('rol').value = colaborador.rol;
    document.getElementById('nombre').value = colaborador.nombre;
    document.getElementById('numero').value = colaborador.numero;
    document.getElementById('fechaIngreso').value = colaborador.fechaIngreso;
    document.getElementById('email').value = colaborador.email;
    
    if (colaborador.firma && signaturePad) {
      // Cargar firma existente si hay
      const image = new Image();
      image.src = colaborador.firma;
      image.onload = function() {
        signaturePad.clear();
        signaturePad.fromDataURL(colaborador.firma);
      };
    } else if (signaturePad) {
      signaturePad.clear();
    }
  } else {
    formTitle.textContent = 'Registrar Nuevo Colaborador';
    colaboradorId.value = '';
    if (signaturePad) signaturePad.clear();
  }
  
  form.style.display = 'block';
  document.getElementById('colaboradoresList').style.display = 'none';
}

function hideRegistroForm() {
  document.getElementById('registroForm').style.display = 'none';
  document.getElementById('colaboradoresList').style.display = 'block';
  document.getElementById('colaboradorForm').reset();
  if (signaturePad) signaturePad.clear();
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userEmail');
  window.location.href = 'index.html';
}
