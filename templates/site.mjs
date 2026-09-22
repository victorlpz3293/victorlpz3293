/**
 * Plantilla de public/index.html. Recibe profile.json y devuelve el HTML completo.
 *
 * Todo texto pasa por esc(). No se emiten atributos style en línea: la CSP no los permite.
 */
import { fecha, fechaCorta, esc } from '../scripts/lib/formato.mjs';

const ICONOS = {
  whatsapp:
    '<path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.17c-.25.69-1.44 1.32-1.99 1.36-.53.04-1.02.23-3.44-.72-2.9-1.14-4.73-4.1-4.87-4.29-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09.99-2.37.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.57.81 1.97.88 2.11.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.16-.3.36-.42.48-.14.14-.29.29-.12.57.16.28.73 1.2 1.56 1.95 1.07.95 1.98 1.25 2.26 1.39.28.14.44.12.61-.07.16-.19.7-.82.89-1.1.19-.28.37-.23.63-.14.26.09 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.68-.18 1.37Z"/>',
  correo:
    '<path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.24-8 4.72-8-4.72V6l8 4.72L20 6v2.24Z"/>',
  linkedin:
    '<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05c.53-1 1.83-2.05 3.76-2.05 4.02 0 4.76 2.64 4.76 6.08V21h-4v-5.5c0-1.31-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V21h-4V9Z"/>',
  github:
    '<path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10Z"/>',
  descarga: '<path d="M12 3v10.17l3.59-3.58L17 11l-5 5-5-5 1.41-1.41L12 13.17V3ZM5 19h14v2H5z"/>',
  ubicacion:
    '<path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/>',
  menu: '<path d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z"/>',
  cerrar: '<path d="m19 6.41-1.41-1.41L12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z"/>',
  chat: '<path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2ZM7 9h10v2H7V9Zm0 4h7v2H7v-2Z"/>',
};

const icono = (nombre, clases = 'w-5 h-5') =>
  `<svg class="${clases}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICONOS[nombre]}</svg>`;

const SECCIONES = [
  ['resumen', 'Resumen'],
  ['experiencia', 'Experiencia'],
  ['proyectos', 'Proyectos'],
  ['habilidades', 'Habilidades'],
  ['formacion', 'Formación'],
  ['contacto', 'Contacto'],
];

const ROTULO_EVIDENCIA = {
  produccion: 'Aplicado en entornos de producción',
  laboratorio: 'Entornos de laboratorio y académicos',
  formacion: 'Estudiado, sin experiencia laboral',
  proyecto_propio: 'Proyectos propios, desarrollados con asistencia de IA',
};

const logo = `<svg class="w-10 h-10" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="#0f172a" stroke="#06b6d4" stroke-width="4"/>
        <path d="M25 35 L40 70 L55 35 M50 70 L62 42 Q68 32 75 42 T62 70" fill="none" stroke="#f8fafc"
              stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;

export function render(perfil, opciones = {}) {
  const { hayPdf = false } = opciones;
  const { identidad, resumen, experiencia, educacion, formacion, habilidades, proyectos, nitsc } = perfil;

  const whatsapp = (identidad.telefono ?? '').replace(/\D/g, '');
  const saludoWa = encodeURIComponent(`Hola ${identidad.nombre}, vengo de tu sitio web y me gustaría conversar contigo.`);
  const enlaceWa = `https://wa.me/${whatsapp}?text=${saludoWa}`;

  // --- Navegación ---

  const enlacesNav = SECCIONES.map(
    ([id, texto]) => `<a class="enlace-nav" href="#${id}">${esc(texto)}</a>`,
  ).join('\n          ');

  const enlacesNavMovil = SECCIONES.map(
    ([id, texto]) =>
      `<a class="block py-2 px-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" href="#${id}">${esc(texto)}</a>`,
  ).join('\n        ');

  // --- Experiencia ---

  const bloquesExperiencia = experiencia
    .map((puesto) => {
      const periodo = `${fechaCorta(puesto.desde)} – ${fechaCorta(puesto.hasta)}`;
      const lugar = puesto.ubicacion ? ` · ${esc(puesto.ubicacion)}` : '';
      const contexto = puesto.contexto
        ? `<p class="text-sm text-slate-400 mt-3">${esc(puesto.contexto)}</p>`
        : '';
      const logros = puesto.logros
        .map((l) => {
          // Algunos logros ya dicen "en curso" en su propio texto; no se repite la insignia.
          const curso =
            l.estado === 'en_curso' && !/en curso/i.test(l.texto)
              ? ' <span class="insignia-estado">En curso</span>'
              : '';
          return `<li class="text-sm text-slate-300 leading-relaxed">${esc(l.texto)}${curso}</li>`;
        })
        .join('\n              ');
      const tecnologias = puesto.tecnologias?.length
        ? `<div class="flex flex-wrap gap-1.5 mt-5">${puesto.tecnologias
            .map((t) => `<span class="insignia">${esc(t)}</span>`)
            .join('')}</div>`
        : '';

      return `<article class="tarjeta p-6 sm:p-8">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <h3 class="text-lg font-bold text-white">${esc(puesto.cargo)}</h3>
              <span class="text-xs text-slate-400">${esc(periodo)}</span>
            </div>
            <p class="text-marca-cyan text-sm font-medium mt-1">${esc(puesto.empresa)}${lugar}</p>
            ${contexto}
            <ul class="mt-4 space-y-2.5 list-disc list-outside pl-5 marker:text-marca-cyan/60">
              ${logros}
            </ul>
            ${tecnologias}
          </article>`;
    })
    .join('\n\n          ');

  // --- Proyectos ---

  const bloquesProyectos = proyectos
    .filter((p) => p.mostrar)
    .map((proyecto) => {
      const marca = proyecto.marca ? `<span class="insignia">${esc(proyecto.marca)}</span>` : '';
      const lab =
        proyecto.evidencia === 'laboratorio'
          ? '<span class="insignia-lab">Laboratorio</span>'
          : '';
      const ia = proyecto.desarrollo
        ? '<span class="insignia-ia">Desarrollado con asistencia de IA</span>'
        : '';
      const contexto = proyecto.contexto
        ? `<p class="text-xs text-slate-500 mt-1">${esc(proyecto.contexto)}</p>`
        : '';
      const destacable = proyecto.destacable?.length
        ? `<ul class="mt-4 space-y-1.5 list-disc list-outside pl-5 marker:text-marca-cyan/60">${proyecto.destacable
            .map((d) => `<li class="text-xs text-slate-400 leading-relaxed">${esc(d)}</li>`)
            .join('')}</ul>`
        : '';
      const sitio = proyecto.url
        ? `<a class="text-xs text-marca-cyan hover:underline mt-4 inline-block" href="${esc(proyecto.url)}"
                 target="_blank" rel="noopener noreferrer">Ver el sitio</a>`
        : '';

      return `<article class="tarjeta p-6 flex flex-col">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-base font-bold text-white">${esc(proyecto.nombre)}</h3>
              ${marca}
            </div>
            ${contexto}
            <p class="text-sm text-slate-400 mt-3 leading-relaxed">${esc(proyecto.descripcion)}</p>
            ${destacable}
            <div class="flex flex-wrap gap-1.5 mt-4">${proyecto.stack
              .map((s) => `<span class="insignia">${esc(s)}</span>`)
              .join('')}</div>
            <div class="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-800">
              <span class="insignia-estado">${esc(proyecto.estado)}</span>
              ${lab}
              ${ia}
            </div>
            ${sitio}
          </article>`;
    })
    .join('\n\n          ');

  // --- Habilidades, agrupadas por evidencia ---

  const bloquesHabilidades = ['produccion', 'proyecto_propio', 'laboratorio', 'formacion']
    .map((tipo) => {
      const grupo = habilidades.filter((h) => h.evidencia === tipo);
      if (!grupo.length) return '';

      const filas = grupo
        .map(
          (h) => `<div class="py-4 border-b border-slate-800 last:border-0">
                <h4 class="text-sm font-semibold text-white">${esc(h.categoria)}</h4>
                <div class="flex flex-wrap gap-1.5 mt-2">${h.items
                  .map((i) => `<span class="insignia">${esc(i)}</span>`)
                  .join('')}</div>
              </div>`,
        )
        .join('\n              ');

      return `<div class="tarjeta p-6 break-inside-avoid mb-6">
              <p class="etiqueta-seccion">${esc(ROTULO_EVIDENCIA[tipo])}</p>
              <div class="mt-2">
              ${filas}
              </div>
            </div>`;
    })
    .filter(Boolean)
    .join('\n\n          ');

  // --- Educación y formación ---

  const bloquesEducacion = educacion
    .map(
      (e) => `<div class="tarjeta p-6">
              <h3 class="text-base font-bold text-white">${esc(e.titulo)}</h3>
              <p class="text-sm text-marca-cyan mt-1">${esc(e.institucion)}</p>
              <p class="text-xs text-slate-400 mt-2">${esc(e.estado)}</p>
            </div>`,
    )
    .join('\n\n            ');

  const filaFormacion = (f) => {
    const horas = f.horas ? ` · ${f.horas} h` : '';
    const credencial = f.id_credencial ? ` · ID ${esc(f.id_credencial)}` : '';
    return `<li class="py-3 border-b border-slate-800 last:border-0">
                <p class="text-sm text-slate-200">${esc(f.nombre)}</p>
                <p class="text-xs text-slate-500 mt-0.5">${esc(f.institucion)} · ${esc(fecha(f.fecha))}${horas}${credencial}</p>
              </li>`;
  };

  const destacadas = formacion.filter((f) => f.destacar);
  const resto = formacion.filter((f) => !f.destacar);

  const agrupada = (perfil.formacion_agrupada ?? [])
    .map(
      (g) =>
        `<p class="text-xs text-slate-500 mt-4">${esc(g.nombre)} — ${esc(g.institucion)}${
          g.periodo ? ` (${esc(g.periodo)})` : ''
        }.</p>`,
    )
    .join('\n          ');

  // --- Documento ---

  const descripcion = resumen.corto;
  const tituloPagina = `${identidad.nombre} — ${identidad.titular.split('|')[0].trim()}`;
  const ogImagen = `${identidad.web.replace(/\/$/, '')}/assets/og-victor-lopez.jpg`;

  const botonPdf = hayPdf
    ? `<a class="boton-secundario" href="cv-victor-lopez.pdf" download>
              ${icono('descarga')} Descargar CV
            </a>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(tituloPagina)}</title>
  <meta name="description" content="${esc(descripcion)}">
  <link rel="canonical" href="${esc(identidad.web)}">

  <meta property="og:type" content="profile">
  <meta property="og:title" content="${esc(tituloPagina)}">
  <meta property="og:description" content="${esc(descripcion)}">
  <meta property="og:url" content="${esc(identidad.web)}">
  <meta property="og:image" content="${esc(ogImagen)}">
  <meta property="og:locale" content="es_NI">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(tituloPagina)}">
  <meta name="twitter:description" content="${esc(descripcion)}">
  <meta name="twitter:image" content="${esc(ogImagen)}">

  <link rel="icon" type="image/svg+xml" href="assets/icono.svg">
  <link rel="preload" href="assets/fonts/inter-variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="css/estilo.css">
</head>

<body>
  <a class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-lg"
     href="#resumen">Saltar al contenido</a>

  <header class="fixed top-0 left-0 w-full z-40 bg-marca-fondo/90 backdrop-blur border-b border-slate-800 no-imprimir">
    <nav class="contenedor flex items-center justify-between h-20" aria-label="Principal">
      <a class="flex items-center gap-3" href="#inicio">
        ${logo}
        <span class="font-titulo font-bold text-white tracking-tight">${esc(identidad.nombre)}</span>
      </a>

      <div class="hidden md:flex items-center gap-7">
          ${enlacesNav}
      </div>

      <button id="boton-menu" class="md:hidden p-2 text-slate-300 hover:text-white"
              aria-expanded="false" aria-controls="menu-movil" aria-label="Abrir el menú">
        ${icono('menu', 'w-6 h-6')}
      </button>
    </nav>

    <div id="menu-movil" class="hidden md:hidden border-t border-slate-800 px-4 py-3 space-y-1">
        ${enlacesNavMovil}
    </div>
  </header>

  <main>
    <!-- Inicio -->
    <section id="inicio" class="contenedor pt-32 pb-20 sm:pt-40 sm:pb-24">
      <div class="grid lg:grid-cols-12 gap-12 items-center">
        <div class="lg:col-span-7">
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            ${esc(identidad.nombre)}
          </h1>
          <p class="text-lg sm:text-xl text-marca-cyan mt-4 font-medium">${esc(identidad.titular)}</p>
          <p class="text-base text-slate-400 mt-6 leading-relaxed max-w-2xl">${esc(resumen.corto)}</p>

          <div class="flex flex-wrap gap-3 mt-8">
            <a class="boton-principal" href="${esc(enlaceWa)}" target="_blank" rel="noopener noreferrer">
              ${icono('whatsapp')} Escribir por WhatsApp
            </a>
            ${botonPdf}
          </div>

          <p class="flex items-center gap-2 text-sm text-slate-500 mt-6">
            ${icono('ubicacion', 'w-4 h-4')} ${esc(identidad.ubicacion)}
          </p>
        </div>

        <div class="lg:col-span-5 flex justify-center">
          <div class="tarjeta p-8 w-full max-w-sm text-center">
            <img class="w-32 h-32 rounded-full object-cover mx-auto border-4 border-slate-800"
                 src="assets/perfil.webp" width="128" height="128"
                 alt="Retrato de ${esc(identidad.nombre)}" loading="eager" decoding="async">
            <h2 class="text-xl font-bold text-white mt-5">${esc(identidad.nombre)}</h2>
            <p class="text-sm text-slate-400 mt-2">${esc(educacion[0].titulo)} — ${esc(educacion[0].estado)}</p>
            <p class="text-xs text-slate-500 mt-4">${esc(identidad.disponibilidad ?? '')}</p>

            <div class="flex justify-center gap-3 mt-6 pt-6 border-t border-slate-800">
              <a class="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                 href="${esc(identidad.linkedin)}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                ${icono('linkedin')}
              </a>
              <a class="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                 href="${esc(identidad.github)}" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                ${icono('github')}
              </a>
              <a class="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                 href="mailto:${esc(identidad.email)}" aria-label="Correo">
                ${icono('correo')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Resumen -->
    <section id="resumen" class="contenedor py-16 border-t border-slate-900">
      <p class="etiqueta-seccion">Sobre mí</p>
      <h2 class="titulo-seccion">Resumen profesional</h2>
      <div class="mt-6 max-w-3xl space-y-4">
        <p class="text-base text-slate-300 leading-relaxed">${esc(resumen.largo)}</p>
        ${resumen.origen ? `<p class="text-base text-slate-400 leading-relaxed">${esc(resumen.origen)}</p>` : ''}
      </div>
    </section>

    <!-- Experiencia -->
    <section id="experiencia" class="contenedor py-16 border-t border-slate-900">
      <p class="etiqueta-seccion">Trayectoria</p>
      <h2 class="titulo-seccion">Experiencia</h2>
      <div class="mt-8 space-y-6">
          ${bloquesExperiencia}
      </div>
    </section>

    <!-- Proyectos -->
    <section id="proyectos" class="contenedor py-16 border-t border-slate-900">
      <p class="etiqueta-seccion">Trabajo propio</p>
      <h2 class="titulo-seccion">Proyectos</h2>
      <p class="text-sm text-slate-400 mt-4 max-w-3xl leading-relaxed">
        Los proyectos de software los desarrollo con asistencia de IA. Mi aporte está en el diseño,
        la infraestructura, el despliegue y la operación.
      </p>
      <!-- items-start: cada tarjeta conserva su alto natural. Las descripciones van de 75 a 355
           caracteres y unas traen lista de puntos destacados; con el estirado por omisión, las
           tarjetas cortas quedaban con cientos de píxeles en blanco al compartir fila con la más alta. -->
      <div class="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          ${bloquesProyectos}
      </div>
      ${
        nitsc
          ? `<div class="tarjeta p-6 mt-6">
            <h3 class="text-base font-bold text-white">${esc(nitsc.nombre)}</h3>
            <p class="text-sm text-slate-400 mt-2 leading-relaxed">${esc(nitsc.presentacion)}</p>
            ${
              nitsc.web
                ? `<a class="text-xs text-marca-cyan hover:underline mt-3 inline-block"
                     href="${esc(nitsc.web)}" target="_blank" rel="noopener noreferrer">${esc(nitsc.web)}</a>`
                : ''
            }
          </div>`
          : ''
      }
    </section>

    <!-- Habilidades -->
    <section id="habilidades" class="contenedor py-16 border-t border-slate-900">
      <p class="etiqueta-seccion">Qué sé hacer</p>
      <h2 class="titulo-seccion">Habilidades</h2>
      <p class="text-sm text-slate-400 mt-4 max-w-3xl leading-relaxed">
        Agrupadas según dónde las he aplicado, para que se distinga lo hecho en un empleo real
        de lo probado en laboratorio y de lo que solo he estudiado.
      </p>
      <!-- Multi-columna y no grid: los grupos tienen tamaños muy distintos (producción trae siete
           categorías, los demás una). Un grid alinearía filas y dejaría medio ancho vacío; las
           columnas se reparten las tarjetas y se compensan solas.
           Dos columnas y no tres: con cuatro tarjetas tan desiguales, la tercera queda vacía. -->
      <div class="mt-8 columns-1 md:columns-2 gap-6">
          ${bloquesHabilidades}
      </div>
    </section>

    <!-- Formación -->
    <section id="formacion" class="contenedor py-16 border-t border-slate-900">
      <p class="etiqueta-seccion">Estudios</p>
      <h2 class="titulo-seccion">Educación y formación</h2>

      <div class="mt-8 grid sm:grid-cols-2 gap-6">
            ${bloquesEducacion}
      </div>

      <div class="tarjeta p-6 mt-6">
        <h3 class="text-sm font-semibold text-white">Formación destacada</h3>
        <ul class="mt-2">
              ${destacadas.map(filaFormacion).join('\n              ')}
        </ul>
      </div>

      <details class="tarjeta p-6 mt-6">
        <summary class="text-sm font-semibold text-white cursor-pointer">
          Otras ${resto.length} formaciones
        </summary>
        <ul class="mt-2">
              ${resto.map(filaFormacion).join('\n              ')}
        </ul>
      </details>

      ${agrupada}

      <div class="tarjeta p-6 mt-6">
        <h3 class="text-sm font-semibold text-white">Idiomas</h3>
        <p class="text-sm text-slate-400 mt-2">
          ${identidad.idiomas.map((i) => `${esc(i.idioma)}: ${esc(i.nivel)}`).join(' · ')}
        </p>
      </div>
    </section>

    <!-- Contacto -->
    <section id="contacto" class="contenedor py-16 border-t border-slate-900">
      <p class="etiqueta-seccion">Hablemos</p>
      <h2 class="titulo-seccion">Contacto</h2>
      <p class="text-sm text-slate-400 mt-4 max-w-2xl leading-relaxed">
        ¿Una vacante, una colaboración o una consulta técnica? Escríbeme por el canal que prefieras.
      </p>

      <div class="mt-8 grid lg:grid-cols-5 gap-8 items-start">
        <!-- El formulario no envía nada a ningún servidor: arma el texto y abre WhatsApp.
             Por eso no hay backend, ni almacenamiento, ni datos de terceros en tránsito. -->
        <form id="formulario-contacto" class="tarjeta p-6 sm:p-8 lg:col-span-3 space-y-5" novalidate
              data-whatsapp="${esc(whatsapp)}">
          <div class="grid sm:grid-cols-2 gap-5">
            <div>
              <label class="etiqueta-campo" for="campo-nombre">Nombre completo</label>
              <input id="campo-nombre" name="nombre" type="text" required maxlength="80"
                     autocomplete="name" placeholder="Ej. Juan Pérez" class="campo mt-2">
            </div>
            <div>
              <label class="etiqueta-campo" for="campo-correo">Correo electrónico</label>
              <input id="campo-correo" name="correo" type="email" required maxlength="120"
                     autocomplete="email" placeholder="ejemplo@correo.com" class="campo mt-2">
            </div>
          </div>

          <div>
            <label class="etiqueta-campo" for="campo-motivo">Motivo de contacto</label>
            <select id="campo-motivo" name="motivo" required class="campo mt-2">
              <option value="" disabled selected>Selecciona una opción</option>
              <option value="Oportunidad laboral">Oportunidad laboral</option>
              <option value="Propuesta de colaboración">Propuesta de colaboración</option>
              <option value="Consulta técnica">Consulta técnica</option>
              <option value="Saludar y conectar">Saludar y conectar</option>
              <option value="Otro asunto">Otro asunto</option>
            </select>
          </div>

          <div>
            <label class="etiqueta-campo" for="campo-mensaje">Mensaje</label>
            <textarea id="campo-mensaje" name="mensaje" rows="5" required maxlength="1200"
                      placeholder="Cuéntame en qué puedo ayudarte." class="campo mt-2 resize-none"></textarea>
          </div>

          <button class="boton-principal w-full" type="submit">
            ${icono('whatsapp')} Enviar por WhatsApp
          </button>

          <p class="text-xs text-slate-500">
            Al enviar se abre WhatsApp con el mensaje ya escrito. Nada se guarda en este sitio.
          </p>

          <p id="aviso-contacto" class="hidden text-sm rounded-xl px-4 py-3" role="status" aria-live="polite"></p>
        </form>

        <div class="lg:col-span-2">
          <p class="text-sm text-slate-400 leading-relaxed">
            Si prefieres, escríbeme directamente por cualquiera de estos canales.
          </p>
          <div class="flex flex-col gap-3 mt-5">
            <a class="boton-principal" href="${esc(enlaceWa)}" target="_blank" rel="noopener noreferrer">
              ${icono('whatsapp')} WhatsApp
            </a>
            <a class="boton-secundario" href="mailto:${esc(identidad.email)}">
              ${icono('correo')} ${esc(identidad.email)}
            </a>
            <a class="boton-secundario" href="${esc(identidad.linkedin)}" target="_blank" rel="noopener noreferrer">
              ${icono('linkedin')} LinkedIn
            </a>
            <a class="boton-secundario" href="${esc(identidad.github)}" target="_blank" rel="noopener noreferrer">
              ${icono('github')} GitHub
            </a>
          </div>
          <p class="flex items-center gap-2 text-sm text-slate-500 mt-6">
            ${icono('ubicacion', 'w-4 h-4')} ${esc(identidad.ubicacion)}
          </p>
        </div>
      </div>
    </section>
  </main>

  <footer class="border-t border-slate-900 py-10 no-imprimir">
    <div class="contenedor flex flex-col sm:flex-row items-center justify-between gap-4">
      <p class="text-xs text-slate-600">© ${new Date().getFullYear()} ${esc(identidad.nombre)}</p>
      <p class="text-xs text-slate-600">
        Esta página se genera desde <code class="text-slate-500">data/profile.json</code>
      </p>
    </div>
  </footer>

  <!-- WhatsApp flotante. Abajo a la izquierda: el asistente ocupa la esquina derecha. -->
  <div class="fixed bottom-6 left-6 z-40 no-imprimir">
    <a class="grupo-flotante flotante-wa flex items-center justify-center w-14 h-14 rounded-full
              bg-green-600 hover:bg-green-500 text-white shadow-2xl transition-colors"
       href="${esc(enlaceWa)}" target="_blank" rel="noopener noreferrer"
       aria-label="Escribir por WhatsApp">
      ${icono('whatsapp', 'w-7 h-7')}
      <span class="globo-flotante">Conectar por WhatsApp</span>
    </a>
  </div>

  <!-- Asistente -->
  <div class="fixed bottom-6 right-6 z-50 no-imprimir">
    <div id="chat-window"
         class="hidden flex-col w-[min(22rem,calc(100vw-3rem))] h-[30rem] mb-4 rounded-2xl overflow-hidden
                bg-marca-hondo border border-slate-800 shadow-2xl">
      <div class="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-marca-azul to-marca-cyan">
        <span class="font-titulo font-bold text-white text-sm">Asistente del sitio</span>
        <button id="close-chat" class="p-1 text-white/90 hover:text-white" aria-label="Cerrar el asistente">
          ${icono('cerrar', 'w-5 h-5')}
        </button>
      </div>

      <div id="chat-messages" class="flex-1 flex flex-col gap-3 p-4 overflow-y-auto bg-slate-900/40">
        <div class="ai-msg">
          Respondo preguntas sobre la experiencia, la formación y los proyectos de
          ${esc(identidad.nombre)}, usando solo lo que está publicado en esta página.
        </div>
      </div>

      <div class="flex gap-2 p-3 border-t border-slate-800">
        <label class="sr-only" for="chat-input">Tu pregunta</label>
        <input id="chat-input" type="text" maxlength="400" placeholder="Escribe tu pregunta…"
               class="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white
                      placeholder-slate-600 outline-none focus:border-marca-cyan">
        <button id="send-chat" class="px-4 rounded-xl bg-gradient-to-r from-marca-azul to-marca-cyan text-white text-sm font-semibold">
          Enviar
        </button>
      </div>
    </div>

    <button id="toggle-chat"
            class="ml-auto flex items-center justify-center w-14 h-14 rounded-full bg-slate-900 border border-slate-800
                   text-marca-cyan shadow-2xl hover:bg-slate-800 transition-colors"
            aria-label="Abrir el asistente">
      ${icono('chat', 'w-6 h-6')}
    </button>
  </div>

  <script type="module" src="js/principal.js"></script>
</body>

</html>
`;
}
