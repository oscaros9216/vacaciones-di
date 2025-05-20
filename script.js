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
// Variables globales para las firmas
let firmaColaborador, firmaJefe;

// Función para inicializar las firmas
function inicializarFirmas() {
    const canvasColaborador = document.getElementById('firma-colaborador');
    const canvasJefe = document.getElementById('firma-jefe');
    
    // Ajustar tamaño de los canvas (IMPORTANTE para móviles)
    canvasColaborador.width = canvasColaborador.offsetWidth;
    canvasColaborador.height = 200;
    canvasJefe.width = canvasJefe.offsetWidth;
    canvasJefe.height = 200;
    
    // Inicializar SignaturePad
    firmaColaborador = new SignaturePad(canvasColaborador, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 3,
    });
    
    firmaJefe = new SignaturePad(canvasJefe, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 3,
    });
    
    // Ajustar en redimensionamiento
    window.addEventListener('resize', () => {
        canvasColaborador.width = canvasColaborador.offsetWidth;
        canvasJefe.width = canvasJefe.offsetWidth;
    });
}

// Función para borrar firmas
function borrarFirma(tipo) {
    if (tipo === 'colaborador' && firmaColaborador) {
        firmaColaborador.clear();
    } else if (tipo === 'jefe' && firmaJefe) {
        firmaJefe.clear();
    }
}

// Al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    inicializarFirmas();
    
    document.getElementById('registro-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validar firmas antes de enviar
        if (firmaColaborador.isEmpty()) {
            alert('Por favor, ingrese la firma del colaborador');
            return;
        }
        
        if (firmaJefe.isEmpty()) {
            alert('Por favor, ingrese la firma del jefe');
            return;
        }
        
        // Resto del código de envío...
        try {
            const formData = {
                // ...otros campos
                firmaColaborador: firmaColaborador.toDataURL('image/png'),
                firmaJefe: firmaJefe.toDataURL('image/png')
            };
            
            // Envío al servidor...
        } catch (error) {
            console.error('Error:', error);
        }
    });
});
