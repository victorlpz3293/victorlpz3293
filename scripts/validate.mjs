#!/usr/bin/env node
/**
 * Valida data/profile.json contra data/profile.schema.json
 * y aplica comprobaciones de coherencia que el schema no puede expresar.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Ajv from 'ajv/dist/2020.js'; // el export por defecto de ajv es draft-07; el schema es 2020-12
import addFormats from 'ajv-formats';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

const perfil = JSON.parse(readFileSync(join(raiz, 'data/profile.json'), 'utf8'));
const schema = JSON.parse(readFileSync(join(raiz, 'data/profile.schema.json'), 'utf8'));

const errores = [];

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

if (!ajv.validate(schema, perfil)) {
  for (const e of ajv.errors) {
    errores.push(`schema  ${e.instancePath || '/'} ${e.message}`);
  }
}

// --- Coherencia ---

const aNumero = (fecha) => {
  const [anio, mes = '01'] = fecha.split('-');
  return Number(anio) * 12 + Number(mes);
};

for (const puesto of perfil.experiencia ?? []) {
  if (puesto.hasta && aNumero(puesto.desde) > aNumero(puesto.hasta)) {
    errores.push(`experiencia/${puesto.id}: "desde" (${puesto.desde}) es posterior a "hasta" (${puesto.hasta})`);
  }
}

const actuales = (perfil.experiencia ?? []).filter((p) => p.hasta === null);
if (actuales.length > 1) {
  errores.push(
    `experiencia: hay ${actuales.length} puestos sin fecha de fin (${actuales.map((p) => p.id).join(', ')}). ` +
      'NITSC va en su propia sección, no como empleo concurrente.',
  );
}

const idsDuplicados = (lista, etiqueta) => {
  const vistos = new Set();
  for (const item of lista ?? []) {
    if (vistos.has(item.id)) errores.push(`${etiqueta}: id duplicado "${item.id}"`);
    vistos.add(item.id);
  }
};
idsDuplicados(perfil.experiencia, 'experiencia');
idsDuplicados(perfil.proyectos, 'proyectos');

const normalizar = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

// La lista de proyectos excluidos vive en _privado/, que no se versiona. Cuando no está
// —en CI o en el build de Vercel— este cruce no se puede hacer y se avisa en vez de callar.
const rutaPrivada = join(raiz, '_privado/notas.json');
const hayNotasPrivadas = existsSync(rutaPrivada);
const notasPrivadas = hayNotasPrivadas ? JSON.parse(readFileSync(rutaPrivada, 'utf8')) : null;

const excluidos = new Set(
  (notasPrivadas?.proyectos_excluidos ?? []).map((p) => normalizar(p.nombre)),
);
for (const proyecto of perfil.proyectos ?? []) {
  if (proyecto.mostrar && excluidos.has(normalizar(proyecto.nombre))) {
    errores.push(
      `proyectos/${proyecto.id}: "${proyecto.nombre}" está en proyectos_excluidos pero tiene mostrar: true`,
    );
  }
  if (proyecto.mostrar && !proyecto.desarrollo && !proyecto.evidencia) {
    errores.push(
      `proyectos/${proyecto.id}: visible sin "desarrollo" ni "evidencia". ` +
        'Todo proyecto publicado debe declarar cómo se construyó o en qué entorno vive.',
    );
  }
}

const visibles = (perfil.proyectos ?? []).filter((p) => p.mostrar);
if (visibles.length === 0) errores.push('proyectos: ninguno tiene mostrar: true');

// Una edición anterior tiene que ser, literalmente, anterior. La entrada principal es la
// vigente; si alguien invierte las fechas, la salida diría que lo viejo es lo actual.
for (const f of perfil.formacion ?? []) {
  for (const e of f.ediciones_anteriores ?? []) {
    if (e.fecha >= f.fecha) {
      errores.push(
        `formacion/"${f.nombre}": la edición anterior "${e.nombre}" tiene fecha ${e.fecha}, ` +
          `que no es anterior a ${f.fecha}`,
      );
    }
  }
}

// El titular no puede contradecir la educación en curso.
const enCurso = (perfil.educacion ?? []).some((e) => /en curso/i.test(e.estado));
if (enCurso && /\bingeniero\b/i.test(perfil.identidad?.titular ?? '')) {
  errores.push('identidad/titular: dice "Ingeniero" mientras la carrera figura en curso');
}

if (errores.length) {
  console.error(`\n  FALLÓ la validación de profile.json — ${errores.length} problema(s):\n`);
  for (const e of errores) console.error(`   • ${e}`);
  console.error('');
  process.exit(1);
}

console.log(`  profile.json válido (v${perfil.meta.version}, actualizado ${perfil.meta.actualizado})`);
console.log(
  `   ${perfil.experiencia.length} puestos · ${visibles.length} proyectos visibles · ` +
    `${perfil.formacion.length} formaciones · ` +
    `${perfil.prohibido.length}+${perfil.prohibido_privado?.length ?? 0} términos prohibidos`,
);
if (!hayNotasPrivadas) {
  console.log('   Sin _privado/notas.json: no se pudo cruzar contra los proyectos excluidos');
}
