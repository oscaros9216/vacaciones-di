document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById("registro-form");
  const firmaColaborador = new SignaturePad(document.getElementById("firma-colaborador"));
  const firmaJefe = new SignaturePad(document.getElementById("firma-jefe"));

  // Configuración de las firmas
  [firmaColaborador, firmaJefe].forEach(pad => {
    pad.minWidth = 1;
    pad.maxWidth = 2;
    pad.penColor = "black";
  });

  function borrarFirma(id) {
    const pad = id === 'firma-colaborador' ? firmaColaborador : firmaJefe;
    pad.clear();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Validar firmas
    if (firmaColaborador.isEmpty() || firmaJefe.isEmpty()) {
      alert("Por favor, complete ambas firmas");
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.firmaColaborador = firmaColaborador.toDataURL();
    data.firmaJefe = firmaJefe.toDataURL();

    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbzPWDLF1oxRpIFr25HH52lC4pu91lumsKTmwf7KVziU-QOKkf8kI0izrwBxEpfGuGwjbw/exec", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
      
      const result = await response.json();
      
      if (result.status === "success") {
        alert("Registro guardado con éxito");
        form.reset();
        firmaColaborador.clear();
        firmaJefe.clear();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert(`Error al guardar: ${error.message}`);
    }
  });
});
