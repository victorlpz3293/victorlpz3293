#!/usr/bin/env node
/**
 * Genera las imágenes de public/assets/ a partir de assets/origen/.
 *
 * No corre en el build de Vercel: la foto cambia muy de vez en cuando y así el despliegue
 * no necesita compilar sharp. Se ejecuta a mano con `npm run assets` y sus salidas se versionan.
 */
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origen = join(raiz, 'assets/origen/perfil.png');
const destino = join(raiz, 'public/assets');

if (!existsSync(origen)) {
  console.error(`  No existe ${origen}`);
  process.exit(1);
}

mkdirSync(destino, { recursive: true });

const kb = (ruta) => (statSync(ruta).size / 1024).toFixed(1);

// Retrato: se muestra a 128 px. Se exporta a 384 (3x) porque a este tamaño el peso es
// despreciable y así se ve nítido también en pantallas de densidad 3, no solo 2.
const retrato = join(destino, 'perfil.webp');
await sharp(origen).resize(384, 384, { fit: 'cover' }).webp({ quality: 90 }).toFile(retrato);

// Imagen para redes sociales: 1200x630 con la foto centrada sobre el color de fondo del sitio.
const social = join(destino, 'og-victor-lopez.jpg');
await sharp({
  create: { width: 1200, height: 630, channels: 3, background: '#0B0F19' },
})
  .composite([
    {
      input: await sharp(origen).resize(420, 420, { fit: 'cover' }).png().toBuffer(),
      gravity: 'centre',
    },
  ])
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(social);

console.log(`  Imágenes generadas`);
console.log(`   perfil.webp          ${kb(retrato)} KB  (origen: ${kb(origen)} KB)`);
console.log(`   og-victor-lopez.jpg  ${kb(social)} KB`);
