#!/usr/bin/env node
/**
 * Genera public/index.html desde data/profile.json y templates/site.mjs.
 *
 * Se genera en el build, no en el navegador, para que el HTML publicado sea el que
 * ven los buscadores y para que check-claims pueda revisarlo antes de desplegar.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { render } from '../templates/site.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const perfil = JSON.parse(readFileSync(join(raiz, 'data/profile.json'), 'utf8'));

// El botón de descarga solo aparece si el PDF existe: enlazar a un 404 sería peor que no ofrecerlo.
const hayPdf = existsSync(join(raiz, 'public/cv-victor-lopez.pdf'));

const html = render(perfil, { hayPdf });

mkdirSync(join(raiz, 'public'), { recursive: true });
writeFileSync(join(raiz, 'public/index.html'), html, 'utf8');

const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
console.log(`  public/index.html generado · ${kb} KB`);
if (!hayPdf) console.log('   Sin public/cv-victor-lopez.pdf: el botón de descarga se omite (fase 3)');
