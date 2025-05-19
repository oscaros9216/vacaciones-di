registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!signaturePad.isEmpty()) {
        // Obtener la firma en formato PNG sin cabecera
        const signatureData = signaturePad.toDataURL('image/png').split(',')[1];
        
        // Obtener datos del formulario
        const formData = {
            action: 'saveUserData',
            id: document.getElementById('userId').value,
            rol: document.getElementById('userRole').value,
            nombre: document.getElementById('fullName').value,
            firma: signatureData, // Enviamos solo el base64 sin prefijo
            numero_colaborador: document.getElementById('employeeNumber').value,
            fecha_ingreso: document.getElementById('hireDate').value,
            email: document.getElementById('email').value,
            contraseña: document.getElementById('password').value,
            vacaciones: document.getElementById('vacationAuth').value,
            jefe_directo: document.getElementById('managerName').value,
            correo_jefe: document.getElementById('managerEmail').value,
            titulo_evento: document.getElementById('eventTitle').value,
            correos_invitados: document.getElementById('guestEmails').value,
            descripcion: document.getElementById('description').value,
            mensaje: document.getElementById('message').value
        };
        
        // Resto del código de envío...
    }
});
