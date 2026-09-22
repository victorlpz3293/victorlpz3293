#!/usr/bin/env node
/**
 * Descarga las fuentes a public/assets/fonts/ en woff2, solo con el subconjunto latino.
 *
 * Se ejecuta a mano (`npm run fonts`) y sus salidas se versionan. Sirviéndolas desde el
 * propio dominio, la web no depende de Google Fonts y la CSP puede cerrarse más.
 */
import { writeFileSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const destino = join(raiz, 'public/assets/fonts');
mkdirSync(destino, { recursive: true });

// Se piden como rango (400..700) para que Google devuelva la fuente variable: un solo
// archivo por familia en vez de uno por peso, y bastante menos peso total.
const FAMILIAS = [
  { familia: 'Inter', rango: '400..700' },
  { familia: 'Outfit', rango: '600..700' },
];

// Con este User-Agent la API devuelve woff2. Con uno antiguo devolvería formatos pesados.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const descargados = [];

for (const { familia, rango } of FAMILIAS) {
  const url = `https://fonts.googleapis.com/css2?family=${familia}:wght@${rango}&display=swap`;
  const css = await fetch(url, { headers: { 'User-Agent': UA } }).then((r) => r.text());

  // La API agrupa por subconjunto con un comentario antes de cada bloque. Solo interesa "latin".
  const bloque = css.split('/*').find((b) => /^\s*latin\s*\*\//.test(b));
  const enlace = bloque?.match(/url\((https:[^)]+\.woff2)\)/)?.[1];

  if (!enlace) {
    console.error(`  No se encontró el subconjunto latino de ${familia}`);
    process.exit(1);
  }

  const nombre = `${familia.toLowerCase()}-variable.woff2`;
  writeFileSync(join(destino, nombre), Buffer.from(await fetch(enlace).then((r) => r.arrayBuffer())));
  descargados.push(nombre);
}

const total = descargados.reduce((s, n) => s + statSync(join(destino, n)).size, 0);
console.log(`  ${descargados.length} fuentes en public/assets/fonts/ · ${(total / 1024).toFixed(1)} KB en total`);
for (const n of descargados) console.log(`   ${n}  ${(statSync(join(destino, n)).size / 1024).toFixed(1)} KB`);
