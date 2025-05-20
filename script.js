/**
 * SCRIPT.JS COMPLETO PARA FORMULARIO CON FIRMAS DIGITALES
 * Versión completa sin omisiones con manejo de errores y validaciones
 */

// =============================================
// CONSTANTES Y VARIABLES GLOBALES
// =============================================
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxDoYg7-1BQgLu_IrNr3kUi7KIbr0JJoK9rit2CKxjuokYrDhC7JLXQrTTaMrtcjhbAPg/exec"; // Reemplazar con tu URL real
let firmaColaborador, firmaJefe;

// =============================================
// FUNCIONES DE INICIALIZACIÓN
// =============================================

/**
 * Inicializa los canvas de firma con SignaturePad
 */
function inicializarFirmas() {
    try {
        // Obtener elementos canvas
        const canvasColaborador = document.getElementById('firma-colaborador');
        const canvasJefe = document.getElementById('firma-jefe');

        // Validar que existan los elementos
        if (!canvasColaborador || !canvasJefe) {
            throw new Error('No se encontraron los elementos canvas para las firmas');
        }

        // Configurar tamaño de los canvas
        canvasColaborador.width = canvasColaborador.offsetWidth;
        canvasColaborador.height = 200;
        canvasJefe.width = canvasJefe.offsetWidth;
        canvasJefe.height = 200;

        // Inicializar SignaturePad con configuración
        firmaColaborador = new SignaturePad(canvasColaborador, {
            backgroundColor: 'rgba(255, 255, 255, 0)',
            penColor: 'rgb(0, 0, 0)',
            minWidth: 1,
            maxWidth: 3,
            throttle: 16 // ms
        });

        firmaJefe = new SignaturePad(canvasJefe, {
            backgroundColor: 'rgba(255, 255, 255, 0)',
            penColor: 'rgb(0, 0, 0)',
            minWidth: 1,
            maxWidth: 3,
            throttle: 16
        });

        // Manejar redimensionamiento de ventana
        window.addEventListener('resize', () => {
            canvasColaborador.width = canvasColaborador.offsetWidth;
            canvasJefe.width = canvasJefe.offsetWidth;
        });

    } catch (error) {
        console.error('Error al inicializar firmas:', error);
        mostrarAlerta('Error al configurar las áreas de firma', 'error');
    }
}

// =============================================
// FUNCIONES DE UTILIDAD
// =============================================

/**
 * Borra una firma específica
 * @param {string} tipo - 'colaborador' o 'jefe'
 */
function borrarFirma(tipo) {
    try {
        if (tipo === 'colaborador' && firmaColaborador) {
            firmaColaborador.clear();
        } else if (tipo === 'jefe' && firmaJefe) {
            firmaJefe.clear();
        } else {
            console.warn('Tipo de firma no reconocido o no inicializada');
        }
    } catch (error) {
        console.error('Error al borrar firma:', error);
    }
}

/**
 * Muestra una alerta al usuario
 * @param {string} mensaje - Texto a mostrar
 * @param {string} tipo - 'success' o 'error'
 */
function mostrarAlerta(mensaje, tipo = 'success') {
    try {
        // Eliminar alertas anteriores
        const alertaAnterior = document.querySelector('.alert');
        if (alertaAnterior) {
            alertaAnterior.remove();
        }

        // Crear elemento de alerta
        const alerta = document.createElement('div');
        alerta.className = `alert alert-${tipo}`;
        alerta.textContent = mensaje;
        document.body.appendChild(alerta);

        // Ocultar después de 3 segundos
        setTimeout(() => {
            alerta.style.opacity = '0';
            setTimeout(() => alerta.remove(), 500);
        }, 3000);

    } catch (error) {
        console.error('Error al mostrar alerta:', error);
        alert(mensaje); // Fallback básico
    }
}

/**
 * Obtiene el valor de un elemento del formulario de forma segura
 * @param {string} id - ID del elemento
 * @returns {string} - Valor del campo o string vacío si no existe
 */
function obtenerValorCampo(id) {
    try {
        const elemento = document.getElementById(id);
        return elemento ? elemento.value : '';
    } catch (error) {
        console.error(`Error al obtener valor del campo ${id}:`, error);
        return '';
    }
}

// =============================================
// MANEJO DEL FORMULARIO
// =============================================

/**
 * Valida los datos del formulario antes del envío
 * @param {Object} datos - Datos del formulario
 * @returns {Array} - Lista de errores encontrados
 */
function validarFormulario(datos) {
    const errores = [];

    // Validar campos obligatorios
    if (!datos.nombre.trim()) errores.push('El nombre es obligatorio');
    if (!datos.email.trim()) errores.push('El email es obligatorio');
    if (!datos.rol.trim()) errores.push('El rol es obligatorio');
    if (!datos.numero.trim()) errores.push('El número de colaborador es obligatorio');
    if (!datos.fecha.trim()) errores.push('La fecha es obligatoria');
    if (!datos.jefe.trim()) errores.push('El nombre del jefe es obligatorio');
    if (!datos.correoJefe.trim()) errores.push('El correo del jefe es obligatorio');

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (datos.email && !emailRegex.test(datos.email)) {
        errores.push('El email no tiene un formato válido');
    }
    if (datos.correoJefe && !emailRegex.test(datos.correoJefe)) {
        errores.push('El correo del jefe no tiene un formato válido');
    }

    // Validar firmas
    if (firmaColaborador.isEmpty()) errores.push('La firma del colaborador es requerida');
    if (firmaJefe.isEmpty()) errores.push('La firma del jefe es requerida');

    return errores;
}

/**
 * Prepara los datos del formulario para el envío
 * @returns {Object} - Datos del formulario estructurados
 */
function prepararDatosEnvio() {
    return {
        nombre: obtenerValorCampo('nombre'),
        email: obtenerValorCampo('email'),
        rol: obtenerValorCampo('rol'),
        numero: obtenerValorCampo('numero'),
        fecha: obtenerValorCampo('fecha'),
        jefe: obtenerValorCampo('jefe'),
        correoJefe: obtenerValorCampo('correoJefe'),
        tituloEvento: obtenerValorCampo('tituloEvento'),
        invitados: obtenerValorCampo('invitados').split(',').map(item => item.trim()),
        descripcion: obtenerValorCampo('descripcion'),
        mensaje: obtenerValorCampo('mensaje'),
        firmaColaborador: firmaColaborador.toDataURL('image/png'),
        firmaJefe: firmaJefe.toDataURL('image/png')
    };
}

/**
 * Envía los datos al servidor mediante Fetch API
 * @param {Object} datos - Datos del formulario
 */
async function enviarDatos(datos) {
    try {
        const response = await fetch(APP_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(datos),
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'no-cors'
        });

        // Nota: En modo 'no-cors' no podemos leer la respuesta
        return { success: true };

    } catch (error) {
        console.error('Error en la solicitud fetch:', error);
        throw new Error('Error de conexión con el servidor');
    }
}

/**
 * Maneja el evento submit del formulario
 * @param {Event} event - Evento submit
 */
async function manejarEnvioFormulario(event) {
    event.preventDefault();
    const formulario = event.target;
    const botonEnviar = document.getElementById('submit-btn');

    try {
        // Deshabilitar botón durante el envío
        botonEnviar.disabled = true;
        botonEnviar.textContent = 'Enviando...';

        // Obtener y validar datos
        const datos = prepararDatosEnvio();
        const errores = validarFormulario(datos);

        if (errores.length > 0) {
            throw new Error(errores.join('\n'));
        }

        // Enviar datos
        await enviarDatos(datos);

        // Mostrar éxito y resetear
        mostrarAlerta('Formulario enviado correctamente', 'success');
        formulario.reset();
        firmaColaborador.clear();
        firmaJefe.clear();

    } catch (error) {
        console.error('Error en el envío:', error);
        mostrarAlerta(error.message, 'error');
    } finally {
        // Restaurar botón
        botonEnviar.disabled = false;
        botonEnviar.textContent = 'Enviar Formulario';
    }
}

// =============================================
// INICIALIZACIÓN DE LA APLICACIÓN
// =============================================

/**
 * Configura los event listeners cuando el DOM esté listo
 */
function configurarEventListeners() {
    try {
        const formulario = document.getElementById('registro-form');
        if (!formulario) {
            throw new Error('No se encontró el formulario en el DOM');
        }

        formulario.addEventListener('submit', manejarEnvioFormulario);

        // Configurar botones de borrado
        document.querySelectorAll('.btn-borrar').forEach(boton => {
            boton.addEventListener('click', function() {
                const tipo = this.getAttribute('data-tipo-firma');
                borrarFirma(tipo);
            });
        });

    } catch (error) {
        console.error('Error al configurar event listeners:', error);
        mostrarAlerta('Error al inicializar el formulario', 'error');
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    inicializarFirmas();
    configurarEventListeners();
});
