const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const MESES_CORTOS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/** "2025-09" → "septiembre de 2025". Sin valor → "la actualidad". */
export function fecha(valor) {
  if (!valor) return 'la actualidad';
  const [anio, mes] = valor.split('-');
  return mes ? `${MESES[Number(mes) - 1]} de ${anio}` : anio;
}

/** "2025-09" → "sep 2025". Sin valor → "actualidad". */
export function fechaCorta(valor) {
  if (!valor) return 'actualidad';
  const [anio, mes] = valor.split('-');
  return mes ? `${MESES_CORTOS[Number(mes) - 1]} ${anio}` : anio;
}

/**
 * Rótulos de los tres niveles de formación. Viven aquí para que la web, el CV, el README y el
 * asistente digan exactamente lo mismo: si cambian, cambian en las cuatro salidas a la vez.
 *
 * El nivel 2 se llama "Cursos con evaluación" y no "Certificaciones": el CCNA ITN entra aquí
 * porque tuvo examen, pero llamarlo certificación insinuaría la certificación CCNA completa,
 * que Victor no tiene y que prohibido[] veta.
 */
export const NIVELES_FORMACION = {
  superior: 'Educación superior',
  evaluacion: 'Cursos con evaluación',
  asistencia: 'Asistencia y participación',
};

/**
 * Reparte la formación en los tres niveles a partir de `acreditacion`, que es obligatorio en
 * el esquema. Nada se infiere del tipo ni del nombre.
 *
 * `destacadas` y `resto` subdividen el nivel 2 según `destacar`, que sigue siendo la curaduría
 * de Victor: qué mostrar primero, no en qué nivel está.
 */
export function nivelesDeFormacion(perfil) {
  const conEvaluacion = perfil.formacion.filter((f) => f.acreditacion === 'evaluacion');
  return {
    superior: perfil.educacion,
    evaluacion: conEvaluacion,
    destacadas: conEvaluacion.filter((f) => f.destacar),
    resto: conEvaluacion.filter((f) => !f.destacar),
    asistencia: perfil.formacion.filter((f) => f.acreditacion === 'asistencia'),
    agrupada: perfil.formacion_agrupada ?? [],
  };
}

/** Escapa HTML. Todo texto que venga de profile.json pasa por aquí antes de incrustarse. */
export function esc(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
