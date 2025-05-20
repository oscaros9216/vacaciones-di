// Configuración inicial
const CONFIG = {
  APP_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxDoYg7-1BQgLu_IrNr3kUi7KIbr0JJoK9rit2CKxjuokYrDhC7JLXQrTTaMrtcjhbAPg/exec", // Reemplazar con tu URL
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};

// Variables globales
let firmaColaborador, firmaJefe;

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  try {
    // 1. Inicializar firmas
    const canvasColaborador = document.getElementById('firma-colaborador');
    const canvasJefe = document.getElementById('firma-jefe');
    
    if (!canvasColaborador || !canvasJefe) {
      throw new Error('Elementos canvas no encontrados');
    }

    // Configuración de SignaturePad
    firmaColaborador = new SignaturePad(canvasColaborador, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 1,
      maxWidth: 3
    });

    firmaJefe = new SignaturePad(canvasJefe, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 1,
      maxWidth: 3
    });

    // 2. Configurar evento submit
    const formulario = document.getElementById('registro-form');
    if (formulario) {
      formulario.addEventListener('submit', manejarEnvio);
    }

  } catch (error) {
    console.error('Error en inicialización:', error);
    mostrarAlerta('Error al iniciar el formulario', 'error');
  }
});

// Función principal para manejar el envío
async function manejarEnvio(event) {
  event.preventDefault();
  const boton = event.target.querySelector('button[type="submit"]');
  
  try {
    // Deshabilitar botón
    boton.disabled = true;
    boton.textContent = 'Enviando...';

    // Validaciones
    const datos = obtenerDatosFormulario();
    const errores = validarDatos(datos);
    
    if (errores.length > 0) {
      throw new Error(errores.join('\n'));
    }

    // Envío con reintentos
    await enviarConReintentos(datos);

    // Feedback y reset
    mostrarAlerta('Datos guardados en Colaboradores', 'success');
    resetearFormulario();

  } catch (error) {
    console.error('Error en envío:', error);
    mostrarAlerta(error.message, 'error');
  } finally {
    boton.disabled = false;
    boton.textContent = 'Enviar';
  }
}

// Función para obtener datos del formulario
function obtenerDatosFormulario() {
  return {
    nombre: document.getElementById('nombre')?.value || '',
    email: document.getElementById('email')?.value || '',
    rol: document.getElementById('rol')?.value || '',
    numero: document.getElementById('numero')?.value || '',
    fecha: document.getElementById('fecha')?.value || '',
    jefe: document.getElementById('jefe')?.value || '',
    correoJefe: document.getElementById('correoJefe')?.value || '',
    tituloEvento: document.getElementById('tituloEvento')?.value || '',
    invitados: document.getElementById('invitados')?.value.split(',') || [],
    descripcion: document.getElementById('descripcion')?.value || '',
    mensaje: document.getElementById('mensaje')?.value || '',
    firmaColaborador: firmaColaborador?.toDataURL() || '',
    firmaJefe: firmaJefe?.toDataURL() || ''
  };
}

// Función de validación
function validarDatos(datos) {
  const errores = [];
  const requeridos = ['nombre', 'email', 'firmaColaborador', 'firmaJefe'];

  requeridos.forEach(campo => {
    if (!datos[campo]) errores.push(`El campo ${campo} es requerido`);
  });

  if (datos.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
    errores.push('Email no válido');
  }

  return errores;
}

// Función de envío con reintentos
async function enviarConReintentos(datos, intento = 1) {
  try {
    const response = await fetch(CONFIG.APP_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(datos),
      headers: { 'Content-Type': 'text/plain' },
      mode: 'no-cors'
    });
    
    console.log('Intento', intento, 'Response:', response);
    return response;
    
  } catch (error) {
    if (intento >= CONFIG.MAX_RETRIES) throw error;
    
    await new Promise(resolve => 
      setTimeout(resolve, CONFIG.RETRY_DELAY * intento));
    
    return enviarConReintentos(datos, intento + 1);
  }
}

// Función para resetear
function resetearFormulario() {
  document.getElementById('registro-form').reset();
  firmaColaborador?.clear();
  firmaJefe?.clear();
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo = 'success') {
  const alerta = document.createElement('div');
  alerta.className = `alerta ${tipo}`;
  alerta.textContent = mensaje;
  document.body.appendChild(alerta);
  
  setTimeout(() => {
    alerta.remove();
  }, 5000);
}

// Función global para borrar firmas
window.borrarFirma = function(tipo) {
  if (tipo === 'colaborador') fir
