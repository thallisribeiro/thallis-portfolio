/* ==========================================================================
   CAMADA GSAP — 30/08/2026
   Roda POR CIMA da camada em CSS/IntersectionObserver do main.js, nunca no
   lugar dela. Se o CDN cair, se o JS falhar, se a pessoa estiver num
   navegador velho: a página continua certa, com o movimento simples do
   main.js. Nada aqui é requisito de leitura.

   O handoff é explícito: quando esta camada assume, ela marca <html> com
   `gsap-on`, e o CSS desliga as animações equivalentes pra não haver dois
   sistemas animando o mesmo elemento.
   ========================================================================== */
(function () {
  'use strict';

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  document.documentElement.classList.add('gsap-on');

  // Tudo daqui pra baixo vive dentro do matchMedia: com reduced-motion
  // nenhuma destas timelines chega a existir, e o estado final é o que já
  // está no HTML. Não é "animação mais curta" -- é ausência de animação.
  var mm = gsap.matchMedia();

  mm.add({
    movimento: '(prefers-reduced-motion: no-preference)',
    largo: '(min-width: 860px)',
    tato: '(hover: hover)',
  }, function (ctx) {
    var largo = ctx.conditions.largo;
    var tato = ctx.conditions.tato;

    /* ------------------------------------------------------------------
       1. A TESE SE MONTA, LETRA POR LETRA
       Só as duas linhas do hero. O preset é explícito: split em manchete
       curta, nunca em parágrafo -- cada caractere vira um elemento no DOM.
       A segunda linha entra depois da primeira porque a ordem é o argumento:
       "construir ficou barato" precisa pousar antes de "distribuir virou o
       gargalo" significar alguma coisa.
    ------------------------------------------------------------------ */
    var linhas = document.querySelectorAll('.hero-tese .tese-linha');
    // Espera a fonte. Cortar em caractere com a fonte de fallback mede a largura errada,
    // e quando a Space Grotesk chega a linha reflui com a animação no meio -- é o aviso
    // "SplitText called before fonts loaded" que saía duas vezes por carga.
    var prontoParaCortar = (document.fonts && document.fonts.ready)
      ? document.fonts.ready
      : Promise.resolve();
    if (linhas.length && window.SplitText) prontoParaCortar.then(cortarTese);
    function cortarTese() {
      var splits = [];
      var tlTese = gsap.timeline({ delay: 0.15 });
      Array.prototype.forEach.call(linhas, function (linha, i) {
        var sp = new SplitText(linha, { type: 'chars' });
        splits.push(sp);
        tlTese.from(sp.chars, {
          opacity: 0, yPercent: 60, rotateX: -55,
          duration: 0.5, stagger: 0.014, ease: 'expo.out',
        }, i === 0 ? 0 : 0.34);
      });
      // Devolve os nós de texto originais: leitor de tela e busca não podem
      // herdar um <div> por caractere.
      ctx.add(function () { splits.forEach(function (s) { s.revert(); }); });
    }

    /* ------------------------------------------------------------------
       2. O CICLO SE DESENHA ENQUANTO SE ROLA   ← a peça principal
       A seção do diagrama prende e o fluxo se monta etapa por etapa,
       amarrado à barra de rolagem. Aqui o scroll não é gatilho: ele É o
       tempo do processo. É o único lugar da página onde vale prender a
       tela, e por isso é UM pin por página -- prender mais de um briga
       com a rolagem nativa.
    ------------------------------------------------------------------ */
    var fluxo = document.querySelector('.fluxo');
    // Prende o DIAGRAMA, nao a secao. Prendi a secao inteira na primeira versao
    // e ela tem 1180px: em tela de 860px sobravam 320px fora de vista, e o que
    // ficava de fora era justamente o fim do ciclo -- a parte que o efeito
    // existe pra mostrar. E so prende se couber com folga: prender algo maior
    // que a tela e prender um pedaco.
    var cabe = fluxo && (fluxo.getBoundingClientRect().height + 120) < window.innerHeight;
    if (fluxo && largo && cabe) {
      var etapas = fluxo.querySelectorAll('.fluxo-linha, .fluxo-canais-wrap');
      var fios = fluxo.querySelectorAll('.fluxo-tubo');
      var retorno = fluxo.querySelector('.fluxo-retorno');

      gsap.set(etapas, { opacity: 0.16 });
      gsap.set(fios, { scaleY: 0, transformOrigin: 'top center' });
      if (retorno) gsap.set(retorno, { opacity: 0 });

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: fluxo,
          start: 'center center',
          // Era '+=150%' (~1350px). O h2, o selo e o lead saíam da viewport e a pessoa
          // olhava um diagrama sem título durante o percurso inteiro. Encurtado, e o pin
          // passou a prender a seção (que carrega o título junto), não só o painel.
          end: '+=90%',
          scrub: 1,
          pin: fluxo.closest('.section-inner') || fluxo,
          pinSpacing: true,
          anticipatePin: 1,
        },
      });

      Array.prototype.forEach.call(etapas, function (et, i) {
        // 0.85 de intervalo em 6 etapas deixava "distribuição" -- a palavra que a página
        // inteira defende -- acendendo a ~75% do percurso, atrás do maior custo de scroll.
        // Com 0.55 ela chega por volta da metade, que é onde a atenção ainda está.
        tl.to(et, { opacity: 1, duration: 0.5 }, i * 0.55);
        if (fios[i]) tl.to(fios[i], { scaleY: 1, duration: 0.5 }, i * 0.55 + 0.3);
      });
      if (retorno) {
        tl.to(retorno, { opacity: 1, duration: 0.6 }, '>-0.2')
          .fromTo(etapas[0], { opacity: 1 }, { opacity: 1, duration: 0.3 }, '<');
      }

      // Imagem e fonte que chegam depois mudam a altura da página e
      // desalinham o pin. Recalcular é obrigatório, não zelo.
      window.addEventListener('load', function () { ScrollTrigger.refresh(); });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
      }
    }

    /* ------------------------------------------------------------------
       3. BOTÃO MAGNÉTICO — um só
       O CTA primário do hero. A força é limitada em 0.28 pra ele nunca
       sair da própria área de clique: botão que foge do cursor é piada,
       não interação. Um por tela, como manda o preset.
    ------------------------------------------------------------------ */
    var ima = document.querySelector('.hero-tese .btn-primary');
    if (ima && tato) {
      var xTo = gsap.quickTo(ima, 'x', { duration: 0.4, ease: 'elastic.out(1, 0.4)' });
      var yTo = gsap.quickTo(ima, 'y', { duration: 0.4, ease: 'elastic.out(1, 0.4)' });
      var mover = function (e) {
        var r = ima.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.28);
      };
      var soltar = function () { xTo(0); yTo(0); };
      ima.addEventListener('pointermove', mover);
      ima.addEventListener('pointerleave', soltar);
      // Foco por teclado nunca pode deixar o botão deslocado.
      ima.addEventListener('blur', soltar);
      ctx.add(function () {
        ima.removeEventListener('pointermove', mover);
        ima.removeEventListener('pointerleave', soltar);
        ima.removeEventListener('blur', soltar);
        gsap.set(ima, { x: 0, y: 0 });
      });
    }

    /* ------------------------------------------------------------------
       4. PROFUNDIDADE NAS CAPTURAS
       As telas dos projetos correm um pouco mais devagar que o texto ao
       lado. 6% -- o suficiente pra dar camada, pouco o bastante pra
       ninguém notar que é um efeito.
    ------------------------------------------------------------------ */
    if (largo) {
      gsap.utils.toArray('.obra-shot').forEach(function (shot) {
        gsap.fromTo(shot, { yPercent: 3 }, {
          yPercent: -3, ease: 'none',
          scrollTrigger: { trigger: shot, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
        });
      });
    }

    /* ------------------------------------------------------------------
       5. ENTRADA EM LOTE, SUBSTITUINDO O IntersectionObserver
       O main.js já revela por scroll. Com o GSAP no ar, quem revela é
       daqui -- o `gsap-on` no <html> desliga o outro no CSS. Dois sistemas
       animando o mesmo elemento é como se ganha um piscar na tela.
    ------------------------------------------------------------------ */
    // Pagina sem nenhum alvo (o /trabalhe-comigo/ e assim) fazia o batch logar
    // "GSAP target [data-surge] not found" em toda carga. Nao e defeito visual, e
    // ruido no console -- e console cheio de ruido e como o aviso REAL desta camada
    // (ela estava morta no site inteiro) passou dias sem ser lido.
    if (document.querySelector('[data-surge]')) ScrollTrigger.batch('[data-surge]', {
      start: 'top 88%',
      onEnter: function (lote) {
        gsap.to(lote, { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: 'expo.out', overwrite: true });
      },
    });
    if (document.querySelector('[data-surge]')) gsap.set('[data-surge]', { opacity: 0, y: 16 });

    /* ------------------------------------------------------------------
       6. O BARALHO SE ABRE NO SCROLL
       No desktop as telas do carrossel já abrem no hover. Elas também
       abrem sozinhas quando entram na tela -- quem chega rolando vê a
       peça, sem depender de passar o mouse por cima.
    ------------------------------------------------------------------ */
    var baralho = document.querySelector('.baralho');
    if (baralho && largo) {
      gsap.fromTo(baralho.querySelectorAll('.carta'),
        { yPercent: 8, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.09, ease: 'expo.out',
          scrollTrigger: { trigger: baralho, start: 'top 82%' } });
    }
  });

  /* --------------------------------------------------------------------
     COM reduced-motion: nenhuma timeline acima existe. Este bloco só
     garante que o que o CSS deixou em opacity:0 esperando animação volte
     ao estado final -- senão "sem movimento" vira "sem conteúdo".
  -------------------------------------------------------------------- */
  mm.add('(prefers-reduced-motion: reduce)', function () {
    gsap.set('[data-surge], .hero-tese .tese-linha, .baralho .carta', { opacity: 1, y: 0, yPercent: 0, clearProps: 'transform' });
    gsap.set('.fluxo-linha, .fluxo-canais-wrap, .fluxo-tubo, .fluxo-retorno', { opacity: 1, scaleY: 1 });
  });
})();
