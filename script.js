document.getElementById('registro-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = {
    nombre: this.nombre.value,
    email: this.email.value,
    firmaColaborador: firmaColaborador.toDataURL(), // Asume que tienes SignaturePad
    firmaJefe: firmaJefe.toDataURL()
  };

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbxDoYg7-1BQgLu_IrNr3kUi7KIbr0JJoK9rit2CKxjuokYrDhC7JLXQrTTaMrtcjhbAPg/exec', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log("Respuesta del servidor:", result);
    alert(result.message); // Muestra "Datos guardados correctamente"
    
    // Limpiar formulario después del éxito
    this.reset();
    firmaColaborador.clear();
    firmaJefe.clear();
    
  } catch (error) {
    console.error("Error al enviar:", error);
    alert("Error: " + error.message);
  }
});
