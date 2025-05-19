document.addEventListener('DOMContentLoaded', function() {
    // Verificar sesión
    checkSession();
    
    // Configurar botón de logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

function checkSession() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    
    if (!isLoggedIn || isLoggedIn !== 'true' || !userEmail || !userRole) {
        logout();
        return;
    }
    
    // Mostrar información del usuario
    const userInfo = document.getElementById('userInfo');
    userInfo.innerHTML = `
        <p><strong>Usuario:</strong> ${userEmail}</p>
        <p><strong>Rol:</strong> ${userRole}</p>
    `;
    
    // Aquí puedes agregar lógica basada en el rol del usuario
    if (userRole === 'admin') {
        // Mostrar elementos adicionales para admin
    }
}

function logout() {
    // Limpiar localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    
    // Redirigir al login
    window.location.href = "index.html";
}