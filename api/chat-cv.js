import { GoogleGenerativeAI } from '@google/generative-ai';
import { INSTRUCCION_SISTEMA } from './_contexto.generado.js';

const ORIGENES_PRODUCCION = ['https://victorlpz3293.me', 'https://www.victorlpz3293.me'];
const ORIGENES_DESARROLLO = ['http://localhost:3000', 'http://127.0.0.1:3000'];

const LARGO_MAXIMO_PREGUNTA = 400;
const TOKENS_MAXIMOS_RESPUESTA = 300;

const MODELO = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash-lite';

/**
 * Los orígenes permitidos dependen del entorno.
 * En preview se añaden las URL del despliegue: VERCEL_URL y VERCEL_BRANCH_URL las define
 * Vercel en el servidor, nunca el cliente, así que no son manipulables desde la petición.
 */
function calcularOrigenesPermitidos() {
  const entorno = process.env.VERCEL_ENV;

  if (entorno === 'production') return ORIGENES_PRODUCCION;

  if (entorno === 'preview') {
    const deVercel = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
      .filter(Boolean)
      .map((host) => `https://${host}`);
    return [...ORIGENES_PRODUCCION, ...deVercel];
  }

  return [...ORIGENES_PRODUCCION, ...ORIGENES_DESARROLLO];
}

const origenesPermitidos = calcularOrigenesPermitidos();

async function leerCuerpo(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);

  const partes = [];
  for await (const parte of req) {
    partes.push(typeof parte === 'string' ? Buffer.from(parte) : parte);
  }
  if (!partes.length) return {};
  return JSON.parse(Buffer.concat(partes).toString('utf8'));
}

export default async function handler(req, res) {
  const origen = req.headers.origin;

  // Sin cabecera Origin no se atiende: eso descarta curl, scripts y clientes ajenos.
  // El navegador siempre la envía en una petición cross-origin o de tipo POST con JSON.
  const permitido = typeof origen === 'string' && origenesPermitidos.includes(origen);

  if (permitido) res.setHeader('Access-Control-Allow-Origin', origen);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (!permitido) {
    console.warn(`Origen rechazado: ${origen ?? '(sin cabecera Origin)'}`);
    return res.status(403).json({ error: 'Origen no permitido' });
  }

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error('Falta la variable de entorno GEMINI_API_KEY');
    return res.status(500).json({ error: 'El asistente no está disponible' });
  }

  let cuerpo;
  try {
    cuerpo = await leerCuerpo(req);
  } catch {
    return res.status(400).json({ error: 'Cuerpo JSON inválido' });
  }

  // Del cliente solo se acepta la pregunta. Cualquier "context" que envíe se ignora:
  // el contexto se construye en el servidor desde data/profile.json.
  const preguntaCruda = cuerpo?.pregunta ?? cuerpo?.prompt;
  if (typeof preguntaCruda !== 'string') {
    return res.status(400).json({ error: 'Falta la pregunta' });
  }

  const pregunta = preguntaCruda.trim().slice(0, LARGO_MAXIMO_PREGUNTA);
  if (!pregunta) return res.status(400).json({ error: 'La pregunta está vacía' });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelo = genAI.getGenerativeModel({
      model: MODELO,
      systemInstruction: INSTRUCCION_SISTEMA,
      generationConfig: {
        maxOutputTokens: TOKENS_MAXIMOS_RESPUESTA,
        temperature: 0.2,
      },
    });

    const resultado = await modelo.generateContent(
      `Pregunta de un visitante del sitio:\n\n${pregunta}`,
    );
    const respuesta = resultado.response.text()?.trim();

    if (!respuesta) {
      return res.status(200).json({ respuesta: 'No tengo esa información; puedes escribirle a Victor.' });
    }

    return res.status(200).json({ respuesta });
  } catch (error) {
    console.error('Error al consultar el modelo:', error?.message || error);
    return res.status(502).json({ error: 'El asistente no pudo responder' });
  }
}
