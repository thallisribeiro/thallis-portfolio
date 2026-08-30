(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href*="wa.me"]');
    if (!link || typeof gtag !== 'function') return;
    var section = e.target.closest('section');
    gtag('event', 'whatsapp_click', {
      link_text: (link.textContent || '').trim(),
      link_section: (section && section.id) || 'nav'
    });
  });

  // Eventos declarados no HTML com data-ev. O elemento diz o que e; o JS so despacha.
  // Assim um CTA novo nao precisa de codigo novo -- e o que evita evento morto quando
  // a home muda de forma.
  document.addEventListener('click', function (e) {
    var alvo = e.target.closest && e.target.closest('[data-ev]');
    if (!alvo || typeof gtag !== 'function') return;
    gtag('event', alvo.getAttribute('data-ev'), {
      local: alvo.getAttribute('data-ev-local') || '',
      rotulo: (alvo.textContent || '').trim().slice(0, 80)
    });
  });

  if (typeof gtag === 'function' && document.body.querySelector('.hero-tese')) {
    gtag('event', 'home_view');
  }

  // Evento de pageview por pagina, declarado no <body data-page-ev="...">.
  // Mesma logica do data-ev: a pagina diz o nome, o JS so despacha.
  if (typeof gtag === 'function' && document.body.dataset.pageEv) {
    gtag('event', document.body.dataset.pageEv);
  }


  // ======================================================================
  // CAMADA DE EFEITOS — 30/08/2026
  //
  // Regra que vale para todo este bloco: se o JS não rodar, a página fica
  // CERTA, só sem movimento. Nenhum efeito aqui é dono de conteúdo — os
  // números da prova já vêm escritos no HTML pelo gerador, os blocos já
  // estão visíveis por padrão, e o `data-surge` só é aplicado depois que
  // este código confirma que vai conseguir animar.
  // ======================================================================

  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temIO = 'IntersectionObserver' in window;

  // ---------- 1. ENTRADA ESCALONADA POR SCROLL ----------
  // O atributo é aplicado AQUI, não no HTML. Assim, com JS desligado nada
  // fica invisível esperando uma classe que nunca chega -- que é como
  // "revelação no scroll" costuma quebrar.
  // Se o GSAP subiu, quem revela e a camada de movimento. Este bloco e o piso
  // pra quando ele nao subir -- CDN fora do ar, navegador velho, rede ruim.
  // Checa o OBJETO, nao a classe: `defer` executa em ordem de documento, entao
  // este arquivo roda ANTES do movimento.js marcar <html>. Olhar a classe aqui
  // daria sempre falso e os dois sistemas revelariam o mesmo elemento.
  var gsapAssumiu = function () { return !!(window.gsap && window.ScrollTrigger); };

  if (!semMovimento && temIO && !gsapAssumiu()) {
    var alvos = document.querySelectorAll(
      '.secao > .section-inner > *, .obra, .ideia, .etapa, .saida, .proj, .prova-item, .fluxo-linha, .cta-tese'
    );
    Array.prototype.forEach.call(alvos, function (el) { el.setAttribute('data-surge', ''); });

    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        var irmaos = Array.prototype.slice.call(e.target.parentElement.children).filter(function (n) {
          return n.hasAttribute && n.hasAttribute('data-surge');
        });
        var i = Math.min(irmaos.indexOf(e.target), 6); // teto: fila longa não pode virar espera
        e.target.style.transitionDelay = (i * 60) + 'ms';
        e.target.classList.add('visivel');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    Array.prototype.forEach.call(alvos, function (el) { obs.observe(el); });
  }

  // ---------- 2. BRILHO QUE SEGUE O CURSOR ----------
  // Coordenadas via variável CSS, atualizadas dentro de requestAnimationFrame:
  // mousemove dispara dezenas de vezes por segundo e escrever estilo direto
  // ali é o caminho mais curto pra travar o scroll.
  if (!semMovimento && window.matchMedia('(hover: hover)').matches) {
    var comBrilho = document.querySelectorAll('.obra-shot, .cta-tese, .fluxo, .prova');
    Array.prototype.forEach.call(comBrilho, function (el) {
      el.classList.add('brilho');
      var pend = null;
      el.addEventListener('mousemove', function (ev) {
        if (pend) return;
        pend = requestAnimationFrame(function () {
          var r = el.getBoundingClientRect();
          el.style.setProperty('--mx', ((ev.clientX - r.left) / r.width * 100) + '%');
          el.style.setProperty('--my', ((ev.clientY - r.top) / r.height * 100) + '%');
          pend = null;
        });
      });
    });
  }

  // ---------- 3. CONTADOR ----------
  // Sobe de 0 até o número que JÁ ESTÁ no HTML. Se este código não rodar, o
  // valor certo continua na tela -- o efeito anima o dado, nunca o produz.
  if (!semMovimento && temIO) {
    var nums = document.querySelectorAll('.prova-num');
    var obsNum = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var alvo = parseInt(el.textContent.replace(/\D/g, ''), 10);
        if (!isFinite(alvo) || alvo === 0) { obsNum.unobserve(el); return; }
        var t0 = null, dur = 900;
        function passo(t) {
          if (t0 === null) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          var suave = 1 - Math.pow(1 - p, 3); // desacelera na chegada
          el.textContent = Math.round(alvo * suave);
          if (p < 1) requestAnimationFrame(passo);
        }
        requestAnimationFrame(passo);
        obsNum.unobserve(el);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(nums, function (el) { obsNum.observe(el); });
  }

  // ---------- 5. O PULSO SÓ RODA COM O DIAGRAMA NA TELA ----------
  // Animação infinita fora de vista é bateria gasta à toa. A classe entra
  // quando o diagrama aparece e sai quando ele some.
  if (!semMovimento && temIO) {
    var fluxos = document.querySelectorAll('.fluxo');
    if (fluxos.length) {
      var obsFluxo = new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.target.classList.toggle('rodando', e.isIntersecting); });
      }, { threshold: 0.25 });
      Array.prototype.forEach.call(fluxos, function (f) { obsFluxo.observe(f); });
    }
  }

  // ---------- COPIAR BLOCO DE CODIGO ----------
  // O botao confirma na propria etiqueta. Sem isso a pessoa clica duas vezes
  // sem saber se funcionou.
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copiar]');
    if (!b) return;
    var alvo = document.querySelector(b.getAttribute('data-copiar'));
    if (!alvo || !navigator.clipboard) return;
    navigator.clipboard.writeText(alvo.textContent.trim()).then(function () {
      var antes = b.textContent;
      b.textContent = 'Copiado';
      setTimeout(function () { b.textContent = antes; }, 1600);
    }).catch(function () {});
  });

  // ---------- 4. BARRA DE PROGRESSO DE LEITURA ----------
  // Só em página longa. Numa página curta a barra fica quase cheia o tempo
  // todo e não informa nada.
  if (!semMovimento && document.body.scrollHeight > window.innerHeight * 3) {
    var barra = document.createElement('div');
    barra.className = 'progresso';
    document.body.appendChild(barra);
    var tickBarra = null;
    window.addEventListener('scroll', function () {
      if (tickBarra) return;
      tickBarra = requestAnimationFrame(function () {
        var max = document.body.scrollHeight - window.innerHeight;
        barra.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
        tickBarra = null;
      });
    }, { passive: true });
  }

  var revealEls = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var toggle = document.querySelector('.nav-toggle');
  var navLinks = document.getElementById('nav-links');
  if (toggle && navLinks) {
    var closeMenu = function () {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    document.addEventListener('click', function (e) {
      if (!navLinks.classList.contains('open')) return;
      if (navLinks.contains(e.target) || toggle.contains(e.target)) return;
      closeMenu();
    });
  }

  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var link = document.querySelector('.nav-links a[href="#' + entry.target.id + '"]');
        if (!link) return;
        links.forEach(function (l) { l.classList.remove('active'); });
        link.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navIo.observe(s); });
  }
})();

/* ---------- CAPTURA DE E-MAIL ----------
   O <form> ja funciona sem JS: method=post + target=_blank cai na pagina do
   provedor. Com JS a pessoa nao sai daqui e o kit aparece na hora -- entregar
   antes de o e-mail chegar tira a unica friccao que ainda tinha sentido.
   fetch no-cors nao devolve status: o provedor nao expoe CORS, e insistir em
   ler a resposta so cria um estado de erro falso. Quem digitou e-mail valido
   entrou; o resto o provedor resolve com o e-mail de confirmacao dele. */
(function () {
  var KIT = [
    ['/assets/kit/ficha-de-apuracao.json', 'ficha-de-apuracao.json', 'o template em branco'],
    ['/assets/kit/ficha-exemplo-preenchido.json', 'ficha-exemplo-preenchido.json', 'um exemplo preenchido de verdade']
  ];

  Array.prototype.forEach.call(document.querySelectorAll('form[data-captura]'), function (form) {
    form.addEventListener('submit', function (e) {
      var campo = form.querySelector('input[type="email"]');
      if (!campo || !campo.checkValidity()) return;          /* deixa o browser reclamar */
      if (form.querySelector('.captura-isca').value) { e.preventDefault(); return; }  /* robo */

      e.preventDefault();
      var botao = form.querySelector('button');
      botao.disabled = true;
      botao.textContent = 'Mandando...';

      fetch(form.action, { method: 'POST', mode: 'no-cors', body: new FormData(form) })
        .catch(function () {})
        .then(function () { pronto(form, campo.value); });
    });
  });

  function pronto(form, email) {
    var local = form.getAttribute('data-captura-local') || '';
    if (window.gtag) {
      window.gtag('event', 'lead_magnet_captured', { local: local });
    }
    var bloco = form.closest('.captura');
    var arquivos = KIT.map(function (k) {
      return '<li><a href="' + k[0] + '" download="' + k[1] + '" data-ev="kit_downloaded" data-ev-local="' +
             local + '">' + k[1] + '</a> — ' + k[2] + '</li>';
    }).join('');
    bloco.classList.add('captura-ok');
    bloco.innerHTML =
      '<p class="captura-olho">Pronto</p>' +
      '<p class="captura-titulo">Baixa agora, o e-mail é só a confirmação</p>' +
      '<p class="captura-texto">Mandei pra <strong>' + email.replace(/[<>&]/g, '') + '</strong>. ' +
      'Se não chegar em alguns minutos, olha no spam e me responde por lá.</p>' +
      '<ul class="captura-kit">' + arquivos + '</ul>' +
      '<p class="captura-nota">Como usar cada campo está aberto em ' +
      '<a href="/ficha-de-apuracao/">/ficha-de-apuracao/</a>.</p>';
    bloco.setAttribute('tabindex', '-1');
    bloco.focus();
  }
})();
