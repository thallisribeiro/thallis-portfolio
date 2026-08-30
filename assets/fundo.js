/* ==========================================================================
   FUNDO DO HERO — 30/08/2026
   Canais verticais com sinais descendo por eles, em velocidades diferentes.

   Por que isto e nao um campo de partículas: o assunto do site é distribuição
   — uma coisa entra e desce por vários canais. O fundo diz isso antes de
   qualquer frase, e continua dizendo enquanto a pessoa lê. Constelação de
   pontinhos ficaria bonita e não falaria de nada.

   Custo controlado de propósito: um canvas só, sem biblioteca, pausado quando
   sai da tela, e desligado inteiro sob prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  var alvo = document.querySelector('.hero-tese');
  if (!alvo) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var cv = document.createElement('canvas');
  cv.className = 'fundo-canais';
  cv.setAttribute('aria-hidden', 'true');
  alvo.insertBefore(cv, alvo.firstChild);
  var ctx = cv.getContext('2d', { alpha: true });
  if (!ctx) return;

  var L = 0, A = 0, dpr = 1;
  var canais = [];
  var sinais = [];
  var mouse = { x: -9999, y: -9999 };
  var rodando = true;
  var t0 = 0;

  var ESPACO = 38;          // distância entre canais
  var COR = '232, 163, 61'; // o âmbar da marca

  function medir() {
    var r = alvo.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    L = Math.round(r.width); A = Math.round(r.height);
    cv.width = L * dpr; cv.height = A * dpr;
    cv.style.width = L + 'px'; cv.style.height = A + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    canais = [];
    for (var x = ESPACO / 2; x < L; x += ESPACO) {
      canais.push({ x: x, brilho: 0 });
    }
    sinais = [];
  }

  function nascer() {
    if (!canais.length) return;
    var c = canais[(Math.random() * canais.length) | 0];
    sinais.push({
      canal: c,
      y: -60,
      vel: 40 + Math.random() * 110,   // px por segundo
      tam: 50 + Math.random() * 130,    // comprimento do rastro
      forca: 0.35 + Math.random() * 0.65,
    });
  }

  function quadro(t) {
    if (!rodando) return;
    var dt = t0 ? Math.min((t - t0) / 1000, 0.05) : 0.016;
    t0 = t;

    ctx.clearRect(0, 0, L, A);

    // Os canais: linhas quase invisíveis que acendem perto do cursor.
    for (var i = 0; i < canais.length; i++) {
      var c = canais[i];
      var d = Math.abs(c.x - mouse.x);
      var perto = d < 150 ? 1 - d / 150 : 0;
      c.brilho += (perto - c.brilho) * 0.08;
      ctx.strokeStyle = 'rgba(' + COR + ',' + (0.07 + c.brilho * 0.34).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(c.x + 0.5, 0);
      ctx.lineTo(c.x + 0.5, A);
      ctx.stroke();
    }

    // Os sinais: um rastro que desce e some.
    for (var j = sinais.length - 1; j >= 0; j--) {
      var s = sinais[j];
      s.y += s.vel * dt;
      if (s.y - s.tam > A) { sinais.splice(j, 1); continue; }

      var g = ctx.createLinearGradient(0, s.y - s.tam, 0, s.y);
      g.addColorStop(0, 'rgba(' + COR + ',0)');
      g.addColorStop(1, 'rgba(' + COR + ',' + (0.78 * s.forca).toFixed(3) + ')');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(s.canal.x + 0.5, Math.max(s.y - s.tam, 0));
      ctx.lineTo(s.canal.x + 0.5, Math.min(s.y, A));
      ctx.stroke();

      // a cabeça do sinal
      ctx.fillStyle = 'rgba(' + COR + ',' + (1 * s.forca).toFixed(3) + ')';
      ctx.fillRect(s.canal.x - 0.5, Math.min(s.y, A) - 2, 2, 2);
    }

    // Densidade estável: nasce sinal enquanto houver menos que o teto.
    if (sinais.length < Math.min(canais.length * 0.8, 34) && Math.random() < 0.6) nascer();

    requestAnimationFrame(quadro);
  }

  medir();
  for (var k = 0; k < 10; k++) { nascer(); sinais[k].y = Math.random() * A; }
  requestAnimationFrame(quadro);

  var redim = null;
  window.addEventListener('resize', function () {
    clearTimeout(redim);
    redim = setTimeout(medir, 180);
  });

  alvo.addEventListener('pointermove', function (e) {
    var r = alvo.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  alvo.addEventListener('pointerleave', function () { mouse.x = -9999; });

  // Fora da tela, para. Animação rodando em hero que ninguém está vendo é
  // bateria queimada de graça.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !rodando) { rodando = true; t0 = 0; requestAnimationFrame(quadro); }
        else if (!e.isIntersecting) { rodando = false; }
      });
    }, { threshold: 0 }).observe(alvo);
  }
})();
