/* Comportamento do site da Dra. Brumna Valdivieso.
   Blocos: painel de menu acessível, CTAs de WhatsApp com dados pendentes,
   consentimento LGPD, avaliações do Google com alternativa elegante,
   busca e filtro da FAQ, aviso de prévia. */
(function () {
  'use strict';

  var dados = window.DADOS_BRUMNA || {};
  var pendente = function (valor) {
    return typeof valor !== 'string' || /^\[.*\]$/.test(valor.trim()) || valor.trim() === '';
  };

  /* ---------------------------------------------------------------- */
  /* 1. Painel de menu: teclado, foco visível, Escape e trava de rolagem */
  /* ---------------------------------------------------------------- */
  (function menu() {
    var abrir = document.querySelector('.abrir-menu');
    var painel = document.getElementById('painel-menu');
    if (!abrir || !painel) return;

    var fechar = painel.querySelector('.fechar-menu');
    var focoAnterior = null;
    var focaveis = 'a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])';

    function abrirPainel() {
      focoAnterior = document.activeElement;
      painel.hidden = false;
      document.documentElement.classList.add('trava-rolagem');
      abrir.setAttribute('aria-expanded', 'true');
      // O elemento acabou de sair de hidden: sem forçar o recálculo de layout,
      // o foco é ignorado porque o painel ainda está como display:none.
      void painel.offsetHeight;
      (fechar || painel.querySelector(focaveis)).focus();
      document.addEventListener('keydown', aoTeclar, true);
    }

    function fecharPainel() {
      painel.hidden = true;
      document.documentElement.classList.remove('trava-rolagem');
      abrir.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', aoTeclar, true);
      if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
    }

    function aoTeclar(evento) {
      if (evento.key === 'Escape') { evento.preventDefault(); fecharPainel(); return; }
      if (evento.key !== 'Tab') return;
      var lista = Array.prototype.filter.call(painel.querySelectorAll(focaveis), function (el) {
        return el.offsetParent !== null;
      });
      if (!lista.length) return;
      var primeiro = lista[0];
      var ultimo = lista[lista.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus(); }
      else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
    }

    abrir.addEventListener('click', abrirPainel);
    if (fechar) fechar.addEventListener('click', fecharPainel);
    painel.addEventListener('click', function (evento) {
      if (evento.target.closest('a')) fecharPainel();
    });
  })();

  /* ---------------------------------------------------------------- */
  /* 2. CTAs de WhatsApp                                               */
  /*    Enquanto o número for placeholder, o botão não navega e explica */
  /*    o motivo. Confirmado o número, vira link wa.me com mensagem.    */
  /* ---------------------------------------------------------------- */
  (function whatsapp() {
    var botoes = document.querySelectorAll('[data-wpp]');
    Array.prototype.forEach.call(botoes, function (botao) {
      var unidade = botao.getAttribute('data-wpp');
      var chave = unidade === 'sao-paulo' ? 'saoPaulo' : 'florianopolis';
      var numero = (dados.whatsapp || {})[chave];
      var aviso = botao.parentNode.querySelector('.aviso-wpp');

      if (pendente(numero)) {
        botao.setAttribute('aria-disabled', 'true');
        botao.removeAttribute('href');
        botao.setAttribute('role', 'button');
        if (aviso) {
          aviso.textContent = 'Número ainda não confirmado. Toque para ver a mensagem que será enviada.';
        }
        botao.addEventListener('click', function (evento) {
          evento.preventDefault();
          mostrarPrevia(chave);
        });
        return;
      }

      var texto = encodeURIComponent((dados.mensagemInicial || {})[chave] || 'Olá! Gostaria de agendar uma consulta.');
      botao.setAttribute('href', 'https://wa.me/' + String(numero).replace(/\D/g, '') + '?text=' + texto);
      botao.setAttribute('target', '_blank');
      botao.setAttribute('rel', 'noopener');
      botao.removeAttribute('aria-disabled');
      if (aviso) aviso.remove();

      // Evento de analytics sem qualquer dado pessoal: só a unidade clicada.
      botao.addEventListener('click', function () {
        if (window.CONSENTIMENTO_ANALYTICS !== true) return;
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'clique_whatsapp', unidade: chave });
      });
    });
  })();

  /* Mostra o destino e a mensagem exata, para a conversa poder ser validada
     mesmo antes de o número chegar. */
  function mostrarPrevia(chave) {
    var dialogo = document.getElementById('previa-wpp');
    if (!dialogo || !dialogo.showModal) return;
    var unidade = chave === 'saoPaulo' ? 'São Paulo — Clínica Fakiani' : 'Florianópolis — IMV';
    var token = chave === 'saoPaulo' ? '[WHATSAPP_SAO_PAULO]' : '[WHATSAPP_FLORIANOPOLIS]';
    dialogo.querySelector('[data-previa="unidade"]').textContent = unidade;
    dialogo.querySelector('[data-previa="numero"]').textContent = token;
    dialogo.querySelector('[data-previa="mensagem"]').textContent =
      (dados.mensagemInicial || {})[chave] || 'Olá! Gostaria de agendar uma consulta.';
    dialogo.showModal();
  }

  (function fecharPrevia() {
    var dialogo = document.getElementById('previa-wpp');
    if (!dialogo) return;
    dialogo.addEventListener('click', function (evento) {
      if (evento.target.closest('[data-fechar-previa]') || evento.target === dialogo) dialogo.close();
    });
  })();

  /* Botão flutuante: some quando o painel de menu está aberto. */
  (function flutuante() {
    var botao = document.querySelector('.wpp-flutuante');
    var painel = document.getElementById('painel-menu');
    if (!botao || !painel) return;
    new MutationObserver(function () { botao.hidden = !painel.hidden; })
      .observe(painel, { attributes: true, attributeFilter: ['hidden'] });
  })();

  /* ---------------------------------------------------------------- */
  /* 3. Campos de dado pendente no corpo das páginas                   */
  /* ---------------------------------------------------------------- */
  (function pendencias() {
    var mapa = {
      'crm-brumna': (dados.registros || {}).crmDraBrumna,
      'crm-nassif': (dados.registros || {}).crmDrThiagoNassif,
      'rqe-nassif': (dados.registros || {}).rqeDrThiagoNassif,
      'endereco-imv': (dados.enderecos || {}).imv,
      'endereco-fakiani': (dados.enderecos || {}).fakiani,
      'horarios-florianopolis': (dados.horarios || {}).florianopolis,
      'horarios-sao-paulo': (dados.horarios || {}).saoPaulo,
      'email': dados.email,
      'responsavel-privacidade': dados.responsavelPrivacidade,
      'dominio-final': dados.dominioFinal,
    };
    Array.prototype.forEach.call(document.querySelectorAll('[data-campo]'), function (el) {
      var valor = mapa[el.getAttribute('data-campo')];
      if (valor === undefined) return;
      el.textContent = valor;
      el.classList.toggle('marcador-pendente', pendente(valor));
    });
  })();

  /* ---------------------------------------------------------------- */
  /* 4. Consentimento LGPD — analytics só depois do aceite             */
  /* ---------------------------------------------------------------- */
  (function consentimento() {
    var faixa = document.querySelector('.consentimento');
    if (!faixa) return;
    var guardado = null;
    try { guardado = localStorage.getItem('consentimento-analytics'); } catch (e) {}

    if (guardado === 'sim') { window.CONSENTIMENTO_ANALYTICS = true; faixa.hidden = true; return; }
    if (guardado === 'nao') { window.CONSENTIMENTO_ANALYTICS = false; faixa.hidden = true; return; }
    faixa.hidden = false;

    faixa.addEventListener('click', function (evento) {
      var botao = evento.target.closest('[data-consentimento]');
      if (!botao) return;
      var aceito = botao.getAttribute('data-consentimento') === 'aceitar';
      window.CONSENTIMENTO_ANALYTICS = aceito;
      try { localStorage.setItem('consentimento-analytics', aceito ? 'sim' : 'nao'); } catch (e) {}
      faixa.hidden = true;
    });
  })();

  /* ---------------------------------------------------------------- */
  /* 5. Avaliações do Google                                          */
  /*    Sem Place ID confirmado, mostra a alternativa em vez de erro.  */
  /* ---------------------------------------------------------------- */
  (function avaliacoes() {
    var area = document.querySelector('.avaliacoes-area');
    if (!area) return;
    if (pendente(dados.avaliacoesGoogle)) {
      area.setAttribute('data-estado', 'sem-fonte');
      return;
    }
    area.setAttribute('data-estado', 'pronto-para-widget');
  })();

  /* ---------------------------------------------------------------- */
  /* 6. FAQ: busca, filtro por tema, contagem e âncora compartilhável  */
  /* ---------------------------------------------------------------- */
  (function faq() {
    var busca = document.getElementById('faq-busca');
    var filtro = document.getElementById('faq-tema');
    var contagem = document.getElementById('faq-contagem');
    var vazio = document.getElementById('faq-vazio');
    if (!busca || !filtro) return;

    var perguntas = Array.prototype.slice.call(document.querySelectorAll('details.pergunta'));
    var grupos = Array.prototype.slice.call(document.querySelectorAll('.grupo-faq'));

    function normalizar(texto) {
      return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    function aplicar() {
      var termo = normalizar(busca.value.trim());
      var tema = filtro.value;
      var visiveis = 0;

      perguntas.forEach(function (item) {
        var grupo = item.closest('.grupo-faq');
        var casaTema = tema === 'todos' || (grupo && grupo.id === tema);
        var casaTermo = !termo || normalizar(item.textContent).indexOf(termo) !== -1;
        var mostrar = casaTema && casaTermo;
        item.hidden = !mostrar;
        if (mostrar) visiveis++;
      });

      grupos.forEach(function (grupo) {
        var algum = grupo.querySelector('details.pergunta:not([hidden])');
        grupo.hidden = !algum;
      });

      if (contagem) {
        contagem.textContent = visiveis === perguntas.length
          ? perguntas.length + ' perguntas publicadas'
          : visiveis + ' de ' + perguntas.length + ' perguntas';
      }
      if (vazio) vazio.hidden = visiveis !== 0;
    }

    busca.addEventListener('input', aplicar);
    filtro.addEventListener('change', aplicar);
    aplicar();

    // Abre e rola até a pergunta quando a URL traz uma âncora.
    function abrirDaAncora() {
      var id = window.location.hash.slice(1);
      if (!id) return;
      var alvo = document.getElementById(id);
      if (alvo && alvo.tagName === 'DETAILS') {
        busca.value = '';
        filtro.value = 'todos';
        aplicar();
        alvo.open = true;
        alvo.scrollIntoView({ block: 'start' });
      }
    }
    window.addEventListener('hashchange', abrirDaAncora);
    abrirDaAncora();

    // Copia o link direto da pergunta.
    document.addEventListener('click', function (evento) {
      var link = evento.target.closest('.link-ancora');
      if (!link) return;
      var url = window.location.href.split('#')[0] + link.getAttribute('href');
      if (navigator.clipboard) {
        evento.preventDefault();
        navigator.clipboard.writeText(url).then(function () {
          var antes = link.textContent;
          link.textContent = 'Link copiado';
          setTimeout(function () { link.textContent = antes; }, 1600);
        });
      }
    });
  })();

  /* ---------------------------------------------------------------- */
  /* 7. Aviso de prévia                                                */
  /* ---------------------------------------------------------------- */
  (function previa() {
    var aviso = document.querySelector('.previa');
    if (!aviso) return;
    try { if (sessionStorage.getItem('previa-oculta') === '1') aviso.hidden = true; } catch (e) {}
    var fechar = aviso.querySelector('button');
    if (!fechar) return;
    fechar.addEventListener('click', function () {
      aviso.hidden = true;
      try { sessionStorage.setItem('previa-oculta', '1'); } catch (e) {}
    });
  })();

  /* ---------------------------------------------------------------- */
  /* 8. Título do hero dividido em linhas                              */
  /*                                                                   */
  /*    Cada linha sobe de dentro da própria máscara. Não dá para fazer */
  /*    só em CSS: onde a linha quebra depende da largura, então é o    */
  /*    layout já calculado que diz onde cortar.                        */
  /*                                                                   */
  /*    Construído para falhar em segurança: a classe que ativa a       */
  /*    animação só é adicionada DEPOIS de a divisão dar certo. Se este */
  /*    bloco não rodar, o título continua lá, opaco e legível — que é  */
  /*    o defeito clássico de efeito de texto em site.                  */
  /* ---------------------------------------------------------------- */
  (function dividirTitulo() {
    var h1 = document.querySelector('.hero-texto h1');
    if (!h1) return;

    // Quem pediu menos movimento não recebe nem a marcação extra.
    var querMovimento = !window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!querMovimento) return;

    var textoOriginal = h1.textContent;

    function dividir() {
      h1.classList.remove('h1-dividido');
      h1.textContent = textoOriginal;

      // Cada palavra vira um span para o navegador informar em que altura ela
      // ficou; palavras com o mesmo topo formam uma linha.
      var palavras = textoOriginal.split(/\s+/).filter(Boolean);
      if (palavras.length < 2) return;

      h1.textContent = '';
      var marcas = palavras.map(function (p, i) {
        var m = document.createElement('span');
        m.textContent = p + (i < palavras.length - 1 ? ' ' : '');
        h1.appendChild(m);
        return m;
      });

      var linhas = [];
      var topoAtual = null;
      marcas.forEach(function (m) {
        var topo = Math.round(m.offsetTop);
        if (topoAtual === null || topo !== topoAtual) { linhas.push([]); topoAtual = topo; }
        linhas[linhas.length - 1].push(m.textContent);
      });

      if (!linhas.length) { h1.textContent = textoOriginal; return; }

      h1.textContent = '';
      linhas.forEach(function (palavrasDaLinha, i) {
        var linha = document.createElement('span');
        linha.className = 'linha';
        var dentro = document.createElement('span');
        dentro.style.setProperty('--i', String(i));
        // Sem o espaço final o textContent do h1 vira "Rejuvenescimentoíntimo":
        // invisível na tela, mas é o que o leitor de tela e o buscador leem.
        var texto = palavrasDaLinha.join('');
        dentro.textContent = (i === linhas.length - 1) ? texto.replace(/s+$/, '') : texto;
        linha.appendChild(dentro);
        h1.appendChild(linha);
      });
      h1.classList.add('h1-dividido');
    }

    // As fontes mudam a quebra de linha: dividir antes de elas carregarem
    // produziria linhas erradas.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(dividir);
    else dividir();

    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(dividir, 200);
    });
  })();

})();
