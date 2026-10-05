(function () {
  'use strict';

  // WhatsApp: um número, duas mensagens (paciente e instituição).
  var NUMERO = '5538999897448';
  var MENSAGENS = {
    consulta: 'Olá, Dra. Lara! Vim pelo site e gostaria de agendar uma consulta.',
    curriculo: 'Olá, Dra. Lara! Vim pelo site e gostaria de receber seu currículo para uma oportunidade de trabalho.'
  };
  Array.prototype.forEach.call(document.querySelectorAll('[data-wpp]'), function (a) {
    a.href = 'https://wa.me/' + NUMERO + '?text=' + encodeURIComponent(MENSAGENS[a.dataset.wpp] || MENSAGENS.consulta);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  // Menu: o <dialog> modal cuida de foco, Esc e trava de foco.
  var menu = document.getElementById('menu');
  var abrir = document.querySelector('.abrir-menu');
  if (menu && abrir && menu.showModal) {
    abrir.addEventListener('click', function () {
      menu.showModal();
      abrir.setAttribute('aria-expanded', 'true');
      document.documentElement.style.overflow = 'hidden';
    });
    menu.querySelector('.fechar-menu').addEventListener('click', function () { menu.close(); });
    menu.addEventListener('close', function () {
      abrir.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
    });
    // Link de âncora fecha o painel antes de rolar.
    menu.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (link) menu.close();
    });
  }

  // Cabeçalho ganha fundo depois do topo; botão flutuante só depois do hero.
  var cab = document.querySelector('.cabecalho');
  var flut = document.querySelector('.flutuante');
  var hero = document.querySelector('.hero');
  function rolagem() {
    var y = window.scrollY;
    cab.classList.toggle('rolou', y > 12);
    if (flut && hero) flut.classList.toggle('escondido', y < hero.offsetHeight * 0.6);
  }
  rolagem();
  window.addEventListener('scroll', rolagem, { passive: true });

  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calmo) return;

  // Título do hero entra linha a linha. Divide depois das fontes, porque elas mudam a quebra.
  var titulo = document.querySelector('[data-linhas]');
  if (titulo) {
    var texto = titulo.textContent.trim();
    var dividir = function () {
      titulo.textContent = '';
      var palavras = texto.split(/\s+/).map(function (p) {
        var s = document.createElement('span');
        s.textContent = p + ' ';
        titulo.appendChild(s);
        return s;
      });
      var linhas = [];
      palavras.forEach(function (s) {
        var ultima = linhas[linhas.length - 1];
        if (!ultima || Math.abs(ultima.topo - s.offsetTop) > 4) linhas.push({ topo: s.offsetTop, p: [s.textContent] });
        else ultima.p.push(s.textContent);
      });
      titulo.textContent = '';
      linhas.forEach(function (l, i) {
        var linha = document.createElement('span');
        linha.className = 'linha';
        var dentro = document.createElement('span');
        dentro.style.setProperty('--i', i);
        dentro.textContent = l.p.join('');
        linha.appendChild(dentro);
        titulo.appendChild(linha);
      });
      titulo.setAttribute('aria-label', texto);
    };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(dividir);
  }

  // Revelação por rolagem, com cascata entre irmãos.
  if (!('IntersectionObserver' in window)) return;
  var alvos = Array.prototype.filter.call(
    document.querySelectorAll('main section .container > *, .tres > li, .grade-4 > *, .linha-do-tempo > li, .perguntas > details'),
    function (el) { return !el.closest('.hero') && !el.matches('.duo, .grade-4, .tres, .linha-do-tempo, .perguntas'); }
  );
  var obs = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visto'); obs.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  alvos.forEach(function (el) {
    var irmaos = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.setAttribute('data-revelar', '');
    el.style.setProperty('--atraso', Math.min(irmaos, 5) * 0.08 + 's');
    obs.observe(el);
  });
  document.documentElement.classList.add('revelar-pronto');
})();
