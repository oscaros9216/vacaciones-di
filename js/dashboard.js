function doPost(e) {
    let response;
    
    try {
        // Parsear datos de entrada
        const data = JSON.parse(e.postData.contents);
        log('Datos recibidos:', data);
        
        // Validar acción
        if (!data.action) {
            throw new Error('Parámetro "action" es requerido');
        }
        
        // Procesar según la acción
        switch(data.action) {
            case 'saveUserData':
                response = saveUserData(data);
                break;
            default:
                throw new Error('Acción no válida');
        }
    } catch (error) {
        console.error('Error en doPost:', error);
        response = {
            success: false,
            message: error.message
        };
    }
    
    // Preparar respuesta
    const output = ContentService.createTextOutput(JSON.stringify(response));
    output.setMimeType(ContentService.MimeType.JSON);
    
    // Headers CORS
    output.setHeaders({
        'Access-Control-Allow-Origin': '*'
    });
    
    return output;
}

function saveUserData(userData) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Colaboradores");
    
    // Validar hoja
    if (!sheet) {
        throw new Error('No se encontró la hoja "Colaboradores"');
    }
    
    // Validar campos requeridos
    const requiredFields = ['id', 'rol', 'nombre', 'email'];
    const missingFields = requiredFields.filter(field => !userData[field]);
    
    if (missingFields.length > 0) {
        throw new Error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
    }
    
    // Preparar fila
    const rowData = [
        userData.id,
        userData.rol,
        userData.nombre,
        userData.firma || '', // Firma en base64
        userData.numero_colaborador || '',
        userData.fecha_ingreso || '',
        userData.email,
        userData.contraseña || '',
        userData.vacaciones || 'Si',
        userData.jefe_directo || '',
        userData.correo_jefe || '',
        '', // Firma jefe (omitida)
        '', // Título evento (opcional)
        '', // Correos invitados (opcional)
        '', // Descripción (opcional)
        ''  // Mensaje (opcional)
    ];
    
    // Guardar datos
    sheet.appendRow(rowData);
    log('Datos guardados en fila:', sheet.getLastRow());
    
    return {
        success: true,
        message: 'Usuario registrado correctamente'
    };
}

function log(...args) {
    console.log(...args);
}
