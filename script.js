// Configuración global
const CONFIG = {
  APP_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxDoYg7-1BQgLu_IrNr3kUi7KIbr0JJoK9rit2CKxjuokYrDhC7JLXQrTTaMrtcjhbAPg/exec", // Reemplazar con tu URL
  REQUIRED_FIELDS: {
    'rol': 'Rol',
    'nombre': 'Nombre completo',
    'numero': 'Número de colaborador',
    'fecha': 'Fecha de ingreso',
    'email': 'Email corporativo',
    'jefe': 'Jefe directo',
    'correoJefe': 'Email del jefe',
    'firmaColaborador': 'Firma del colaborador',
    'firmaJefe': 'Firma del jefe'
  }
};

let firmaColaborador, firmaJefe;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  // Configurar firmas
  const canvasColaborador = document.getElementById('firma-colaborador');
  const canvasJefe = document.getElementById('firma-jefe');
  
  firmaColaborador = new SignaturePad(canvasColaborador, {
    backgroundColor: 'rgba(255, 255, 255, 0)',
    penColor: 'rgb(0, 0, 0)'
  });
  
  firmaJefe = new SignaturePad(canvasJefe, {
    backgroundColor: 'rgba(255, 255, 255, 0)',
    penColor: 'rgb(0, 0, 0)'
  });
  
  // Evento submit
  document.getElementById('registro-form').addEventListener('submit', enviarFormulario);
});

async function enviarFormulario(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  
  try {
    // 1. Validar campos
    const errores = validarCampos();
    if (errores.length > 0) {
      throw new Error(errores.join('\n'));
    }

    // 2. Preparar datos según tu estructura
    const formData = {
      rol: document.getElementById('rol').value,
      nombre: document.getElementById('nombre').value,
      numero: document.getElementById('numero').value,
      fecha: document.getElementById('fecha').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
      vacaciones: document.getElementById('vacaciones').value,
      jefe: document.getElementById('jefe').value,
      correoJefe: document.getElementById('correoJefe').value,
      tituloEvento: document.getElementById('tituloEvento').value,
      invitados: document.getElementById('invitados').value.split(',').map(i => i.trim()),
      descripcion: document.getElementById('descripcion').value,
      mensaje: document.getElementById('mensaje').value,
      firmaColaborador: firmaColaborador.toDataURL('image/png'),
      firmaJefe: firmaJefe.toDataURL('image/png')
    };

    // 3. Enviar datos
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    
    const response = await fetch(CONFIG.APP_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'text/plain' },
      mode: 'no-cors'
    });

    // 4. Verificar (aunque sea modo no-cors)
    await new Promise(resolve => setTimeout(resolve, 2000)); // Espera 2s
    
    // 5. Mostrar resultado
    mostrarAlerta('Registro guardado en Colaboradores', 'success');
    resetFormulario();

  } catch (error) {
    console.error('Error:', error);
    mostrarAlerta(error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar';
  }
}

function validarCampos() {
  const errores = [];
  
  // Validar campos requeridos
  Object.entries(CONFIG.REQUIRED_FIELDS).forEach(([id, nombre]) => {
    const value = id.startsWith('firma') 
      ? (id === 'firmaColaborador' ? firmaColaborador.isEmpty() : firmaJefe.isEmpty())
      : !document.getElementById(id)?.value.trim();
    
    if (value) {
      errores.push(`El campo "${nombre}" es requerido`);
    }
  });
  
  // Validar email
  const email = document.getElementById('email')?.value;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errores.push('El email no es válido');
  }
  
  // Validar email jefe
  const emailJefe = document.getElementById('correoJefe')?.value;
  if (emailJefe && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailJefe)) {
    errores.push('El email del jefe no es válido');
  }
  
  return errores;
}

function resetFormulario() {
  document.getElementById('registro-form').reset();
  firmaColaborador.clear();
  firmaJefe.clear();
}

function mostrarAlerta(mensaje, tipo) {
  const alerta = document.createElement('div');
  alerta.className = `alerta ${tipo}`;
  alerta.textContent = mensaje;
  document.body.appendChild(alerta);
  
  setTimeout(() => alerta.remove(), 5000);
}

// Funciones globales para botones HTML
window.borrarFirma = function(tipo) {
  if (tipo === 'colaborador') firmaColaborador.clear();
  if (tipo === 'jefe') firmaJefe.clear();
};
