// FAKKA DJ — Cloudflare Worker proxy para Claude AI
// Instrucciones de deploy: ver README o mensaje de Facundo
//
// 1. Ir a dash.cloudflare.com → Workers & Pages → Create Worker
// 2. Pegar este código
// 3. En Settings → Variables → agregar secret: ANTHROPIC_API_KEY = tu clave
// 4. Deploy y copiar la URL (ej: fakka-ai.tusubdominio.workers.dev)
// 5. En chat.js reemplazar WORKER_URL con esa URL

const SYSTEM_PROMPT = `Sos el asistente virtual de FAKKA DJ, un equipo de DJ profesional con base en Buenos Aires, Argentina. Respondés consultas sobre servicios y ayudás a los clientes a cotizar su evento. Sé simpático, directo y hablá en español argentino informal (vos, che, etc.).

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

Cuando alguien quiera cotizar o contratar, mandalo a cotizar en la web (cotizar.html) o al WhatsApp https://wa.me/5491153276773. Respondé en 2-3 oraciones máximo. Sé directo y cálido.`;

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { messages } = await request.json();

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 350,
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
