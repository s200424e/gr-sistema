/* =========================================================
   GR SISTEMA · tela de entrada
   No protótipo os botões entram direto. No sistema real:
   aluno entra com CPF ou telefone + senha (ou código no WhatsApp),
   dono entra com e-mail + senha.
   ========================================================= */
(function () {
  'use strict';
  const A = App;

  A.rota('entrar', function () {
    document.body.className = 'tela-entrar';
    A.$('#app').innerHTML = `
      <main class="entrar">
        <section class="entrar-marca">
          <svg class="entrar-logo"><use href="#gr-marca"/></svg>
          <h1>Sistema<br>GR Sports</h1>
          <p>Turmas, mensalidades, caixa, quadras, cantina e torneios num lugar só. Feito para CT de areia, sem as funções de academia que ninguém usa.</p>
          <ul class="entrar-lista">
            <li>${A.ic('check')} O aluno paga a mensalidade no Pix pelo celular</li>
            <li>${A.ic('check')} O dono vê quem pagou e quem atrasou na hora</li>
            <li>${A.ic('check')} Quadra alugada e burger vendido entram no caixa</li>
          </ul>
        </section>
        <section class="entrar-cartao">
          <h2>Entrar</h2>
          <p class="sutil">Use o CPF ou o telefone cadastrado na GR.</p>
          <form id="fEntrar" class="form" autocomplete="off">
            <label>CPF ou telefone<input name="login" inputmode="numeric" placeholder="000.000.000-00" value="(61) 98123-4567"></label>
            <label>Senha<input name="senha" type="password" value="demonstracao"></label>
            <button class="btn btn-grad btn-cheio" type="submit">Entrar ${A.ic('seta')}</button>
          </form>
          <div class="entrar-ou"><span>ou veja a demonstração</span></div>
          <div class="entrar-demo">
            <a class="demo-card" href="#/aluno/inicio">
              ${A.ic('user')}
              <strong>Sou aluno</strong>
              <span>Treino, mensalidade no Pix, reserva de quadra e torneio</span>
            </a>
            <a class="demo-card demo-dono" href="#/dono/geral">
              ${A.ic('grafico')}
              <strong>Sou o dono</strong>
              <span>Quem pagou, caixa do mês, agenda das quadras e cantina</span>
            </a>
          </div>
          <button class="link-sutil" id="bRestaurar">${A.ic('restaurar')} Restaurar dados de exemplo</button>
        </section>
      </main>`;
    A.$('#fEntrar').addEventListener('submit', e => { e.preventDefault(); A.ir('#/aluno/inicio'); });
    A.$('#bRestaurar').addEventListener('click', () => { A.restaurar(); A.avisar('Dados de exemplo restaurados'); });
  });

  A.carregar();
  A.desenhar();
})();
