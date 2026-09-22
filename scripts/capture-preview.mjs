#!/usr/bin/env node
/**
 * Captura public/assets/preview.png desde el sitio ya generado, para docs/TECNICO.md.
 *
 * Levanta un servidor estático sobre public/ en vez de abrir el archivo directamente:
 * con file:// el navegador bloquea los módulos de JavaScript y la página saldría a medias.
 *
 * Se ejecuta a mano (`npm run preview`) después de `npm run build`.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { chromium } from 'playwright';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const publico = join(raiz, 'public');
const salida = join(publico, 'assets/preview.png');

if (!existsSync(join(publico, 'index.html'))) {
  console.error('  No existe public/index.html. Ejecuta antes `npm run build`.');
  process.exit(1);
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

const servidor = createServer(async (peticion, respuesta) => {
  try {
    const ruta = peticion.url === '/' ? '/index.html' : peticion.url.split('?')[0];
    const datos = await readFile(join(publico, ruta));
    respuesta.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] ?? 'application/octet-stream' });
    respuesta.end(datos);
  } catch {
    respuesta.writeHead(404).end('No encontrado');
  }
});

await new Promise((listo) => servidor.listen(4180, listo));

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1280, height: 800 } });

await pagina.goto('http://localhost:4180/', { waitUntil: 'networkidle' });
await pagina.evaluate(() => document.fonts.ready);

// Sin el asistente flotante: la captura es del sitio, no de su widget.
await pagina.evaluate(() => document.querySelector('#toggle-chat')?.closest('div')?.remove());
await pagina.screenshot({ path: salida });

await navegador.close();
servidor.close();

console.log(`  public/assets/preview.png · ${(statSync(salida).size / 1024).toFixed(1)} KB`);
