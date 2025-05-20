// Variables globales para las firmas
let firmaColaborador, firmaJefe;

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    inicializarComponentes();
});

function inicializarComponentes() {
    // 1. Configurar las áreas de firma
    inicializarFirmas();
    
    // 2. Configurar el evento submit del formulario
    const formulario = document.getElementById('registro-form');
    if (formulario) {
        formulario.addEventListener('submit', manejarEnvioFormulario);
    }
    
    // 3. Configurar otros event listeners si es necesario
    document.getElementById('btn-limpiar').addEventListener('click', limpiarFormulario);
}

function inicializarFirmas() {
    try {
        // Configurar canvas para firmas
        const canvasColaborador = document.getElementById('firma-colaborador');
        const canvasJefe = document.getElementById('firma-jefe');
        
        // Ajustar tamaño
        canvasColaborador.width = canvasColaborador.offsetWidth;
        canvasColaborador.height = 150;
        canvasJefe.width = canvasJefe.offsetWidth;
        canvasJefe.height = 150;
        
        // Inicializar SignaturePad
        firmaColaborador = new SignaturePad(canvasColaborador, {
            backgroundColor: 'rgba(255, 255, 255, 0)',
            penColor: 'rgb(0, 0, 0)',
            minWidth: 1,
            maxWidth: 3
        });
        
        firmaJefe = new SignaturePad(canvasJefe, {
            backgroundColor: 'rgba(255, 255, 255, 0)',
            penColor: 'rgb(0, 0, 0)',
            minWidth: 1,
            maxWidth: 3
        });
        
        // Manejar redimensionamiento
        window.addEventListener('resize', function() {
            canvasColaborador.width = canvasColaborador.offsetWidth;
            canvasJefe.width = canvasJefe.offsetWidth;
        });
        
    } catch (error) {
        console.error('Error al inicializar firmas:', error);
        mostrarAlerta('Error al configurar las áreas de firma', 'error');
    }
}

async function manejarEnvioFormulario(evento) {
    evento.preventDefault();
    const formulario = evento.target;
    const botonEnviar = formulario.querySelector('button[type="submit"]');
    
    try {
        // Deshabilitar botón durante el envío
        botonEnviar.disabled = true;
        botonEnviar.textContent = 'Enviando...';
        
        // 1. Validar firmas
        if (firmaColaborador.isEmpty() || firmaJefe.isEmpty()) {
            throw new Error('Ambas firmas son requeridas');
        }
        
        // 2. Obtener datos del formulario
        const datosFormulario = {
            nombre: obtenerValorSeguro('nombre'),
            email: obtenerValorSeguro('email'),
            rol: obtenerValorSeguro('rol'),
            numero: obtenerValorSeguro('numero'),
            fecha: obtenerValorSeguro('fecha'),
            jefe: obtenerValorSeguro('jefe'),
            correoJefe: obtenerValorSeguro('correoJefe'),
            tituloEvento: obtenerValorSeguro('tituloEvento'),
            invitados: obtenerValorSeguro('invitados').split(',').map(item => item.trim()),
            descripcion: obtenerValorSeguro('descripcion'),
            mensaje: obtenerValorSeguro('mensaje'),
            firmaColaborador: firmaColaborador.toDataURL('image/png'),
            firmaJefe: firmaJefe.toDataURL('image/png')
        };
        
        // 3. Validar campos requeridos
        const errores = validarCampos(datosFormulario);
        if (errores.length > 0) {
            throw new Error(errores.join('\n'));
        }
        
        // 4. Enviar datos al backend (Google Apps Script)
        const respuesta = await enviarDatos(datosFormulario);
        
        // 5. Mostrar feedback al usuario
        mostrarAlerta('Formulario enviado correctamente a Colaboradores', 'success');
        
        // 6. Limpiar formulario
        limpiarFormulario();
        
    } catch (error) {
        console.error('Error en el envío:', error);
        mostrarAlerta(error.message, 'error');
    } finally {
        // Restaurar botón
        botonEnviar.disabled = false;
        botonEnviar.textContent = 'Enviar Formulario';
    }
}

function obtenerValorSeguro(id) {
    const elemento = document.getElementById(id);
    return elemento ? elemento.value : '';
}

function validarCampos(datos) {
    const errores = [];
    const camposRequeridos = ['nombre', 'email', 'rol', 'numero', 'fecha', 'jefe', 'correoJefe'];
    
    camposRequeridos.forEach(campo => {
        if (!datos[campo] || datos[campo].trim() === '') {
            errores.push(`El campo ${campo} es obligatorio`);
        }
    });
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (datos.email && !emailRegex.test(datos.email)) {
        errores.push('El email no tiene un formato válido');
    }
    
    if (datos.correoJefe && !emailRegex.test(datos.correoJefe)) {
        errores.push('El correo del jefe no tiene un formato válido');
    }
    
    return errores;
}

async function enviarDatos(datos) {
    try {
        // URL de TU implementación de Apps Script
        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxDoYg7-1BQgLu_IrNr3kUi7KIbr0JJoK9rit2CKxjuokYrDhC7JLXQrTTaMrtcjhbAPg/exec"; // Reemplaza con tu URL
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(datos),
            headers: {
                'Content-Type': 'text/plain' // Importante para Google Apps Script
            },
            mode: 'no-cors'
        });
        
        // En modo 'no-cors' no podemos leer la respuesta, pero sabemos que se envió
        console.log('Datos enviados a Google Sheets');
        return { success: true };
        
    } catch (error) {
        console.error('Error en la solicitud:', error);
        throw new Error('Error de conexión con el servidor');
    }
}

function limpiarFormulario() {
    document.getElementById('registro-form').reset();
    if (firmaColaborador) firmaColaborador.clear();
    if (firmaJefe) firmaJefe.clear();
}

function mostrarAlerta(mensaje, tipo = 'success') {
    // Eliminar alertas anteriores
    const alertaAnterior = document.querySelector('.alerta-flotante');
    if (alertaAnterior) {
        alertaAnterior.remove();
    }
    
    // Crear elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `alerta-flotante alerta-${tipo}`;
    alerta.textContent = mensaje;
    document.body.appendChild(alerta);
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        alerta.style.opacity = '0';
        setTimeout(() => alerta.remove(), 500);
    }, 5000);
}

// Función global para borrar firmas (llamada desde HTML)
function borrarFirma(tipo) {
    if (tipo === 'colaborador' && firmaColaborador) {
        firmaColaborador.clear();
    } else if (tipo === 'jefe' && firmaJefe) {
        firmaJefe.clear();
    }
}
