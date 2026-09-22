/** Interacciones de la página: menú móvil y estado de la barra al desplazar. */

export function iniciarNavegacion() {
  const boton = document.getElementById('boton-menu');
  const menu = document.getElementById('menu-movil');
  if (!boton || !menu) return;

  const cerrar = () => {
    menu.classList.add('hidden');
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-label', 'Abrir el menú');
  };

  boton.addEventListener('click', () => {
    const abierto = !menu.classList.toggle('hidden');
    boton.setAttribute('aria-expanded', String(abierto));
    boton.setAttribute('aria-label', abierto ? 'Cerrar el menú' : 'Abrir el menú');
  });

  menu.querySelectorAll('a').forEach((enlace) => enlace.addEventListener('click', cerrar));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrar();
  });
}
