// Configuración de firmas (asegúrate de tener esto)
const firmaColaborador = new SignaturePad(document.getElementById('firma-colaborador'));
const firmaJefe = new SignaturePad(document.getElementById('firma-jefe'));

// Función para mostrar mensajes al usuario
function mostrarMensaje(tipo, mensaje) {
  const contenedor = document.getElementById('mensajes') || crearContenedorMensajes();
  
  const mensajeElement = document.createElement('div');
  mensajeElement.className = `alert alert-${tipo}`;
  mensajeElement.textContent = mensaje;
  
  contenedor.appendChild(mensajeElement);
  
  // Auto-eliminación después de 5 segundos
  setTimeout(() => mensajeElement.remove(), 5000);
}

function crearContenedorMensajes() {
  const contenedor = document.createElement('div');
  contenedor.id = 'mensajes';
  contenedor.style.position = 'fixed';
  contenedor.style.top = '20px';
  contenedor.style.right = '20px';
  contenedor.style.zIndex = '1000';
  document.body.appendChild(contenedor);
  return contenedor;
}

// Función principal para enviar el formulario
async function enviarFormulario(event) {
  event.preventDefault();
  
  const form = event.target;
  const botonEnviar = form.querySelector('button[type="submit"]');
  
  // Deshabilitar botón durante el envío
  botonEnviar.disabled = true;
  botonEnviar.textContent = 'Enviando...';
  
  try {
    // Validar firmas
    if (firmaColaborador.isEmpty() || firmaJefe.isEmpty()) {
      throw new Error('Ambas firmas son requeridas');
    }
    
    // Preparar datos
    const formData = {
      nombre: form.nombre.value,
      email: form.email.value,
      firmaColaborador: firmaColaborador.toDataURL(),
      firmaJefe: firmaJefe.toDataURL(),
      // Agrega aquí todos los demás campos de tu formulario
    };
    
    // URL de tu Apps Script (¡REEMPLAZA ESTO!)
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqAIH0S-dtKzHrtoQUu36y3Mbd-6tJCJ-Il-dcoePHOdEpCqHdN9H6VKTN3_jYyRgxvg/exec";
    
    // Enviar datos
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Procesar respuesta
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      mostrarMensaje('success', '¡Formulario enviado con éxito!');
      form.reset();
      firmaColaborador.clear();
      firmaJefe.clear();
    } else {
      throw new Error(result.error || 'Error desconocido al guardar');
    }
    
  } catch (error) {
    console.error('Error al enviar formulario:', error);
    mostrarMensaje('error', error.message || 'Error al enviar el formulario');
    
  } finally {
    // Restaurar botón
    botonEnviar.disabled = false;
    botonEnviar.textContent = 'Enviar';
  }
}

// Asignar evento al formulario
document.getElementById('registro-form').addEventListener('submit', enviarFormulario);
