const WORKER_URL = 'https://fakka-ai.facundo-tomas-deluca.workers.dev';

const SYSTEM_PROMPT = `Sos el asistente virtual de FAKKA DJ, un equipo de DJ profesional con base en Buenos Aires, Argentina. Respondés consultas sobre servicios y ayudás a los clientes a cotizar su evento. Hablá en español argentino natural e informal (tuteo con "vos"), sin exageraciones ni frases motivacionales. Nada de "¡vamos a hacerlo memorable!", "¡dale que buena onda!" ni frases grandilocuentes. Sé directo, cálido y concreto.

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

(function () {
  const widget = document.createElement('div');
  widget.id = 'fk-chat';
  widget.innerHTML = `
    <button id="fk-chat-btn" aria-label="Consultá con IA">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="fk-badge" id="fk-badge">1</span>
    </button>
    <div id="fk-panel">
      <div id="fk-header">
        <div class="fk-hinfo">
          <div class="fk-avatar">🎧</div>
          <div>
            <strong>FAKKA DJ</strong>
            <span>Asistente virtual · responde al instante</span>
          </div>
        </div>
        <button id="fk-close" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div id="fk-msgs">
        <div class="fk-msg fk-bot">
          <p>Hola! Soy el asistente de FAKKA DJ. Preguntame lo que quieras sobre servicios, precios o tu evento.</p>
        </div>
      </div>
      <div id="fk-input-row">
        <input id="fk-input" type="text" placeholder="Escribí tu consulta..." autocomplete="off" maxlength="400" />
        <button id="fk-send" aria-label="Enviar">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  const btn   = document.getElementById('fk-chat-btn');
  const panel = document.getElementById('fk-panel');
  const close = document.getElementById('fk-close');
  const input = document.getElementById('fk-input');
  const send  = document.getElementById('fk-send');
  const msgs  = document.getElementById('fk-msgs');
  const badge = document.getElementById('fk-badge');

  let history = [];
  let isOpen  = false;

  function togglePanel(open) {
    isOpen = open;
    panel.classList.toggle('fk-open', open);
    btn.classList.toggle('fk-active', open);
    if (open) {
      badge.style.display = 'none';
      setTimeout(() => input.focus(), 200);
    }
  }

  btn.addEventListener('click', () => togglePanel(!isOpen));
  close.addEventListener('click', () => togglePanel(false));

  function appendMsg(text, isBot) {
    const div = document.createElement('div');
    div.className = 'fk-msg ' + (isBot ? 'fk-bot' : 'fk-user');
    const p = document.createElement('p');
    p.innerHTML = text;
    div.appendChild(p);
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function appendTyping() {
    const div = document.createElement('div');
    div.className = 'fk-msg fk-bot fk-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || send.disabled) return;
    input.value = '';
    send.disabled = true;

    appendMsg(text, false);
    history.push({ role: 'user', content: text });

    const typing = appendTyping();

    try {
      const res  = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: SYSTEM_PROMPT, messages: history }),
      });
      const data = await res.json();
      typing.remove();
      appendMsg(data.reply, true);
      history.push({ role: 'assistant', content: data.reply });
    } catch {
      typing.remove();
      appendMsg('Hubo un error. <a href="https://wa.me/5491153276773" target="_blank" style="color:#25d366;font-weight:600;">Escribinos por WhatsApp</a>', true);
    }

    send.disabled = false;
    input.focus();
  }

  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
})();
