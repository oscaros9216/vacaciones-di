// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // 1. Inicializar firmas
    const canvasColaborador = document.getElementById('firma-colaborador');
    const canvasJefe = document.getElementById('firma-jefe');
    
    if (!canvasColaborador || !canvasJefe) {
        console.error('No se encontraron los elementos canvas para firmas');
        return;
    }

    const firmaColaborador = new SignaturePad(canvasColaborador);
    const firmaJefe = new SignaturePad(canvasJefe);

    // 2. Manejar envío del formulario
    const form = document.getElementById('registro-form');
    if (!form) {
        console.error('No se encontró el formulario');
        return;
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // 3. Validar que los campos existan antes de acceder a .value
        const getValue = (id) => {
            const element = document.getElementById(id);
            return element ? element.value : null;
        };

        // 4. Recoger datos de forma segura
        const formData = {
            nombre: getValue('nombre'),
            email: getValue('email'),
            rol: getValue('rol'),
            numero: getValue('numero'),
            fecha: getValue('fecha'),
            jefe: getValue('jefe'),
            correoJefe: getValue('correoJefe'),
            firmaColaborador: firmaColaborador.toDataURL(),
            firmaJefe: firmaJefe.toDataURL()
        };

        // 5. Validar campos requeridos
        if (!formData.nombre || !formData.email) {
            alert('Nombre y email son campos obligatorios');
            return;
        }

        // 6. Enviar datos (ejemplo con fetch)
        try {
            const response = await fetch('TU_URL_APPS_SCRIPT', {
                method: 'POST',
                body: JSON.stringify(formData),
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Error en la respuesta');
            alert('Enviado correctamente');
            form.reset();
            firmaColaborador.clear();
            firmaJefe.clear();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al enviar: ' + error.message);
        }
    });
});

// Función para borrar firmas (ahora accesible globalmente)
function borrarFirma(tipo) {
    if (tipo === 'colaborador' && window.firmaColaborador) {
        window.firmaColaborador.clear();
    } else if (tipo === 'jefe' && window.firmaJefe) {
        window.firmaJefe.clear();
    }
}
