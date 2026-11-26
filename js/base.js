/* =========================================================
   GR SISTEMA · base compartilhada
   Estado (localStorage no protótipo; no sistema real vira o banco),
   regras de mensalidade, rotas, modais, avisos e Pix.
   ========================================================= */
(function () {
  'use strict';
  const D = GR.data;
  const CHAVE = 'gr-sistema-demo';

  /* ---------- Estado ---------- */
  let S;
  function carregar() {
    try { S = JSON.parse(localStorage.getItem(CHAVE)); } catch (e) { S = null; }
    // Dados guardados de outro dia ficam "velhos": a demo sempre recomeça em volta de hoje
    if (!S || S.versao !== 4 || S.geradoEm !== D.iso(new Date())) S = GR.gerar();
    salvar();
  }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch (e) { /* modo privado */ } }
  function restaurar() { S = GR.gerar(); salvar(); }
  function novoId(p) { S.seq = (S.seq || 0) + 1; return p + 'n' + S.seq; }

  /* ---------- Datas e números ---------- */
  const hoje = () => D.iso(new Date());
  const MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const MES_C = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const SEM = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const SEM_C = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const ddmm = s => s.slice(8, 10) + '/' + s.slice(5, 7);
  const nomeMes = m => MES[+m.slice(5, 7) - 1];
  const nomeMesAno = m => nomeMes(m) + ' de ' + m.slice(0, 4);
  function dataLonga(s) { const d = D.deISO(s); return SEM[d.getDay()] + ', ' + d.getDate() + ' de ' + MES[d.getMonth()]; }
  function quando(s) {
    const h = hoje(); if (s === h) return 'hoje';
    if (s === D.somar(h, 1)) return 'amanhã';
    if (s === D.somar(h, -1)) return 'ontem';
    return ddmm(s);
  }
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const reais = v => fmt.format(v);
  const reaisCurto = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');

  /* ---------- Consultas ---------- */
  const aluno = id => S.alunos.find(a => a.id === id);
  const turma = id => GR.TURMAS.find(t => t.id === id);
  const plano = id => GR.PLANOS.find(p => p.id === id);
  const prof = id => GR.PROFESSORES.find(p => p.id === id);
  const nomeTurma = t => GR.MODALIDADES[t.mod] + ' ' + GR.NIVEIS[t.nivel].toLowerCase();
  const diasTurma = t => t.dias.map(d => SEM_C[d]).join(' e ');
  const descPlano = p => GR.MODALIDADES[p.mod] + ' · ' + p.vezes + 'x por semana';
  function proximoTreino(t) {
    const agora = new Date(); const min = agora.getHours() * 60 + agora.getMinutes();
    for (let i = 0; i < 8; i++) {
      const dia = D.somar(hoje(), i); const sem = D.deISO(dia).getDay();
      if (t.dias.indexOf(sem) > -1 && (i > 0 || GR.emMin(t.hora) + 60 > min)) return dia;
    }
    return null;
  }

  // Situação da mensalidade de um aluno num mês: pago | analise | aberto | atrasado | isento
  function situacao(a, ref) {
    ref = ref || D.mesDe(hoje());
    if (a.desde.slice(0, 7) > ref) return { status: 'isento' };
    const pg = S.pagamentos.find(p => p.aluno === a.id && p.ref === ref);
    const venc = ref + '-' + D.pad(a.venc);
    const valor = plano(a.plano).preco;
    if (pg && pg.status === 'pago') return { status: 'pago', venc, valor, pg };
    if (pg && pg.status === 'analise') return { status: 'analise', venc, valor, pg };
    return { status: venc < hoje() ? 'atrasado' : 'aberto', venc, valor };
  }
  // Tudo o que o aluno deve (meses anteriores incluídos)
  function debitos(a) {
    const out = []; const atual = D.mesDe(hoje());
    for (let k = 5; k >= 0; k--) {
      const ref = D.mesMenos(atual, k); const s = situacao(a, ref);
      if (s.status === 'atrasado' || s.status === 'aberto') out.push(Object.assign({ ref }, s));
    }
    return out;
  }
  function diasAtraso(venc) { return Math.round((D.deISO(hoje()) - D.deISO(venc)) / 864e5); }
  const ROTULO = { pago: 'Pago', analise: 'Comprovante enviado', aberto: 'A vencer', atrasado: 'Atrasado', isento: 'Novo', pendente: 'Aguardando Pix' };

  /* ---------- Ações que mexem no dinheiro ---------- */
  function registrarPagamento(alunoId, ref, forma) {
    const a = aluno(alunoId); const valor = plano(a.plano).preco;
    let pg = S.pagamentos.find(p => p.aluno === alunoId && p.ref === ref);
    if (pg) { pg.status = 'pago'; pg.forma = forma || pg.forma; pg.data = hoje(); }
    else { pg = { id: novoId('pg'), aluno: alunoId, ref, valor, data: hoje(), forma: forma || 'Pix', status: 'pago' }; S.pagamentos.push(pg); }
    lancar({ tipo: 'entrada', cat: 'Mensalidades', desc: 'Mensalidade ' + a.nome + (ref !== D.mesDe(hoje()) ? ' (' + MES_C[+ref.slice(5, 7) - 1] + ')' : ''), valor, forma: pg.forma, ref: pg.id });
    salvar(); return pg;
  }
  function enviarComprovante(alunoId, ref) {
    const a = aluno(alunoId);
    let pg = S.pagamentos.find(p => p.aluno === alunoId && p.ref === ref);
    if (!pg) { pg = { id: novoId('pg'), aluno: alunoId, ref, valor: plano(a.plano).preco, data: hoje(), forma: 'Pix', status: 'analise' }; S.pagamentos.push(pg); }
    salvar(); return pg;
  }
  function lancar(l) {
    S.caixa.unshift(Object.assign({ id: novoId('cx'), data: hoje() }, l));
    salvar();
  }

  /* ---------- Pix copia e cola (BR Code com CRC16) ---------- */
  const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
  function emv(id, v) { return id + ('0' + v.length).slice(-2) + v; }
  function crc16(s) {
    let crc = 0xFFFF;
    for (let i = 0; i < s.length; i++) {
      crc ^= s.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
    return ('000' + crc.toString(16).toUpperCase()).slice(-4);
  }
  function limpo(s, max) { return semAcento(s).toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim().slice(0, max); }
  function pix(valor, txid) {
    const c = S.config.pix;
    const p = emv('00', '01') + emv('26', emv('00', 'br.gov.bcb.pix') + emv('01', c.chave)) +
      emv('52', '0000') + emv('53', '986') + (valor ? emv('54', valor.toFixed(2)) : '') + emv('58', 'BR') +
      emv('59', limpo(c.nome, 25)) + emv('60', limpo(c.cidade, 15)) + emv('62', emv('05', limpo(txid || 'GRSPORTS', 25).replace(/ /g, ''))) + '6304';
    return p + crc16(p);
  }

  /* ---------- DOM ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const ic = (nome, cls) => '<svg class="ic ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + nome + '"/></svg>';
  const pill = (status, txt) => '<span class="pill pill-' + status + '">' + esc(txt || ROTULO[status] || status) + '</span>';
  const iniciais = nome => nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  function avatar(nome, cls) {
    let h = 0; for (const c of nome) h = (h * 31 + c.charCodeAt(0)) % 360;
    return '<span class="avatar ' + (cls || '') + '" style="--h:' + h + '">' + esc(iniciais(nome)) + '</span>';
  }

  /* ---------- Aviso rápido (toast) ---------- */
  let tT;
  function avisar(txt, tipo) {
    let t = $('#toast');
    t.innerHTML = ic(tipo === 'erro' ? 'alerta' : 'check') + '<span>' + esc(txt) + '</span>';
    t.className = 'toast ver ' + (tipo || '');
    clearTimeout(tT); tT = setTimeout(() => t.classList.remove('ver'), 3400);
  }
  function copiar(txt, msg) {
    const ok = () => avisar(msg || 'Copiado');
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, ok); else ok();
  }

  /* ---------- Modal / folha ---------- */
  let aoFechar = null;
  function abrirModal(html, opts) {
    opts = opts || {};
    const m = $('#modal');
    m.innerHTML = '<div class="modal-fundo" data-fechar></div><div class="modal-caixa ' + (opts.classe || '') + '" role="dialog" aria-modal="true">' +
      '<button class="modal-x" data-fechar aria-label="Fechar">' + ic('x') + '</button>' + html + '</div>';
    m.hidden = false; document.body.classList.add('travado');
    requestAnimationFrame(() => m.classList.add('ver'));
    aoFechar = opts.aoFechar || null;
    const foco = m.querySelector('input,select,textarea,button:not(.modal-x)');
    if (foco && !opts.semFoco) setTimeout(() => foco.focus(), 60);
    return m.querySelector('.modal-caixa');
  }
  function fecharModal() {
    const m = $('#modal'); if (m.hidden) return;
    m.classList.remove('ver'); document.body.classList.remove('travado');
    setTimeout(() => { m.hidden = true; m.innerHTML = ''; }, 220);
    if (aoFechar) { const f = aoFechar; aoFechar = null; f(); }
  }
  document.addEventListener('click', e => { if (e.target.closest('[data-fechar]')) fecharModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModal(); });

  /* ---------- WhatsApp ---------- */
  // No protótipo o link abre o WhatsApp SEM número (para não mandar mensagem a um telefone inventado)
  function whats(msg) { window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener'); }

  /* ---------- Rotas ---------- */
  const rotas = {};
  function rota(nome, fn) { rotas[nome] = fn; }
  function ir(h) { if (location.hash === h) desenhar(); else location.hash = h; }
  function desenhar() {
    const h = location.hash.replace(/^#\/?/, '') || 'entrar';
    const partes = h.split('/');
    const area = partes[0];
    const fn = rotas[area] || rotas.entrar;
    fn(partes.slice(1));
  }
  window.addEventListener('hashchange', () => { fecharModal(); desenhar(); });

  window.App = {
    get S() { return S; }, carregar, salvar, restaurar, novoId,
    hoje, ddmm, quando, dataLonga, nomeMes, nomeMesAno, MES, MES_C, SEM, SEM_C, reais, reaisCurto,
    aluno, turma, plano, prof, nomeTurma, diasTurma, descPlano, proximoTreino,
    situacao, debitos, diasAtraso, ROTULO, registrarPagamento, enviarComprovante, lancar, pix,
    $, $$, esc, ic, pill, avatar, avisar, copiar, abrirModal, fecharModal, whats,
    rota, ir, desenhar,
  };
})();
