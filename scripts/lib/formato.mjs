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

/** Escapa HTML. Todo texto que venga de profile.json pasa por aquí antes de incrustarse. */
export function esc(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
