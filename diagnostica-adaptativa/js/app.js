/*
 * Telas, estado e temporização da avaliação (ESPECIFICACAO_WEB.md, seção 4).
 * Fluxo: boas-vindas → cadastro → autoavaliação → questões → relatório.
 * O estado vai para o localStorage a cada passo; a aluna pode pausar e continuar no mesmo navegador.
 */
(function () {
  "use strict";

  const CHAVE = "diag_mat_v1";
  const { Motor, ORDEM_EIXOS, MAX_TOTAL, MAX_EIXO } = window.MotorDiag;
  const { md, escapar: esc } = window.Render;

  const DICAS_EIXO = {
    A: "operações e sinais, frações, potências e raízes, notação científica, MMC e MDC",
    B: "razão e proporção, regra de três, porcentagem, escala, unidades de medida",
    C: "expressões, equações do 1º e do 2º grau, sistemas, fatoração",
    D: "leitura de gráficos e tabelas, funções afim, quadrática, exponencial e logaritmo",
    E: "ângulos e polígonos, áreas e perímetros, semelhança, Pitágoras, círculo",
    F: "trigonometria no triângulo retângulo, ciclo trigonométrico, leis dos senos e cossenos",
    G: "sólidos e planificações, volumes de prismas, cilindros, cones e esferas",
    H: "média, mediana e moda, contagem, combinações, probabilidade",
    I: "PA, PG, juros e geometria analítica"
  };
  const ESCALA = ["Nada segura", "Pouco segura", "Mais ou menos", "Segura", "Muito segura"];
  const CONFIANCAS = [["certeza", "Tinha certeza"], ["duvida", "Fiquei em dúvida"], ["chutei", "Chutei"]];

  const $app = document.getElementById("app");
  const $aviso = document.getElementById("aviso-vivo");
  let itens = [], matriz = null, motor = null, atual = null;
  let est = novoEstado();
  let inicioQuestao = 0, sel = null, ocupado = false;

  function novoEstado() {
    return { versao: 1, fase: "inicio", cadastro: null, autoavaliacao: null, inicio: null, fim: null, motor: null, atual: null, tempoAtual: 0 };
  }

  // ---------- armazenamento ----------
  let semArmazenamento = false;
  function salvar() {
    if (motor) est.motor = motor.estado();
    try { localStorage.setItem(CHAVE, JSON.stringify(est)); }
    catch (e) { semArmazenamento = true; }
  }
  function carregarSalvo() {
    try { const s = localStorage.getItem(CHAVE); return s ? JSON.parse(s) : null; }
    catch (e) { semArmazenamento = true; return null; }
  }
  function apagarSalvo() {
    try { localStorage.removeItem(CHAVE); } catch (e) { /* nada a fazer */ }
  }

  function tela(html, classe) {
    $app.className = classe || "";
    $app.innerHTML = html;
    window.scrollTo(0, 0);
    const foco = $app.querySelector("h1, h2");
    if (foco) { foco.setAttribute("tabindex", "-1"); foco.focus({ preventScroll: true }); }
  }

  // ---------- boas-vindas ----------
  function telaInicio() {
    const salvo = carregarSalvo();
    const emAndamento = salvo && ["cadastro", "autoavaliacao", "pronta", "teste", "pausa"].includes(salvo.fase);
    const terminado = salvo && salvo.fase === "fim";
    let botoes = `<button class="btn primario" id="comecar">Começar</button>`;
    if (emAndamento) {
      botoes = `<button class="btn primario" id="continuar">Continuar de onde parei</button>
                <button class="btn secundario" id="recomecar">Recomeçar do zero</button>`;
    } else if (terminado) {
      botoes = `<button class="btn primario" id="ver">Ver meu relatório</button>
                <button class="btn secundario" id="recomecar">Fazer uma nova aplicação</button>`;
    }
    tela(`
      <section class="cartao">
        <p class="sobretitulo">Matemática · pré-vestibular</p>
        <h1>Avaliação diagnóstica</h1>
        <p>Este teste serve para descobrir onde vale a pena focar os estudos até as provas.</p>
        <ul class="lista-boas-vindas">
          <li><b>Ele se adapta a você.</b> A próxima questão depende das respostas anteriores.</li>
          <li><b>Errar faz parte.</b> É errando que o teste descobre onde ajudar. Ninguém acerta tudo.</li>
          <li><b>Leva cerca de 1h30</b> (umas 45 questões). Você pode pausar e continuar depois, neste mesmo navegador.</li>
          <li><b>Use papel e lápis, sem calculadora</b>, como no ENEM.</li>
          <li><b>O resultado aparece só no final</b>, com o seu nível e um relatório para enviar ao professor.</li>
        </ul>
        <p class="nota">Suas respostas ficam só neste navegador até você exportar o relatório. Nada é enviado.</p>
        ${semArmazenamento ? '<p class="alerta">Este navegador não está permitindo salvar o progresso (talvez uma janela anônima). Faça o teste de uma vez só, sem fechar a página.</p>' : ""}
        <div class="acoes">${botoes}</div>
      </section>`);
    const on = (id, fn) => { const b = document.getElementById(id); if (b) b.onclick = fn; };
    on("comecar", () => { est = novoEstado(); est.fase = "cadastro"; salvar(); telaCadastro(); });
    on("continuar", () => retomar(salvo));
    on("ver", () => retomar(salvo));
    on("recomecar", () => {
      if (!confirm("Apagar o progresso salvo neste navegador e começar do zero?")) return;
      apagarSalvo(); est = novoEstado(); motor = null; est.fase = "cadastro"; salvar(); telaCadastro();
    });
  }

  function retomar(salvo) {
    est = Object.assign(novoEstado(), salvo);
    motor = est.motor ? Motor.restaurar(itens, matriz, est.motor) : null;
    ({ cadastro: telaCadastro, autoavaliacao: telaAutoavaliacao, pronta: telaPronta, teste: retomarTeste, pausa: retomarTeste, fim: telaRelatorio }[est.fase] || telaInicio)();
  }

  // ---------- cadastro ----------
  function telaCadastro() {
    const c = est.cadastro || { nome: "", curso: "", provas: [], outras: "" };
    const provas = ["ENEM", "FUVEST", "UNESP"];
    tela(`
      <form class="cartao" id="form-cadastro" novalidate>
        <p class="sobretitulo">Passo 1 de 3</p>
        <h1>Sobre você</h1>
        <label class="campo">Seu nome
          <input name="nome" autocomplete="name" required value="${esc(c.nome)}">
        </label>
        <label class="campo">Curso pretendido
          <input name="curso" list="cursos" value="${esc(c.curso)}" placeholder="Ex.: Medicina">
          <datalist id="cursos"><option value="Medicina"><option value="Odontologia"><option value="Medicina ou Odontologia"></datalist>
        </label>
        <fieldset class="campo">
          <legend>Provas que você vai fazer</legend>
          <div class="opcoes-check">
            ${provas.map(p => `<label class="check"><input type="checkbox" name="provas" value="${p}" ${c.provas.includes(p) ? "checked" : ""}> ${p}</label>`).join("")}
          </div>
          <label class="campo campo-menor">Outras
            <input name="outras" value="${esc(c.outras)}" placeholder="Ex.: UNICAMP, Santa Casa">
          </label>
        </fieldset>
        <p class="erro-form" id="erro-cadastro" role="alert"></p>
        <div class="acoes"><button class="btn primario" type="submit">Continuar</button></div>
      </form>`);
    document.getElementById("form-cadastro").onsubmit = ev => {
      ev.preventDefault();
      const f = ev.target;
      const nome = f.nome.value.trim();
      if (!nome) { document.getElementById("erro-cadastro").textContent = "Escreva o seu nome para continuar."; f.nome.focus(); return; }
      est.cadastro = {
        nome, curso: f.curso.value.trim(), outras: f.outras.value.trim(),
        provas: [...f.querySelectorAll("input[name=provas]:checked")].map(x => x.value)
      };
      est.fase = "autoavaliacao"; salvar(); telaAutoavaliacao();
    };
  }

  // ---------- autoavaliação ----------
  function telaAutoavaliacao() {
    const a = est.autoavaliacao || {};
    const blocos = ORDEM_EIXOS.slice().sort().map(e => `
      <fieldset class="auto-eixo" data-eixo="${e}">
        <legend><b>${esc(matriz.eixos[e])}</b><span class="dica">${DICAS_EIXO[e]}</span></legend>
        <div class="escala">
          ${ESCALA.map((rot, k) => `
            <label class="escala-op"><input type="radio" name="auto-${e}" value="${k + 1}" ${Number(a[e]) === k + 1 ? "checked" : ""}>
              <span class="escala-num">${k + 1}</span><span class="escala-rot">${rot}</span></label>`).join("")}
        </div>
      </fieldset>`).join("");
    tela(`
      <form class="cartao" id="form-auto" novalidate>
        <p class="sobretitulo">Passo 2 de 3</p>
        <h1>O quanto você se sente segura em…</h1>
        <p>Responda pelo que você sente hoje, sem pensar muito. No relatório, isso é comparado com o que você mostrar no teste.</p>
        ${blocos}
        <p class="erro-form" id="erro-auto" role="alert"></p>
        <div class="acoes">
          <button class="btn secundario" type="button" id="voltar">Voltar</button>
          <button class="btn primario" type="submit">Continuar</button>
        </div>
      </form>`);
    document.getElementById("voltar").onclick = () => { est.fase = "cadastro"; salvar(); telaCadastro(); };
    document.getElementById("form-auto").onsubmit = ev => {
      ev.preventDefault();
      const r = {};
      const faltam = [];
      for (const e of ORDEM_EIXOS) {
        const m = ev.target.querySelector(`input[name=auto-${e}]:checked`);
        if (m) r[e] = Number(m.value); else faltam.push(matriz.eixos[e]);
      }
      if (faltam.length) {
        document.getElementById("erro-auto").textContent = `Falta marcar: ${faltam.join("; ")}.`;
        return;
      }
      est.autoavaliacao = r; est.fase = "pronta"; salvar(); telaPronta();
    };
  }

  function telaPronta() {
    tela(`
      <section class="cartao">
        <p class="sobretitulo">Passo 3 de 3</p>
        <h1>Tudo pronto</h1>
        <ul class="lista-boas-vindas">
          <li>Separe <b>papel e lápis</b>. Sem calculadora.</li>
          <li>Em cada questão, escolha a alternativa e diga <b>o quanto você confia</b> nela.</li>
          <li>Se não souber por onde começar, use <b>"Não sei resolver"</b>. É melhor que chutar.</li>
          <li>Você não vai ver se acertou durante o teste. O resultado aparece no final.</li>
          <li>No computador: teclas <kbd>1</kbd> a <kbd>5</kbd> escolhem a alternativa e <kbd>Enter</kbd> avança.</li>
        </ul>
        <div class="acoes">
          <button class="btn secundario" id="voltar">Voltar</button>
          <button class="btn primario" id="iniciar">Começar o teste</button>
        </div>
      </section>`);
    document.getElementById("voltar").onclick = () => { est.fase = "autoavaliacao"; salvar(); telaAutoavaliacao(); };
    document.getElementById("iniciar").onclick = () => {
      motor = new Motor(itens, matriz);
      est.inicio = new Date().toISOString();
      est.fase = "teste";
      proximaQuestao();
    };
  }

  // ---------- teste ----------
  function proximaQuestao() {
    const prox = motor.proximo();
    est.tempoAtual = 0;
    if (!prox) {
      est.atual = null; est.fim = new Date().toISOString(); est.fase = "fim";
      salvar(); telaRelatorio(); return;
    }
    est.atual = { id: prox.item.id, modo: prox.modo };
    salvar();
    telaQuestao();
  }

  function retomarTeste() {
    if (!motor) motor = new Motor(itens, matriz);
    est.fase = "teste";
    if (!est.atual || !motor.porId.has(est.atual.id) || motor.usados.has(est.atual.id)) { proximaQuestao(); return; }
    salvar();
    telaQuestao();
  }

  function estimativaTotal() {
    const n = motor.resp.length;
    const restante = ORDEM_EIXOS.filter(e => motor.eixoAberto(e)).reduce((s, e) => s + (MAX_EIXO - motor.nEixo[e]), 0);
    return Math.max(n + 1, Math.min(MAX_TOTAL, n + restante));
  }

  function telaQuestao() {
    const item = motor.porId.get(est.atual.id);
    atual = { item, modo: est.atual.modo };
    sel = { letra: null, conf: null, naoSei: false };
    const n = motor.resp.length + 1, total = estimativaTotal();
    const origem = item.origem.tipo === "AUTORAL" ? "" : `<p class="fonte">${esc(item.origem.prova)} · questão ${item.origem.questao}</p>`;
    const figuras = item.figuras.map((f, k) => `
      <button class="figura" type="button" data-src="${esc(f)}" aria-label="Ampliar a figura ${k + 1}">
        <img src="${esc(f)}" alt="Figura ${k + 1} da questão" loading="eager">
        <span class="figura-dica">Toque para ampliar</span>
      </button>`).join("");
    tela(`
      <div class="barra-topo">
        <div class="progresso">
          <span class="progresso-texto">Questão ${n} de cerca de ${total}</span>
          <div class="progresso-trilho" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${n - 1}" aria-label="Progresso">
            <div class="progresso-barra" style="width:${(100 * (n - 1)) / total}%"></div>
          </div>
        </div>
        <button class="btn link" id="pausar">Pausar e continuar depois</button>
      </div>
      <article class="cartao questao">
        <h1 class="vis-oculto">Questão ${n}</h1>
        ${origem}
        <div class="enunciado">${md(item.enunciado)}</div>
        ${figuras ? `<div class="figuras">${figuras}</div>` : ""}
        <div class="alternativas" role="radiogroup" aria-label="Alternativas">
          ${item.alternativas.map((a, k) => `
            <button class="alt" type="button" role="radio" aria-checked="false" data-letra="${a.letra}">
              <span class="alt-letra">${a.letra}</span><span class="alt-texto">${md(a.texto, true)}</span>
              <span class="vis-oculto">(tecla ${k + 1})</span>
            </button>`).join("")}
        </div>
        <div class="confianca" id="confianca" hidden>
          <p class="confianca-pergunta">Quanto você confia nessa resposta?</p>
          <div class="confianca-ops" role="radiogroup" aria-label="Confiança">
            ${CONFIANCAS.map(([v, rot]) => `<button class="conf" type="button" role="radio" aria-checked="false" data-conf="${v}">${rot}</button>`).join("")}
          </div>
        </div>
        <div class="acoes acoes-questao">
          <button class="btn secundario" type="button" id="nao-sei" aria-pressed="false">Não sei resolver</button>
          <button class="btn primario" type="button" id="avancar" disabled>Avançar</button>
        </div>
      </article>`, "tela-questao");

    $app.querySelectorAll(".alt").forEach(b => b.onclick = () => escolherLetra(b.dataset.letra));
    $app.querySelectorAll(".conf").forEach(b => b.onclick = () => { sel.conf = b.dataset.conf; atualizarSelecao(); });
    $app.querySelectorAll(".figura").forEach(b => b.onclick = () => ampliar(b.dataset.src));
    document.getElementById("nao-sei").onclick = () => {
      sel.naoSei = !sel.naoSei;
      if (sel.naoSei) { sel.letra = null; sel.conf = null; }
      atualizarSelecao();
    };
    document.getElementById("avancar").onclick = avancar;
    document.getElementById("pausar").onclick = pausar;
    inicioQuestao = performance.now();
  }

  function escolherLetra(letra) {
    sel.letra = letra; sel.naoSei = false;
    atualizarSelecao();
  }

  function atualizarSelecao() {
    $app.querySelectorAll(".alt").forEach(b => b.setAttribute("aria-checked", String(b.dataset.letra === sel.letra)));
    $app.querySelectorAll(".conf").forEach(b => b.setAttribute("aria-checked", String(b.dataset.conf === sel.conf)));
    const caixa = document.getElementById("confianca");
    const mostrar = !!sel.letra;
    if (mostrar && caixa.hidden) { caixa.hidden = false; caixa.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
    caixa.hidden = !mostrar;
    const ns = document.getElementById("nao-sei");
    ns.setAttribute("aria-pressed", String(sel.naoSei));
    ns.classList.toggle("ativo", sel.naoSei);
    document.getElementById("avancar").disabled = !podeAvancar();
  }

  const podeAvancar = () => sel && (sel.naoSei || (sel.letra && sel.conf));

  function tempoDecorrido() {
    return est.tempoAtual + (performance.now() - inicioQuestao) / 1000;
  }

  function avancar() {
    if (ocupado || !podeAvancar()) return;
    ocupado = true;
    const tempo = Math.max(1, Math.round(tempoDecorrido()));
    const letra = sel.naoSei ? null : sel.letra;
    const conf = sel.naoSei ? "nao_sei" : sel.conf;
    motor.responder(atual.item, letra, conf, tempo, atual.modo);
    $app.querySelectorAll("button").forEach(b => { b.disabled = true; });
    const selo = document.createElement("div");
    selo.className = "registrada";
    selo.textContent = "Resposta registrada";
    $app.appendChild(selo);
    $aviso.textContent = "Resposta registrada.";
    est.tempoAtual = 0;
    est.atual = null; // se a página recarregar agora, a retomada já sorteia a próxima
    salvar();
    setTimeout(() => { ocupado = false; proximaQuestao(); }, 650);
  }

  function pausar() {
    est.tempoAtual = tempoDecorrido();
    est.fase = "pausa";
    salvar();
    tela(`
      <section class="cartao">
        <h1>Teste pausado</h1>
        <p>Seu progresso está salvo neste navegador: ${motor.resp.length} ${motor.resp.length === 1 ? "questão respondida" : "questões respondidas"}.</p>
        <p>Pode fechar a página. Quando voltar, abra o mesmo endereço neste mesmo navegador e toque em "Continuar de onde parei".</p>
        <div class="acoes"><button class="btn primario" id="voltar-teste">Continuar agora</button></div>
      </section>`);
    document.getElementById("voltar-teste").onclick = retomarTeste;
  }

  // o tempo é medido só com a página visível
  document.addEventListener("visibilitychange", () => {
    if (est.fase !== "teste" || !atual) return;
    if (document.hidden) { est.tempoAtual = tempoDecorrido(); salvar(); }
    else inicioQuestao = performance.now();
  });

  document.addEventListener("keydown", ev => {
    if (est.fase !== "teste" || !atual || ocupado || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (document.getElementById("zoom").open) return;
    if (/^[1-5]$/.test(ev.key)) {
      const alt = atual.item.alternativas[Number(ev.key) - 1];
      if (alt) { ev.preventDefault(); escolherLetra(alt.letra); }
    } else if (ev.key === "Enter" && podeAvancar()) {
      ev.preventDefault(); avancar();
    }
  });

  // ---------- figura ampliada ----------
  function ampliar(src) {
    const dlg = document.getElementById("zoom");
    dlg.querySelector("img").src = src;
    if (dlg.showModal) dlg.showModal(); else window.open(src, "_blank");
  }
  (function prepararZoom() {
    const dlg = document.getElementById("zoom");
    dlg.addEventListener("click", () => dlg.close());
  })();

  // ---------- relatório ----------
  function telaRelatorio() {
    const dados = { cadastro: est.cadastro, autoavaliacao: est.autoavaliacao, inicio: est.inicio, fim: est.fim, resp: motor.resp };
    const { html, codigo } = window.Relatorio.montar(dados, itens, matriz);
    tela(`
      <div class="barra-relatorio nao-imprimir">
        <p><b>Pronto!</b> Este é o seu resultado. Exporte em PDF e envie ao professor.</p>
        <div class="acoes">
          <button class="btn primario" id="pdf">Exportar PDF</button>
          <button class="btn secundario" id="copiar">Copiar código de dados</button>
          <button class="btn link" id="inicio">Início</button>
        </div>
        <p class="nota">Na janela que abrir, escolha "Salvar como PDF" como destino.</p>
      </div>
      <div class="relatorio">${html}</div>`, "tela-relatorio");
    document.getElementById("pdf").onclick = () => exportarPdf(est.cadastro && est.cadastro.nome);
    document.getElementById("copiar").onclick = ev => copiar(codigo, ev.target);
    document.getElementById("inicio").onclick = telaInicio;
  }

  function exportarPdf(nome) {
    const titulo = document.title;
    const dia = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
    document.title = `Diagnóstico de Matemática - ${nome || "aluna"} - ${dia}`;
    window.print();
    setTimeout(() => { document.title = titulo; }, 1000);
  }

  function copiar(texto, botao) {
    const ok = () => { const t = botao.textContent; botao.textContent = "Copiado!"; setTimeout(() => { botao.textContent = t; }, 1800); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(ok, () => copiarAntigo(texto) && ok());
    } else if (copiarAntigo(texto)) ok();
  }
  function copiarAntigo(texto) {
    const ta = document.createElement("textarea");
    ta.value = texto; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    if (!ok) alert("Não consegui copiar sozinho. Selecione o código no fim do relatório e copie.");
    return ok;
  }

  // ---------- início ----------
  async function iniciar() {
    try {
      const [ri, rm] = await Promise.all([fetch("banco/itens.json"), fetch("banco/matriz.json")]);
      if (!ri.ok || !rm.ok) throw new Error("HTTP " + (ri.ok ? rm.status : ri.status));
      itens = (await ri.json()).itens;
      matriz = await rm.json();
    } catch (e) {
      tela(`<section class="cartao"><h1>Não foi possível carregar as questões</h1>
        <p>Confira a conexão e recarregue a página.</p>
        <p class="nota">Se você abriu o arquivo direto do computador, use um servidor local (por exemplo, <code>python3 -m http.server</code>) ou o endereço do GitHub Pages.</p></section>`);
      return;
    }
    if (!window.katex || !window.marked) {
      document.getElementById("aviso-lib").hidden = false;
    }
    telaInicio();
  }

  iniciar();
})();
