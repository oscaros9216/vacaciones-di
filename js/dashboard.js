// Debug: Verificar carga
console.log("Dashboard script cargado");
document.getElementById('debugInfo').textContent = "Dashboard script cargado: OK";

// Verificar sesión
function checkSession() {
    console.log("Verificando sesión...");
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    
    // Debug: Mostrar valores de sesión
    const debugInfo = `Valores de sesión:
        isLoggedIn: ${isLoggedIn}
        userEmail: ${userEmail}
        userRole: ${userRole}`;
    
    console.log(debugInfo);
    document.getElementById('debugInfo').innerHTML += `<p>${debugInfo.replace(/\n/g, '<br>')}</p>`;

    if (!isLoggedIn || isLoggedIn !== 'true' || !userEmail || !userRole) {
        console.log("Sesión no válida, redirigiendo...");
        window.location.href = "index.html";
        return false;
    }
    
    // Mostrar información del usuario
    document.getElementById('userInfo').innerHTML = `
        <p><strong>Usuario:</strong> ${userEmail}</p>
        <p><strong>Rol:</strong> ${userRole}</p>
    `;
    
    return true;
}

// Configurar botón de logout
function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', function() {
        console.log("Cerrando sesión...");
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        window.location.href = "index.html";
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM completamente cargado");
    if (checkSession()) {
        setupLogout();
    }
});
