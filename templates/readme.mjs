/**
 * Plantilla del README.md del perfil de GitHub. Sigue la estructura y el tono de
 * docs/insumos/README.propuesta.md, pero el contenido sale de profile.json.
 */
import { fechaCorta, NIVELES_FORMACION, nivelesDeFormacion } from '../scripts/lib/formato.mjs';

/**
 * Tecnologías que llevan insignia. Solo se emiten para habilidades de producción:
 * el laboratorio y el desarrollo asistido por IA van en líneas de texto, no en insignias,
 * para que nadie los confunda con experiencia laboral.
 */
const INSIGNIAS = [
  { busca: 'Proxmox', texto: 'Proxmox_VE', color: 'E57000', logo: 'proxmox' },
  { busca: 'VMware ESXi', texto: 'VMware_ESXi', color: '607078', logo: 'vmware' },
  { busca: 'FortiGate', texto: 'FortiGate', color: 'C81326', logo: 'fortinet' },
  { busca: 'MikroTik', texto: 'MikroTik', color: '293239', logo: 'mikrotik' },
  { busca: 'Linux', texto: 'Linux', color: 'FCC624', logo: 'linux', logoColor: 'black' },
  { busca: 'Active Directory', texto: 'Active_Directory', color: '0078D4', logo: 'windows' },
  { busca: 'Docker', texto: 'Docker', color: '2496ED', logo: 'docker' },
  { busca: 'Synology', texto: 'Synology', color: 'B5B5B6', logo: 'synology', logoColor: 'black' },
  { busca: 'PostgreSQL', texto: 'PostgreSQL', color: '4169E1', logo: 'postgresql' },
];

const insignia = ({ texto, color, logo, logoColor = 'white' }) =>
  `![${texto.replace(/_/g, ' ')}](https://img.shields.io/badge/${texto}-${color}?style=flat-square&logo=${logo}&logoColor=${logoColor})`;

export function render(perfil) {
  const { identidad, resumen, experiencia, formacion, habilidades, proyectos, nitsc } = perfil;

  const actual = experiencia.find((p) => p.hasta === null) ?? experiencia[0];

  const porEvidencia = (tipo) => habilidades.filter((h) => h.evidencia === tipo);
  const itemsDe = (tipo) => porEvidencia(tipo).flatMap((h) => h.items);

  // --- Insignias de cabecera ---

  const ubicacion = encodeURIComponent(identidad.ubicacion).replace(/%20/g, '_');
  const dominio = identidad.web.replace(/^https?:\/\/(www\.)?/, '');
  const usuarioLinkedin = identidad.linkedin.replace(/\/$/, '').split('/').pop();

  const cabecera = [
    `![Ubicación](https://img.shields.io/badge/${ubicacion}-blue?style=flat-square)`,
    `[![Web](https://img.shields.io/badge/${dominio.replace(/\./g, '.')}-orange?style=flat-square)](${identidad.web})`,
    `[![LinkedIn](https://img.shields.io/badge/LinkedIn-${usuarioLinkedin}-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](${identidad.linkedin})`,
  ].join('\n');

  // --- Qué hago hoy: los logros del puesto actual, sin los que siguen en curso ---

  const hoy = actual.logros
    .filter((l) => l.estado !== 'en_curso')
    .map((l) => `- ${l.texto}`)
    .join('\n');

  // --- Trayectoria ---

  const filas = experiencia
    .map((p) => {
      const periodo = `${fechaCorta(p.desde)} – ${fechaCorta(p.hasta)}`;
      return `| ${periodo} | ${p.cargo} | ${p.empresa} |`;
    })
    .join('\n');

  // --- Stack ---

  const enProduccion = itemsDe('produccion');
  const badges = INSIGNIAS.filter((b) => enProduccion.some((i) => i.includes(b.busca)))
    .map(insignia)
    .join('\n');

  const laboratorio = itemsDe('laboratorio').join(' · ');
  const conIa = itemsDe('proyecto_propio').join(' · ');

  // --- Proyectos ---

  const visibles = proyectos.filter((p) => p.mostrar);
  const filasProyectos = visibles
    .map((p) => {
      // La descripción va entera: cortarla por el primer punto mutila las abreviaturas
      // ("RR. HH.") y los números de versión ("Ubuntu 24.04").
      const stack = p.stack.slice(0, 3).join(', ');
      return `| **${p.nombre}** | ${p.descripcion} | ${stack} | ${p.estado} |`;
    })
    .join('\n');

  const todosPrivados = visibles.every((p) => !p.repositorio || p.repositorio.visibilidad === 'privado');

  // --- Formación ---

  const niveles = nivelesDeFormacion(perfil);
  const enLinea = (lista) =>
    lista.map((f) => `${f.nombre} (${f.institucion.split(' —')[0]})`).join(' · ');

  // Nivel 1: los estudios formales. Faltaban en el README, aunque la web, el CV y el
  // asistente sí los decían.
  const educacionSuperior = niveles.superior
    .map((e) => `- **${e.titulo}** — ${e.institucion} · ${e.estado}`)
    .join('\n');

  const conEvaluacion = enLinea(niveles.evaluacion);
  const deAsistencia = [
    enLinea(niveles.asistencia),
    ...niveles.agrupada.map((g) => `${g.nombre} — ${g.institucion}`),
  ]
    .filter(Boolean)
    .join(' · ');

  return `# ${identidad.nombre}

**${identidad.titular.replace(/\s*\|\s*/g, ' · ')}**

${cabecera}

${resumen.origen ?? resumen.corto}

## Qué hago hoy

${hoy}

## Trayectoria

| Periodo | Cargo | Empresa |
|---|---|---|
${filas}

## Stack

**En producción**

${badges}

**En laboratorio:** ${laboratorio}

**Desarrollo asistido por IA:** ${conIa}

## Proyectos

> Mis proyectos de software los desarrollo **con asistencia de IA**. Mi aporte está en el diseño, la infraestructura, el despliegue y la operación.

| Proyecto | Qué es | Stack | Estado |
|---|---|---|---|
${filasProyectos}
${todosPrivados ? '\n*Los repositorios de los proyectos son privados.*\n' : ''}
## ${nitsc.nombre.split(' — ')[0]}

**[${nitsc.nombre.split(' — ')[1] ?? nitsc.nombre}](${nitsc.web})** — ${nitsc.presentacion}

## ${NIVELES_FORMACION.superior}

${educacionSuperior}

## ${NIVELES_FORMACION.evaluacion}

<sub>Formaciones con examen o trabajo calificado para obtener el certificado.</sub>

${conEvaluacion}

## ${NIVELES_FORMACION.asistencia}

<sub>Constancia de participación, sin evaluación.</sub>

${deAsistencia}

## Contacto

- Web y asistente: [${dominio}](${identidad.web})
- [Descargar CV (PDF)](${identidad.web}/cv-victor-lopez.pdf)
- ${identidad.email}

---

<sub>Este repositorio también contiene el código de ${dominio}. Documentación técnica en [docs/TECNICO.md](docs/TECNICO.md). Este README se genera desde \`data/profile.json\`.</sub>
`;
}
