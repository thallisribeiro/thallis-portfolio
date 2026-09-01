// Menu hamburguer e dispensa do aviso de previa.
(function () {
  var botao = document.querySelector('.hamburguer');
  var nav = document.getElementById('nav-principal');

  if (botao && nav) {
    botao.addEventListener('click', function () {
      var aberto = botao.getAttribute('aria-expanded') === 'true';
      botao.setAttribute('aria-expanded', String(!aberto));
      nav.setAttribute('data-aberto', String(!aberto));
    });
  }

  var aviso = document.querySelector('.previa');
  if (aviso) {
    var fechar = aviso.querySelector('button');
    if (sessionStorage.getItem('previa-oculta') === '1') aviso.hidden = true;
    if (fechar) {
      fechar.addEventListener('click', function () {
        aviso.hidden = true;
        try { sessionStorage.setItem('previa-oculta', '1'); } catch (e) {}
      });
    }
  }
})();
