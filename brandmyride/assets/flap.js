/* Painel split-flap do BrandMyRide.
   Cada palheta gira pela roda de caracteres até parar na letra certa, como no saguão. */
(function () {
  const RODA = ' ABCDEFGHIJKLMNOPQRSTUVWXYZÁÂÃÉÊÍÓÔÕÚÇ0123456789.,:;!?-/@&+%';
  const MEIA = 58;      // ms de cada meia palheta
  const MAX_PASSOS = 9; // teto de voltas por palheta, pra animação não arrastar
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');

  const norma = ch => {
    const c = (ch || ' ').toLocaleUpperCase('pt-BR');
    return RODA.includes(c) ? c : ' ';
  };

  function celula() {
    const c = document.createElement('span');
    c.className = 'flap';
    c.innerHTML = '<span class="flap-t"><b> </b></span><span class="flap-b"><b> </b></span>';
    c.atual = ' ';
    c.alvo = ' ';
    return c;
  }

  function fixa(c, ch) {
    c.atual = ch;
    c.children[0].firstChild.textContent = ch;
    c.children[1].firstChild.textContent = ch;
  }

  // Aba escondida ou janela minimizada pausa a animação; o prazo garante que a palheta chega no alvo.
  function gira(el, quadros, easing) {
    const a = el.animate(quadros, { duration: MEIA, easing, fill: 'forwards' });
    return Promise.race([a.finished, new Promise(ok => setTimeout(ok, MEIA * 4))]).then(() => a.cancel());
  }

  // Meia palheta de cima cai mostrando a letra nova em cima; a de baixo desce com a letra nova embaixo.
  function vira(c, para) {
    const de = c.atual;
    const t = c.children[0];
    const b = c.children[1];
    const folhaT = t.cloneNode(true);
    const folhaB = b.cloneNode(true);
    folhaT.classList.add('folha');
    folhaB.classList.add('folha');
    folhaT.firstChild.textContent = de;
    folhaB.firstChild.textContent = para;
    folhaB.style.transform = 'rotateX(90deg)';
    t.firstChild.textContent = para;
    c.append(folhaT, folhaB);
    c.atual = para;
    return gira(folhaT, [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }], 'cubic-bezier(.55,0,1,.45)')
      .then(() => {
        folhaT.remove();
        return gira(folhaB, [{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }], 'cubic-bezier(0,.55,.45,1)');
      })
      .then(() => {
        b.firstChild.textContent = para;
        folhaB.remove();
      });
  }

  async function roda(c) {
    if (c.rodando) return;
    c.rodando = true;
    const n = RODA.length;
    while (c.atual !== c.alvo) {
      if (document.hidden) { fixa(c, c.alvo); break; }
      const i = RODA.indexOf(c.atual);
      const f = RODA.indexOf(c.alvo);
      const falta = (f - i + n) % n;
      const prox = falta > MAX_PASSOS ? RODA[(f - MAX_PASSOS + n) % n] : RODA[(i + 1) % n];
      await vira(c, prox);
    }
    c.rodando = false;
  }

  function mira(c, ch, atraso) {
    c.alvo = norma(ch);
    if (quieto.matches) { fixa(c, c.alvo); return; }
    if (c.atual === c.alvo) return;
    setTimeout(() => roda(c), atraso);
  }

  // el é o .flap-rows; escreve(linhas, {cols}) monta as células e vira só o que mudou.
  function Painel(el) {
    let grade = [];
    let cols = 0;
    // Mesma largura: só acrescenta ou tira linhas, sem apagar as palhetas que já estão certas.
    function monta(nCols, nLinhas) {
      if (nCols !== cols) {
        cols = nCols;
        el.style.setProperty('--cols', nCols);
        el.textContent = '';
        grade = [];
      }
      while (grade.length > nLinhas) grade.pop()[0].parentNode.remove();
      for (let r = grade.length; r < nLinhas; r++) {
        const linha = document.createElement('div');
        linha.className = 'flap-row';
        const celulas = [];
        for (let k = 0; k < nCols; k++) {
          const c = celula();
          linha.append(c);
          celulas.push(c);
        }
        el.append(linha);
        grade.push(celulas);
      }
    }
    return {
      escreve(textos, { cols: nCols, atraso = 0, escalonado = 28, instantaneo = false } = {}) {
        monta(nCols, textos.length);
        textos.forEach((txt, r) => {
          const letras = Array.from(txt.normalize('NFC').padEnd(nCols).slice(0, nCols));
          grade[r].forEach((c, k) => {
            if (instantaneo) fixa(c, norma(letras[k]));
            else mira(c, letras[k], atraso + (r * 4 + k) * escalonado);
          });
        });
      },
    };
  }

  // Quebra o texto em linhas de até `largura` letras sem cortar palavra; palavra maior que a linha é partida.
  function quebra(texto, largura) {
    const linhas = [];
    let atual = '';
    for (let palavra of String(texto).trim().split(/\s+/)) {
      while (palavra.length > largura) {
        if (atual) { linhas.push(atual); atual = ''; }
        linhas.push(palavra.slice(0, largura));
        palavra = palavra.slice(largura);
      }
      if (!palavra) continue;
      if (!atual) atual = palavra;
      else if ((atual + ' ' + palavra).length <= largura) atual += ' ' + palavra;
      else { linhas.push(atual); atual = palavra; }
    }
    if (atual) linhas.push(atual);
    return linhas.length ? linhas : [''];
  }

  // Código de barras do cartão, derivado do nome da marca.
  function codigoBarras(el, texto) {
    const s = (texto || 'BRANDMYRIDE').toUpperCase();
    let x = 0;
    let barras = '';
    for (let i = 0; i < 42; i++) {
      const v = s.charCodeAt(i % s.length) * (i + 7);
      const w = 1 + (v % 3);
      barras += '<rect x="' + x + '" width="' + w + '" height="40"/>';
      x += w + 1 + ((v >> 3) % 2);
    }
    el.innerHTML = '<svg viewBox="0 0 ' + x + ' 40" preserveAspectRatio="none" aria-hidden="true">' + barras + '</svg>';
  }

  window.BMR = { Painel, codigoBarras, norma, quebra };
})();
