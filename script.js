async function enviarFormulario(formData) {
  // Mostrar carga
  const submitBtn = document.querySelector('#registro-form button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';

  try {
    // URL de tu Apps Script (REEMPLAZA ESTO)
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzPWDLF1oxRpIFr25HH52lC4pu91lumsKTmwf7KVziU-QOKkf8kI0izrwBxEpfGuGwjbw/exec";
    
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow' // Importante para Google Apps Script
    });

    // Verificar si la redirección ocurrió
    if (response.redirected) {
      const redirectedResponse = await fetch(response.url);
      return await redirectedResponse.json();
    }

    return await response.json();

  } finally {
    // Restaurar botón
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar';
  }
}

// Uso con tu formulario
document.getElementById('registro-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    nombre: e.target.nombre.value,
    email: e.target.email.value,
    firmaColaborador: firmaColaborador.toDataURL(),
    firmaJefe: firmaJefe.toDataURL(),
    // Agrega aquí todos tus campos
  };

  try {
    const result = await enviarFormulario(formData);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    alert(`¡Éxito! Registro guardado para ${result.saved}`);
    e.target.reset();
    firmaColaborador.clear();
    firmaJefe.clear();

  } catch (error) {
    console.error("Error completo:", error);
    alert(`Error al guardar: ${error.message || "Por favor intente nuevamente"}`);
  }
});
