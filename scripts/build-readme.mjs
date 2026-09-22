#!/usr/bin/env node
/**
 * Genera el README.md raíz desde data/profile.json y templates/readme.mjs.
 *
 * A diferencia de la web, el README sí se versiona: GitHub lo lee del repositorio.
 * Lo regenera el workflow de verificación en cada Pull Request.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { render } from '../templates/readme.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const perfil = JSON.parse(readFileSync(join(raiz, 'data/profile.json'), 'utf8'));

const markdown = render(perfil);
writeFileSync(join(raiz, 'README.md'), markdown, 'utf8');

console.log(`  README.md generado · ${markdown.split('\n').length} líneas`);
