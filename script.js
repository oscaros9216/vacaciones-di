const form = document.getElementById("registro-form");
const firmaColaborador = new SignaturePad(document.getElementById("firma-colaborador"));
const firmaJefe = new SignaturePad(document.getElementById("firma-jefe"));

function borrarFirma(id) {
  const canvas = document.getElementById(id);
  const pad = id === 'firma-colaborador' ? firmaColaborador : firmaJefe;
  pad.clear();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const formData = new FormData(form);
  formData.append("firmaColaborador", firmaColaborador.toDataURL());
  formData.append("firmaJefe", firmaJefe.toDataURL());

  const data = Object.fromEntries(formData.entries());

  try {
    await fetch("https://script.google.com/macros/s/AKfycbzWlLi4JlzZwOI1azLRrGJ4CeTTvSzmzW6caVzA-Kzv100tY66anXS2nxGx7zzXeKRC4A/exec", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    });
    alert("Formulario enviado con éxito");
    form.reset();
    firmaColaborador.clear();
    firmaJefe.clear();
  } catch (error) {
    alert("Error al enviar el formulario");
    console.error(error);
  }
});
