// FAKKA DJ — Chat widget con IA
// Reemplazá WORKER_URL con la URL de tu Cloudflare Worker desplegado
const WORKER_URL = 'https://fakka-ai.facundo-tomas-deluca.workers.dev';

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
          <p>¡Hola! 👋 Soy el asistente de FAKKA DJ. Preguntame lo que quieras sobre servicios, precios o tu evento.</p>
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

  const btn    = document.getElementById('fk-chat-btn');
  const panel  = document.getElementById('fk-panel');
  const close  = document.getElementById('fk-close');
  const input  = document.getElementById('fk-input');
  const send   = document.getElementById('fk-send');
  const msgs   = document.getElementById('fk-msgs');
  const badge  = document.getElementById('fk-badge');

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
    p.textContent = text;
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
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      typing.remove();
      appendMsg(data.reply, true);
      history.push({ role: 'assistant', content: data.reply });
    } catch {
      typing.remove();
      appendMsg('Hubo un error 😕 Escribinos directamente por WhatsApp: wa.me/5491153276773', true);
    }

    send.disabled = false;
    input.focus();
  }

  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
})();
