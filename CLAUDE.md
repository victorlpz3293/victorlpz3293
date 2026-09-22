# CLAUDE.md — Unificación del perfil profesional de Victor R. López

## Contexto

Victor tiene su perfil profesional disperso en cinco fuentes que se contradicen entre sí:

1. El CV web: repo `victorlpz3293/CV-VictorLopez-2026`, publicado en victorlpz3293.me con Vercel.
2. El asistente IA de esa web: `public/script.js` (`CONTEXTO_CV` y `cerebroLocal`) y `api/chat-cv.js`.
3. El README de perfil de GitHub: repo `victorlpz3293/victorlpz3293`.
4. El CV en PDF, hecho en Canva.
5. LinkedIn, que Victor actualiza a mano con `LINKEDIN.md`.

Parte del contenido actual fue generado por IA sin verificar e incluye afirmaciones falsas (por ejemplo, Zabbix/Grafana, clúster Proxmox, título de ingeniero ya obtenido).

**Objetivo:** que `data/profile.json` sea la única fuente de verdad y que todo lo demás se genere o lea desde ahí.

**Decisión de arquitectura: un solo repo.** Todo vive en `victorlpz3293/victorlpz3293`, que GitHub muestra como perfil. La web se mueve ahí y `CV-VictorLopez-2026` se archiva.

## Reglas no negociables

1. **No inventes datos.** Todo texto sobre Victor sale de `data/profile.json`. Si falta información, pregúntale; no la completes.
2. **Respeta el campo `evidencia`.**
   - `produccion`: se presenta como experiencia.
   - `laboratorio`: se presenta como laboratorio.
   - `formacion`: se presenta como formación.
   - Nunca se mezclan.
3. **Ninguna frase de `prohibido[]` puede aparecer en ninguna salida.** Esto incluye la web, el PDF, el README y las respuestas del bot.
4. **Tono sobrio y verificable.** Sin superlativos ("experto", "total", "absoluto", "primer nivel") ni métricas no respaldadas.
5. **Proyectos con `mostrar: false` y los excluidos no aparecen en ningún lado.** La lista de excluidos vive en `_privado/notas.json`, porque nombra proyectos que no son públicos.
5b. **`data/profile.json` es público**, porque el repositorio lo es. Solo contiene lo publicable. El material editorial —notas por proyecto, proyectos excluidos, formación no TI, restricciones de NITSC— vive en `_privado/notas.json`. Los términos prohibidos que nombran algo privado se guardan en `prohibido_privado[]` como huella SHA-256, nunca escritos.
6. **Proyectos con desarrollo asistido por IA** se rotulan como tal: *"Desarrollado con asistencia de IA"*.
7. **Privacidad.** No publicar la dirección de casa, IPs internas, dominios internos de la empresa, números de serie ni documentos de identidad. El detalle está en `_privado/observaciones.md`.

## Fase M — Construcción limpia y entrega al repo de perfil (última fase)

**Método (sustituye al plan anterior de mover código entre repos):** no se migra nada. Todo se construye desde cero en la carpeta de trabajo `victorlpz3293-v2/`, y solo al final se entrega al repo `victorlpz3293`.

Roles de las carpetas durante todas las fases:

- `victorlpz3293-v2/` — donde se construye. Repo git propio, sin remoto.
- `CV-VictorLopez-2026/` — **solo lectura**. Se usa como referencia de código, estructura y assets; nunca como fuente de contenido sobre Victor.
- `victorlpz3293/` — **solo lectura** hasta esta fase. Es el destino final.

**Por qué no se usa el git de `victorlpz3293-v2/`:** su historia es independiente y no comparte ningún commit con `victorlpz3293`. GitHub no permite abrir un PR entre historias sin ancestro común. El git de v2 sirve solo para trabajar con seguridad dentro del taller; **no se empuja a ningún remoto**.

Pasos de la entrega, cada uno con aprobación explícita de Victor:

- [ ] Revisión final del árbol construido en `victorlpz3293-v2/`: `npm run validate` y `npm run check-claims` en verde.
- [ ] Dentro del **clon de `victorlpz3293`**, crear la rama `Desarrollo-Claude` partiendo de `main`.
- [ ] Copiar sobre esa rama **los archivos que git rastrea en el taller**, que son exactamente los que debe tener el repositorio: `git ls-files` los enumera. No vale copiar la carpeta entera "quitando `.git/` y `_privado/`", porque arrastraría `node_modules/`, `build/` y los archivos generados, que están en `.gitignore` y los produce el build de Vercel. Luego hacer commit: así se apoya en la historia real del repo y el PR es posible.

  **Esto no es opcional.** La historia de git del taller contiene commits anteriores a la revisión de confidencialidad, con los logros que describían la infraestructura de cada empleador, los modelos de equipo y las cantidades. Copiando solo los archivos, esa historia nunca sale del disco local: en GitHub aparece un único commit con el contenido ya revisado. Si en su lugar se empujara el repositorio del taller, o se usara `git subtree`, `git filter-repo` o cualquier método que arrastre commits, **el texto anterior quedaría publicado y recuperable**.
- [ ] Subir la rama (`git push -u origin Desarrollo-Claude`) y abrir el **Pull Request** hacia `main` con el detalle de lo construido. No hacer merge sin que Victor lo apruebe.
- [ ] Vercel (solo tras el merge). **El proyecto actual no se reutiliza: se crea uno nuevo.** Estos pasos los ejecuta Victor en el panel de Vercel; el trabajo aquí es dejar el procedimiento escrito en `docs/TECNICO.md`:
  1. Crear un proyecto nuevo en Vercel conectado al repo `victorlpz3293`.
  2. Cargar las variables con una **API key de Gemini nueva** (no reutilizar la del proyecto viejo).
  3. Probar el sitio y el asistente en la URL `*.vercel.app`.
  4. Mover el dominio `victorlpz3293.me` del proyecto viejo (`cv-victor-lopez-2026`) al nuevo.
  5. Verificar en el dominio real.
  6. Eliminar el proyecto viejo y revocar la API key vieja.
  7. Archivar el repo `CV-VictorLopez-2026` (Settings → Archive).
- [ ] Verificar que `github.com/victorlpz3293` muestra el README nuevo.

No se hace `git push`, no se abren PRs y no se toca Vercel sin aprobación explícita de Victor.

## Fase 0 — Fuente de verdad

- [ ] Copiar `profile.json` a `data/profile.json` en el repo del CV.
- [ ] Crear `data/profile.schema.json` (JSON Schema) y un script `npm run validate` que valide el archivo.
- [ ] Los `stack` de los proyectos ya fueron validados por Victor con los lenguajes que muestra GitHub. No los amplíes.
- [ ] Crear `scripts/check-claims.mjs`:
  - Busca en todas las salidas generadas (HTML, README, texto del PDF) cada término de `prohibido[]`, sin distinguir mayúsculas.
  - Si encuentra alguno, falla el build.

## Fase 1 — Seguridad del asistente IA (prioridad alta)

Problemas actuales en `api/chat-cv.js` y `public/script.js`:

- [ ] **El contexto lo envía el navegador.** Hoy cualquiera puede mandar su propio "contexto" y usar la API key de Gemini como proxy gratuito. El servidor debe construir el contexto desde `data/profile.json` (import en build o lectura en el handler) e ignorar cualquier contexto enviado por el cliente.
- [ ] **Validación de origen.** Rechazar las peticiones sin cabecera `Origin`; hoy `!origin` pasa el filtro. Permitir solo `https://www.victorlpz3293.me`, `https://victorlpz3293.me` y localhost en desarrollo.
- [ ] **Límite de peticiones.** Rate limiting con **Vercel Firewall** (decisión de Victor). No vive en el repo, así que queda documentado en `docs/TECNICO.md` con los valores aplicados.
- [ ] **Largo del mensaje.** Mantener el límite de longitud del mensaje del usuario (ya existe) y quitar el recorte a 3000 caracteres del contexto, que hoy corta la línea de LinkedIn y GitHub.
- [ ] **Límite de salida.** Acotar los tokens de respuesta de Gemini (`maxOutputTokens`) para que una petición no pueda disparar el costo.
- [ ] **Historial completo de git.** Verificar que nunca se versionó una API key en `CV-VictorLopez-2026` (`git log -p --all`, patrones `AIza` y `GEMINI_API_KEY=`). Solo lectura.
- [ ] **Salida sin sanitizar.** Hoy se inserta con `innerHTML`. Escapar el HTML antes de aplicar el formato (negritas y saltos de línea), o renderizar con `textContent` más elementos creados por DOM.
- [ ] **Instrucción de sistema.** Responder solo con datos de `profile.json`, rechazar lo que no esté ahí ("No tengo esa información; puedes escribirle a Victor") y nunca usar términos de `prohibido[]`.
- [ ] **Respaldo offline (`cerebroLocal`).** Regenerarlo desde `profile.json`, no escribirlo a mano.
- [ ] **Redirección a WhatsApp.** Quitar la apertura automática de pestaña tras 3 mensajes. En su lugar, mostrar un botón "Continuar por WhatsApp" que el visitante decide pulsar, y **no incluir el historial del chat** en el mensaje.
- [ ] Verificar que ninguna API key esté en el frontend ni en el historial de git.

## Fase 2 — Web generada desde el JSON

- [ ] Crear `scripts/build-site.mjs` que genere `public/index.html` desde una plantilla más `profile.json`. Generar en build y no en el navegador, para no perder SEO. Configurarlo como build command de Vercel.
- [ ] Secciones, en este orden:
  1. Hero (nombre, `titular`, `resumen.corto`, botones de contacto y de descarga del PDF).
  2. Resumen (`resumen.largo`).
  3. Experiencia.
  4. Proyectos (`mostrar: true`), con rótulo de estado y de IA.
  5. Habilidades agrupadas por `evidencia`.
  6. Educación.
  7. Formación: destacadas primero, luego el resto, y `formacion_agrupada` en una línea.
  8. Contacto.
### Decisiones de Victor para la web (2026-09-21)

- ~~**Formulario de contacto: se elimina.**~~ Revertido el 2026-09-22, ver abajo.
- **Teléfono: nunca como texto visible.** Solo accesible a través del botón de WhatsApp.
- **Nombre: "Victor R. López"**, sin tilde en Victor, tal como está en el JSON. Aplica a toda salida.
- **Tailwind:** CLI v3 fijado como devDependency, compilado en build. Sin CDN.

### Decisiones de Victor para la web (2026-09-22)

Sustituyen a las anteriores donde se contradigan.

- **Formulario de contacto: vuelve.** Sin servidor: arma el texto y abre WhatsApp. Convive con los botones directos.
- **Botón flotante de WhatsApp:** abajo a la izquierda (el asistente ocupa la derecha).
- **Experiencia:** línea de tiempo con columna fija a la izquierda y círculos numerados. Sin las métricas de la web vieja ("+6 años", "99% de uptime"): no están respaldadas.
- **Formación destacada:** cuadrícula de tarjetas con un ícono genérico por tema, nunca el logotipo del emisor.
- **Habilidades:** una tarjeta por categoría con una etiqueta de evidencia; se conserva el agrupamiento por evidencia.
- **Proyectos:** las tarjetas se igualan sintetizando el contenido de `profile.json`, no con trucos de maquetación.
- **CV en PDF:** no se versiona. Lo genera el build de Vercel; su `installCommand` instala las librerías de Chromium con `dnf`.

- [ ] Reemplazar el CDN "play" de Tailwind por CSS compilado con **Tailwind CLI v3 fijado**. Luego endurecer la CSP:
  - Quitar `unsafe-eval`.
  - Reducir `unsafe-inline` si es posible.
  - Cambiar `connect-src https://*.me` por solo `'self'`.
- [ ] Quitar jsPDF (se carga y no se usa) y la cabecera obsoleta `X-XSS-Protection`.
- [ ] Optimizar `perfil.png` (1 MB) a WebP de menos de 150 KB, con `width` y `height` definidos.
- [ ] Agregar etiquetas Open Graph y Twitter Card, usando `preview.png` optimizado como imagen.
- [ ] Actualizar todos los enlaces:
  - LinkedIn: `https://www.linkedin.com/in/victorlpz3293/`.
  - Eliminar cualquier referencia a `victorlpz329` o a WordPress.
- [ ] Corregir los errores ortográficos existentes ("itegradores", "computos", etc.); desaparecen al regenerar.

## Fase 3 — CV en PDF generado

- [ ] Crear `templates/cv-print.html`: una sola columna, apto para ATS, 2 páginas como máximo, misma paleta que la web. Contenido:
  - Encabezado: nombre, `titular`, contacto (sin dirección de casa), web, LinkedIn y GitHub.
  - Resumen: `resumen.largo`.
  - Experiencia completa.
  - Proyectos: solo los de `mostrar: true`, máximo 3 (ERP Hub, Core ERP Suite, laboratorio OpenStack).
  - Habilidades: las de `produccion`, más una línea por cada otro tipo de evidencia (laboratorio, desarrollo asistido por IA y estudiado). Deben coincidir con la web.
  - Educación.
  - Formación: solo `destacar: true`, más la línea de `formacion_agrupada`.
  - Idiomas.
- [ ] Crear `scripts/build-pdf.mjs` con Playwright (Chromium) que genere `public/cv-victor-lopez.pdf`.
- [ ] En `.gitignore`, mantener `*.pdf` **sin excepciones**: ningún PDF se versiona. El CV lo genera el build. Los PDF de certificados nunca se suben: uno de ellos muestra un documento de identidad.
- [ ] Workflow `.github/workflows/verificar.yml`: en cada Pull Request, corre el mismo `npm run build` que Vercel (PDF incluido) y hace commit solo del README. El PDF no se confirma.
- [ ] **Evitar el bucle de CI.** El workflow hace commit de archivos del propio repo, así que debe: (a) filtrar por `on.push.paths` (`data/**`, `templates/**`, `scripts/**`) y (b) ignorar sus propios commits — marcarlos con `[skip ci]` en el mensaje, o condicionar el job a que el autor no sea `github-actions[bot]`. Sin esto, cada commit del bot dispara otra ejecución.

## Fase 4 — README generado

- [ ] Crear `templates/readme.md.tpl` a partir de `README.propuesta.md`, respetando su estructura exacta y su tono.
- [ ] Crear `scripts/build-readme.mjs`, que escribe el `README.md` raíz desde el JSON. Se ejecuta en el mismo workflow que el PDF; no hace falta sincronizar entre repos.
- [ ] Badges: solo tecnologías con `evidencia: produccion`. Laboratorio y desarrollo asistido por IA van en líneas de texto, no como badges.
- [ ] No incluir widgets de terceros (rachas ni estadísticas).

### Auditoría de los README anteriores: NO recuperar nada de esto

Del README de perfil anterior:
- Título "Ingeniero en Telemática & IT Manager".
- Badge "100% Curiosity | 99.9% Resilience".
- La historia de "desarmando equipos".
- "No soy solo un entusiasta de la IA; soy un arquitecto…".
- La cita del "tejido auto-sanable".
- "Clusters de Proxmox" y "VPNs multisitio".
- "Profundo background Full-Stack".
- El badge de Cisco.
- Los proyectos listados en `_privado/notas.json` como excluidos, junto con "microservicios" y HRMS.
- La tienda en línea descrita con su nombre antiguo, wallet y multimoneda.
- El widget de rachas en herokuapp.
- "Arquitecturas Zero-Trust".

Del README del CV anterior (al reescribirlo en `docs/TECNICO.md`):
- **Se va:**
  - Badge "Production Ready".
  - "Ingeniero en Telemática".
  - "Firma consultora".
  - "Entrenado con un System Prompt".
  - La sección CI/CD con "validación de variables".
  - "100% responsiva / visualización perfecta".
- **Se queda (verificado en el código):**
  - Asistente con Gemini en una función serverless.
  - Redirección a WhatsApp tras 3 mensajes.
  - Respaldo offline (`cerebroLocal`).
  - Cabeceras de seguridad en `vercel.json`, descritas tal como queden después de la fase 1.
  - Despliegue automático de Vercel en cada push a `main`.
- **Captura `preview.png`:** regenerarla del sitio nuevo y rotularla como "Captura del sitio".
- **Instalación local:** completarla.

## Fase 5 — Limpieza del repo del CV

- [ ] Reescribir `README.md` del repo con descripciones técnicas honestas. Quitar "entrenado", "pipeline CI/CD" (a menos que exista tras la fase 3) y "Production Ready". Completar la sección de instalación, que hoy está cortada.
- [ ] Actualizar `.env.example` con las variables reales que se necesiten tras la fase 1.

## Observaciones en otros repos

Están en `_privado/observaciones.md`, que no se versiona: nombran repositorios privados y fallos de seguridad sin corregir. No tocar esos repos sin permiso de Victor; solo reportar.

## Criterios de aceptación

- `npm run validate` y `npm run check-claims` pasan.
- Hay un solo repo activo y `CV-VictorLopez-2026` está archivado.
- La web, el PDF y el README muestran el mismo titular, fechas, cargos y certificados.
- El bot responde "no tengo esa información" ante preguntas sobre algo que no está en el JSON (por ejemplo, "¿sabe Kubernetes?").
- Una petición a `/api/chat-cv` sin `Origin` válido o con un campo `context` propio no usa ese contexto.
- Lighthouse de la web con 90 o más en Performance, Accessibility, Best Practices y SEO.

## Lo que NO debes hacer

- No redactes logros nuevos ni "mejores" que los del JSON.
- No agregues tecnologías porque aparezcan en un repo sin que Victor lo confirme.
- No publiques datos de `notas_privadas`.
- No borres ni modifiques los repos de proyectos; solo léelos.
