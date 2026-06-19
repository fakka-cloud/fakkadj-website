// ============ FAKKA DJ — JS compartido ============
(function () {
  // Menú hamburguesa
  var burger = document.getElementById('hamburger');
  var links = document.getElementById('navLinks');
  if (burger && links) {
    burger.addEventListener('click', function () {
      burger.classList.toggle('open');
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        burger.classList.remove('open');
        links.classList.remove('open');
      });
    });
  }

  // Acordeón FAQ
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentElement;
      var open = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); });
      if (!open) item.classList.add('open');
    });
  });

  // Form de cotización -> WhatsApp
  var form = document.getElementById('cotizarForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre = form.nombre.value || '';
      var tipo = form.tipo_evento.value || '';
      var fecha = form.fecha.value || '';
      var zona = form.zona ? form.zona.value : '';
      var mensaje = form.mensaje.value || '';
      var text = 'hola fakka! quiero cotizar mi evento 🎉\n\n' +
        'nombre: ' + nombre + '\n' +
        'tipo de evento: ' + tipo + '\n' +
        'fecha: ' + fecha + '\n' +
        (zona ? 'zona: ' + zona + '\n' : '') +
        'detalle: ' + mensaje;
      window.open('https://wa.me/5491153276773?text=' + encodeURIComponent(text), '_blank');
    });
  }
})();
