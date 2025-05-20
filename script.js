document.getElementById('registro-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Deshabilitar botón para evitar envíos duplicados
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';

  try {
    // 1. Preparar datos del formulario
    const formData = {
      nombre: e.target.nombre.value,
      email: e.target.email.value,
      firmaColaborador: firmaColaborador.toDataURL(), // Asumiendo que usas SignaturePad
      firmaJefe: firmaJefe.toDataURL(),
      // Agrega aquí todos los demás campos
    };

    // 2. URL CORRECTA (¡usa la que acabas de probar!)
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxDoYg7-1BQgLu_IrNr3kUi7KIbr0JJoK9rit2CKxjuokYrDhC7JLXQrTTaMrtcjhbAPg/exec";

    // 3. Enviar datos (configuración especial para Apps Script)
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: { 
        'Content-Type': 'text/plain' // ¡Clave para que funcione!
      },
      redirect: 'follow',
      mode: 'no-cors' // Necesario para evitar bloqueos
    });

    // 4. Mostrar feedback al usuario (aunque no podamos leer la respuesta)
    alert('¡Formulario enviado con éxito! Revisa tu hoja de cálculo.');
    e.target.reset(); // Limpiar formulario
    firmaColaborador.clear();
    firmaJefe.clear();

  } catch (error) {
    console.error('Error:', error);
    alert('Error al enviar. Por favor intenta nuevamente.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar';
  }
});
