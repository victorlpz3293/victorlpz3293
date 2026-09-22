/**
 * Asistente del sitio. El contexto vive en el servidor: aquí solo se envía la pregunta.
 * Nada se inserta con innerHTML; todo el texto se escribe con textContent.
 */
import { cerebroLocal } from './cerebro-local.generado.js';
import { CONTACTO } from './contacto.generado.js';

const MAXIMO_INTERCAMBIOS = 3;
const LARGO_MAXIMO_PREGUNTA = 400;

const MENSAJE_WHATSAPP = `Hola ${CONTACTO.nombre}, vengo de tu sitio web y me gustaría conversar contigo.`;

export function iniciarChat() {
  const ventana = document.getElementById('chat-window');
  const entrada = document.getElementById('chat-input');
  const mensajes = document.getElementById('chat-messages');
  const botonAbrir = document.getElementById('toggle-chat');
  const botonCerrar = document.getElementById('close-chat');
  const botonEnviar = document.getElementById('send-chat');

  if (!ventana || !entrada || !mensajes) return;

  let intercambios = 0;

  botonAbrir?.addEventListener('click', () => {
    const oculto = ventana.classList.toggle('hidden');
    ventana.classList.toggle('flex', !oculto);
    if (!oculto) entrada.focus();
  });

  botonCerrar?.addEventListener('click', () => {
    ventana.classList.add('hidden');
    ventana.classList.remove('flex');
  });

  botonEnviar?.addEventListener('click', enviar);
  entrada.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') enviar();
  });

  /** Convierte **negritas** y saltos de línea en nodos reales. Nunca interpreta HTML. */
  function comoNodos(texto) {
    const fragmento = document.createDocumentFragment();
    texto.split('\n').forEach((linea, indice) => {
      if (indice > 0) fragmento.appendChild(document.createElement('br'));
      for (const trozo of linea.split(/(\*\*[^*]+\*\*)/g)) {
        if (!trozo) continue;
        if (trozo.startsWith('**') && trozo.endsWith('**')) {
          const negrita = document.createElement('b');
          negrita.textContent = trozo.slice(2, -2);
          fragmento.appendChild(negrita);
        } else {
          fragmento.appendChild(document.createTextNode(trozo));
        }
      }
    });
    return fragmento;
  }

  function agregarMensaje(texto, clase, { conFormato = false } = {}) {
    const div = document.createElement('div');
    div.className = clase;
    if (conFormato) div.appendChild(comoNodos(texto));
    else div.textContent = texto;
    mensajes.appendChild(div);
    mensajes.scrollTop = mensajes.scrollHeight;
    return div;
  }

  function agregarNota(texto) {
    const nota = document.createElement('span');
    nota.className = 'chat-nota';
    nota.textContent = texto;
    mensajes.lastElementChild?.appendChild(nota);
  }

  /**
   * Tras el último intercambio el campo queda cerrado y solo quedan los dos botones.
   * El visitante decide si los pulsa: nada se abre solo.
   */
  function cerrarConversacion() {
    entrada.disabled = true;
    entrada.value = '';
    entrada.placeholder = 'Conversación finalizada';
    entrada.setAttribute('aria-disabled', 'true');
    if (botonEnviar) botonEnviar.disabled = true;

    agregarMensaje(
      `Hasta aquí llego con lo que tengo. Para seguir la conversación, escríbele a ${CONTACTO.nombre} por WhatsApp o por correo.`,
      'ai-msg',
    );

    const contenedor = document.createElement('div');
    contenedor.className = 'chat-acciones';

    const whatsapp = document.createElement('a');
    whatsapp.className = 'chat-boton-wa';
    whatsapp.href = `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(MENSAJE_WHATSAPP)}`;
    whatsapp.target = '_blank';
    whatsapp.rel = 'noopener noreferrer';
    whatsapp.textContent = 'Continuar por WhatsApp';

    const correo = document.createElement('a');
    correo.className = 'chat-boton-mail';
    correo.href = `mailto:${CONTACTO.email}`;
    correo.textContent = 'Escribir un correo';

    contenedor.append(whatsapp, correo);
    mensajes.appendChild(contenedor);
    mensajes.scrollTop = mensajes.scrollHeight;
  }

  async function enviar() {
    if (entrada.disabled) return;

    const texto = entrada.value.trim().slice(0, LARGO_MAXIMO_PREGUNTA);
    if (!texto) return;

    agregarMensaje(texto, 'user-msg');
    entrada.value = '';
    entrada.disabled = true;

    const cargando = agregarMensaje('Buscando en el perfil…', 'ai-msg chat-cargando');

    try {
      const respuesta = await fetch('/api/chat-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: texto }),
      });

      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

      const datos = await respuesta.json();
      if (typeof datos?.respuesta !== 'string') throw new Error('Respuesta con formato inesperado');

      cargando.remove();
      agregarMensaje(datos.respuesta, 'ai-msg', { conFormato: true });
    } catch (error) {
      console.error('El asistente en línea no respondió:', error);
      cargando.remove();
      agregarMensaje(cerebroLocal(texto.toLowerCase()), 'ai-msg');
      agregarNota('Respuesta local, sin conexión con el asistente');
    }

    intercambios += 1;

    if (intercambios >= MAXIMO_INTERCAMBIOS) {
      cerrarConversacion();
    } else {
      entrada.disabled = false;
      entrada.focus();
    }
  }
}
