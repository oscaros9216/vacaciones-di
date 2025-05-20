// Configuración global (AJUSTA LA URL)
const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyI4TwH2l1rrjl5-wR27HRNjRu7jzroC8W5Buf8UasI7Qq2yg0ruGnx9SEzrU5wQTorpA/exec",
  DEBUG_MODE: true
};

// Elementos del DOM (sí pertenece al frontend)
const elements = {
  registerForm: document.getElementById("registerForm"),
  // ... (otros elementos)
};

// Función para enviar datos al backend
async function enviarDatosAlBackend(datos) {
  try {
    const respuesta = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

    if (respuesta.redirected) {
      const respuestaRedirigida = await fetch(respuesta.url);
      return await respuestaRedirigida.json();
    }

    return await respuesta.json();
  } catch (error) {
    console.error("Error al enviar datos:", error);
    throw error;
  }
}

// Ejemplo de uso en el formulario
elements.registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const datosFormulario = {
    action: "saveUserData",
    id: generarIdUnico(),
    nombre: document.getElementById("fullName").value,
    email: document.getElementById("email").value,
    // ... (otros campos)
  };

  try {
    const respuesta = await enviarDatosAlBackend(datosFormulario);
    console.log("Respuesta del backend:", respuesta);
    alert("Registro exitoso!");
  } catch (error) {
    console.error("Error:", error);
    alert("Error al guardar: " + error.message);
  }
});
