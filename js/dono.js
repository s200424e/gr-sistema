/* =========================================================
   GR SISTEMA · painel do dono
   Visão geral · alunos · mensalidades · caixa · quadras · turmas · cantina · eventos
   ========================================================= */
(function () {
  'use strict';
  const A = App, D = GR.data;
  const ABAS = [
    { id: 'geral', nome: 'Visão geral', ic: 'grafico' },
    { id: 'alunos', nome: 'Alunos', ic: 'alunos' },
    { id: 'mensalidades', nome: 'Mensalidades', ic: 'mensal' },
    { id: 'caixa', nome: 'Caixa', ic: 'caixa' },
    { id: 'quadras', nome: 'Quadras', ic: 'quadra' },
    { id: 'turmas', nome: 'Turmas', ic: 'apito' },
    { id: 'cantina', nome: 'Cantina', ic: 'burger' },
    { id: 'eventos', nome: 'Eventos', ic: 'trofeu' },
  ];
  const est = { filtro: 'todos', turma: '', busca: '', mes: null, periodo: 'mes', diaQuadra: null, comanda: {}, };
  const CAT_ENTRADA = ['Mensalidades', 'Aluguel de quadra', 'Cantina', 'Loja', 'Torneios', 'Aula avulsa', 'Outros'];
  const CAT_SAIDA = ['Aluguel do espaço', 'Professores', 'Energia e água', 'Compras da cantina', 'Manutenção', 'Internet e sistemas', 'Outros'];

  A.rota('dono', function (p) {
    const aba = ABAS.some(a => a.id === p[0]) ? p[0] : 'geral';
    const info = ABAS.find(a => a.id === aba);
    const comp = A.S.pagamentos.filter(x => x.status === 'analise').length;
    document.body.className = 'tela-dono';
    A.$('#app').innerHTML = `
      <div class="painel">
        <aside class="lateral" id="lateral">
          <a class="lat-marca" href="#/dono/geral"><svg><use href="#gr-marca"/></svg><span>GR Sports<small>Painel do CT</small></span></a>
          <nav class="lat-nav" aria-label="Painel">
            ${ABAS.map(a => `<a href="#/dono/${a.id}" class="${a.id === aba ? 'ativo' : ''}" ${a.id === aba ? 'aria-current="page"' : ''}>${A.ic(a.ic)}<span>${a.nome}</span>${a.id === 'mensalidades' && comp ? `<b class="bolinha">${comp}</b>` : ''}</a>`).join('')}
          </nav>
          <div class="lat-rodape">
            <a href="#/aluno/inicio">${A.ic('user')} Ver como aluno</a>
            <button id="bRest">${A.ic('restaurar')} Restaurar exemplo</button>
            <a href="#/entrar">${A.ic('sair')} Sair</a>
          </div>
        </aside>
        <div class="lat-fundo" id="latFundo"></div>
        <div class="painel-main">
          <header class="painel-topo">
            <button class="bt-menu" id="bMenu" aria-label="Abrir menu">${A.ic('menu')}</button>
            <div><h1>${info.nome}</h1><p class="sutil">${A.dataLonga(A.hoje()).replace(/^./, c => c.toUpperCase())}</p></div>
            <div class="topo-dono">${A.avatar('GR Sports', 'avatar-gr')}<span><strong>Dono</strong><small>GR Sports</small></span></div>
          </header>
          <main class="painel-corpo" id="pn"></main>
        </div>
      </div>`;
    const lat = A.$('#lateral');
    A.$('#bMenu').addEventListener('click', () => document.body.classList.add('menu-aberto'));
    A.$('#latFundo').addEventListener('click', () => document.body.classList.remove('menu-aberto'));
    lat.addEventListener('click', e => { if (e.target.closest('a')) document.body.classList.remove('menu-aberto'); });
    A.$('#bRest').addEventListener('click', () => { A.restaurar(); A.avisar('Dados de exemplo restaurados'); A.desenhar(); });
    ({ geral, alunos, mensalidades, caixa, quadras, turmas, cantina, eventos })[aba](A.$('#pn'));
    window.scrollTo(0, 0);
  });

  /* ---------- contas ---------- */
  const mesAtual = () => D.mesDe(A.hoje());
  const doMes = m => A.S.caixa.filter(l => l.data.slice(0, 7) === m);
  const soma = (lista, tipo) => lista.filter(l => !tipo || l.tipo === tipo).reduce((s, l) => s + l.valor, 0);
  function porCategoria(lista, tipo) {
    const o = {}; lista.filter(l => l.tipo === tipo).forEach(l => { o[l.cat] = (o[l.cat] || 0) + l.valor; });
    return Object.keys(o).map(k => ({ cat: k, valor: o[k] })).sort((a, b) => b.valor - a.valor);
  }
  const ativos = () => A.S.alunos.filter(a => a.ativo);
  const comStatus = (st, m) => ativos().filter(a => A.situacao(a, m).status === st);
  function atrasados() {
    return ativos().map(a => ({ a, deb: A.debitos(a).filter(d => d.status === 'atrasado') }))
      .filter(x => x.deb.length).map(x => Object.assign(x, { total: x.deb.reduce((s, d) => s + d.valor, 0), dias: A.diasAtraso(x.deb[0].venc) }))
      .sort((a, b) => b.dias - a.dias);
  }
  function msgCobranca(a, deb) {
    const total = deb.reduce((s, d) => s + d.valor, 0);
    const meses = deb.map(d => A.nomeMes(d.ref)).join(' e ');
    return `Oi, ${a.nome.split(' ')[0]}! Tudo bem? Aqui é da GR Sports 🏐\n\nA mensalidade de ${meses} (${A.reais(total)}) está em aberto desde ${A.ddmm(deb[0].venc)}.\n\nVocê pode pagar pelo app da GR: Início > Pagar com Pix. Se já pagou, é só mandar o comprovante por lá.\n\nQualquer coisa, chama aqui! 🤙`;
  }
  const kpi = (rot, val, sub, cls) => `<div class="kpi ${cls || ''}"><span>${rot}</span><strong>${val}</strong>${sub ? `<small>${sub}</small>` : ''}</div>`;

  /* ---------- Visão geral ---------- */
  function geral(el) {
    const m = mesAtual(); const lm = doMes(m);
    const ent = soma(lm, 'entrada'), sai = soma(lm, 'saida');
    const atr = atrasados(); const totalAtr = atr.reduce((s, x) => s + x.total, 0);
    const comp = A.S.pagamentos.filter(p => p.status === 'analise');
    const hoje = A.hoje(); const sem = D.deISO(hoje).getDay();
    const turmasHoje = GR.TURMAS.filter(t => t.dias.indexOf(sem) > -1).sort((a, b) => GR.emMin(a.hora) - GR.emMin(b.hora));
    const resHoje = A.S.reservas.filter(r => r.data === hoje).sort((a, b) => GR.emMin(a.hora) - GR.emMin(b.hora));
    const pagos = comStatus('pago', m).length, tot = ativos().filter(a => A.situacao(a, m).status !== 'isento').length;

    el.innerHTML = `
      <div class="kpis">
        ${kpi('Entrou em ' + A.nomeMes(m), A.reais(ent), 'mensalidades, quadra, cantina e mais', 'kpi-entrada')}
        ${kpi('Saiu em ' + A.nomeMes(m), A.reais(sai), 'aluguel, professores e contas')}
        ${kpi('Sobrou no mês', A.reais(ent - sai), ent - sai >= 0 ? 'no azul' : 'no vermelho', ent - sai >= 0 ? 'kpi-ok' : 'kpi-ruim')}
        ${kpi('Mensalidades atrasadas', A.reais(totalAtr), atr.length + ' alunos · ' + pagos + ' de ' + tot + ' já pagaram este mês', 'kpi-alerta')}
      </div>

      <div class="grade-2">
        <section class="bloco">
          <div class="bloco-cab"><h2>Cobrar agora</h2><a href="#/dono/mensalidades" class="link">Ver todas ${A.ic('seta')}</a></div>
          ${atr.length ? `<ul class="lista">${atr.slice(0, 6).map(x => `
            <li class="li-aluno">${A.avatar(x.a.nome)}<div class="li-txt"><strong>${A.esc(x.a.nome)}</strong><span>${A.reais(x.total)} · ${x.dias} dias de atraso</span></div>
              <div class="li-acoes"><button class="btn-ic btn-whats" data-cobrar="${x.a.id}" title="Cobrar no WhatsApp">${A.ic('whats')}</button><button class="btn btn-mini" data-recebi="${x.a.id}">Recebi</button></div></li>`).join('')}</ul>`
          : `<p class="vazio">${A.ic('check')} Ninguém atrasado. Que mês!</p>`}
        </section>

        <section class="bloco">
          <div class="bloco-cab"><h2>Comprovantes para conferir</h2>${comp.length ? `<span class="bolinha">${comp.length}</span>` : ''}</div>
          ${comp.length ? `<ul class="lista">${comp.map(p => { const a = A.aluno(p.aluno); return `
            <li class="li-aluno">${A.avatar(a.nome)}<div class="li-txt"><strong>${A.esc(a.nome)}</strong><span>Pix de ${A.reais(p.valor)} · enviado ${A.quando(p.data)}</span></div>
              <div class="li-acoes"><button class="btn btn-mini btn-ok" data-aprovar="${p.id}">${A.ic('check')} Aprovar</button></div></li>`; }).join('')}</ul>`
          : `<p class="vazio">${A.ic('check')} Nenhum comprovante esperando.</p>`}

          <div class="bloco-cab mt"><h2>Hoje na arena</h2></div>
          <ul class="agenda-hoje">
            ${turmasHoje.map(t => ({ h: t.hora, html: `<li><b>${t.hora}</b><span>${A.esc(A.nomeTurma(t))}</span><small>${A.esc(GR.nomeQuadra(t.quadra))} · ${A.S.alunos.filter(a => a.turma === t.id).length} alunos</small></li>` }))
              .concat(resHoje.map(r => ({ h: r.hora, html: `<li class="ag-res"><b>${r.hora}</b><span>Aluguel · ${A.esc(r.nome)}</span><small>${A.esc(GR.nomeQuadra(r.quadra))} · ${A.ROTULO[r.status]}</small></li>` })))
              .sort((a, b) => GR.emMin(a.h) - GR.emMin(b.h)).map(x => x.html).join('')}
            ${!turmasHoje.length && !resHoje.length ? '<li class="vazio">Sem turmas nem reservas hoje.</li>' : ''}
          </ul>
        </section>
      </div>

      <div class="grade-2">
        <section class="bloco">
          <div class="bloco-cab"><h2>Quanto entrou por mês</h2></div>
          ${graficoMeses()}
        </section>
        <section class="bloco">
          <div class="bloco-cab"><h2>De onde veio o dinheiro em ${A.nomeMes(m)}</h2></div>
          ${barrasCategoria(porCategoria(lm, 'entrada'))}
        </section>
      </div>`;
    ligarCobranca(el);
  }

  // Barras verticais: uma série só (entradas), sem legenda; valor no mês atual e no toque/hover
  function graficoMeses() {
    const ms = []; for (let k = 5; k >= 0; k--) ms.push(D.mesMenos(mesAtual(), k));
    const vals = ms.map(m => soma(doMes(m), 'entrada'));
    const max = Math.max.apply(null, vals) * 1.12 || 1;
    const linhas = [0.25, 0.5, 0.75].map(f => `<i style="bottom:${f * 100}%"><span>${A.reaisCurto(max * f / 1000)}k</span></i>`).join('');
    return `<div class="grafico" role="img" aria-label="Entradas dos últimos 6 meses">
      <div class="graf-area">${linhas}
        ${ms.map((m, i) => `<div class="graf-col ${i === ms.length - 1 ? 'atual' : ''}" tabindex="0" data-tip="${A.nomeMes(m)}: ${A.reais(vals[i])}${i === ms.length - 1 ? ' (até hoje)' : ''}">
          ${i === ms.length - 1 ? `<span class="graf-rot">${A.reaisCurto(vals[i])}</span>` : ''}<div class="graf-barra" style="height:${vals[i] / max * 100}%"></div></div>`).join('')}
      </div>
      <div class="graf-eixo">${ms.map(m => `<span>${A.MES_C[+m.slice(5, 7) - 1]}</span>`).join('')}</div>
    </div>
    <table class="so-leitor"><caption>Entradas por mês</caption>${ms.map((m, i) => `<tr><th>${A.nomeMes(m)}</th><td>${A.reais(vals[i])}</td></tr>`).join('')}</table>`;
  }
  function barrasCategoria(lista, cls) {
    if (!lista.length) return '<p class="vazio">Nada neste período.</p>';
    const max = lista[0].valor; const tot = lista.reduce((s, x) => s + x.valor, 0);
    return `<ul class="barras ${cls || ''}">${lista.map(x => `<li><div class="barras-txt"><span>${A.esc(x.cat)}</span><strong>${A.reais(x.valor)}</strong></div><div class="barras-trilho" data-tip="${A.esc(x.cat)}: ${Math.round(x.valor / tot * 100)}% do total"><i style="width:${x.valor / max * 100}%"></i></div></li>`).join('')}</ul>`;
  }

  function ligarCobranca(el) {
    el.querySelectorAll('[data-cobrar]').forEach(b => b.addEventListener('click', () => {
      const a = A.aluno(b.dataset.cobrar); cobrar(a);
    }));
    el.querySelectorAll('[data-recebi]').forEach(b => b.addEventListener('click', () => receber(A.aluno(b.dataset.recebi))));
    el.querySelectorAll('[data-aprovar]').forEach(b => b.addEventListener('click', () => {
      const p = A.S.pagamentos.find(x => x.id === b.dataset.aprovar);
      A.registrarPagamento(p.aluno, p.ref, 'Pix');
      A.avisar('Pagamento de ' + A.aluno(p.aluno).nome.split(' ')[0] + ' aprovado e lançado no caixa'); A.desenhar();
    }));
  }
  function cobrar(a) {
    const deb = A.debitos(a).filter(d => d.status === 'atrasado');
    const msg = msgCobranca(a, deb.length ? deb : A.debitos(a));
    const cx = A.abrirModal(`
      <h3 class="modal-titulo">Cobrar ${A.esc(a.nome.split(' ')[0])}</h3>
      <p class="sutil">${A.esc(a.tel)} · mensagem pronta, é só enviar:</p>
      <textarea class="msg" rows="9">${A.esc(msg)}</textarea>
      <button class="btn btn-whats-g btn-cheio" data-ok>${A.ic('whats')} Abrir no WhatsApp</button>
      <p class="dica">No protótipo o WhatsApp abre sem número, para você escolher o contato. No sistema real já abre na conversa do aluno.</p>`);
    cx.querySelector('[data-ok]').addEventListener('click', () => { A.whats(cx.querySelector('textarea').value); A.fecharModal(); });
  }
  function receber(a, ref) {
    const deb = ref ? [Object.assign({ ref }, A.situacao(a, ref))] : A.debitos(a);
    const total = deb.reduce((s, d) => s + d.valor, 0);
    const cx = A.abrirModal(`
      <h3 class="modal-titulo">Recebi de ${A.esc(a.nome.split(' ')[0])}</h3>
      <div class="resumo">${deb.map(d => `<div><span>${A.nomeMes(d.ref).replace(/^./, c => c.toUpperCase())}</span><strong>${A.reais(d.valor)}</strong></div>`).join('')}
        <div class="resumo-total"><span>Total</span><strong>${A.reais(total)}</strong></div></div>
      <div class="formas" role="radiogroup">${['Pix', 'Dinheiro', 'Cartão'].map((f, i) => `<label><input type="radio" name="forma" value="${f}" ${i ? '' : 'checked'}><span>${f}</span></label>`).join('')}</div>
      <button class="btn btn-grad btn-cheio" data-ok>${A.ic('check')} Confirmar e lançar no caixa</button>`);
    cx.querySelector('[data-ok]').addEventListener('click', () => {
      const forma = cx.querySelector('input[name=forma]:checked').value;
      deb.forEach(d => A.registrarPagamento(a.id, d.ref, forma));
      A.fecharModal(); A.avisar(A.reais(total) + ' lançado no caixa'); A.desenhar();
    });
  }

  /* ---------- Alunos ---------- */
  function alunos(el) {
    const m = mesAtual();
    const FILTROS = [['todos', 'Todos'], ['pago', 'Em dia'], ['aberto', 'A vencer'], ['atrasado', 'Atrasados'], ['analise', 'Comprovante']];
    const conta = st => st === 'todos' ? ativos().length : comStatus(st, m).length;
    el.innerHTML = `
      <div class="barra-ferr">
        <label class="busca">${A.ic('busca')}<input id="iBusca" placeholder="Buscar aluno pelo nome ou telefone" value="${A.esc(est.busca)}"></label>
        <select id="sTurma" aria-label="Filtrar por turma"><option value="">Todas as turmas</option>${GR.TURMAS.map(t => `<option value="${t.id}" ${est.turma === t.id ? 'selected' : ''}>${A.esc(A.nomeTurma(t))} · ${A.diasTurma(t)} ${t.hora}</option>`).join('')}</select>
        <button class="btn btn-grad" id="bNovo">${A.ic('mais')} Novo aluno</button>
      </div>
      <div class="chips">${FILTROS.map(f => `<button class="chip ${est.filtro === f[0] ? 'ativo' : ''}" data-f="${f[0]}">${f[1]} <b>${conta(f[0])}</b></button>`).join('')}</div>
      <section class="bloco sem-pad"><table class="tabela" id="tAlunos">
        <thead><tr><th>Aluno</th><th>Turma</th><th>Plano</th><th>Vence</th><th>${A.nomeMes(m).replace(/^./, c => c.toUpperCase())}</th></tr></thead>
        <tbody></tbody></table></section>`;
    const corpo = el.querySelector('tbody');
    function lista() {
      const q = est.busca.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const rows = ativos().filter(a => (!est.turma || a.turma === est.turma) && (est.filtro === 'todos' || A.situacao(a, m).status === est.filtro) &&
        (!q || (a.nome + ' ' + a.tel).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').indexOf(q) > -1));
      corpo.innerHTML = rows.map(a => { const t = A.turma(a.turma), p = A.plano(a.plano), s = A.situacao(a, m); return `
        <tr data-id="${a.id}" tabindex="0">
          <td><div class="td-aluno">${A.avatar(a.nome)}<div><strong>${A.esc(a.nome)}</strong><small>${A.esc(a.tel)}</small></div></div></td>
          <td data-r="Turma">${A.esc(A.nomeTurma(t))}<small>${A.diasTurma(t)} ${t.hora}</small></td>
          <td data-r="Plano">${A.reais(p.preco)}<small>${p.vezes}x por semana</small></td>
          <td data-r="Vence">dia ${a.venc}</td>
          <td data-r="Situação">${A.pill(s.status)}</td>
        </tr>`; }).join('') || `<tr><td colspan="5" class="vazio">Nenhum aluno com esse filtro.</td></tr>`;
    }
    lista();
    el.querySelector('#iBusca').addEventListener('input', e => { est.busca = e.target.value; lista(); });
    el.querySelector('#sTurma').addEventListener('change', e => { est.turma = e.target.value; lista(); });
    el.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => { est.filtro = b.dataset.f; alunos(el); }));
    corpo.addEventListener('click', e => { const tr = e.target.closest('tr[data-id]'); if (tr) fichaAluno(A.aluno(tr.dataset.id)); });
    corpo.addEventListener('keydown', e => { const tr = e.target.closest('tr[data-id]'); if (tr && e.key === 'Enter') fichaAluno(A.aluno(tr.dataset.id)); });
    el.querySelector('#bNovo').addEventListener('click', novoAluno);
  }

  function fichaAluno(a) {
    const t = A.turma(a.turma), p = A.plano(a.plano);
    const meses = []; for (let k = 5; k >= 0; k--) meses.push(D.mesMenos(mesAtual(), k));
    const deb = A.debitos(a);
    const faltasMes = Object.keys(A.S.presencas).filter(k => k.endsWith('|' + a.turma) && k.slice(0, 7) === mesAtual());
    const pres = faltasMes.filter(k => A.S.presencas[k].indexOf(a.id) > -1).length;
    const cx = A.abrirModal(`
      <div class="ficha-cab">${A.avatar(a.nome, 'avatar-g')}<div><h3>${A.esc(a.nome)}</h3><p class="sutil">${A.esc(a.tel)} · aluno desde ${A.ddmm(a.desde)}/${a.desde.slice(2, 4)}</p></div></div>
      <div class="ficha-meses">${meses.map(m => { const s = A.situacao(a, m); return `<div class="fm fm-${s.status}" title="${A.nomeMes(m)}: ${A.ROTULO[s.status]}"><span>${A.MES_C[+m.slice(5, 7) - 1]}</span><i></i><small>${s.status === 'isento' ? '-' : A.ROTULO[s.status]}</small></div>`; }).join('')}</div>
      ${deb.length ? `<div class="ficha-deve"><span>Em aberto</span><strong>${A.reais(deb.reduce((s, d) => s + d.valor, 0))}</strong>
        <div><button class="btn btn-whats-g" data-c>${A.ic('whats')} Cobrar</button><button class="btn btn-grad" data-r>${A.ic('check')} Recebi</button></div></div>` : `<p class="mens-ok mini">${A.ic('check')} Em dia com a GR</p>`}
      <p class="sutil">Frequência em ${A.nomeMes(mesAtual())}: <strong>${pres} de ${faltasMes.length}</strong> treinos marcados na chamada.</p>
      <form class="form form-2" id="fFicha">
        <label>Turma<select name="turma">${GR.TURMAS.map(x => `<option value="${x.id}" ${x.id === t.id ? 'selected' : ''}>${A.esc(A.nomeTurma(x))} · ${A.diasTurma(x)} ${x.hora}</option>`).join('')}</select></label>
        <label>Plano<select name="plano">${GR.PLANOS.map(x => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${A.esc(A.descPlano(x))} · ${A.reais(x.preco)}</option>`).join('')}</select></label>
        <label>Vencimento<select name="venc">${[5, 10, 15, 20, 28].map(v => `<option ${v === a.venc ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label>Telefone<input name="tel" value="${A.esc(a.tel)}"></label>
        <button class="btn btn-escuro" type="submit">Salvar alterações</button>
      </form>`, { classe: 'modal-largo', semFoco: true });
    const c = cx.querySelector('[data-c]'); if (c) c.addEventListener('click', () => { A.fecharModal(); setTimeout(() => cobrar(a), 240); });
    const r = cx.querySelector('[data-r]'); if (r) r.addEventListener('click', () => { A.fecharModal(); setTimeout(() => receber(a), 240); });
    cx.querySelector('#fFicha').addEventListener('submit', e => {
      e.preventDefault(); const f = new FormData(e.target);
      Object.assign(a, { turma: f.get('turma'), plano: f.get('plano'), venc: +f.get('venc'), tel: f.get('tel') });
      A.salvar(); A.fecharModal(); A.avisar('Dados de ' + a.nome.split(' ')[0] + ' salvos'); A.desenhar();
    });
  }

  function novoAluno() {
    const cx = A.abrirModal(`
      <h3 class="modal-titulo">Novo aluno</h3>
      <form class="form form-2" id="fNovo">
        <label class="span-2">Nome completo<input name="nome" required></label>
        <label>Telefone (WhatsApp)<input name="tel" required placeholder="(61) 9 0000-0000"></label>
        <label>CPF<input name="cpf" placeholder="para entrar no app"></label>
        <label>Turma<select name="turma">${GR.TURMAS.map(x => `<option value="${x.id}">${A.esc(A.nomeTurma(x))} · ${A.diasTurma(x)} ${x.hora}</option>`).join('')}</select></label>
        <label>Plano<select name="plano">${GR.PLANOS.map(x => `<option value="${x.id}">${A.esc(A.descPlano(x))} · ${A.reais(x.preco)}</option>`).join('')}</select></label>
        <label>Vencimento<select name="venc">${[5, 10, 15, 20, 28].map(v => `<option>${v}</option>`).join('')}</select></label>
        <button class="btn btn-grad span-2" type="submit">${A.ic('mais')} Cadastrar e mandar o acesso</button>
      </form>
      <p class="dica">No sistema real o aluno recebe no WhatsApp o link do app e cria a senha.</p>`, { classe: 'modal-largo' });
    cx.querySelector('#fNovo').addEventListener('submit', e => {
      e.preventDefault(); const f = new FormData(e.target);
      const a = { id: A.novoId('a'), nome: String(f.get('nome')).trim(), tel: f.get('tel'), turma: f.get('turma'), plano: f.get('plano'), venc: +f.get('venc'), desde: A.hoje(), ativo: true };
      A.S.alunos.push(a); A.S.alunos.sort((x, y) => x.nome.localeCompare(y.nome, 'pt')); A.salvar();
      A.fecharModal(); A.avisar(a.nome.split(' ')[0] + ' cadastrado'); A.desenhar();
    });
  }

  /* ---------- Mensalidades ---------- */
  function mensalidades(el) {
    const ms = []; for (let k = 0; k < 6; k++) ms.push(D.mesMenos(mesAtual(), k));
    if (!est.mes || ms.indexOf(est.mes) < 0) est.mes = ms[0];
    const m = est.mes;
    const lista = ativos().map(a => ({ a, s: A.situacao(a, m) })).filter(x => x.s.status !== 'isento');
    const grupo = st => lista.filter(x => x.s.status === st);
    const esperado = lista.reduce((s, x) => s + x.s.valor, 0);
    const recebido = grupo('pago').reduce((s, x) => s + x.s.valor, 0);
    const pct = esperado ? Math.round(recebido / esperado * 100) : 0;
    const linha = (x, acoes) => `<li class="li-aluno">${A.avatar(x.a.nome)}<div class="li-txt"><strong>${A.esc(x.a.nome)}</strong><span>${A.reais(x.s.valor)} · ${x.s.status === 'pago' ? 'pago ' + A.ddmm(x.s.pg.data) + ' · ' + A.esc(x.s.pg.forma) : x.s.status === 'atrasado' ? A.diasAtraso(x.s.venc) + ' dias de atraso' : x.s.status === 'analise' ? 'comprovante de ' + A.quando(x.s.pg.data) : 'vence ' + A.ddmm(x.s.venc)}</span></div><div class="li-acoes">${acoes}</div></li>`;

    el.innerHTML = `
      <div class="chips">${ms.map(x => `<button class="chip ${x === m ? 'ativo' : ''}" data-m="${x}">${A.nomeMes(x).replace(/^./, c => c.toUpperCase())}</button>`).join('')}</div>
      <section class="bloco resumo-mes">
        <div class="rm-num">${kpi('Esperado', A.reais(esperado), lista.length + ' alunos')}${kpi('Recebido', A.reais(recebido), grupo('pago').length + ' pagaram', 'kpi-ok')}${kpi('Falta receber', A.reais(esperado - recebido), grupo('atrasado').length + ' atrasados · ' + grupo('aberto').length + ' a vencer', 'kpi-alerta')}</div>
        <div class="progresso" data-tip="${pct}% das mensalidades de ${A.nomeMes(m)} já entraram"><i style="width:${pct}%"></i></div>
        <p class="sutil">${pct}% recebido</p>
      </section>
      <div class="grade-2">
        <section class="bloco">
          <div class="bloco-cab"><h2>Atrasados <span class="cont">${grupo('atrasado').length}</span></h2>${grupo('atrasado').length > 1 ? `<button class="btn btn-mini btn-whats-g" id="bTodos">${A.ic('whats')} Cobrar todos</button>` : ''}</div>
          <ul class="lista">${grupo('atrasado').map(x => linha(x, `<button class="btn-ic btn-whats" data-cobrar="${x.a.id}" title="Cobrar">${A.ic('whats')}</button><button class="btn btn-mini" data-rec="${x.a.id}">Recebi</button>`)).join('') || `<li class="vazio">${A.ic('check')} Ninguém atrasado.</li>`}</ul>
        </section>
        <section class="bloco">
          <div class="bloco-cab"><h2>Comprovantes <span class="cont">${grupo('analise').length}</span></h2></div>
          <ul class="lista">${grupo('analise').map(x => linha(x, `<button class="btn btn-mini" data-recusar="${x.s.pg.id}">Recusar</button><button class="btn btn-mini btn-ok" data-aprovar="${x.s.pg.id}">${A.ic('check')} Aprovar</button>`)).join('') || '<li class="vazio">Nenhum comprovante esperando.</li>'}</ul>
          <div class="bloco-cab mt"><h2>A vencer <span class="cont">${grupo('aberto').length}</span></h2></div>
          <ul class="lista">${grupo('aberto').map(x => linha(x, `<button class="btn btn-mini" data-rec="${x.a.id}">Recebi</button>`)).join('') || '<li class="vazio">Nada a vencer.</li>'}</ul>
        </section>
      </div>
      <section class="bloco">
        <details><summary><h2>Pagos <span class="cont">${grupo('pago').length}</span></h2></summary>
          <ul class="lista colunas">${grupo('pago').map(x => linha(x, A.pill('pago'))).join('')}</ul></details>
      </section>`;

    el.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { est.mes = b.dataset.m; mensalidades(el); }));
    ligarCobranca(el);
    el.querySelectorAll('[data-rec]').forEach(b => b.addEventListener('click', () => receber(A.aluno(b.dataset.rec), m)));
    el.querySelectorAll('[data-recusar]').forEach(b => b.addEventListener('click', () => {
      A.S.pagamentos = A.S.pagamentos.filter(p => p.id !== b.dataset.recusar); A.salvar();
      A.avisar('Comprovante recusado. O aluno volta para "em aberto".'); A.desenhar();
    }));
    const bt = el.querySelector('#bTodos');
    if (bt) bt.addEventListener('click', () => {
      const atr = grupo('atrasado');
      const cx = A.abrirModal(`<h3 class="modal-titulo">Cobrar ${atr.length} alunos</h3><p class="sutil">Cada botão abre o WhatsApp com a mensagem pronta daquele aluno.</p>
        <ul class="lista">${atr.map(x => `<li class="li-aluno">${A.avatar(x.a.nome)}<div class="li-txt"><strong>${A.esc(x.a.nome)}</strong><span>${A.reais(x.s.valor)}</span></div><div class="li-acoes"><button class="btn btn-mini btn-whats-g" data-w="${x.a.id}">${A.ic('whats')} Enviar</button></div></li>`).join('')}</ul>
        <p class="dica">Com a API oficial do WhatsApp dá para mandar todas de uma vez, automaticamente, no dia seguinte ao vencimento.</p>`, { classe: 'modal-largo' });
      cx.querySelectorAll('[data-w]').forEach(b => b.addEventListener('click', () => {
        const a = A.aluno(b.dataset.w); A.whats(msgCobranca(a, A.debitos(a).filter(d => d.status === 'atrasado')));
        b.outerHTML = A.pill('pago', 'Enviado');
      }));
    });
  }

  /* ---------- Caixa ---------- */
  function caixa(el) {
    const h = A.hoje();
    const PER = { hoje: ['Hoje', h, h], semana: ['7 dias', D.somar(h, -6), h], mes: ['Este mês', mesAtual() + '-01', h], passado: ['Mês passado', D.mesMenos(mesAtual(), 1) + '-01', D.somar(mesAtual() + '-01', -1)] };
    const [, ini, fim] = PER[est.periodo];
    const lista = A.S.caixa.filter(l => l.data >= ini && l.data <= fim);
    const ent = soma(lista, 'entrada'), sai = soma(lista, 'saida');
    const dias = [...new Set(lista.map(l => l.data))].sort().reverse();
    const formas = {}; lista.filter(l => l.tipo === 'entrada').forEach(l => { formas[l.forma] = (formas[l.forma] || 0) + l.valor; });

    el.innerHTML = `
      <div class="barra-ferr">
        <div class="chips sem-mb">${Object.keys(PER).map(k => `<button class="chip ${est.periodo === k ? 'ativo' : ''}" data-p="${k}">${PER[k][0]}</button>`).join('')}</div>
        <div class="ferr-dir">
          <button class="btn btn-linha" data-novo="saida">${A.ic('saida')} Saída</button>
          <button class="btn btn-grad" data-novo="entrada">${A.ic('entrada')} Entrada</button>
        </div>
      </div>
      <div class="kpis kpis-3">${kpi('Entradas', A.reais(ent), lista.filter(l => l.tipo === 'entrada').length + ' lançamentos', 'kpi-entrada')}${kpi('Saídas', A.reais(sai), lista.filter(l => l.tipo === 'saida').length + ' lançamentos')}${kpi('Saldo', A.reais(ent - sai), PER[est.periodo][0].toLowerCase(), ent - sai >= 0 ? 'kpi-ok' : 'kpi-ruim')}</div>
      <div class="grade-caixa">
        <section class="bloco">
          <div class="bloco-cab"><h2>Lançamentos</h2>${est.periodo === 'hoje' || est.periodo === 'mes' ? `<button class="btn btn-mini btn-escuro" id="bFechar">${A.ic('cadeado')} Fechar caixa de hoje</button>` : ''}</div>
          <div class="lancamentos">${dias.slice(0, 40).map(d => {
            const doDia = lista.filter(l => l.data === d); const sd = soma(doDia, 'entrada') - soma(doDia, 'saida');
            return `<div class="lc-dia"><div class="lc-dia-cab"><strong>${A.quando(d) === A.ddmm(d) ? A.dataLonga(d) : A.quando(d).replace(/^./, c => c.toUpperCase()) + ' · ' + A.ddmm(d)}</strong><span class="${sd >= 0 ? 'pos' : 'neg'}">${sd >= 0 ? '+' : '−'} ${A.reais(Math.abs(sd))}</span></div>
              <ul>${doDia.map(l => `<li class="lc lc-${l.tipo}"><span class="lc-ic">${A.ic(l.tipo)}</span><div><strong>${A.esc(l.desc)}</strong><small>${A.esc(l.cat)} · ${A.esc(l.forma)}</small></div><b>${l.tipo === 'saida' ? '−' : '+'} ${A.reais(l.valor)}</b></li>`).join('')}</ul></div>`;
          }).join('') || '<p class="vazio">Nenhum lançamento neste período.</p>'}
          ${dias.length > 40 ? `<p class="dica centro">Mostrando os 40 dias mais recentes.</p>` : ''}</div>
        </section>
        <div class="col-dir">
          <section class="bloco"><div class="bloco-cab"><h2>Entradas por categoria</h2></div>${barrasCategoria(porCategoria(lista, 'entrada'))}</section>
          <section class="bloco"><div class="bloco-cab"><h2>Saídas por categoria</h2></div>${barrasCategoria(porCategoria(lista, 'saida'), 'barras-saida')}</section>
          <section class="bloco"><div class="bloco-cab"><h2>Como entrou</h2></div>
            <ul class="formas-lista">${Object.keys(formas).sort((a, b) => formas[b] - formas[a]).map(f => `<li><span>${A.esc(f)}</span><strong>${A.reais(formas[f])}</strong></li>`).join('') || '<li class="vazio">-</li>'}</ul>
            <p class="dica">"Vários" é o total da cantina do dia. No sistema final, cada venda da cantina sai com a forma de pagamento.</p></section>
        </div>
      </div>`;

    el.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { est.periodo = b.dataset.p; caixa(el); }));
    el.querySelectorAll('[data-novo]').forEach(b => b.addEventListener('click', () => novoLancamento(b.dataset.novo)));
    const bf = el.querySelector('#bFechar');
    if (bf) bf.addEventListener('click', () => {
      const hj = A.S.caixa.filter(l => l.data === h); const fo = {};
      hj.filter(l => l.tipo === 'entrada').forEach(l => { fo[l.forma] = (fo[l.forma] || 0) + l.valor; });
      const cx = A.abrirModal(`<h3 class="modal-titulo">Fechar caixa de hoje</h3>
        <div class="resumo">${Object.keys(fo).map(f => `<div><span>${A.esc(f)}</span><strong>${A.reais(fo[f])}</strong></div>`).join('')}
          <div><span>Saídas</span><strong>− ${A.reais(soma(hj, 'saida'))}</strong></div>
          <div class="resumo-total"><span>Saldo do dia</span><strong>${A.reais(soma(hj, 'entrada') - soma(hj, 'saida'))}</strong></div></div>
        <label class="form">Dinheiro contado na gaveta<input type="number" inputmode="decimal" placeholder="${(fo['Dinheiro'] || 0).toFixed(2)}"></label>
        <button class="btn btn-escuro btn-cheio" data-ok>${A.ic('cadeado')} Fechar caixa</button>`);
      cx.querySelector('[data-ok]').addEventListener('click', () => { A.fecharModal(); A.avisar('Caixa de ' + A.ddmm(h) + ' fechado'); });
    });
  }
  function novoLancamento(tipo) {
    const cats = tipo === 'entrada' ? CAT_ENTRADA : CAT_SAIDA;
    const cx = A.abrirModal(`
      <h3 class="modal-titulo">Nova ${tipo === 'entrada' ? 'entrada' : 'saída'}</h3>
      <form class="form form-2" id="fLanc">
        <label>Valor (R$)<input name="valor" type="number" step="0.01" min="0.01" inputmode="decimal" required></label>
        <label>Data<input name="data" type="date" value="${A.hoje()}"></label>
        <label>Categoria<select name="cat">${cats.map(c => `<option>${c}</option>`).join('')}</select></label>
        <label>Forma<select name="forma"><option>Pix</option><option>Dinheiro</option><option>Cartão</option></select></label>
        <label class="span-2">Descrição<input name="desc" placeholder="${tipo === 'entrada' ? 'Ex.: Aula experimental Maria' : 'Ex.: Conta de luz de novembro'}"></label>
        <button class="btn ${tipo === 'entrada' ? 'btn-grad' : 'btn-escuro'} span-2" type="submit">Lançar ${tipo}</button>
      </form>`, { classe: 'modal-largo' });
    cx.querySelector('#fLanc').addEventListener('submit', e => {
      e.preventDefault(); const f = new FormData(e.target);
      const l = { id: A.novoId('cx'), tipo, valor: +f.get('valor'), data: f.get('data') || A.hoje(), cat: f.get('cat'), forma: f.get('forma'), desc: String(f.get('desc')).trim() || f.get('cat') };
      A.S.caixa.push(l); A.S.caixa.sort((a, b) => a.data < b.data ? 1 : a.data > b.data ? -1 : 0); A.salvar();
      A.fecharModal(); A.avisar((tipo === 'entrada' ? 'Entrada' : 'Saída') + ' de ' + A.reais(l.valor) + ' lançada'); A.desenhar();
    });
  }

  /* ---------- Quadras ---------- */
  function quadras(el) {
    if (!est.diaQuadra) est.diaQuadra = A.hoje();
    const dias = []; for (let i = -2; i < 12; i++) dias.push(D.somar(A.hoje(), i));
    const d = est.diaQuadra, sem = D.deISO(d).getDay();
    const slots = GR.slotsDoDia(sem); const qs = A.S.config.quadras;
    const res = A.S.reservas.filter(r => r.data === d);
    const turmaHoras = slots.reduce((s, h) => s + qs.filter(q => GR.turmaNoHorario(sem, h, q.id)).length, 0);
    const livres = slots.length * qs.length - res.length - turmaHoras;
    el.innerHTML = `
      <div class="dias-rolagem dias-painel">${dias.map(x => { const dd = D.deISO(x); const n = A.S.reservas.filter(r => r.data === x).length; return `<button class="dia-chip ${x === d ? 'ativo' : ''}" data-d="${x}"><small>${A.quando(x) === 'hoje' ? 'hoje' : A.SEM_C[dd.getDay()]}</small><strong>${dd.getDate()}</strong><i>${n ? n + ' res.' : '·'}</i></button>`; }).join('')}</div>
      <div class="kpis kpis-4">${kpi('Reservas', res.length, A.dataLonga(d))}${kpi('Horários livres', livres, 'nas ' + qs.length + ' quadras')}${kpi('Recebido', A.reais(res.filter(r => r.status === 'pago').reduce((s, r) => s + r.valor, 0)), 'reservas pagas', 'kpi-ok')}${kpi('Aguardando Pix', A.reais(res.filter(r => r.status === 'pendente').reduce((s, r) => s + r.valor, 0)), res.filter(r => r.status === 'pendente').length + ' reservas', 'kpi-alerta')}</div>
      <section class="bloco sem-pad">
        <div class="agenda-q" style="--q:${qs.length}">
          <div class="aq-cab"><span></span>${qs.map(q => `<strong>${A.esc(q.nome)}</strong>`).join('')}</div>
          ${slots.map(h => `<div class="aq-linha"><span class="aq-hora">${h}</span>${qs.map(q => {
            const t = GR.turmaNoHorario(sem, h, q.id); const r = res.find(x => x.hora === h && x.quadra === q.id);
            if (t) return `<div class="aq aq-turma"><strong>${A.esc(A.nomeTurma(t))}</strong><small>${A.esc(A.prof(t.prof).nome)}</small></div>`;
            if (r) return `<button class="aq aq-res aq-${r.status}" data-res="${r.id}"><strong>${A.esc(r.nome)}</strong><small>${A.ROTULO[r.status]} · ${A.reais(r.valor)}</small></button>`;
            return `<button class="aq aq-livre" data-h="${h}" data-q="${q.id}">${A.ic('mais')}<span>Livre</span></button>`;
          }).join('')}</div>`).join('')}
        </div>
      </section>
      <p class="dica">O aluno vê esta mesma agenda no app e reserva sozinho pagando no Pix. As turmas da GR já bloqueiam os horários.</p>`;
    el.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { est.diaQuadra = b.dataset.d; quadras(el); }));
    el.querySelectorAll('[data-h]').forEach(b => b.addEventListener('click', () => {
      const cx = A.abrirModal(`
        <h3 class="modal-titulo">Reservar ${A.esc(GR.nomeQuadra(b.dataset.q))} · ${b.dataset.h}</h3>
        <p class="sutil">${A.dataLonga(d)}</p>
        <form class="form form-2" id="fRes">
          <label class="span-2">Nome de quem alugou<input name="nome" required></label>
          <label>Telefone<input name="tel"></label>
          <label>Valor (R$)<input name="valor" type="number" value="${A.S.config.precoQuadraHora}"></label>
          <label class="span-2 check"><input type="checkbox" name="pago" checked> Já pagou (lança no caixa)</label>
          <button class="btn btn-grad span-2" type="submit">Reservar</button>
        </form>`);
      cx.querySelector('#fRes').addEventListener('submit', e => {
        e.preventDefault(); const f = new FormData(e.target);
        const r = { id: A.novoId('rs'), data: d, hora: b.dataset.h, quadra: b.dataset.q, nome: String(f.get('nome')).trim(), tel: f.get('tel'), valor: +f.get('valor'), status: f.get('pago') ? 'pago' : 'pendente' };
        A.S.reservas.push(r);
        if (r.status === 'pago') A.lancar({ tipo: 'entrada', cat: 'Aluguel de quadra', desc: r.nome + ' · ' + GR.nomeQuadra(r.quadra) + ' ' + r.hora, valor: r.valor, forma: 'Pix', ref: r.id });
        A.salvar(); A.fecharModal(); A.avisar('Quadra reservada para ' + r.nome.split(' ')[0]); quadras(el);
      });
    }));
    el.querySelectorAll('[data-res]').forEach(b => b.addEventListener('click', () => {
      const r = A.S.reservas.find(x => x.id === b.dataset.res);
      const cx = A.abrirModal(`
        <h3 class="modal-titulo">${A.esc(r.nome)}</h3>
        <div class="resumo"><div><span>Quadra</span><strong>${A.esc(GR.nomeQuadra(r.quadra))} · ${r.hora}</strong></div><div><span>Dia</span><strong>${A.dataLonga(r.data)}</strong></div><div><span>Telefone</span><strong>${A.esc(r.tel || '-')}</strong></div><div class="resumo-total"><span>${A.ROTULO[r.status]}</span><strong>${A.reais(r.valor)}</strong></div></div>
        <div class="acoes-lado">
          ${r.status === 'pendente' ? `<button class="btn btn-grad" data-pg>${A.ic('check')} Marcar como pago</button>` : ''}
          <button class="btn btn-whats-g" data-w>${A.ic('whats')} WhatsApp</button>
          <button class="btn btn-linha" data-cancel>${A.ic('x')} Cancelar reserva</button>
        </div>`);
      const pg = cx.querySelector('[data-pg]');
      if (pg) pg.addEventListener('click', () => { r.status = 'pago'; A.lancar({ tipo: 'entrada', cat: 'Aluguel de quadra', desc: r.nome + ' · ' + GR.nomeQuadra(r.quadra) + ' ' + r.hora, valor: r.valor, forma: 'Pix', ref: r.id }); A.fecharModal(); A.avisar('Reserva paga e lançada no caixa'); quadras(el); });
      cx.querySelector('[data-w]').addEventListener('click', () => A.whats(`Oi, ${r.nome.split(' ')[0]}! Aqui é da GR Sports. Sua quadra está reservada para ${A.dataLonga(r.data)} às ${r.hora} (${GR.nomeQuadra(r.quadra)}). Até lá! 🏐`));
      cx.querySelector('[data-cancel]').addEventListener('click', () => {
        A.S.reservas = A.S.reservas.filter(x => x.id !== r.id);
        if (r.status === 'pago') A.lancar({ tipo: 'saida', cat: 'Outros', desc: 'Estorno reserva ' + r.nome, valor: r.valor, forma: 'Pix' });
        A.salvar(); A.fecharModal(); A.avisar('Reserva cancelada' + (r.status === 'pago' ? ' e estorno lançado' : '')); quadras(el);
      });
    }));
  }

  /* ---------- Turmas ---------- */
  function turmas(el) {
    const m = mesAtual();
    el.innerHTML = `<div class="cards-turmas">${GR.TURMAS.slice().sort((a, b) => a.dias[0] - b.dias[0] || GR.emMin(a.hora) - GR.emMin(b.hora)).map(t => {
      const al = ativos().filter(a => a.turma === t.id); const atr = al.filter(a => A.situacao(a, m).status === 'atrasado').length;
      return `<button class="bloco turma-card" data-t="${t.id}">
        <div class="tc-hora"><strong>${t.hora}</strong><span>${A.diasTurma(t)}</span></div>
        <h3>${A.esc(A.nomeTurma(t))}</h3>
        <p class="sutil">${A.esc(A.prof(t.prof).nome)} · ${A.esc(GR.nomeQuadra(t.quadra))}</p>
        <div class="ev-vagas"><div class="barra"><i style="width:${Math.min(100, al.length / t.vagas * 100)}%"></i></div><span>${al.length} de ${t.vagas} vagas</span></div>
        ${atr ? `<span class="pill pill-atrasado">${atr} atrasado${atr > 1 ? 's' : ''}</span>` : `<span class="pill pill-pago">Todos em dia</span>`}
      </button>`; }).join('')}</div>`;
    el.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => chamada(A.turma(b.dataset.t))));
  }
  function chamada(t) {
    // dia da chamada: hoje se tem treino, senão o último treino que passou
    let d = A.hoje(); for (let i = 0; i < 7 && t.dias.indexOf(D.deISO(d).getDay()) < 0; i++) d = D.somar(d, -1);
    const k = d + '|' + t.id; const marcados = A.S.presencas[k] || [];
    const al = ativos().filter(a => a.turma === t.id);
    const avisou = A.S.faltas.filter(f => f.data === d && f.turma === t.id);
    const cx = A.abrirModal(`
      <h3 class="modal-titulo">Chamada · ${A.esc(A.nomeTurma(t))}</h3>
      <p class="sutil">${A.dataLonga(d).replace(/^./, c => c.toUpperCase())} às ${t.hora} · ${A.esc(A.prof(t.prof).nome)}</p>
      <ul class="chamada">${al.map(a => { const fal = avisou.find(f => f.aluno === a.id && f.tipo === 'falta'); const s = A.situacao(a); return `
        <li><label><input type="checkbox" value="${a.id}" ${marcados.indexOf(a.id) > -1 ? 'checked' : ''}><span class="ch-box">${A.ic('check')}</span>${A.avatar(a.nome)}<span class="ch-nome">${A.esc(a.nome)}${fal ? '<small>avisou que ia faltar</small>' : ''}</span></label>${s.status === 'atrasado' ? A.pill('atrasado') : ''}</li>`; }).join('')}
        ${avisou.filter(f => f.tipo === 'reposicao').map(f => `<li class="ch-repo"><label><input type="checkbox" value="${f.aluno}"><span class="ch-box">${A.ic('check')}</span>${A.avatar(A.aluno(f.aluno).nome)}<span class="ch-nome">${A.esc(A.aluno(f.aluno).nome)}<small>reposição</small></span></label></li>`).join('')}
      </ul>
      <button class="btn btn-grad btn-cheio" data-ok>${A.ic('check')} Salvar chamada</button>
      <p class="dica">O professor pode fazer a chamada pelo celular na beira da quadra. Quem está atrasado aparece marcado.</p>`, { classe: 'modal-largo', semFoco: true });
    cx.querySelector('[data-ok]').addEventListener('click', () => {
      A.S.presencas[k] = Array.from(cx.querySelectorAll('input:checked')).map(i => i.value); A.salvar();
      A.fecharModal(); A.avisar('Chamada salva: ' + A.S.presencas[k].length + ' presentes');
    });
  }

  /* ---------- Cantina (venda rápida) ---------- */
  function cantina(el) {
    const cats = [...new Set(A.S.produtos.map(p => p.cat))];
    const hj = A.S.caixa.filter(l => l.data === A.hoje() && (l.cat === 'Cantina' || l.cat === 'Loja'));
    function desenharComanda() {
      const itens = Object.keys(est.comanda).filter(id => est.comanda[id] > 0).map(id => ({ p: A.S.produtos.find(x => x.id === id), q: est.comanda[id] }));
      const total = itens.reduce((s, x) => s + x.p.preco * x.q, 0);
      el.querySelector('#comanda').innerHTML = `
        <div class="bloco-cab"><h2>Venda atual</h2>${itens.length ? '<button class="link" id="bLimpar">Limpar</button>' : ''}</div>
        ${itens.length ? `<ul class="com-itens">${itens.map(x => `<li><span>${A.esc(x.p.nome)}</span><div class="qtd"><button data-menos="${x.p.id}" aria-label="Menos">${A.ic('menos')}</button><b>${x.q}</b><button data-mais="${x.p.id}" aria-label="Mais">${A.ic('mais')}</button></div><strong>${A.reais(x.p.preco * x.q)}</strong></li>`).join('')}</ul>` : '<p class="vazio">Toque nos produtos para montar a venda.</p>'}
        <div class="com-total"><span>Total</span><strong>${A.reais(total)}</strong></div>
        <div class="formas formas-3">${['Pix', 'Dinheiro', 'Cartão'].map(f => `<button class="btn ${f === 'Pix' ? 'btn-grad' : 'btn-linha'}" data-vender="${f}" ${itens.length ? '' : 'disabled'}>${f}</button>`).join('')}</div>`;
      el.querySelectorAll('[data-menos]').forEach(b => b.addEventListener('click', () => { est.comanda[b.dataset.menos]--; desenharComanda(); }));
      el.querySelectorAll('[data-mais]').forEach(b => b.addEventListener('click', () => { est.comanda[b.dataset.mais]++; desenharComanda(); }));
      const bl = el.querySelector('#bLimpar'); if (bl) bl.addEventListener('click', () => { est.comanda = {}; desenharComanda(); });
      el.querySelectorAll('[data-vender]').forEach(b => b.addEventListener('click', () => {
        const loja = itens.filter(x => x.p.cat === 'Loja'), comida = itens.filter(x => x.p.cat !== 'Loja');
        const desc = l => l.map(x => x.q + 'x ' + x.p.nome).join(', ');
        if (comida.length) A.lancar({ tipo: 'entrada', cat: 'Cantina', desc: desc(comida), valor: comida.reduce((s, x) => s + x.p.preco * x.q, 0), forma: b.dataset.vender });
        if (loja.length) A.lancar({ tipo: 'entrada', cat: 'Loja', desc: desc(loja), valor: loja.reduce((s, x) => s + x.p.preco * x.q, 0), forma: b.dataset.vender });
        est.comanda = {}; A.avisar('Venda de ' + A.reais(total) + ' no ' + b.dataset.vender + ' lançada no caixa'); cantina(el);
      }));
    }
    el.innerHTML = `
      <div class="kpis kpis-3">${kpi('Vendido hoje', A.reais(soma(hj, 'entrada')), hj.length + ' lançamentos', 'kpi-entrada')}${kpi('Cantina no mês', A.reais(soma(doMes(mesAtual()).filter(l => l.cat === 'Cantina'), 'entrada')), 'GR Burger e bebidas')}${kpi('Loja no mês', A.reais(soma(doMes(mesAtual()).filter(l => l.cat === 'Loja'), 'entrada')), 'camisas e bolas')}</div>
      <div class="grade-pdv">
        <div>${cats.map(c => `<section class="bloco"><div class="bloco-cab"><h2>${A.esc(c)}</h2></div><div class="produtos">${A.S.produtos.filter(p => p.cat === c).map(p => `<button class="produto" data-p="${p.id}"><strong>${A.esc(p.nome)}</strong><span>${A.reais(p.preco)}</span>${est.comanda[p.id] ? `<b class="prod-q">${est.comanda[p.id]}</b>` : ''}</button>`).join('')}</div></section>`).join('')}</div>
        <aside class="bloco comanda" id="comanda"></aside>
      </div>`;
    el.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => {
      est.comanda[b.dataset.p] = (est.comanda[b.dataset.p] || 0) + 1;
      let q = b.querySelector('.prod-q'); if (!q) { q = document.createElement('b'); q.className = 'prod-q'; b.append(q); }
      q.textContent = est.comanda[b.dataset.p]; desenharComanda();
    }));
    desenharComanda();
  }

  /* ---------- Eventos ---------- */
  function eventos(el) {
    const evs = A.S.eventos.slice().sort((a, b) => (a.encerrado ? 1 : 0) - (b.encerrado ? 1 : 0) || (a.data < b.data ? -1 : 1));
    el.innerHTML = `
      <div class="barra-ferr"><p class="sutil">Torneios, aulões e eventos. A inscrição e o Pix acontecem no app do aluno.</p><button class="btn btn-grad" id="bEv">${A.ic('mais')} Novo evento</button></div>
      <div class="cards-turmas">${evs.map(ev => { const pagos = ev.inscritos.filter(i => i.pago).length; return `
        <button class="bloco turma-card ${ev.encerrado ? 'encerrado' : ''}" data-ev="${ev.id}">
          <div class="tc-hora"><strong>${A.ddmm(ev.data)}</strong><span>${A.esc(ev.tipo)}</span></div>
          <h3>${A.esc(ev.nome)}</h3>
          <p class="sutil">${ev.encerrado ? A.esc(ev.campeoes) : (ev.valor ? A.reais(ev.valor) + ' por inscrição' : 'Gratuito')}</p>
          ${ev.encerrado ? A.pill('isento', 'Encerrado') : `<div class="ev-vagas"><div class="barra"><i style="width:${Math.min(100, ev.inscritos.length / ev.vagas * 100)}%"></i></div><span>${ev.inscritos.length} de ${ev.vagas} inscritos</span></div>
          ${ev.valor ? `<span class="sutil">Arrecadado: <strong>${A.reais(pagos * ev.valor)}</strong></span>` : ''}`}
        </button>`; }).join('')}</div>`;
    el.querySelectorAll('[data-ev]').forEach(b => b.addEventListener('click', () => {
      const ev = A.S.eventos.find(x => x.id === b.dataset.ev);
      const cx = A.abrirModal(`
        <h3 class="modal-titulo">${A.esc(ev.nome)}</h3>
        <p class="sutil">${A.dataLonga(ev.data)} · ${ev.hora}${ev.valor ? ' · ' + A.reais(ev.valor) + ' por inscrição' : ''}</p>
        ${ev.inscritos.length ? `<table class="tabela tabela-mini"><thead><tr><th>${ev.tipo === 'Torneio' ? 'Dupla' : 'Nome'}</th><th>Categoria</th><th>Pagamento</th></tr></thead><tbody>
          ${ev.inscritos.map(i => `<tr><td>${A.esc(i.dupla)}</td><td>${A.esc(i.cat)}</td><td>${i.pago ? A.pill('pago') : `<button class="btn btn-mini" data-pagar="${i.id}">Marcar pago</button>`}</td></tr>`).join('')}</tbody></table>` : '<p class="vazio">Sem inscritos.</p>'}
        <button class="btn btn-whats-g" data-div>${A.ic('whats')} Divulgar no WhatsApp</button>`, { classe: 'modal-largo', semFoco: true });
      cx.querySelectorAll('[data-pagar]').forEach(bt => bt.addEventListener('click', () => {
        const i = ev.inscritos.find(x => x.id === bt.dataset.pagar); i.pago = true;
        A.lancar({ tipo: 'entrada', cat: 'Torneios', desc: 'Inscrição ' + i.dupla, valor: ev.valor, forma: 'Pix', ref: i.id });
        bt.outerHTML = A.pill('pago'); A.avisar('Inscrição paga e lançada no caixa');
      }));
      cx.querySelector('[data-div]').addEventListener('click', () => A.whats(`🏆 ${ev.nome}\n📅 ${A.dataLonga(ev.data)} às ${ev.hora}\n${ev.desc}\n\nInscrição pelo app da GR Sports!`));
    }));
    el.querySelector('#bEv').addEventListener('click', () => {
      const cx = A.abrirModal(`
        <h3 class="modal-titulo">Novo evento</h3>
        <form class="form form-2" id="fEv">
          <label class="span-2">Nome<input name="nome" required placeholder="Ex.: Torneio Kids de Férias"></label>
          <label>Tipo<select name="tipo"><option>Torneio</option><option>Aulão</option><option>Evento</option></select></label>
          <label>Data<input name="data" type="date" required value="${D.somar(A.hoje(), 20)}"></label>
          <label>Horário<input name="hora" type="time" value="08:00"></label>
          <label>Inscrição (R$)<input name="valor" type="number" value="0" min="0"></label>
          <label>Vagas<input name="vagas" type="number" value="16" min="1"></label>
          <label>Categorias<input name="cats" value="Masculino, Misto, Feminino"></label>
          <label class="span-2">Descrição<textarea name="desc" rows="3"></textarea></label>
          <button class="btn btn-grad span-2" type="submit">Publicar no app</button>
        </form>`, { classe: 'modal-largo' });
      cx.querySelector('#fEv').addEventListener('submit', e => {
        e.preventDefault(); const f = new FormData(e.target);
        A.S.eventos.push({ id: A.novoId('ev'), nome: f.get('nome'), tipo: f.get('tipo'), data: f.get('data'), hora: f.get('hora'), valor: +f.get('valor'), vagas: +f.get('vagas'), desc: f.get('desc'), categorias: String(f.get('cats')).split(',').map(s => s.trim()).filter(Boolean), inscritos: [] });
        A.salvar(); A.fecharModal(); A.avisar('Evento publicado. Os alunos já veem no app.'); eventos(el);
      });
    });
  }
})();
