/* =========================================================
   GR SISTEMA · área do aluno (celular primeiro)
   Abas: início · quadras · cantina · eventos · perfil
   ========================================================= */
(function () {
  'use strict';
  const A = App, D = GR.data;
  const EU = 'a1'; // no protótipo o aluno logado é o Lucas Andrade
  const ABAS = [
    { id: 'inicio', nome: 'Início', ic: 'casa' },
    { id: 'quadras', nome: 'Quadras', ic: 'quadra' },
    { id: 'cantina', nome: 'Cantina', ic: 'burger' },
    { id: 'eventos', nome: 'Eventos', ic: 'trofeu' },
    { id: 'perfil', nome: 'Perfil', ic: 'user' },
  ];
  const estado = { dia: null, quadra: 'q1' };

  A.rota('aluno', function (p) {
    const aba = ABAS.some(a => a.id === p[0]) ? p[0] : 'inicio';
    const eu = A.aluno(EU);
    document.body.className = 'tela-aluno';
    A.$('#app').innerHTML = `
      <div class="celular">
        <header class="al-topo">
          <a href="#/aluno/inicio" class="al-marca" aria-label="Início"><svg><use href="#gr-marca"/></svg></a>
          <div class="al-ola"><span>Olá,</span> <strong>${A.esc(eu.nome.split(' ')[0])}</strong></div>
          <a class="al-trocar" href="#/dono/geral" title="Ver o painel do dono">Ver como dono ${A.ic('seta')}</a>
        </header>
        <main class="al-corpo" id="alCorpo"></main>
        <nav class="al-nav" aria-label="Menu do aluno">
          ${ABAS.map(a => `<a href="#/aluno/${a.id}" class="${a.id === aba ? 'ativo' : ''}" ${a.id === aba ? 'aria-current="page"' : ''}>${A.ic(a.ic)}<span>${a.nome}</span></a>`).join('')}
        </nav>
      </div>`;
    ({ inicio, quadras, cantina, eventos, perfil })[aba](A.$('#alCorpo'), eu);
    window.scrollTo(0, 0);
  });

  /* ---------------- Início ---------------- */
  function inicio(el, eu) {
    const t = A.turma(eu.turma); const prox = A.proximoTreino(t);
    const sit = A.situacao(eu); const devendo = A.debitos(eu);
    const aviso = A.S.avisos[0];
    const falta = A.S.faltas.find(f => f.aluno === EU && f.data === prox);
    const minhasRes = A.S.reservas.filter(r => r.aluno === EU && r.data >= A.hoje()).sort((a, b) => a.data < b.data ? -1 : 1);

    // presença do mês
    const mes = D.mesDe(A.hoje()); const treinos = [];
    for (let d = mes + '-01'; d < A.hoje(); d = D.somar(d, 1)) if (t.dias.indexOf(D.deISO(d).getDay()) > -1) treinos.push(d);
    const foi = treinos.filter(d => (A.S.presencas[d + '|' + t.id] || []).indexOf(EU) > -1).length;

    el.innerHTML = `
      <section class="cartao cartao-treino">
        <div class="ct-topo"><span class="etiqueta">${A.ic('relogio')} Próximo treino</span>${falta ? A.pill('aberto', 'Você avisou falta') : A.pill('pago', 'Confirmado')}</div>
        <h2 class="titulo-g">${A.esc(A.nomeTurma(t))}</h2>
        <p class="ct-quando"><strong>${A.quando(prox) === 'hoje' || A.quando(prox) === 'amanhã' ? A.quando(prox).replace(/^./, c => c.toUpperCase()) : A.dataLonga(prox).replace(/^./, c => c.toUpperCase())}</strong> às ${t.hora}</p>
        <p class="ct-info">${A.esc(A.prof(t.prof).nome)} · ${A.esc(GR.nomeQuadra(t.quadra))} · ${A.diasTurma(t)}</p>
        <div class="ct-acoes">
          <button class="btn btn-claro" data-acao="falta" ${falta ? 'disabled' : ''}>${A.ic('x')} Vou faltar</button>
          <button class="btn btn-claro" data-acao="repor">${A.ic('restaurar')} Pedir reposição</button>
        </div>
      </section>

      ${aviso ? `<section class="aviso-chuva">${A.ic('chuva')}<div><strong>${A.esc(aviso.titulo)}</strong><p>${A.esc(aviso.texto)}</p></div></section>` : ''}

      <section class="cartao">
        <div class="cartao-cab"><h3>Mensalidade de ${A.nomeMes(mes)}</h3>${A.pill(sit.status)}</div>
        ${blocoMensalidade(eu, sit, devendo)}
      </section>

      <section class="cartao">
        <div class="cartao-cab"><h3>Sua frequência</h3><span class="sutil">${foi} de ${treinos.length} treinos</span></div>
        <div class="frequencia">${treinos.map(d => { const ok = (A.S.presencas[d + '|' + t.id] || []).indexOf(EU) > -1; return `<span class="freq ${ok ? 'ok' : 'nao'}" title="${A.ddmm(d)}: ${ok ? 'presente' : 'falta'}"><b>${A.ddmm(d).slice(0, 2)}</b></span>`; }).join('') || '<p class="sutil">Os treinos do mês aparecem aqui.</p>'}</div>
      </section>

      ${minhasRes.length ? `<section class="cartao">
        <div class="cartao-cab"><h3>Sua quadra reservada</h3></div>
        ${minhasRes.map(r => `<div class="linha-res">${A.ic('quadra')}<div><strong>${A.esc(GR.nomeQuadra(r.quadra))} · ${r.hora}</strong><span>${A.dataLonga(r.data)}</span></div>${A.pill(r.status)}</div>`).join('')}
      </section>` : ''}

      <section class="cartao">
        <div class="cartao-cab"><h3>Mural da GR</h3>${A.ic('sino', 'sutil')}</div>
        <ol class="mural">${A.S.avisos.map(a => `<li><span class="mural-dia">${A.quando(a.data)}</span><div><strong>${A.esc(a.titulo)}</strong><p>${A.esc(a.texto)}</p></div></li>`).join('')}</ol>
      </section>`;

    el.querySelector('[data-acao="falta"]').addEventListener('click', () => {
      A.S.faltas.push({ aluno: EU, data: prox, turma: t.id, tipo: 'falta' }); A.salvar();
      A.avisar('Falta avisada. O professor já sabe.'); A.desenhar();
    });
    el.querySelector('[data-acao="repor"]').addEventListener('click', () => reposicao(eu, t));
    ligarMensalidade(el, eu, sit, devendo);
  }

  function blocoMensalidade(eu, sit, devendo) {
    const p = A.plano(eu.plano);
    const base = `<p class="mens-plano">${A.esc(A.descPlano(p))}</p>`;
    if (sit.status === 'pago') return base + `<div class="mens-ok">${A.ic('check')}<div><strong>Tudo certo!</strong><span>Pago em ${A.ddmm(sit.pg.data)} via ${A.esc(sit.pg.forma)}. A próxima vence dia ${eu.venc}.</span></div></div>`;
    if (sit.status === 'analise') return base + `<div class="mens-analise">${A.ic('relogio')}<div><strong>Comprovante recebido</strong><span>A GR confere e confirma em até 1 dia útil.</span></div></div><p class="dica">Na demonstração: entre como dono e aprove em Mensalidades.</p>`;
    const total = devendo.reduce((s, d) => s + d.valor, 0);
    const atras = sit.status === 'atrasado';
    return base + `
      <div class="mens-valor"><strong>${A.reais(total)}</strong><span>${atras ? 'venceu dia ' + eu.venc + ' (' + A.diasAtraso(sit.venc) + ' dias)' : 'vence dia ' + eu.venc + ' de ' + A.nomeMes(D.mesDe(A.hoje()))}</span></div>
      ${devendo.length > 1 ? `<p class="dica">Inclui ${devendo.length - 1} mês(es) anterior(es) em aberto.</p>` : ''}
      <div class="mens-acoes">
        <button class="btn btn-grad btn-cheio" data-acao="pix">${A.ic('pix')} Pagar com Pix</button>
        <button class="btn btn-linha btn-cheio" data-acao="comprovante">${A.ic('upload')} Já paguei, enviar comprovante</button>
      </div>`;
  }
  function ligarMensalidade(el, eu, sit, devendo) {
    const bPix = el.querySelector('[data-acao="pix"]');
    if (bPix) bPix.addEventListener('click', () => {
      const total = devendo.reduce((s, d) => s + d.valor, 0);
      modalPix(total, 'Mensalidade ' + A.nomeMes(D.mesDe(A.hoje())), 'MENSALIDADE', () => {
        devendo.forEach(d => A.enviarComprovante(EU, d.ref));
        A.avisar('Comprovante enviado para a GR'); A.desenhar();
      });
    });
    const bComp = el.querySelector('[data-acao="comprovante"]');
    if (bComp) bComp.addEventListener('click', () => {
      const cx = A.abrirModal(`
        <h3 class="modal-titulo">Enviar comprovante</h3>
        <p class="sutil">Tire um print do Pix e mande por aqui. A GR confere e a mensalidade fica em dia.</p>
        <label class="soltar">${A.ic('upload')}<strong>Escolher print ou foto</strong><span>JPG, PNG ou PDF</span><input type="file" accept="image/*,application/pdf" hidden></label>
        <button class="btn btn-grad btn-cheio" data-ok>Enviar</button>`);
      cx.querySelector('input').addEventListener('change', e => { const f = e.target.files[0]; if (f) cx.querySelector('.soltar strong').textContent = f.name; });
      cx.querySelector('[data-ok]').addEventListener('click', () => {
        devendo.forEach(d => A.enviarComprovante(EU, d.ref));
        A.fecharModal(); A.avisar('Comprovante enviado'); A.desenhar();
      });
    });
  }

  // Pix: código copia e cola + simulação do pagamento
  function modalPix(valor, titulo, txid, aoPagar, textoBotao) {
    const codigo = A.pix(valor, txid);
    const cx = A.abrirModal(`
      <div class="pix-cab">${A.ic('pix')}<div><span class="sutil">${A.esc(titulo)}</span><strong class="pix-valor">${A.reais(valor)}</strong></div></div>
      <ol class="pix-passos"><li>Copie o código abaixo</li><li>Abra o app do seu banco e escolha <b>Pix copia e cola</b></li><li>Confira o valor e pague</li></ol>
      <div class="pix-codigo"><code>${A.esc(codigo)}</code></div>
      <button class="btn btn-escuro btn-cheio" data-copiar>${A.ic('copiar')} Copiar código Pix</button>
      <button class="btn btn-grad btn-cheio" data-pago>${A.ic('check')} ${textoBotao || 'Já paguei'}</button>
      <p class="dica">Demonstração: a chave é fictícia. No sistema final, com Asaas ou Mercado Pago, o pagamento é confirmado sozinho em segundos.</p>`, { semFoco: true });
    cx.querySelector('[data-copiar]').addEventListener('click', () => A.copiar(codigo, 'Código Pix copiado'));
    cx.querySelector('[data-pago]').addEventListener('click', () => { A.fecharModal(); aoPagar(); });
  }

  function reposicao(eu, t) {
    // Turmas do mesmo nível e modalidade em outros dias/horários
    const opcoes = GR.TURMAS.filter(x => x.id !== t.id && x.mod === t.mod && x.nivel === t.nivel);
    const dias = [];
    for (let i = 1; i <= 7; i++) {
      const d = D.somar(A.hoje(), i); const s = D.deISO(d).getDay();
      opcoes.filter(o => o.dias.indexOf(s) > -1).forEach(o => dias.push({ d, o }));
    }
    const cx = A.abrirModal(`
      <h3 class="modal-titulo">Pedir reposição</h3>
      <p class="sutil">Turmas de ${A.esc(A.nomeTurma(t).toLowerCase())} com vaga nos próximos dias:</p>
      <div class="opcoes">${dias.map((x, i) => `<label class="opcao"><input type="radio" name="rep" value="${i}" ${i === 0 ? 'checked' : ''}><span><strong>${A.dataLonga(x.d).replace(/^./, c => c.toUpperCase())} · ${x.o.hora}</strong><small>${A.esc(A.prof(x.o.prof).nome)} · ${A.esc(GR.nomeQuadra(x.o.quadra))}</small></span></label>`).join('') || '<p>Nenhuma turma igual nesta semana. Fale com a GR.</p>'}</div>
      ${dias.length ? '<button class="btn btn-grad btn-cheio" data-ok>Pedir esta reposição</button>' : ''}`);
    const ok = cx.querySelector('[data-ok]');
    if (ok) ok.addEventListener('click', () => {
      const x = dias[+cx.querySelector('input[name=rep]:checked').value];
      A.S.faltas.push({ aluno: EU, data: x.d, turma: x.o.id, tipo: 'reposicao' }); A.salvar();
      A.fecharModal(); A.avisar('Reposição pedida para ' + A.ddmm(x.d) + ' às ' + x.o.hora);
    });
  }

  /* ---------------- Quadras ---------------- */
  function quadras(el, eu) {
    if (!estado.dia || estado.dia < A.hoje()) estado.dia = A.hoje();
    const dias = []; for (let i = 0; i < 10; i++) dias.push(D.somar(A.hoje(), i));
    const sem = D.deISO(estado.dia).getDay();
    const agoraMin = new Date().getHours() * 60 + new Date().getMinutes();
    const slots = GR.slotsDoDia(sem).filter(h => estado.dia > A.hoje() || GR.emMin(h) > agoraMin);
    const ocupado = (q, h) => A.S.reservas.find(r => r.data === estado.dia && r.hora === h && r.quadra === q);
    const livres = q => slots.filter(h => !GR.turmaNoHorario(sem, h, q) && !ocupado(q, h)).length;
    const preco = A.S.config.precoQuadraHora;

    el.innerHTML = `
      <section class="sec-cab"><h2 class="titulo-g">Alugar quadra</h2><p class="sutil">${A.reais(preco)} a hora · pague no Pix e a quadra é sua.</p></section>
      <div class="dias-rolagem" role="tablist">${dias.map(d => { const dd = D.deISO(d); return `<button class="dia-chip ${d === estado.dia ? 'ativo' : ''}" data-dia="${d}"><small>${A.quando(d) === 'hoje' ? 'hoje' : A.SEM_C[dd.getDay()]}</small><strong>${dd.getDate()}</strong></button>`; }).join('')}</div>

      <div class="mapa-quadras" role="radiogroup" aria-label="Escolha a quadra">
        ${A.S.config.quadras.map(q => `
          <button class="quadra-areia ${q.id === estado.quadra ? 'ativa' : ''}" data-quadra="${q.id}" role="radio" aria-checked="${q.id === estado.quadra}">
            <span class="qa-rede"></span><span class="qa-linha"></span>
            <span class="qa-nome">${A.esc(q.nome)}</span>
            <span class="qa-livres">${livres(q.id)} horários livres</span>
          </button>`).join('')}
      </div>

      <section class="cartao">
        <div class="cartao-cab"><h3>${A.esc(GR.nomeQuadra(estado.quadra))} · ${A.dataLonga(estado.dia)}</h3></div>
        <div class="horarios">
          ${slots.map(h => {
            const t = GR.turmaNoHorario(sem, h, estado.quadra); const r = ocupado(estado.quadra, h);
            if (t) return `<div class="hor hor-turma"><strong>${h}</strong><span>Turma GR</span></div>`;
            if (r) return `<div class="hor hor-ocupado ${r.aluno === EU ? 'meu' : ''}"><strong>${h}</strong><span>${r.aluno === EU ? 'Sua reserva' : 'Reservado'}</span></div>`;
            return `<button class="hor hor-livre" data-hora="${h}"><strong>${h}</strong><span>Livre</span></button>`;
          }).join('') || '<p class="sutil">Sem horários hoje. Escolha outro dia.</p>'}
        </div>
        <div class="legenda"><span><i class="lg-livre"></i>Livre</span><span><i class="lg-ocupado"></i>Reservado</span><span><i class="lg-turma"></i>Turma</span></div>
      </section>`;

    el.querySelectorAll('[data-dia]').forEach(b => b.addEventListener('click', () => { estado.dia = b.dataset.dia; quadras(el, eu); }));
    el.querySelectorAll('[data-quadra]').forEach(b => b.addEventListener('click', () => { estado.quadra = b.dataset.quadra; quadras(el, eu); }));
    el.querySelectorAll('[data-hora]').forEach(b => b.addEventListener('click', () => {
      const h = b.dataset.hora;
      const cx = A.abrirModal(`
        <h3 class="modal-titulo">Reservar quadra</h3>
        <div class="resumo">
          <div><span>Quadra</span><strong>${A.esc(GR.nomeQuadra(estado.quadra))}</strong></div>
          <div><span>Dia</span><strong>${A.dataLonga(estado.dia)}</strong></div>
          <div><span>Horário</span><strong>${h} (1 hora)</strong></div>
          <div class="resumo-total"><span>Total</span><strong>${A.reais(preco)}</strong></div>
        </div>
        <p class="dica">Cancelamento grátis até 24 h antes. Depois disso, vira crédito.</p>
        <button class="btn btn-grad btn-cheio" data-ok>${A.ic('pix')} Pagar com Pix e reservar</button>`);
      cx.querySelector('[data-ok]').addEventListener('click', () => {
        A.fecharModal();
        setTimeout(() => modalPix(preco, 'Quadra ' + A.ddmm(estado.dia) + ' às ' + h, 'QUADRA', () => {
          const r = { id: A.novoId('rs'), data: estado.dia, hora: h, quadra: estado.quadra, nome: eu.nome, tel: eu.tel, valor: preco, status: 'pago', aluno: EU };
          A.S.reservas.push(r);
          A.lancar({ tipo: 'entrada', cat: 'Aluguel de quadra', desc: eu.nome + ' · ' + GR.nomeQuadra(r.quadra) + ' ' + h, valor: preco, forma: 'Pix', ref: r.id });
          A.avisar('Quadra reservada! ' + A.ddmm(estado.dia) + ' às ' + h); quadras(el, eu);
        }, 'Paguei, confirmar reserva'), 240);
      });
    }));
  }

  /* ---------------- Cantina ---------------- */
  function cantina(el) {
    const cats = [...new Set(A.S.produtos.map(p => p.cat))];
    el.innerHTML = `
      <section class="sec-cab cantina-cab"><h2 class="titulo-g">GR Burger</h2><p class="sutil">A cantina da arena. Peça no balcão depois do treino.</p></section>
      ${cats.map(c => `
        <section class="cartao">
          <div class="cartao-cab"><h3>${A.esc(c)}</h3></div>
          <ul class="cardapio">${A.S.produtos.filter(p => p.cat === c).map(p => `<li><div><strong>${A.esc(p.nome)}</strong><span>${A.esc(p.desc)}</span></div><b>${A.reais(p.preco)}</b></li>`).join('')}</ul>
        </section>`).join('')}
      <p class="dica centro">Cardápio de exemplo. O dono troca preços e itens pelo painel.</p>`;
  }

  /* ---------------- Eventos ---------------- */
  function eventos(el, eu) {
    const evs = A.S.eventos.slice().sort((a, b) => (a.encerrado ? 1 : 0) - (b.encerrado ? 1 : 0) || (a.data < b.data ? -1 : 1));
    el.innerHTML = `<section class="sec-cab"><h2 class="titulo-g">Torneios e eventos</h2><p class="sutil">Inscreva a sua dupla e pague pelo app.</p></section>` +
      evs.map(ev => {
        const meu = ev.inscritos.find(i => i.aluno === EU || i.dupla === eu.nome);
        const d = D.deISO(ev.data);
        return `
        <article class="cartao evento ${ev.encerrado ? 'encerrado' : ''}">
          <div class="ev-data"><strong>${d.getDate()}</strong><span>${A.MES_C[d.getMonth()]}</span></div>
          <div class="ev-corpo">
            <span class="etiqueta">${A.esc(ev.tipo)}${ev.encerrado ? ' · encerrado' : ''}</span>
            <h3>${A.esc(ev.nome)}</h3>
            <p class="sutil">${A.dataLonga(ev.data)} · ${ev.hora}</p>
            <p>${A.esc(ev.desc)}</p>
            ${ev.encerrado ? `<p class="campeoes">${A.ic('trofeu')} ${A.esc(ev.campeoes)}</p>` : `
              <div class="ev-vagas"><div class="barra"><i style="width:${Math.min(100, ev.inscritos.length / ev.vagas * 100)}%"></i></div><span>${ev.inscritos.length} de ${ev.vagas} ${ev.tipo === 'Torneio' ? 'duplas' : 'vagas'}</span></div>
              ${meu ? `<p class="mens-ok mini">${A.ic('check')} Você está inscrito${meu.cat !== 'Participante' ? ' · ' + A.esc(meu.cat) : ''}</p>` :
                `<button class="btn btn-grad" data-ev="${ev.id}">${ev.valor ? 'Inscrever dupla · ' + A.reais(ev.valor) : 'Confirmar presença'}</button>`}`}
          </div>
        </article>`;
      }).join('');

    el.querySelectorAll('[data-ev]').forEach(b => b.addEventListener('click', () => {
      const ev = A.S.eventos.find(x => x.id === b.dataset.ev);
      if (!ev.valor) {
        ev.inscritos.push({ id: A.novoId('in'), dupla: eu.nome, cat: 'Participante', pago: true, aluno: EU }); A.salvar();
        A.avisar('Presença confirmada!'); eventos(el, eu); return;
      }
      const cx = A.abrirModal(`
        <h3 class="modal-titulo">${A.esc(ev.nome)}</h3>
        <form class="form" id="fDupla">
          <label>Seu parceiro ou parceira<input name="par" required placeholder="Nome completo"></label>
          <label>Categoria<select name="cat">${ev.categorias.map(c => `<option>${A.esc(c)}</option>`).join('')}</select></label>
          <div class="resumo"><div class="resumo-total"><span>Inscrição da dupla</span><strong>${A.reais(ev.valor)}</strong></div></div>
          <button class="btn btn-grad btn-cheio" type="submit">${A.ic('pix')} Continuar para o Pix</button>
        </form>`);
      cx.querySelector('#fDupla').addEventListener('submit', e => {
        e.preventDefault();
        const f = new FormData(e.target); const par = String(f.get('par')).trim(); const cat = f.get('cat');
        A.fecharModal();
        setTimeout(() => modalPix(ev.valor, 'Inscrição ' + ev.nome, 'TORNEIO', () => {
          const dupla = eu.nome.split(' ')[0] + ' & ' + par.split(' ')[0];
          const ins = { id: A.novoId('in'), dupla, cat, pago: true, aluno: EU };
          ev.inscritos.push(ins);
          A.lancar({ tipo: 'entrada', cat: 'Torneios', desc: 'Inscrição ' + dupla, valor: ev.valor, forma: 'Pix', ref: ins.id });
          A.avisar('Dupla inscrita! Boa sorte 🏆'); eventos(el, eu);
        }, 'Paguei, confirmar inscrição'), 240);
      });
    }));
  }

  /* ---------------- Perfil ---------------- */
  function perfil(el, eu) {
    const t = A.turma(eu.turma); const p = A.plano(eu.plano);
    const meses = []; for (let k = 0; k < 6; k++) meses.push(D.mesMenos(D.mesDe(A.hoje()), k));
    el.innerHTML = `
      <section class="perfil-topo">${A.avatar(eu.nome, 'avatar-g')}<div><h2>${A.esc(eu.nome)}</h2><p class="sutil">Aluno desde ${A.nomeMesAno(eu.desde.slice(0, 7))}</p></div></section>
      <section class="cartao">
        <dl class="dados">
          <div><dt>Turma</dt><dd>${A.esc(A.nomeTurma(t))}<br><small>${A.diasTurma(t)} às ${t.hora}</small></dd></div>
          <div><dt>Plano</dt><dd>${A.esc(A.descPlano(p))}<br><small>${A.reais(p.preco)} por mês</small></dd></div>
          <div><dt>Vencimento</dt><dd>Todo dia ${eu.venc}</dd></div>
          <div><dt>Telefone</dt><dd>${A.esc(eu.tel)}</dd></div>
        </dl>
      </section>
      <section class="cartao">
        <div class="cartao-cab"><h3>Histórico de mensalidades</h3></div>
        <ul class="historico">${meses.map(m => { const s = A.situacao(eu, m); if (s.status === 'isento') return ''; return `<li><span>${A.nomeMes(m).replace(/^./, c => c.toUpperCase())}</span><span class="sutil">${s.pg ? A.ddmm(s.pg.data) + ' · ' + A.esc(s.pg.forma) : 'vence ' + A.ddmm(s.venc)}</span>${A.pill(s.status)}</li>`; }).join('')}</ul>
      </section>
      <a class="btn btn-linha btn-cheio" href="#/entrar">${A.ic('sair')} Sair</a>`;
  }
})();
