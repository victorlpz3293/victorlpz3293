#!/usr/bin/env node
/**
 * Busca en las salidas generadas cualquier afirmación de prohibido[] y falla el build si aparece.
 *
 * prohibido[] describe las afirmaciones en lenguaje natural ("Cualquier porcentaje de uptime"),
 * así que no se puede buscar por texto literal. Cada entrada necesita una regla con patrones
 * concretos. Si se agrega una entrada al JSON sin su regla aquí, este script falla: así el JSON
 * sigue mandando y ninguna prohibición queda sin vigilar.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const perfil = JSON.parse(readFileSync(join(raiz, 'data/profile.json'), 'utf8'));

/**
 * Cada regla: patrones que delatan la afirmación, y excepciones que la vuelven legítima
 * cuando aparecen en la misma línea (p. ej. "Bootcamp Analista SOC" sí es formación real).
 */
const REGLAS = {
  'Ingeniero en Telemática (como título obtenido o graduado)': {
    patrones: [
      /\bingenier[oa]s?\s+en\s+telem[áa]tica/i,
      /(t[íi]tulo|graduad[oa]|egresad[oa]|licenciad[oa])[^.]{0,40}telem[áa]tica/i,
    ],
  },
  'Clúster Proxmox / alta disponibilidad (HA) en Proxmox': {
    patrones: [
      /cl[úu]ster(s|es)?\s+(de\s+|hiperconvergentes?\s+)?proxmox/i,
      /proxmox[^.]{0,40}(alta disponibilidad|hiperconverg)/i,
      /(alta disponibilidad|hiperconverg)[^.]{0,40}proxmox/i,
      /\bProxmox\b[^.]{0,40}\bHA\b/, // "HA" en mayúsculas: sin /i, para no chocar con el verbo "ha"
    ],
  },
  'Zero Trust': { patrones: [/zero[\s-]?trust/i] },
  'Zabbix / Grafana': { patrones: [/\bzabbix\b/i, /\bgrafana\b/i] },
  'Cualquier porcentaje de uptime (90%, 99%, 99.9%)': {
    // Ninguna salida debería afirmar un porcentaje. El JSON no contiene ninguno.
    patrones: [/\b\d{1,3}([.,]\d+)?\s*%/],
  },
  'Reducción del 80% en tiempos de resolución': {
    patrones: [
      /reducci[óo]n[^.]{0,40}\d{1,3}\s*%/i,
      /\d{1,3}\s*%[^.]{0,50}(tiempos?\s+de\s+resoluci[óo]n|resoluci[óo]n\s+de\s+incidentes|MTTR)/i,
    ],
  },
  'Certificación CCNA (solo el curso ITN)': {
    patrones: [/certificaci[óo]n\s+ccna/i, /certificad[oa]\s+ccna/i, /ccna\s+certificad/i],
  },
  'Experto / especialista de primer nivel / validaciones internacionales de primer nivel': {
    patrones: [/\bexpert[oa]s?\b/i, /primer\s+nivel/i, /validaciones\s+internacionales/i, /\bde\s+[ée]lite\b/i],
  },
  'Pentesting o hacking ético en producción': {
    patrones: [/\bpentesting\b/i, /hacking\s+[ée]tico/i, /pruebas\s+de\s+penetraci[óo]n/i],
    excepciones: [/laboratorio/i, /entorno(s)?\s+controlado/i, /curso/i, /formaci[óo]n/i, /comunix/i, /bootcamp/i],
  },
  'OSPF en producción': {
    patrones: [/\bospf\b/i],
    excepciones: [/laboratorio/i, /packet\s*tracer/i, /gns3/i, /formaci[óo]n/i],
  },
  'Diseñé una red multisitio con VPN de alta disponibilidad': {
    patrones: [
      /vpn[^.]{0,50}(alta\s+disponibilidad|multisitio|multi-?sitio)/i,
      /(multisitio|multi-?sitio)[^.]{0,50}vpn/i,
      /dise[ñn][ée][^.]{0,40}red\s+multisitio/i,
    ],
  },
  'Protección total / continuidad absoluta / blindaje': {
    patrones: [
      /protecci[óo]n\s+total/i,
      /continuidad\s+absoluta/i,
      /\bblindaje\b/i,
      /\bblindar\b/i,
      /tolerancia\s+total/i,
      /seguridad\s+absoluta/i,
    ],
  },
  'Analista SOC (como cargo desempeñado)': {
    patrones: [/analista\s+(de\s+)?(ciberseguridad\s+)?soc/i, /monitoreo\s+(proactivo\s+)?soc/i],
    excepciones: [/bootcamp/i, /formaci[óo]n/i, /curso/i],
  },
  'Clientes de NITSC / casos de éxito de NITSC': {
    patrones: [/casos?\s+de\s+[ée]xito/i, /cartera\s+de\s+clientes/i, /nitsc[^.]{0,40}clientes/i, /clientes[^.]{0,30}nitsc/i],
  },
  'Firma consultora (para NITSC)': {
    patrones: [/firma\s+consultora/i, /consultora\s+establecida/i, /\bmi\s+firma\b/i],
  },
  'Arquitectura de microservicios': { patrones: [/microservicios?/i] },
  'Arquitecto de infraestructura': {
    patrones: [/arquitect[oa]\s+de\s+(infraestructura|soluciones|sistemas)/i, /soy\s+un\s+arquitecto/i],
  },
  'Sistema perfecto / auto-sanable': {
    patrones: [/auto[\s-]?sanable/i, /sistema\s+perfecto/i, /tejido\s+(invisible|auto)/i],
  },
  '100% Curiosity / Resilience': {
    patrones: [/\d{1,3}\s*%?\s*[_\s]*(curiosity|curiosidad)/i, /\d{1,3}\s*%?\s*[_\s]*(resilience|resiliencia)/i],
  },
  'Production Ready': { patrones: [/production[\s_-]?ready/i] },
  'Entrenado (para el bot)': { patrones: [/entrenad[oa]s?\b/i, /system\s+prompt/i] },
};

// --- Guarda: toda prohibición del JSON necesita su regla ---
const sinRegla = perfil.prohibido.filter((p) => !REGLAS[p]);
if (sinRegla.length) {
  console.error('\n  Hay prohibiciones en profile.json sin regla en check-claims.mjs:\n');
  for (const p of sinRegla) console.error(`   • ${p}`);
  console.error('\n   Agrega sus patrones antes de generar nada.\n');
  process.exit(1);
}
const reglasHuerfanas = Object.keys(REGLAS).filter((k) => !perfil.prohibido.includes(k));
if (reglasHuerfanas.length) {
  console.error('\n  Hay reglas en check-claims.mjs que ya no existen en prohibido[]:\n');
  for (const r of reglasHuerfanas) console.error(`   • ${r}`);
  console.error('\n   Quítalas o corrige el texto para que coincida con el JSON.\n');
  process.exit(1);
}

// --- Archivos a revisar (se saltan los que aún no existen) ---
const OBJETIVOS = [
  'public/index.html',
  'public/js/chat.js',
  'public/js/cerebro-local.generado.js',
  'public/js/contacto.generado.js',
  'api/_contexto.generado.js',
  'README.md',
  'docs/TECNICO.md',
  'templates/cv-print.html',
  'build/cv-texto.txt', // volcado de texto del PDF (fase 3)
];

const ENTIDADES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

/** Reemplaza por espacios conservando longitud y saltos de línea, para no mover los offsets. */
const enBlanco = (txt) => txt.replace(/[^\n]/g, ' ');

/** Deja solo el texto visible de un HTML, conservando las posiciones originales. */
function textoVisible(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, enBlanco)
    .replace(/<style\b[\s\S]*?<\/style>/gi, enBlanco)
    .replace(/<!--[\s\S]*?-->/g, enBlanco)
    .replace(/<[^>]*>/g, enBlanco)
    .replace(/&[a-z]+;|&#\d+;/gi, (m) => (ENTIDADES[m.toLowerCase()] ?? ' ').padEnd(m.length, ' '));
}

/** Decodifica %XX sin romper la línea si el porcentaje no es una secuencia válida. */
const decodificar = (linea) => {
  try {
    return decodeURIComponent(linea);
  } catch {
    return linea;
  }
};

const numeroDeLinea = (texto, indice) => texto.slice(0, indice).split('\n').length;

/** Ventana alrededor del hallazgo: el rótulo que lo legitima suele ir justo antes. */
const ventana = (texto, indice) => texto.slice(Math.max(0, indice - 250), indice + 150);

const hallazgos = [];

for (const objetivo of OBJETIVOS) {
  const ruta = join(raiz, objetivo);
  if (!existsSync(ruta)) continue;

  const crudo = readFileSync(ruta, 'utf8');
  const esHtml = objetivo.endsWith('.html');
  const archivo = relative(raiz, ruta).replace(/\\/g, '/');

  // En HTML solo se mira el texto visible. En el resto se mira también la forma decodificada:
  // las insignias de Markdown esconden las afirmaciones dentro de la URL.
  const versiones = [esHtml ? textoVisible(crudo) : crudo];
  if (!esHtml) {
    const decodificado = crudo.split('\n').map(decodificar).join('\n');
    if (decodificado !== crudo) versiones.push(decodificado);
  }

  for (const [etiqueta, regla] of Object.entries(REGLAS)) {
    for (const patron of regla.patrones) {
      // Búsqueda global sobre todo el texto, no línea por línea: en HTML una frase
      // se parte entre dos líneas y una búsqueda por línea la dejaría pasar.
      const global = new RegExp(patron.source, `${patron.flags.replace('g', '')}g`);
      const yaVisto = new Set();

      for (const version of versiones) {
        for (const m of version.matchAll(global)) {
          const entorno = ventana(version, m.index);
          if (regla.excepciones?.some((e) => e.test(entorno))) continue;

          const linea = numeroDeLinea(version, m.index);
          const clave = `${linea}|${m[0]}`;
          if (yaVisto.has(clave)) continue;
          yaVisto.add(clave);

          hallazgos.push({
            archivo,
            linea,
            etiqueta,
            texto: m[0].replace(/\s+/g, ' ').trim().slice(0, 80),
            contexto: entorno.replace(/\s+/g, ' ').trim().slice(0, 120),
          });
        }
      }
    }
  }
}

// --- Términos reservados guardados como huella ---
//
// Hay términos que no pueden escribirse ni en profile.json ni aquí, porque ambos archivos son
// públicos: nombres de proyectos privados y datos técnicos de los empleadores de Victor, que
// están cubiertos por acuerdos de confidencialidad. De ellos se guarda solo el SHA-256 del
// término normalizado. Se trocea cada salida en grupos de 1 a 8 palabras y se compara la huella,
// de modo que también se detectan frases y no solo palabras sueltas.
//
// El término nunca aparece escrito en el repositorio y la comprobación sigue funcionando en un
// checkout público. No es un secreto criptográfico —sin sal, un diccionario daría con la palabra—,
// pero el objetivo es que el dato no figure en el repositorio, no volverlo irrecuperable.

const MAXIMO_PALABRAS = 8;

const huellasProhibidas = new Map(
  (perfil.prohibido_privado ?? []).map((p) => [p.sha256, p.etiqueta]),
);

// CLAUDE.md se publica y no debe contener datos de los empleadores, pero sí nombra las
// afirmaciones prohibidas porque su función es enumerarlas. Por eso entra solo aquí.
const OBJETIVOS_HUELLA = [...OBJETIVOS, 'CLAUDE.md'];

if (huellasProhibidas.size) {
  const normalizar = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const huella = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

  for (const objetivo of OBJETIVOS_HUELLA) {
    const ruta = join(raiz, objetivo);
    if (!existsSync(ruta)) continue;

    const crudo = readFileSync(ruta, 'utf8');
    const texto = objetivo.endsWith('.html') ? textoVisible(crudo) : crudo;
    const archivo = relative(raiz, ruta).replace(/\\/g, '/');

    texto.split('\n').forEach((linea, i) => {
      const palabras = normalizar(linea).match(/[\p{L}\p{N}]+/gu) ?? [];

      for (let inicio = 0; inicio < palabras.length; inicio++) {
        for (let largo = 1; largo <= MAXIMO_PALABRAS && inicio + largo <= palabras.length; largo++) {
          const etiqueta = huellasProhibidas.get(
            huella(palabras.slice(inicio, inicio + largo).join(' ')),
          );
          if (!etiqueta) continue;
          hallazgos.push({
            archivo,
            linea: i + 1,
            etiqueta,
            texto: '(coincide con una huella; el término no se imprime)',
            contexto: linea.replace(/\s+/g, ' ').trim().slice(0, 120),
          });
        }
      }
    });
  }
}

// --- Ninguna marca en la misma oración que un empleador ---
//
// Las marcas pueden aparecer en habilidades, donde describen lo que Victor sabe usar.
// Lo que no puede ocurrir es que una marca quede pegada al nombre de una empresa: eso vuelve
// a revelar con qué está construida. Las marcas se leen de habilidades[] y los empleadores de
// experiencia[], así que la regla se mantiene sola cuando el JSON cambie.
//
// Lo que no sea una marca hay que declararlo en GENERICOS. El valor por omisión es tratarlo
// como marca, que es el lado seguro por el que equivocarse.

const GENERICOS = new Set(
  [
    'DNS', 'GPO', 'RAID', 'CCTV', 'FXS/FXO', 'SSO', 'OIDC', 'LDAP', 'VLANs', 'OSPF', 'SOC',
    'Segmentación con VLANs', 'Inicio de sesión único', 'Migración P2V', 'Streaming',
    'Infraestructura de TI para sistemas de radiocomunicación',
    'Pentesting en entornos controlados', 'Análisis forense Windows', 'Fundamentos SOC',
    'ISO/IEC 27001', 'Liderazgo técnico', 'Gestión de presupuesto y proveedores',
    'Planificación de migraciones', 'Autodidacta',
  ].map((g) => g.toLowerCase()),
);

/** "Linux (Debian, Ubuntu)" → ["Linux", "Debian", "Ubuntu"] */
function fragmentosDe(item) {
  const partes = [];
  const base = item.replace(/\s*\([^)]*\)/g, '').trim();
  const dentro = [...item.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);

  for (const trozo of [base, ...dentro]) {
    for (const p of trozo.split(/\s*[,/]\s*|\s+y\s+/)) {
      const limpio = p.trim();
      if (limpio.length >= 3) partes.push(limpio);
    }
  }
  return partes;
}

const marcas = [
  ...new Set(
    perfil.habilidades
      .flatMap((h) => h.items)
      // Se descarta el item completo antes de trocearlo: si no, "Gestión de presupuesto y
      // proveedores" acabaría aportando "proveedores" como si fuera una marca.
      .filter((i) => !GENERICOS.has(i.toLowerCase()))
      .flatMap(fragmentosDe)
      .filter((m) => !GENERICOS.has(m.toLowerCase())),
  ),
];

/** "Mega Comunicaciones S.A. (MEGACOM)" → ["Mega Comunicaciones", "MEGACOM", "Mega"] */
function nombresDe(empresa) {
  const dentro = [...empresa.matchAll(/\(([^)]*)\)/g)].map((m) => m[1].trim());
  const base = empresa
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*S\.?A\.?\s*$/i, '')
    .trim();
  const primera = base.split(/\s+/)[0];
  return [...new Set([base, ...dentro, primera.length >= 4 ? primera : null].filter(Boolean))];
}

const empleadores = perfil.experiencia.flatMap((p) => nombresDe(p.empresa));

const comoRegex = (t) => new RegExp(`(?<![\\p{L}\\p{N}])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'iu');

const marcasRegex = marcas.map((m) => [m, comoRegex(m)]);
const empleadoresRegex = empleadores.map((e) => [e, comoRegex(e)]);

for (const objetivo of OBJETIVOS) {
  const ruta = join(raiz, objetivo);
  if (!existsSync(ruta)) continue;

  const crudo = readFileSync(ruta, 'utf8');
  // Los módulos generados guardan el contexto como una sola cadena con saltos escapados.
  // Sin deshacerlos, el archivo entero sería una única línea y una "oración" abarcaría media
  // biografía, juntando empresas y marcas que en realidad están en párrafos distintos.
  const plano = objetivo.endsWith('.js') ? crudo.replace(/\\n/g, '\n') : crudo;
  const texto = objetivo.endsWith('.html') ? textoVisible(crudo) : plano;
  const archivo = relative(raiz, ruta).replace(/\\/g, '/');

  texto.split('\n').forEach((linea, i) => {
    for (const oracion of linea.split(/(?<=[.!?;])\s+/)) {
      const empresa = empleadoresRegex.find(([, r]) => r.test(oracion));
      if (!empresa) continue;

      const marca = marcasRegex.find(([, r]) => r.test(oracion));
      if (!marca) continue;

      hallazgos.push({
        archivo,
        linea: i + 1,
        etiqueta: 'Marca en la misma oración que un empleador',
        texto: `"${marca[0]}" junto a "${empresa[0]}"`,
        contexto: oracion.replace(/\s+/g, ' ').trim().slice(0, 130),
      });
    }
  });
}

hallazgos.sort((a, b) => a.archivo.localeCompare(b.archivo) || a.linea - b.linea);

const revisados = OBJETIVOS.filter((o) => existsSync(join(raiz, o)));

if (hallazgos.length) {
  console.error(`\n  check-claims FALLÓ — ${hallazgos.length} afirmación(es) prohibida(s):\n`);
  for (const h of hallazgos) {
    console.error(`   ${h.archivo}:${h.linea}`);
    console.error(`      prohibido: ${h.etiqueta}`);
    console.error(`      coincide:  "${h.texto}"`);
    console.error(`      contexto:  ${h.contexto}\n`);
  }
  process.exit(1);
}

const huellas = perfil.prohibido_privado?.length ?? 0;
console.log(
  `  check-claims limpio · ${perfil.prohibido.length} reglas` +
    (huellas ? ` + ${huellas} huella(s)` : '') +
    ` + ${marcas.length} marcas vs ${empleadores.length} empleadores` +
    ` sobre ${revisados.length} archivo(s)`,
);
if (revisados.length) console.log(`   ${revisados.join(', ')}`);
