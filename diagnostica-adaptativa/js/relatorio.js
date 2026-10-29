/*
 * Cálculos e montagem do relatório final (ESPECIFICACAO_WEB.md, seção 5).
 * Usado pela página da aluna (index.html) e pela tela do professor (professor.html).
 * Entrada: dados = {cadastro, autoavaliacao, inicio, fim, resp}; resp no formato do motor.
 */
(function (raiz) {
  "use strict";

  const { Motor, nivelDe, ORDEM_EIXOS } = raiz.MotorDiag;
  const esc = raiz.Render.escapar;
  const md = txt => raiz.Render.md(txt, true);

  const STATUS = {
    dominada: "Você já domina",
    em_desenvolvimento: "Em desenvolvimento",
    lacuna: "Lacuna (base a retomar)",
    nao_avaliada: "Não avaliada"
  };
  const CONFIANCA = { certeza: "tinha certeza", duvida: "fiquei em dúvida", chutei: "chutei", nao_sei: "não sei resolver" };
  const LEITURA_NIVEL = {
    1: "O resultado indica que o melhor ponto de partida é a base do Fundamental: operações, frações e proporção. É a parte que mais destrava o resto da prova, e é por ela que o plano começa.",
    2: "Você já tem a base do Ensino Médio para resolver as questões mais acessíveis do ENEM. O próximo passo é ganhar consistência nelas e avançar para as de dificuldade média.",
    3: "Você resolve questões de dificuldade média e parte das difíceis do ENEM. O foco agora é transformar acertos inseguros em acertos firmes e fechar as lacunas pontuais.",
    4: "Seu desempenho está no nível dos vestibulares paulistas. Daqui em diante, o trabalho é de refinamento: atenção, tempo de prova e os conteúdos que ainda oscilam."
  };
  const RETA_FINAL = [
    ["1. Consertar a base que mais rende", "30/10 a 07/11", "As habilidades do topo deste plano com peso alto no ENEM. Primeiro os erros com certeza, depois as lacunas."],
    ["2. Treino no formato ENEM", "09 a 14/11", "Questões N2 e N3 cronometradas (cerca de 3 min cada). Resolver primeiro as fáceis, não deixar em branco, conferir as de acerto inseguro."],
    ["3. Vestibular", "16 a 21/11", "Para a UNESP: funções, trigonometria e geometria analítica, conforme este diagnóstico, com questões N3 e N4."],
    ["4. Depois das 1ªs fases", "dezembro em diante", "Plano longo de recomposição pelos pré-requisitos, se houver 2ª fase ou prova em 2027."]
  ];

  // ---------- formatação ----------
  const num = (x, d = 2) => x.toFixed(d).replace(".", ",").replace("-", "−");
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0) + "%";
  function duracao(s) {
    const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
    return h ? `${h} h ${String(m).padStart(2, "0")} min` : `${m} min`;
  }
  const data = iso => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");
  const hora = iso => (iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—");
  const rotuloNivel = (matriz, n) => (n ? matriz.niveis[String(n)].nome : "—");
  const fonte = item => (item.origem.tipo === "AUTORAL" ? "Autoral" : `${item.origem.prova} · questão ${item.origem.questao}`);

  // ---------- cálculos ----------
  function calcular(dados, itens, matriz) {
    const motor = Motor.restaurar(itens, matriz, { resp: dados.resp });
    const res = motor.resultado();
    const pesos = motor.pesosEixo();
    const somaPesos = Object.values(pesos).reduce((a, b) => a + b, 0);
    const thetaGeral = ORDEM_EIXOS.reduce((s, e) => s + res.eixos[e].theta * pesos[e], 0) / somaPesos;
    // EP do nível geral: média ponderada de eixos independentes
    const epGeral = Math.sqrt(ORDEM_EIXOS.reduce((s, e) => s + (pesos[e] * res.eixos[e].ep) ** 2, 0)) / somaPesos;
    return {
      motor, res, epGeral,
      faixa: [nivelDe(thetaGeral - epGeral), nivelDe(thetaGeral + epGeral)],
      porId: motor.porId
    };
  }

  // ---------- seções ----------
  function secIdentificacao(dados) {
    const c = dados.cadastro || {};
    const provas = [...(c.provas || []), c.outras].filter(Boolean).join(", ") || "—";
    const total = dados.resp.reduce((s, r) => s + (r.tempo_s || 0), 0);
    return `
      <section class="rel-sec" id="sec-1">
        <h2>1. Identificação</h2>
        <dl class="ident">
          <div><dt>Nome</dt><dd>${esc(c.nome || "—")}</dd></div>
          <div><dt>Curso pretendido</dt><dd>${esc(c.curso || "—")}</dd></div>
          <div><dt>Provas</dt><dd>${esc(provas)}</dd></div>
          <div><dt>Data</dt><dd>${data(dados.inicio)}</dd></div>
          <div><dt>Início e fim</dt><dd>${hora(dados.inicio)} às ${hora(dados.fim)}</dd></div>
          <div><dt>Tempo de resolução</dt><dd>${duracao(total)}</dd></div>
          <div><dt>Questões respondidas</dt><dd>${dados.resp.length}</dd></div>
        </dl>
      </section>`;
  }

  function secNivelGeral(calc, matriz) {
    const { res, epGeral, faixa } = calc;
    const nomesEixo = matriz.eixos;
    const ordenados = ORDEM_EIXOS.filter(e => res.eixos[e].n > 0).sort((a, b) => res.eixos[b].theta - res.eixos[a].theta);
    const fortes = ordenados.slice(0, 2).map(e => nomesEixo[e]);
    const atencao = ordenados.slice(-2).reverse().map(e => nomesEixo[e]);
    const acertos = calc.motor.resp.filter(r => r.acertou).length;
    const inseguros = res.confianca.acerto_inseguro;
    let texto = LEITURA_NIVEL[res.nivel_geral];
    if (faixa[0] !== faixa[1]) texto += ` Pela margem de incerteza, o nível fica entre N${faixa[0]} e N${faixa[1]}.`;
    if (ordenados.length >= 4) texto += ` Seus melhores resultados foram em ${fortes.join(" e ")}; os eixos que mais pedem atenção agora são ${atencao.join(" e ")}.`;
    if (inseguros > 0) texto += ` Das ${acertos} questões que você acertou, ${inseguros} foram marcadas com dúvida ou chute: você sabe mais do que imagina.`;
    return `
      <section class="rel-sec" id="sec-2">
        <h2>2. Nível geral estimado</h2>
        <div class="nivel-geral nivel-${res.nivel_geral}">
          <div class="nivel-selo">N${res.nivel_geral}</div>
          <div>
            <p class="nivel-nome">${esc(rotuloNivel(matriz, res.nivel_geral))}</p>
            <p class="nivel-theta">θ = ${num(res.theta_geral)} ± ${num(epGeral)}${faixa[0] !== faixa[1] ? ` · faixa N${faixa[0]} a N${faixa[1]}` : ""}</p>
          </div>
        </div>
        <p>${esc(texto)}</p>
      </section>`;
  }

  function secPerfilEixos(calc, matriz) {
    const pos = t => Math.max(0, Math.min(100, ((t + 3) / 6) * 100));
    const linhas = ORDEM_EIXOS.map(e => {
      const x = calc.res.eixos[e];
      const ini = pos(x.theta - x.ep), fim = pos(x.theta + x.ep);
      return `
        <div class="eixo-linha">
          <div class="eixo-nome"><b>${e}</b> ${esc(matriz.eixos[e])}</div>
          <div class="eixo-trilho" role="img" aria-label="${esc(matriz.eixos[e])}: θ ${num(x.theta)}, nível N${x.nivel}">
            <span class="zona z1"></span><span class="zona z2"></span><span class="zona z3"></span><span class="zona z4"></span>
            <span class="faixa" style="left:${ini}%;width:${fim - ini}%"></span>
            <span class="ponto" style="left:${pos(x.theta)}%"></span>
          </div>
          <div class="eixo-valor"><b>N${x.nivel}</b> · θ ${num(x.theta)} ± ${num(x.ep)} · ${x.n} ${x.n === 1 ? "questão" : "questões"}</div>
        </div>`;
    }).join("");
    return `
      <section class="rel-sec" id="sec-3">
        <h2>3. Perfil por eixo</h2>
        <p class="nota">O ponto é a estimativa (θ); a faixa clara é a margem de incerteza. Com cerca de 5 questões por eixo, leia cada eixo como uma faixa, não como um número exato.</p>
        <div class="eixos">
          <div class="eixo-linha eixo-escala" aria-hidden="true">
            <div class="eixo-nome"></div>
            <div class="eixo-trilho escala"><span>N1</span><span>N2</span><span>N3</span><span>N4</span></div>
            <div class="eixo-valor"></div>
          </div>
          ${linhas}
        </div>
      </section>`;
  }

  function secAutoavaliacao(dados, calc, matriz) {
    const auto = dados.autoavaliacao || {};
    const linhas = ORDEM_EIXOS.map(e => {
      const x = calc.res.eixos[e], r = Number(auto[e]) || 0;
      let leitura = "—", classe = "";
      if (r && x.n) {
        const esperado = 1 + (r - 1) * 0.75; // escala 1–5 levada para N1–N4
        if (x.nivel - esperado >= 1) { leitura = "Você mostrou mais do que marcou"; classe = "subestimou"; }
        else if (esperado - x.nivel >= 1) { leitura = "Avaliação acima do medido: vale conferir"; classe = "acima"; }
        else leitura = "Alinhado";
      }
      const bolinhas = r ? "●".repeat(r) + "○".repeat(5 - r) : "—";
      return `<tr class="${classe}"><td><b>${e}</b> ${esc(matriz.eixos[e])}</td><td class="auto"><span aria-hidden="true">${bolinhas}</span> ${r || ""}/5</td><td>N${x.nivel}</td><td>${leitura}</td></tr>`;
    }).join("");
    const sub = ORDEM_EIXOS.filter(e => {
      const r = Number(auto[e]) || 0;
      return r && calc.res.eixos[e].nivel - (1 + (r - 1) * 0.75) >= 1;
    }).length;
    return `
      <section class="rel-sec" id="sec-4">
        <h2>4. Autoavaliação × resultado</h2>
        <p>${sub ? `Em <b>${sub}</b> ${sub === 1 ? "eixo" : "eixos"} você mostrou um nível acima do que marcou no começo (linhas destacadas).` : "Sua autoavaliação ficou próxima do que você mostrou."}</p>
        <div class="tabela-rolagem"><table class="tab">
          <thead><tr><th>Eixo</th><th>Você marcou</th><th>Nível medido</th><th>Leitura</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table></div>
      </section>`;
  }

  function secMapa(calc, matriz) {
    const habs = calc.res.habilidades;
    const grupos = ORDEM_EIXOS.slice().sort().map(e => {
      const cel = Object.entries(matriz.habilidades).filter(([, v]) => v.eixo === e).map(([h, v]) =>
        `<div class="hab st-${habs[h].status}" title="${esc(STATUS[habs[h].status])}"><b>${h}</b><span>${esc(v.nome)}</span></div>`).join("");
      return `<div class="mapa-eixo"><h3>${e} · ${esc(matriz.eixos[e])}</h3><div class="mapa-grade">${cel}</div></div>`;
    }).join("");
    const cont = st => Object.values(habs).filter(v => v.status === st).length;
    const legenda = Object.keys(STATUS).map(st => `<span class="leg"><i class="st-${st}"></i>${STATUS[st]} (${cont(st)})</span>`).join("");
    return `
      <section class="rel-sec quebra" id="sec-5">
        <h2>5. Mapa das 41 habilidades</h2>
        <div class="legenda">${legenda}</div>
        ${grupos}
      </section>`;
  }

  function secFortes(calc, matriz) {
    const H = matriz.habilidades;
    const lista = Object.keys(H).filter(h => calc.res.habilidades[h].status === "dominada")
      .sort((a, b) => H[b].peso_enem - H[a].peso_enem);
    const corpo = lista.length
      ? `<ul class="lista-hab">${lista.map(h => `<li><b>${h}</b> ${esc(H[h].nome)}${H[h].peso_enem === 3 ? ' <span class="tag">peso alto no ENEM</span>' : ""}</li>`).join("")}</ul>`
      : "<p>Nenhuma habilidade ficou marcada como dominada ainda. Isso acontece quando há pelo menos um erro num nível igual ou abaixo do maior acerto; os acertos aparecem nas seções seguintes.</p>";
    return `<section class="rel-sec" id="sec-6"><h2>6. Pontos fortes</h2><p class="nota">Habilidades que você já domina, das que mais pesam no ENEM para as demais.</p>${corpo}</section>`;
  }

  // Para cada pré-requisito direto que não está dominado, segue a cadeia pelo primeiro
  // pré-requisito também não dominado (até 3 elos). No máximo 2 cadeias por lacuna.
  function cadeias(h, habs, H) {
    const pendente = p => habs[p].status !== "dominada";
    return H[h].pre.filter(pendente).slice(0, 2).map(p => {
      const c = [p];
      while (c.length < 3) {
        const prox = H[c[c.length - 1]].pre.find(q => pendente(q) && !c.includes(q));
        if (!prox) break;
        c.push(prox);
      }
      return c;
    });
  }

  function secDesenvolver(calc, matriz) {
    const H = matriz.habilidades, habs = calc.res.habilidades;
    const curto = h => `<b>${h}</b> ${esc(H[h].nome)}`;
    const lacunas = Object.keys(H).filter(h => habs[h].status === "lacuna");
    const emDes = Object.keys(H).filter(h => habs[h].status === "em_desenvolvimento");
    const itemLacuna = h => {
      const cs = cadeias(h, habs, H);
      const txt = cs.length
        ? cs.map(c => `<div class="cadeia">${h} ← ${c.map(p => `${p} <small>(${STATUS[habs[p].status].toLowerCase()})</small>`).join(" ← ")}</div>`).join("")
        : `<div class="cadeia">${H[h].pre.length ? "Pré-requisitos em dia: dá para atacar esta habilidade diretamente." : "Habilidade de base, sem pré-requisito na matriz."}</div>`;
      return `<li>${curto(h)}${txt}</li>`;
    };
    return `
      <section class="rel-sec" id="sec-7">
        <h2>7. A desenvolver e base a retomar</h2>
        <h3>Lacunas (base a retomar)</h3>
        ${lacunas.length ? `<p class="nota">Ao lado de cada lacuna, a cadeia de pré-requisitos que ainda não está firme (← lê-se "depende de").</p><ul class="lista-hab">${lacunas.map(itemLacuna).join("")}</ul>` : "<p>Nenhuma lacuna identificada.</p>"}
        <h3>Em desenvolvimento</h3>
        ${emDes.length ? `<ul class="lista-hab">${emDes.map(h => `<li>${curto(h)}</li>`).join("")}</ul>` : "<p>Nenhuma habilidade nesta situação.</p>"}
      </section>`;
  }

  function secConfianca(calc, matriz) {
    const H = matriz.habilidades, q = calc.res.confianca, resp = calc.motor.resp;
    const total = resp.length;
    const linha = (r, extra) => `<li><b>Q${resp.indexOf(r) + 1}</b> · ${r.habilidade} ${esc(H[r.habilidade].nome)} <small>(${CONFIANCA[r.confianca]})</small>${extra || ""}</li>`;
    const sabia = resp.filter(r => r.acertou && r.confianca !== "certeza");
    const certezaErro = resp.filter(r => !r.acertou && r.confianca === "certeza");
    const quad = (k, titulo, desc) => `<div class="quad q-${k}"><span class="quad-n">${q[k]}</span><b>${titulo}</b><span>${desc} · ${pct(q[k], total)}</span></div>`;
    return `
      <section class="rel-sec quebra" id="sec-8">
        <h2>8. Confiança × acerto</h2>
        <div class="quadrantes">
          ${quad("acerto_seguro", "Acerto com certeza", "domínio")}
          ${quad("acerto_inseguro", "Acerto com dúvida ou chute", "sabe e não confia")}
          ${quad("erro_seguro", "Erro com certeza", "erro conceitual fixado")}
          ${quad("erro_inseguro", "Erro com dúvida ou \"não sei\"", "lacuna reconhecida")}
        </div>
        <h3>Você sabia mais do que achava</h3>
        ${sabia.length ? `<p class="nota">Questões que você acertou marcando dúvida ou chute.</p><ul class="lista-q">${sabia.map(r => linha(r)).join("")}</ul>` : "<p>Nenhum acerto com dúvida ou chute.</p>"}
        <h3>Atenção: certeza no erro</h3>
        ${certezaErro.length ? `<p class="nota">Questões em que você tinha certeza e errou: costumam ser uma ideia que vale corrigir primeiro.</p><ul class="lista-q">${certezaErro.map(r => linha(r, r.erro ? `<div class="cadeia">${md(r.erro)}</div>` : "")).join("")}</ul>` : "<p>Nenhum erro com certeza.</p>"}
      </section>`;
  }

  function secErros(calc, matriz) {
    const H = matriz.habilidades, resp = calc.motor.resp;
    const grupos = new Map();
    for (const r of resp) {
      if (r.acertou || !r.erro || r.letra === null) continue;
      const g = grupos.get(r.erro) || { n: 0, habs: new Set() };
      g.n += 1; g.habs.add(r.habilidade);
      grupos.set(r.erro, g);
    }
    const top = [...grupos.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 8);
    const naoSei = resp.filter(r => r.letra === null).length;
    return `
      <section class="rel-sec" id="sec-9">
        <h2>9. Erros mais frequentes</h2>
        <p class="nota">O raciocínio que provavelmente levou a cada alternativa errada escolhida.</p>
        ${top.length ? `<ol class="lista-erros">${top.map(([erro, g]) => `<li>${md(erro)} <small>(${[...g.habs].map(h => `${h} ${esc(H[h].nome)}`).join("; ")}${g.n > 1 ? ` · ${g.n} vezes` : ""})</small></li>`).join("")}</ol>` : "<p>Nenhuma alternativa errada marcada.</p>"}
        ${naoSei ? `<p>Você usou "Não sei resolver" em ${naoSei} ${naoSei === 1 ? "questão" : "questões"}.</p>` : ""}
      </section>`;
  }

  function secTempo(calc) {
    const resp = calc.motor.resp;
    const linhas = [1, 2, 3, 4].map(n => {
      const rs = resp.filter(r => r.nivel === n);
      if (!rs.length) return `<tr><td>N${n}</td><td>0</td><td>—</td><td>—</td></tr>`;
      const media = rs.reduce((s, r) => s + r.tempo_s, 0) / rs.length;
      const ref = rs.reduce((s, r) => s + calc.porId.get(r.id).tempo_estimado_s, 0) / rs.length;
      return `<tr><td>N${n}</td><td>${rs.length}</td><td>${Math.round(media)} s</td><td>${Math.round(ref)} s</td></tr>`;
    }).join("");
    const rapidas = resp.filter(r => r.tempo_s < 20 && r.letra !== null);
    return `
      <section class="rel-sec" id="sec-10">
        <h2>10. Tempo</h2>
        <div class="tabela-rolagem"><table class="tab">
          <thead><tr><th>Nível</th><th>Questões</th><th>Tempo médio</th><th>Tempo de referência</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table></div>
        <h3>Respostas abaixo de 20 segundos</h3>
        ${rapidas.length ? `<p class="nota">Rápidas demais para a leitura completa: possível chute.</p><ul class="lista-q">${rapidas.map(r => `<li><b>Q${resp.indexOf(r) + 1}</b> · ${r.habilidade} · ${r.tempo_s} s · ${r.acertou ? "acertou" : "errou"} <small>(${CONFIANCA[r.confianca]})</small></li>`).join("")}</ul>` : "<p>Nenhuma resposta abaixo de 20 segundos.</p>"}
      </section>`;
  }

  function secPlano(calc) {
    const verbo = { lacuna: "Retomar", em_desenvolvimento: "Consolidar", nao_avaliada: "Verificar" };
    const plano = calc.res.plano_acao;
    const itens = plano.map(p => {
      const motivos = [];
      if (p.erro_com_certeza) motivos.push("houve erro com certeza");
      if (p.pre_de_fraca) motivos.push("é base de outra habilidade a desenvolver");
      if (p.status === "nao_avaliada") motivos.push("não entrou no teste e o eixo ficou abaixo de N3");
      return `<li><b>${verbo[p.status]}:</b> ${esc(p.nome)} <small>(${p.habilidade}${motivos.length ? " · " + motivos.join("; ") : ""})</small></li>`;
    }).join("");
    return `
      <section class="rel-sec" id="sec-11">
        <h2>11. Plano de ação preliminar</h2>
        <p class="nota">Ordenado por prioridade: peso no ENEM × tamanho da lacuna, com bônus para pré-requisitos e erros com certeza. O professor fecha o plano a partir daqui.</p>
        ${plano.length ? `<ol class="plano">${itens}</ol>` : "<p>Nenhuma habilidade pendente pela regra de prioridade.</p>"}
        <h3>Como organizar até as provas</h3>
        <div class="tabela-rolagem"><table class="tab">
          <thead><tr><th>Bloco</th><th>Período</th><th>Foco</th></tr></thead>
          <tbody>${RETA_FINAL.map(l => `<tr>${l.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
        </table></div>
      </section>`;
  }

  function secApendice(dados, calc, codigo) {
    const resp = calc.motor.resp;
    const confCurta = { certeza: "certeza", duvida: "dúvida", chutei: "chute", nao_sei: "não sei" };
    const linhas = resp.map((r, k) => {
      const item = calc.porId.get(r.id);
      return `<tr class="${r.acertou ? "ok" : "nok"}" data-eixo="${r.eixo}" data-hab="${r.habilidade}">
        <td>${k + 1}${r.modo === "sondagem" ? "<sup>s</sup>" : ""}</td><td class="sem-quebra" title="${esc(fonte(item))}">${esc(r.id)}</td><td>${r.habilidade}</td><td>N${r.nivel}</td>
        <td>${r.letra || "—"}</td><td>${item.gabarito}</td><td>${r.acertou ? "✓" : "✗"}</td>
        <td class="sem-quebra">${confCurta[r.confianca]}</td><td class="sem-quebra">${r.tempo_s} s</td><td>${r.erro ? md(r.erro) : ""}</td></tr>`;
    }).join("");
    return `
      <section class="rel-sec quebra apendice" id="sec-12">
        <h2>12. Para o professor</h2>
        <p class="nota">Questão a questão, na ordem em que apareceram. <sup>s</sup> = sondagem de pré-requisito.</p>
        <div class="tabela-rolagem"><table class="tab tab-apendice">
          <thead><tr><th>Nº</th><th>Item</th><th>Hab.</th><th>Nível</th><th>Resp.</th><th>Gab.</th><th>Acerto</th><th>Confiança</th><th>Tempo</th><th>Erro provável</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table></div>
        <h3>Código de dados</h3>
        <p class="nota">Cole este código em professor.html para reconstruir o relatório.</p>
        <pre class="codigo" id="codigo-dados">${esc(codigo)}</pre>
      </section>`;
  }

  // ---------- código de dados ----------
  function codificar(dados) {
    const compacto = {
      v: 1, c: dados.cadastro, a: dados.autoavaliacao, i: dados.inicio, f: dados.fim,
      r: dados.resp.map(r => [r.id, r.letra, r.confianca, r.tempo_s, r.modo])
    };
    const json = JSON.stringify(compacto);
    if (raiz.LZString) return "LZ1:" + raiz.LZString.compressToBase64(json);
    return "B64:" + btoa(unescape(encodeURIComponent(json)));
  }

  function decodificar(codigo, itens, matriz) {
    codigo = codigo.trim().replace(/\s+/g, "");
    let json;
    if (codigo.startsWith("LZ1:")) {
      if (!raiz.LZString) throw new Error("A biblioteca LZ-string não carregou; confira a conexão.");
      json = raiz.LZString.decompressFromBase64(codigo.slice(4));
    } else if (codigo.startsWith("B64:")) {
      json = decodeURIComponent(escape(atob(codigo.slice(4))));
    } else throw new Error("Código não reconhecido: ele deve começar com LZ1: ou B64:.");
    if (!json) throw new Error("Não foi possível descompactar o código. Ele foi copiado inteiro?");
    const d = JSON.parse(json);
    // refaz as respostas no motor: recalcula acerto, erro e θ com o banco atual
    const m = new Motor(itens, matriz);
    for (const [id, letra, conf, tempo, modo] of d.r) {
      const item = m.porId.get(id);
      if (!item) throw new Error(`Item ${id} não existe no banco atual.`);
      m.responder(item, letra, conf, tempo, modo);
    }
    return { cadastro: d.c, autoavaliacao: d.a, inicio: d.i, fim: d.f, resp: m.resp };
  }

  function montar(dados, itens, matriz) {
    const calc = calcular(dados, itens, matriz);
    const codigo = codificar(dados);
    const nome = (dados.cadastro && dados.cadastro.nome) || "";
    return {
      codigo,
      html: `
        <header class="rel-cabecalho">
          <p class="rel-sobre">Avaliação diagnóstica adaptativa · Matemática pré-vestibular</p>
          <h1>Relatório de ${esc(nome || "diagnóstico")}</h1>
        </header>
        ${secIdentificacao(dados)}
        ${secNivelGeral(calc, matriz)}
        ${secPerfilEixos(calc, matriz)}
        ${secAutoavaliacao(dados, calc, matriz)}
        ${secMapa(calc, matriz)}
        ${secFortes(calc, matriz)}
        ${secDesenvolver(calc, matriz)}
        ${secConfianca(calc, matriz)}
        ${secErros(calc, matriz)}
        ${secTempo(calc)}
        ${secPlano(calc)}
        ${secApendice(dados, calc, codigo)}`
    };
  }

  raiz.Relatorio = { montar, codificar, decodificar, calcular };
})(window);
