// dashboard.js
document.addEventListener('DOMContentLoaded', function() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const userEmail = localStorage.getItem('userEmail');
  const userRole = localStorage.getItem('userRole');
  
  if (!isLoggedIn || isLoggedIn !== 'true' || !userEmail || !userRole) {
    window.location.href = "index.html";
    return;
  }
  
  // Mostrar información del usuario
  document.getElementById('userInfo').innerHTML = `
    <p>Bienvenido: ${userEmail}</p>
    <p>Rol: ${userRole}</p>
  `;
  
  // Configurar botón de logout
  document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    window.location.href = "index.html";
  });
});
