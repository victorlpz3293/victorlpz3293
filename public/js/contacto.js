/**
 * Formulario de contacto sin servidor: arma un mensaje con lo que escribió el visitante
 * y abre WhatsApp con el texto ya puesto. Nada sale de este navegador hacia otro sitio,
 * no hay backend y no se guarda nada.
 *
 * El número llega en data-whatsapp, que la plantilla toma de data/profile.json.
 */

const CAMPOS = [
  ['nombre', 'campo-nombre', 'Nombre'],
  ['correo', 'campo-correo', 'Correo'],
  ['motivo', 'campo-motivo', 'Motivo'],
  ['mensaje', 'campo-mensaje', 'Mensaje'],
];

// Deliberadamente laxo: solo descarta lo que no puede ser una dirección. Validar correos
// a fondo desde el navegador rechaza direcciones válidas y no aporta nada aquí.
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function iniciarContacto() {
  const formulario = document.getElementById('formulario-contacto');
  if (!formulario) return;

  const aviso = document.getElementById('aviso-contacto');
  const telefono = (formulario.dataset.whatsapp ?? '').replace(/\D/g, '');

  const mostrar = (texto, tono) => {
    if (!aviso) return;
    aviso.textContent = texto;
    aviso.classList.remove('hidden', 'aviso-ok', 'aviso-error');
    aviso.classList.add(tono === 'ok' ? 'aviso-ok' : 'aviso-error');
  };

  const ocultar = () => aviso?.classList.add('hidden');

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const valores = {};
    for (const [clave, id] of CAMPOS) {
      valores[clave] = (document.getElementById(id)?.value ?? '').trim();
    }

    const faltantes = CAMPOS.filter(([clave]) => !valores[clave]).map(([, , rotulo]) => rotulo);
    if (faltantes.length) {
      mostrar(`Faltan estos campos: ${faltantes.join(', ')}.`, 'error');
      document.getElementById(CAMPOS.find(([c]) => !valores[c])[1])?.focus();
      return;
    }

    if (!CORREO.test(valores.correo)) {
      mostrar('Revisa el correo: no parece una dirección válida.', 'error');
      document.getElementById('campo-correo')?.focus();
      return;
    }

    if (!telefono) {
      mostrar('No hay un número de WhatsApp configurado. Escríbeme por correo.', 'error');
      return;
    }

    const texto = [
      '*Mensaje desde victorlpz3293.me*',
      '',
      `• *Nombre:* ${valores.nombre}`,
      `• *Correo:* ${valores.correo}`,
      `• *Motivo:* ${valores.motivo}`,
      '',
      valores.mensaje,
    ].join('\n');

    const ventana = window.open(
      `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`,
      '_blank',
      'noopener,noreferrer',
    );

    if (!ventana) {
      // El navegador bloqueó la ventana emergente. El visitante ya escribió todo:
      // no se limpia el formulario, solo se le dice qué pasó.
      mostrar('El navegador bloqueó la ventana de WhatsApp. Permítela e inténtalo de nuevo.', 'error');
      return;
    }

    mostrar('Mensaje listo. Se abrió WhatsApp para que lo envíes.', 'ok');
    formulario.reset();
    setTimeout(ocultar, 8000);
  });

  // Al corregir un campo desaparece el aviso de error anterior.
  formulario.addEventListener('input', () => {
    if (aviso && !aviso.classList.contains('aviso-ok')) ocultar();
  });
}
