/* =========================================================
   GR SISTEMA · protótipo
   Dados de EXEMPLO gerados na hora, sempre em volta da data de hoje,
   para a demonstração parecer viva em qualquer dia.
   A grade de turmas e os preços dos planos são os reais da landing da GR.
   Nomes, telefones, valores de despesas e reservas são inventados.
   ========================================================= */
(function () {
  'use strict';

  // Gerador de números "aleatórios" sempre igual (a demo não muda a cada recarga)
  function semente(n) {
    return function () {
      n |= 0; n = (n + 0x6D2B79F5) | 0;
      let t = Math.imul(n ^ (n >>> 15), 1 | n);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const deISO = s => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); };
  const somar = (s, n) => { const d = deISO(s); d.setDate(d.getDate() + n); return iso(d); };
  const mesDe = s => s.slice(0, 7);
  const mesMenos = (m, n) => { const d = deISO(m + '-01'); d.setMonth(d.getMonth() - n); return iso(d).slice(0, 7); };

  const CONFIG = {
    nome: 'GR Sports',
    cidade: 'Ceilândia - DF',
    pix: { chave: 'pix-demonstracao@grsports.com.br', nome: 'GR SPORTS', cidade: 'BRASILIA' },
    precoQuadraHora: 80,          // EXEMPLO: confirmar com o dono
    quadras: [
      { id: 'q1', nome: 'Quadra 1', apelido: 'Areia 1' },
      { id: 'q2', nome: 'Quadra 2', apelido: 'Areia 2' },
    ],
    manhaInicio: 6, manhaFim: 16,  // horários avulsos de manhã/tarde, de hora em hora
    noiteFim: 22,                  // último horário que começa à noite
  };

  const PROFESSORES = [
    { id: 'p1', nome: 'Professor 1', mod: 'futevolei' }, // nomes pendentes na landing
    { id: 'p2', nome: 'Professora 2', mod: 'volei' },
    { id: 'p3', nome: 'Professor 3', mod: 'futevolei' },
  ];

  // Grade real (stories da GR). Dias: 0 = domingo ... 6 = sábado.
  const TURMAS = [
    { id: 't1',  dias: [1, 3], hora: '18:30', nivel: 'personal',      mod: 'futevolei', prof: 'p1', quadra: 'q1', vagas: 2 },
    { id: 't2',  dias: [1, 3], hora: '19:30', nivel: 'iniciante',     mod: 'futevolei', prof: 'p1', quadra: 'q1', vagas: 12 },
    { id: 't3',  dias: [1, 3], hora: '20:30', nivel: 'iniciante',     mod: 'futevolei', prof: 'p1', quadra: 'q1', vagas: 12 },
    { id: 't4',  dias: [1, 3], hora: '21:30', nivel: 'personal',      mod: 'futevolei', prof: 'p1', quadra: 'q1', vagas: 2 },
    { id: 't5',  dias: [2, 4], hora: '19:00', nivel: 'kids',          mod: 'volei',     prof: 'p2', quadra: 'q2', vagas: 12 },
    { id: 't6',  dias: [2, 4], hora: '20:00', nivel: 'iniciante',     mod: 'volei',     prof: 'p2', quadra: 'q2', vagas: 12 },
    { id: 't7',  dias: [2, 4], hora: '21:00', nivel: 'intermediario', mod: 'volei',     prof: 'p2', quadra: 'q2', vagas: 12 },
    { id: 't8',  dias: [2, 4], hora: '20:00', nivel: 'iniciante',     mod: 'futevolei', prof: 'p3', quadra: 'q1', vagas: 12 },
    { id: 't9',  dias: [2, 4], hora: '21:00', nivel: 'iniciante',     mod: 'futevolei', prof: 'p3', quadra: 'q1', vagas: 12 },
    { id: 't10', dias: [2, 4], hora: '22:00', nivel: 'iniciante',     mod: 'futevolei', prof: 'p3', quadra: 'q1', vagas: 12 },
  ];

  const MODALIDADES = { futevolei: 'Futevôlei', volei: 'Vôlei de praia' };
  const NIVEIS = { kids: 'Kids', iniciante: 'Iniciante', intermediario: 'Intermediário', personal: 'Personal' };

  // Preços reais da landing
  const PLANOS = [
    { id: 'fv1', mod: 'futevolei', vezes: 1, preco: 80 },
    { id: 'fv2', mod: 'futevolei', vezes: 2, preco: 160 },
    { id: 'vp1', mod: 'volei',     vezes: 1, preco: 60 },
    { id: 'vp2', mod: 'volei',     vezes: 2, preco: 110 },
  ];

  const PRODUTOS = [ // EXEMPLO: cardápio do GR Burger a confirmar
    { id: 'c1',  cat: 'Lanches', nome: 'GR Burger',          preco: 28, desc: 'Pão brioche, blend 150 g, cheddar e molho da casa' },
    { id: 'c2',  cat: 'Lanches', nome: 'GR Bacon',           preco: 32, desc: 'O clássico com bacon crocante e cebola caramelizada' },
    { id: 'c3',  cat: 'Lanches', nome: 'Smash duplo',        preco: 34, desc: 'Dois smash de 90 g, queijo prato e picles' },
    { id: 'c4',  cat: 'Lanches', nome: 'Batata frita',       preco: 18, desc: 'Porção para dividir depois do treino' },
    { id: 'c5',  cat: 'Açaí',    nome: 'Açaí 300 ml',        preco: 16, desc: 'Com granola e banana' },
    { id: 'c6',  cat: 'Açaí',    nome: 'Açaí 500 ml',        preco: 22, desc: 'Com dois acompanhamentos' },
    { id: 'c7',  cat: 'Bebidas', nome: 'Água 500 ml',        preco: 4,  desc: 'Sem gás' },
    { id: 'c8',  cat: 'Bebidas', nome: 'Isotônico',          preco: 8,  desc: 'Sabores do dia' },
    { id: 'c9',  cat: 'Bebidas', nome: 'Refrigerante lata',  preco: 6,  desc: '350 ml' },
    { id: 'c10', cat: 'Bebidas', nome: 'Água de coco',       preco: 9,  desc: 'Gelada' },
    { id: 'c11', cat: 'Loja',    nome: 'Camisa oficial GR',  preco: 80, desc: 'Uniforme da GR Sports' },
    { id: 'c12', cat: 'Loja',    nome: 'Bola de futevôlei',  preco: 140, desc: 'Oficial, costurada' },
  ];

  const NOMES = ['Lucas', 'Mariana', 'Gabriel', 'Ana Clara', 'Rafael', 'Júlia', 'Pedro', 'Beatriz', 'Matheus', 'Larissa',
    'Thiago', 'Camila', 'Bruno', 'Fernanda', 'Diego', 'Letícia', 'Felipe', 'Isabela', 'Vinícius', 'Amanda',
    'João Pedro', 'Bianca', 'Gustavo', 'Carolina', 'Leonardo', 'Yasmin', 'Rodrigo', 'Natália', 'André', 'Vitória',
    'Caio', 'Débora', 'Igor', 'Priscila', 'Henrique', 'Raquel', 'Samuel', 'Tainá', 'Wesley', 'Paula',
    'Davi', 'Kelly', 'Murilo', 'Jéssica', 'Otávio', 'Lorena', 'Renan', 'Sabrina', 'Enzo', 'Helena',
    'Arthur', 'Lívia', 'Miguel', 'Sofia', 'Heitor', 'Alice', 'Bernardo', 'Laura', 'Nicolas', 'Manuela',
    'Breno', 'Clara', 'Fábio', 'Daniela'];
  const SOBRENOMES = ['Andrade', 'Silva', 'Souza', 'Oliveira', 'Lima', 'Pereira', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
    'Almeida', 'Rocha', 'Gomes', 'Barbosa', 'Araújo', 'Moura', 'Teixeira', 'Freitas', 'Nunes', 'Cardoso'];

  function gerar() {
    const r = semente(2026);
    const pega = a => a[Math.floor(r() * a.length)];
    const hoje = iso(new Date());
    const mesAtual = mesDe(hoje);
    let seq = 0; const id = p => p + (++seq);

    // ---------- Alunos ----------
    // Distribuição por turma (personal tem 1 ou 2 alunos)
    const porTurma = { t1: 2, t2: 11, t3: 9, t4: 1, t5: 8, t6: 9, t7: 7, t8: 6, t9: 6, t10: 5 };
    const alunos = [];
    let n = 0;
    Object.keys(porTurma).forEach(tid => {
      const t = TURMAS.find(x => x.id === tid);
      for (let i = 0; i < porTurma[tid]; i++) {
        const nome = NOMES[n % NOMES.length] + ' ' + SOBRENOMES[(n * 7 + 3) % SOBRENOMES.length];
        const plano = t.nivel === 'personal' ? 'fv2' : (t.mod === 'volei' ? (r() < .55 ? 'vp2' : 'vp1') : (r() < .6 ? 'fv2' : 'fv1'));
        const mesesAtras = 1 + Math.floor(r() * 14);
        alunos.push({
          id: 'a' + (n + 1), nome, turma: tid, plano,
          venc: pega([5, 5, 10, 10, 10, 15, 15, 20, 20, 28]),
          tel: '(61) 9' + (8000 + Math.floor(r() * 1999)) + '-' + String(1000 + Math.floor(r() * 8999)),
          desde: mesMenos(mesAtual, mesesAtras) + '-' + pad(1 + Math.floor(r() * 27)),
          nasc: (1985 + Math.floor(r() * 22)) + '-' + pad(1 + Math.floor(r() * 12)) + '-' + pad(1 + Math.floor(r() * 27)),
          ativo: true,
        });
        n++;
      }
    });
    // Aluno da demonstração: turma de futevôlei iniciante, vence dia 28, ainda não pagou
    Object.assign(alunos.find(a => a.turma === 't2'), {
      id: 'a1', nome: 'Lucas Andrade', plano: 'fv2', venc: 28, tel: '(61) 98123-4567',
      desde: mesMenos(mesAtual, 7) + '-12', email: 'lucas.andrade@exemplo.com',
    });
    alunos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
    // ids únicos depois da troca
    const vistos = {}; alunos.forEach((a, i) => { if (vistos[a.id] && a.id !== 'a1') a.id = 'a' + (100 + i); vistos[a.id] = 1; });

    const plano = pid => PLANOS.find(p => p.id === pid);
    const caixa = [], pagamentos = [];
    const formaAleatoria = () => { const x = r(); return x < .78 ? 'Pix' : x < .9 ? 'Dinheiro' : 'Cartão'; };

    // ---------- Mensalidades dos últimos 6 meses ----------
    // Uns poucos alunos ficam devendo para a demonstração ter cobrança
    const devedoresAntigos = new Set(alunos.filter((a, i) => a.id !== 'a1' && i % 23 === 7).map(a => a.id));
    for (let k = 5; k >= 0; k--) {
      const ref = mesMenos(mesAtual, k);
      alunos.forEach((a, i) => {
        if (a.desde.slice(0, 7) > ref) return;
        const vencISO = ref + '-' + pad(a.venc);
        const valor = plano(a.plano).preco;
        let paga = true;
        if (k === 0) {
          if (a.id === 'a1') paga = false;
          else if (vencISO > hoje) paga = r() < .35;           // a vencer: alguns pagam adiantado
          else paga = r() < .86;                               // vencida: a maioria pagou
        } else if (k === 1 && devedoresAntigos.has(a.id)) paga = false;
        if (!paga) return;
        let dia = somar(vencISO, Math.floor(r() * 7) - 3);
        if (dia > hoje) dia = hoje;
        const forma = formaAleatoria();
        const pid = id('pg');
        pagamentos.push({ id: pid, aluno: a.id, ref, valor, data: dia, forma, status: 'pago' });
        caixa.push({ id: id('cx'), data: dia, tipo: 'entrada', cat: 'Mensalidades', desc: 'Mensalidade ' + a.nome, valor, forma, ref: pid });
      });
    }
    // Dois comprovantes esperando o dono conferir
    alunos.filter(a => a.id !== 'a1' && !pagamentos.some(p => p.aluno === a.id && p.ref === mesAtual) && (mesAtual + '-' + pad(a.venc)) <= hoje)
      .slice(0, 2).forEach(a => {
        pagamentos.push({ id: id('pg'), aluno: a.id, ref: mesAtual, valor: plano(a.plano).preco, data: somar(hoje, -1), forma: 'Pix', status: 'analise' });
      });

    // ---------- Reservas de quadra ----------
    const reservas = [];
    const clientes = ['Marcos Vieira', 'Equipe Pé na Areia', 'Tiago Farias', 'Racha dos Amigos', 'Patrícia Melo', 'Diego Prates',
      'Turma do Sábado', 'Rafa Beach', 'Kauã Siqueira', 'Futevôlei Ceilândia', 'Luana Brito', 'Grupo do Trabalho'];
    const inicioRes = mesMenos(mesAtual, 5) + '-01';
    for (let dia = inicioRes; dia <= somar(hoje, 14); dia = somar(dia, 1)) {
      const sem = deISO(dia).getDay();
      const horas = slotsDoDia(sem).filter(h => !turmaNoHorario(sem, h, 'q1') || !turmaNoHorario(sem, h, 'q2'));
      const qtd = sem === 0 || sem === 6 ? 3 + Math.floor(r() * 4) : Math.floor(r() * 2.6);
      for (let j = 0; j < qtd; j++) {
        const hora = pega(horas);
        const q = pega(CONFIG.quadras).id;
        if (turmaNoHorario(sem, hora, q) || reservas.some(x => x.data === dia && x.hora === hora && x.quadra === q)) continue;
        const futura = dia >= hoje;
        const status = futura ? (r() < .65 ? 'pago' : 'pendente') : 'pago';
        const res = { id: id('rs'), data: dia, hora, quadra: q, nome: pega(clientes), tel: '(61) 9' + (8100 + Math.floor(r() * 1800)) + '-' + (1000 + Math.floor(r() * 8999)), valor: CONFIG.precoQuadraHora, status };
        reservas.push(res);
        if (status === 'pago') {
          const pagoEm = futura ? somar(hoje, -Math.floor(r() * 3)) : dia;
          caixa.push({ id: id('cx'), data: pagoEm, tipo: 'entrada', cat: 'Aluguel de quadra', desc: res.nome + ' · ' + nomeQuadra(q) + ' ' + hora, valor: res.valor, forma: formaAleatoria(), ref: res.id });
        }
      }
    }
    // Uma reserva do aluno da demo no fim de semana que vem
    const sab = (() => { let d = hoje; while (deISO(d).getDay() !== 6) d = somar(d, 1); return d; })();
    if (!reservas.some(x => x.data === sab && x.hora === '09:00' && x.quadra === 'q1')) {
      const res = { id: id('rs'), data: sab, hora: '09:00', quadra: 'q1', nome: 'Lucas Andrade', tel: '(61) 98123-4567', valor: CONFIG.precoQuadraHora, status: 'pago', aluno: 'a1' };
      reservas.push(res);
      caixa.push({ id: id('cx'), data: somar(hoje, -1), tipo: 'entrada', cat: 'Aluguel de quadra', desc: 'Lucas Andrade · Quadra 1 09:00', valor: res.valor, forma: 'Pix', ref: res.id });
    }

    // ---------- Cantina, loja e despesas ----------
    const inicio = mesMenos(mesAtual, 5) + '-01';
    for (let dia = inicio; dia <= hoje; dia = somar(dia, 1)) {
      const sem = deISO(dia).getDay();
      const movimento = sem === 0 ? .6 : sem === 6 ? 1.5 : 1;
      const v = Math.round((55 + r() * 170) * movimento);
      caixa.push({ id: id('cx'), data: dia, tipo: 'entrada', cat: 'Cantina', desc: 'Vendas do dia (GR Burger e bebidas)', valor: v, forma: 'Vários' });
      if (r() < .09) caixa.push({ id: id('cx'), data: dia, tipo: 'entrada', cat: 'Loja', desc: 'Camisa oficial GR', valor: 80, forma: formaAleatoria() });
      if (r() < .12) caixa.push({ id: id('cx'), data: dia, tipo: 'entrada', cat: 'Aula avulsa', desc: 'Aula experimental / diária', valor: 30, forma: 'Pix' });
      const dm = deISO(dia).getDate();
      const fixo = (d, cat, desc, valor) => { if (dm === d) caixa.push({ id: id('cx'), data: dia, tipo: 'saida', cat, desc, valor, forma: 'Pix' }); };
      fixo(5, 'Aluguel do espaço', 'Aluguel do terreno', 3500);
      fixo(5, 'Professores', 'Repasse Professor 1', 1300);
      fixo(5, 'Professores', 'Repasse Professora 2', 1100);
      fixo(5, 'Professores', 'Repasse Professor 3', 1100);
      fixo(12, 'Energia e água', 'Conta de luz (refletores)', 640 + Math.round(r() * 120));
      fixo(14, 'Energia e água', 'Conta de água', 150 + Math.round(r() * 40));
      fixo(10, 'Internet e sistemas', 'Internet + sistema', 180);
      if (sem === 1) caixa.push({ id: id('cx'), data: dia, tipo: 'saida', cat: 'Compras da cantina', desc: 'Reposição: pão, carne, bebidas', valor: 280 + Math.round(r() * 220), forma: 'Cartão' });
      if (dm === 20 && r() < .7) caixa.push({ id: id('cx'), data: dia, tipo: 'saida', cat: 'Manutenção', desc: pega(['Areia nova', 'Troca de rede', 'Bolas novas', 'Lâmpada do refletor']), valor: 150 + Math.round(r() * 350), forma: 'Pix' });
    }

    // ---------- Eventos ----------
    const proxSabado = n => { let d = somar(hoje, n); while (deISO(d).getDay() !== 6) d = somar(d, 1); return d; };
    const duplas = ['Léo & Rafa', 'Thiago & Bruno', 'Ana & Júlia', 'Pedro & Caio', 'Mari & Bia', 'Diego & Igor', 'Gustavo & Leo',
      'Larissa & Natália', 'Vini & Felipe', 'Camila & Fernanda', 'Matheus & Davi', 'Yasmin & Paula', 'Wesley & Samuel', 'Henrique & Otávio'];
    const torneio = {
      id: 'ev1', nome: 'Torneio GR de Verão', data: proxSabado(14), hora: '08:00', valor: 60, vagas: 24, tipo: 'Torneio',
      desc: 'Chaves de futevôlei masculino, misto e feminino para iniciantes. Troféu, medalha e brinde para as duplas do pódio. Inscrição por dupla.',
      categorias: ['Masculino iniciante', 'Misto iniciante', 'Feminino iniciante'],
      inscritos: duplas.map((d, i) => ({ id: 'in' + i, dupla: d, cat: i % 3 === 0 ? 'Misto iniciante' : (/Ana|Mari|Larissa|Camila|Yasmin/.test(d) ? 'Feminino iniciante' : 'Masculino iniciante'), pago: i % 5 !== 3 })),
    };
    torneio.inscritos.filter(x => x.pago).forEach((x, i) => caixa.push({ id: id('cx'), data: somar(hoje, -(i % 9)), tipo: 'entrada', cat: 'Torneios', desc: 'Inscrição ' + x.dupla, valor: 60, forma: 'Pix', ref: x.id }));
    const eventos = [
      torneio,
      { id: 'ev2', nome: 'Aulão aberto + resenha', data: proxSabado(5), hora: '16:00', valor: 0, vagas: 40, tipo: 'Aulão',
        desc: 'Aula aberta para alunos e amigos. Traga quem quer conhecer a areia. Depois tem GR Burger e música.', categorias: ['Participante'],
        inscritos: ['Lucas Andrade', 'Mariana Silva', 'Pedro Lima', 'Bia Costa', 'Rafael Souza', 'Júlia Rocha', 'Caio Nunes', 'Tainá Moura'].map((d, i) => ({ id: 'au' + i, dupla: d, cat: 'Participante', pago: true })) },
      { id: 'ev3', nome: 'Torneio interno de novembro', data: somar(hoje, -3 - (deISO(hoje).getDay() + 1) % 7), hora: '08:00', valor: 0, vagas: 16, tipo: 'Torneio', encerrado: true,
        desc: 'Chaves masculina e mista de iniciantes. Inscrição gratuita, troféu e brinde.', categorias: ['Masculino iniciante', 'Misto iniciante'],
        campeoes: 'Masculino: Thiago & Bruno · Misto: Pedro & Ana', inscritos: [] },
    ];

    const avisos = [
      { data: hoje, titulo: 'Previsão de chuva quinta', texto: 'Se chover forte, o treino das 20h vira reposição no sábado às 9h. Fique de olho aqui.' },
      { data: somar(hoje, -2), titulo: 'Camisa oficial de volta', texto: 'Chegou nova leva da camisa da GR. Tamanhos P ao GG na cantina.' },
      { data: somar(hoje, -6), titulo: 'Torneio de Verão aberto', texto: 'Inscrições abertas no app. Vagas limitadas a 24 duplas.' },
    ];

    // Presenças do aluno da demo neste mês (treinos já passados)
    const faltas = [];
    const presencas = {};
    const t2 = TURMAS.find(t => t.id === 't2');
    for (let dia = mesAtual + '-01'; dia < hoje; dia = somar(dia, 1)) {
      if (t2.dias.indexOf(deISO(dia).getDay()) < 0) continue;
      const n = Object.keys(presencas).length;
      // o Lucas (aluno da demo) faltou no 3º treino do mês
      const lista = alunos.filter(a => a.turma === 't2' && (a.id === 'a1' ? n !== 2 : r() < .82)).map(a => a.id);
      const k = dia + '|t2';
      presencas[k] = lista;
    }

    caixa.sort((a, b) => a.data < b.data ? 1 : a.data > b.data ? -1 : 0);
    return { versao: 4, geradoEm: hoje, config: CONFIG, alunos, pagamentos, caixa, reservas, eventos, avisos, faltas, presencas, produtos: PRODUTOS.slice(), seq };
  }

  // ---------- Grade de horários das quadras ----------
  function emMin(h) { const p = h.split(':'); return +p[0] * 60 + +p[1]; }
  function deMin(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  // Manhã e tarde de hora em hora; à noite os horários seguem a grade das turmas daquele dia
  function slotsDoDia(sem) {
    const s = [];
    for (let h = CONFIG.manhaInicio; h <= CONFIG.manhaFim; h++) s.push(pad(h) + ':00');
    const doDia = TURMAS.filter(t => t.dias.indexOf(sem) > -1);
    const off = doDia.length ? emMin(doDia[0].hora) % 60 : 0;
    for (let m = 17 * 60 + off; m <= CONFIG.noiteFim * 60 + off; m += 60) s.push(deMin(m));
    return s;
  }
  function turmaNoHorario(sem, hora, quadra) {
    return TURMAS.find(t => t.dias.indexOf(sem) > -1 && t.hora === hora && t.quadra === quadra) || null;
  }
  function nomeQuadra(q) { return (CONFIG.quadras.find(x => x.id === q) || {}).nome || q; }

  window.GR = {
    gerar, CONFIG, PROFESSORES, TURMAS, MODALIDADES, NIVEIS, PLANOS,
    slotsDoDia, turmaNoHorario, nomeQuadra, emMin,
    data: { pad, iso, deISO, somar, mesDe, mesMenos },
  };
})();
