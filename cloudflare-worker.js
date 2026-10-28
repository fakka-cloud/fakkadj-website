// FAKKA DJ — Cloudflare Worker proxy para Claude AI
// Instrucciones de deploy: ver README o mensaje de Facundo
//
// 1. Ir a dash.cloudflare.com → Workers & Pages → Create Worker
// 2. Pegar este código
// 3. En Settings → Variables → agregar secret: ANTHROPIC_API_KEY = tu clave
// 4. Deploy y copiar la URL (ej: fakka-ai.tusubdominio.workers.dev)
// 5. En chat.js reemplazar WORKER_URL con esa URL

const SYSTEM_PROMPT = `Sos el asistente virtual de FAKKA DJ, un equipo de DJ profesional con base en Buenos Aires, Argentina. Respondés consultas sobre servicios y ayudás a los clientes a cotizar su evento. Hablá en español argentino natural e informal (tuteo con "vos"), sin exageraciones ni frases motivacionales. Nada de "¡vamos a hacerlo memorable!", "¡dale que buena onda!" ni frases grandilocuentes. No uses palabrotas ni expresiones como "boludo", "che", "loco". Sé directo, cálido y concreto.

SERVICIOS:
- DJ profesional
- Iluminación audiorrítmica
- Sistema de sonido (parlantes)
- Servicios extra coordinados: fotografía, catering, animación de eventos

ZONAS DE COBERTURA: Gran Buenos Aires — CABA, Zona Norte, Zona Oeste, Zona Sur

TIPOS DE EVENTOS: casamientos, fiestas de 15, cumpleaños, corporativos, egresados, barcos privados, y más

MÚSICA: 100% personalizable. Cumbia, reggaetón, rock, pop, disco y más. Aceptan playlists de Spotify o YouTube Music. Se organiza en reunión previa al evento.

DURACIÓN: Sin límite fijo, han manejado eventos de hasta 12 horas.

WIFI: No es necesario para el servicio.

PAGO Y CONTRATO:
- Se firma contrato luego de aceptar el presupuesto
- Seña del 50% para reservar la fecha y congelar el precio
- El resto se puede abonar en hasta 3 cuotas
- Factura C únicamente

PRECIOS: Los precios se cotizan según cada evento (tipo, duración, zona, cantidad de personas). No des cifras específicas — siempre decí que el precio se calcula en base al evento.

CONTACTO: WhatsApp 11 5327-6773 | contacto.fakkadj@gmail.com

Cuando alguien quiera cotizar o pedir un presupuesto, incluí este botón HTML al final de tu respuesta:
<a href="https://fakkadj.com/cotizar.html" style="display:inline-block;margin-top:8px;padding:8px 16px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.9rem;">Cotizar ahora</a>

Cuando alguien quiera contactar o escribir por WhatsApp, incluí este botón HTML al final de tu respuesta:
<a href="https://wa.me/5491153276773" target="_blank" style="display:inline-block;margin-top:8px;padding:8px 16px;background:#25d366;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.9rem;">Escribir por WhatsApp</a>

Respondé en 2-3 oraciones máximo (sin contar el botón). Sé directo y natural.`;

const ORIGENES = ['https://fakkadj.com', 'https://www.fakkadj.com'];
const MAX_MENSAJES = 20;
const MAX_LARGO = 1000;
const MAX_PEDIDOS = 20; // por minuto y por IP (por instancia del worker)
const pedidos = new Map();

function limitado(ip) {
  const ahora = Date.now();
  const lista = (pedidos.get(ip) || []).filter(t => ahora - t < 60000);
  lista.push(ahora);
  pedidos.set(ip, lista);
  if (pedidos.size > 5000) pedidos.clear();
  return lista.length > MAX_PEDIDOS;
}

function mensajesValidos(m) {
  return Array.isArray(m) && m.length > 0 && m.length <= MAX_MENSAJES &&
    m.every(x => x && (x.role === 'user' || x.role === 'assistant') &&
      typeof x.content === 'string' && x.content.length > 0 && x.content.length <= MAX_LARGO) &&
    m[0].role === 'user' && m[m.length - 1].role === 'user';
}

export default {
  async fetch(request, env) {
    const origen = request.headers.get('Origin');
    const permitido = ORIGENES.includes(origen);
    const cors = {
      'Access-Control-Allow-Origin': permitido ? origen : ORIGENES[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (!permitido) {
      return new Response('Forbidden', { status: 403, headers: cors });
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
    if (limitado(ip)) {
      return new Response(
        JSON.stringify({ reply: 'Estás mandando muchos mensajes. Probá en un minuto o escribinos por WhatsApp: wa.me/5491153276773' }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...cors } }
      );
    }

    try {
      const { messages } = await request.json();
      if (!mensajesValidos(messages)) {
        return new Response(JSON.stringify({ reply: 'Mensaje inválido.' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system: SYSTEM_PROMPT,
          messages,
        }),
      });

      const data = await res.json();
      const reply = data.content?.[0]?.text || 'Lo siento, no pude procesar tu consulta.';

      return new Response(JSON.stringify({ reply }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    } catch {
      return new Response(
        JSON.stringify({ reply: 'Hubo un error. Escribinos por WhatsApp: wa.me/5491153276773' }),
        { headers: { 'Content-Type': 'application/json', ...cors } }
      );
    }
  },
};
