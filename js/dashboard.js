// Reemplaza la función saveToGoogleSheets con esta versión:
function saveToGoogleSheets(data) {
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyI4TwH2l1rrjl5-wR27HRNjRu7jzroC8W5Buf8UasI7Qq2yg0ruGnx9SEzrU5wQTorpA/exec";
    
    return new Promise((resolve, reject) => {
        // Convertir la firma a una cadena base64 simple
        const formData = {
            ...data,
            firma: data.firma // Ya está en formato base64
        };

        fetch(`${APPS_SCRIPT_URL}?action=saveUserData`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                resolve(data);
            } else {
                reject(new Error(data.message || 'Error desconocido'));
            }
        })
        .catch(error => {
            reject(error);
        });
    });
}
