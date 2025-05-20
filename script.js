const form = document.getElementById("registro-form");
const firmaColaborador = new SignaturePad(document.getElementById("firma-colaborador"));
const firmaJefe = new SignaturePad(document.getElementById("firma-jefe"));

function borrarFirma(id) {
  const pad = id === 'firma-colaborador' ? firmaColaborador : firmaJefe;
  pad.clear();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Recoger datos del formulario
  const formData = new FormData(form);

  // Agregar las firmas como imágenes base64
  formData.append("firmaColaborador", firmaColaborador.toDataURL());
  formData.append("firmaJefe", firmaJefe.toDataURL());

  // Convertir a objeto simple
  const data = Object.fromEntries(formData.entries());

  try {
    // Enviar POST con JSON al endpoint de Apps Script
    const res = await fetch("https://script.google.com/macros/s/AKfycbzPWDLF1oxRpIFr25HH52lC4pu91lumsKTmwf7KVziU-QOKkf8kI0izrwBxEpfGuGwjbw/exec", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    });

    // Leer texto de la respuesta
    const text = await res.text();

    if (text === "OK") {
      alert("Formulario enviado con éxito");
      form.reset();
      firmaColaborador.clear();
      firmaJefe.clear();
    } else {
      alert("Error al enviar el formulario: " + text);
    }
  } catch (error) {
    alert("Error al enviar el formulario: " + error.message);
    console.error(error);
  }
});
