// Configuración de firmas
const firmaColaborador = new SignaturePad(document.getElementById('firma-colaborador'));
const firmaJefe = new SignaturePad(document.getElementById('firma-jefe'));

// Función para mostrar mensajes
function showAlert(message, type = 'error') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert ${type}`;
  alertDiv.textContent = message;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => alertDiv.remove(), 5000);
}

// Función para enviar el formulario
async function handleSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  
  // Deshabilitar botón durante el envío
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';
  
  try {
    // Validar firmas
    if (firmaColaborador.isEmpty() || firmaJefe.isEmpty()) {
      throw new Error('Debes completar ambas firmas');
    }
    
    // Preparar datos
    const formData = {
      nombre: form.nombre.value,
      email: form.email.value,
      firmaColaborador: firmaColaborador.toDataURL(),
      firmaJefe: firmaJefe.toDataURL(),
      // Agrega aquí todos los demás campos
    };
    
    // URL de tu Apps Script (¡IMPORTANTE: REEMPLAZA ESTO!)
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqAIH0S-dtKzHrtoQUu36y3Mbd-6tJCJ-Il-dcoePHOdEpCqHdN9H6VKTN3_jYyRgxvg/exec";
    
    // Enviar datos
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow' // Importante para Apps Script
    });
    
    // Procesar respuesta
    const result = await response.json();
    
    if (result.status === 'error') {
      throw new Error(result.message);
    }
    
    // Éxito
    showAlert('¡Formulario enviado con éxito!', 'success');
    form.reset();
    firmaColaborador.clear();
    firmaJefe.clear();
    
  } catch (error) {
    console.error('Error:', error);
    showAlert(error.message || 'Error al enviar el formulario');
    
  } finally {
    // Restaurar botón
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar';
  }
}

// Asignar evento al formulario
document.getElementById('registro-form').addEventListener('submit', handleSubmit);
