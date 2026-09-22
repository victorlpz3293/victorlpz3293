#!/usr/bin/env node
/**
 * Genera public/cv-victor-lopez.pdf desde data/profile.json y templates/cv-print.mjs.
 *
 * Deja además build/cv-texto.txt con el texto extraído del documento, que es lo que revisa
 * check-claims: así se verifica lo que el PDF realmente dice, no lo que dice su plantilla.
 *
 * No forma parte de `npm run build` porque Vercel no tiene los navegadores de Playwright.
 * Lo ejecuta el workflow de GitHub Actions, y en local `npm run build:pdf`.
 */
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';
import subsetFont from 'subset-font';
import { render } from '../templates/cv-print.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const perfil = JSON.parse(readFileSync(join(raiz, 'data/profile.json'), 'utf8'));

const carpetaBuild = join(raiz, 'build');
mkdirSync(carpetaBuild, { recursive: true });

const rutaHtml = join(carpetaBuild, 'cv-print.html');
const rutaPdf = join(raiz, 'public/cv-victor-lopez.pdf');
const rutaTexto = join(carpetaBuild, 'cv-texto.txt');

// Chromium incrusta en el PDF la fuente que se le dé, y si es variable la expande entera.
// Se le pasan instancias de peso fijo, recortadas a los caracteres que este CV usa: el
// archivo baja de unos 250 KB a unos 100.
const PESOS = [400, 600, 700];

const htmlCompleto = render(perfil, { rutaFuentes: '../public/assets/fonts' });
const caracteres = htmlCompleto.replace(/<[^>]*>/g, ' ');
const fuenteVariable = readFileSync(join(raiz, 'public/assets/fonts/inter-variable.woff2'));

const fuentesEnLinea = [];
for (const peso of PESOS) {
  const recortada = await subsetFont(fuenteVariable, caracteres, {
    targetFormat: 'woff2',
    variationAxes: { wght: { min: peso, max: peso, default: peso } },
  });
  fuentesEnLinea.push({ peso, base64: recortada.toString('base64') });
}

writeFileSync(rutaHtml, render(perfil, { fuentesEnLinea }), 'utf8');

const navegador = await chromium.launch();
const pagina = await navegador.newPage();

await pagina.goto(pathToFileURL(rutaHtml).href, { waitUntil: 'networkidle' });
await pagina.evaluate(() => document.fonts.ready);

await pagina.pdf({
  path: rutaPdf,
  format: 'A4',
  printBackground: true,
  margin: { top: '13mm', bottom: '13mm', left: '14mm', right: '14mm' },
});

const texto = await pagina.evaluate(() => document.body.innerText);
writeFileSync(rutaTexto, texto, 'utf8');

await navegador.close();

// Chromium escribe un objeto /Type /Page por página; contarlos basta para saber si se pasó de dos.
const paginas = (readFileSync(rutaPdf, 'latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
const kb = (statSync(rutaPdf).size / 1024).toFixed(1);

console.log(`  public/cv-victor-lopez.pdf generado · ${paginas} página(s) · ${kb} KB`);
console.log(`   build/cv-texto.txt · ${texto.length} caracteres para check-claims`);

if (paginas > 2) {
  console.error(`\n  El CV ocupa ${paginas} páginas y el máximo son 2.`);
  console.error('   Reduce contenido en templates/cv-print.mjs o ajusta los tamaños.\n');
  process.exit(1);
}
