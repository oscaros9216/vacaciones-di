// Inicialización de SignaturePad
const canvasColaborador = document.getElementById('firma-colaborador');
const canvasJefe = document.getElementById('firma-jefe');
const firmaColaborador = new SignaturePad(canvasColaborador);
const firmaJefe = new SignaturePad(canvasJefe);

// Función para borrar firmas
function borrarFirma(tipo) {
    if (tipo === 'colaborador') {
        firmaColaborador.clear();
    } else if (tipo === 'jefe') {
        firmaJefe.clear();
    }
}

// Manejo del envío del formulario
document.getElementById('registro-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    // Mostrar loader
    const loader = document.createElement('div');
    loader.className = 'loader';
    submitBtn.parentNode.insertBefore(loader, submitBtn.nextSibling);

    try {
        // Validar firmas
        if (firmaColaborador.isEmpty() || firmaJefe.isEmpty()) {
            throw new Error('Ambas firmas son requeridas');
        }

        // Preparar datos
        const formData = {
            nombre: e.target.nombre.value,
            email: e.target.email.value,
            rol: e.target.rol.value,
            numero: e.target.numero.value,
            fecha: e.target.fecha.value,
            password: e.target.password.value,
            vacaciones: e.target.vacaciones.value,
            jefe: e.target.jefe.value,
            correoJefe: e.target.correoJefe.value,
            tituloEvento: e.target.tituloEvento.value,
            invitados: e.target.invitados.value.split(',').map(item => item.trim()),
            descripcion: e.target.descripcion.value,
            mensaje: e.target.mensaje.value,
            firmaColaborador: firmaColaborador.toDataURL('image/png'),
            firmaJefe: firmaJefe.toDataURL('image/png')
        };

        // Configuración especial para Google Apps Script
        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxDoYg7-1BQgLu_IrNr3kUi7KIbr0JJoK9rit2CKxjuokYrDhC7JLXQrTTaMrtcjhbAPg/exec";
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'no-cors'
        });

        // Mostrar notificación de éxito
        showAlert('Formulario enviado con éxito', 'success');
        
        // Resetear formulario
        e.target.reset();
        firmaColaborador.clear();
        firmaJefe.clear();

    } catch (error) {
        console.error('Error:', error);
        showAlert(error.message || 'Error al enviar. Por favor intenta nuevamente', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar';
        const loader = document.querySelector('.loader');
        if (loader) loader.remove();
    }
});

// Función para mostrar notificaciones
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.classList.add('fade-out');
        setTimeout(() => alertDiv.remove(), 500);
    }, 3000);
}
