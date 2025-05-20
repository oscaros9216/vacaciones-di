// script.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registro-form');
  const firmaColaborador = new SignaturePad(document.getElementById('firma-colaborador'));
  const firmaJefe = new SignaturePad(document.getElementById('firma-jefe'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validar firmas
    if (firmaColaborador.isEmpty() || firmaJefe.isEmpty()) {
      alert('Por favor, complete ambas firmas');
      return;
    }

    try {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      // Agregar firmas como imágenes base64
      data.firmaColaborador = firmaColaborador.toDataURL();
      data.firmaJefe = firmaJefe.toDataURL();

      // Enviar datos
      const response = await fetch('https://script.google.com/macros/s/AKfycbzPWDLF1oxRpIFr25HH52lC4pu91lumsKTmwf7KVziU-QOKkf8kI0izrwBxEpfGuGwjbw/exec', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        alert('Registro guardado con éxito!');
        form.reset();
        firmaColaborador.clear();
        firmaJefe.clear();
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error al guardar: ${error.message}`);
    }
  });
});
