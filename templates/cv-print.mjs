/**
 * Plantilla del CV en PDF. Una sola columna, sin iconos ni imágenes y con encabezados
 * corrientes, para que un lector automático de currículums (ATS) extraiga el texto sin perderse.
 *
 * Fondo claro a propósito: el PDF se imprime y se lee en visores. Del sitio conserva los
 * colores de acento, no el fondo oscuro.
 */
import { fecha, fechaCorta, esc } from '../scripts/lib/formato.mjs';

/**
 * Los tres proyectos que van al CV, en este orden. El resto vive en la web.
 * erp-hub queda fuera mientras esté oculto; su lugar lo ocupa pasteleria.
 */
const PROYECTOS_CV = ['core-erp-suite', 'pasteleria', 'lab-openstack'];

export function render(perfil, opciones = {}) {
  // fuentesEnLinea: una instancia por peso, ya recortada a los caracteres de este CV.
  // Chromium incrusta en el PDF la fuente que recibe y, si es variable, la expande entera;
  // por eso se le pasan instancias de peso fijo y no la fuente variable.
  const { rutaFuentes = '../public/assets/fonts', fuentesEnLinea = null } = opciones;

  const carasDeFuente = fuentesEnLinea
    ? fuentesEnLinea
        .map(
          ({ peso, base64 }) => `@font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: ${peso};
    src: url(data:font/woff2;base64,${base64}) format('woff2');
  }`,
        )
        .join('\n  ')
    : `@font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400 700;
    src: url('${rutaFuentes}/inter-variable.woff2') format('woff2');
  }`;
  const { identidad, resumen, experiencia, educacion, formacion, habilidades, proyectos } = perfil;

  const contacto = [
    identidad.email,
    identidad.telefono,
    identidad.ubicacion,
    identidad.web.replace(/^https?:\/\//, ''),
    identidad.linkedin.replace(/^https?:\/\/(www\.)?/, ''),
    identidad.github.replace(/^https?:\/\//, ''),
  ]
    .filter(Boolean)
    .map((c) => `<span>${esc(c)}</span>`)
    .join('<span class="sep">·</span>');

  const bloquesExperiencia = experiencia
    .map((p) => {
      const lugar = p.ubicacion ? `, ${esc(p.ubicacion)}` : '';
      const contexto = p.contexto ? `<p class="contexto">${esc(p.contexto)}</p>` : '';
      return `<article>
        <div class="fila">
          <h3>${esc(p.cargo)} — ${esc(p.empresa)}${lugar}</h3>
          <span class="periodo">${esc(fechaCorta(p.desde))} – ${esc(fechaCorta(p.hasta))}</span>
        </div>
        ${contexto}
        <ul>${p.logros
          .map((l) => {
            // Algunos logros ya dicen "en curso" en su propio texto; no se repite.
            const marca = l.estado === 'en_curso' && !/en curso/i.test(l.texto) ? ' (en curso)' : '';
            return `<li>${esc(l.texto)}${marca}</li>`;
          })
          .join('')}</ul>
      </article>`;
    })
    .join('\n      ');

  const bloquesProyectos = PROYECTOS_CV.map((id) => proyectos.find((p) => p.id === id))
    .filter((p) => p?.mostrar)
    .map((p) => {
      const ia = p.desarrollo ? ' Desarrollado con asistencia de IA.' : '';
      const lab = p.evidencia === 'laboratorio' ? ' Proyecto de laboratorio.' : '';
      return `<article>
        <div class="fila">
          <h3>${esc(p.nombre)}${p.marca ? ` (${esc(p.marca)})` : ''}</h3>
          <span class="periodo">${esc(p.estado)}</span>
        </div>
        <p>${esc(p.descripcion)}${esc(ia)}${esc(lab)}</p>
        <p class="stack">${esc(p.stack.join(' · '))}</p>
      </article>`;
    })
    .join('\n      ');

  const produccion = habilidades.filter((h) => h.evidencia === 'produccion');
  const laboratorio = habilidades.filter((h) => h.evidencia === 'laboratorio');
  const conIa = habilidades.filter((h) => h.evidencia === 'proyecto_propio');

  const filasHabilidades = produccion
    .map((h) => `<p><strong>${esc(h.categoria)}:</strong> ${esc(h.items.join(', '))}</p>`)
    .join('\n      ');

  const lineaLaboratorio = laboratorio.length
    ? `<p class="matiz"><strong>En laboratorio:</strong> ${esc(
        laboratorio.flatMap((h) => h.items).join(', '),
      )}</p>`
    : '';

  const lineaIa = conIa.length
    ? `<p class="matiz"><strong>Desarrollo asistido por IA:</strong> ${esc(
        conIa.flatMap((h) => h.items).join(', '),
      )}</p>`
    : '';

  const bloquesEducacion = educacion
    .map(
      (e) => `<div class="fila">
        <h3>${esc(e.titulo)} — ${esc(e.institucion)}</h3>
        <span class="periodo">${esc(e.estado)}</span>
      </div>`,
    )
    .join('\n      ');

  const destacadas = formacion
    .filter((f) => f.destacar)
    .map((f) => {
      const horas = f.horas ? `, ${f.horas} h` : '';
      return `<li>${esc(f.nombre)} — ${esc(f.institucion)} (${esc(fecha(f.fecha))}${horas})</li>`;
    })
    .join('\n        ');

  const agrupada = (perfil.formacion_agrupada ?? [])
    .map((g) => `<p class="matiz">${esc(g.nombre)} — ${esc(g.institucion)}.</p>`)
    .join('\n      ');

  return `<!DOCTYPE html>
<html lang="es">

<head>
<meta charset="UTF-8">
<title>${esc(identidad.nombre)} — CV</title>
<style>
  ${carasDeFuente}

  /* Los márgenes los pone build-pdf.mjs en la llamada a pdf(). Si se declararan también
     aquí, Chromium los sumaría y el contenido no cabría en dos páginas. */
  @page { size: A4; }

  * { box-sizing: border-box; }

  body {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 9.2pt;
    line-height: 1.34;
    color: #1e293b;
    margin: 0;
  }

  header { border-bottom: 2px solid #06b6d4; padding-bottom: 8px; margin-bottom: 12px; }

  h1 { font-size: 19pt; font-weight: 700; color: #0f172a; margin: 0; letter-spacing: -0.02em; }

  .titular { font-size: 9.6pt; color: #0e7490; font-weight: 600; margin: 3px 0 6px; }

  .contacto { font-size: 8.2pt; color: #475569; }
  .contacto .sep { margin: 0 6px; color: #cbd5e1; }

  section { margin-bottom: 8px; }

  h2 {
    font-size: 8.4pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: #0e7490;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 3px;
    margin: 0 0 5px;
  }

  h3 { font-size: 9.6pt; font-weight: 700; color: #0f172a; margin: 0; }

  article { margin-bottom: 6px; }
  article:last-child { margin-bottom: 0; }

  .fila { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  .periodo { font-size: 8.2pt; color: #64748b; white-space: nowrap; }

  .contexto { font-size: 8.4pt; color: #64748b; font-style: italic; margin: 2px 0 0; }

  p { margin: 3px 0 0; }

  ul { margin: 4px 0 0; padding-left: 15px; }
  li { margin-bottom: 2px; }

  .stack { font-size: 8.2pt; color: #64748b; }
  .matiz { font-size: 8.4pt; color: #475569; }

  strong { color: #0f172a; }

  /* Nada se parte entre páginas por la mitad. */
  article, .fila { break-inside: avoid; }
  h2 { break-after: avoid; }
</style>
</head>

<body>

<header>
  <h1>${esc(identidad.nombre)}</h1>
  <p class="titular">${esc(identidad.titular)}</p>
  <p class="contacto">${contacto}</p>
</header>

<section>
  <h2>Resumen</h2>
  <p>${esc(resumen.largo)}</p>
</section>

<section>
  <h2>Experiencia</h2>
      ${bloquesExperiencia}
</section>

<section>
  <h2>Proyectos</h2>
      ${bloquesProyectos}
</section>

<section>
  <h2>Habilidades</h2>
      ${filasHabilidades}
      ${lineaLaboratorio}
      ${lineaIa}
</section>

<section>
  <h2>Educación</h2>
      ${bloquesEducacion}
</section>

<section>
  <h2>Formación destacada</h2>
  <ul>
        ${destacadas}
  </ul>
      ${agrupada}
</section>

<section>
  <h2>Idiomas</h2>
  <p>${identidad.idiomas.map((i) => `${esc(i.idioma)}: ${esc(i.nivel)}`).join(' · ')}</p>
</section>

</body>

</html>
`;
}
