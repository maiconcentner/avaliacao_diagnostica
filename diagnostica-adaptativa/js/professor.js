/* Tela do professor: reconstrói o relatório a partir do código de dados e filtra o apêndice. */
(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  let itens = [], matriz = null;

  function mostrarErro(msg) { $("erro").textContent = msg; }

  function montar(dados) {
    const { html } = window.Relatorio.montar(dados, itens, matriz);
    $("saida").innerHTML = html;
    $("saida").hidden = false;
    $("painel-filtros").hidden = false;
    prepararFiltros(dados);
    filtrar();
    $("saida").scrollIntoView({ behavior: "smooth" });
  }

  function prepararFiltros(dados) {
    const eixos = [...new Set(dados.resp.map(r => r.eixo))].sort();
    const habs = [...new Set(dados.resp.map(r => r.habilidade))].sort();
    $("f-eixo").innerHTML = '<option value="">Todos</option>' + eixos.map(e => `<option value="${e}">${e} · ${window.Render.escapar(matriz.eixos[e])}</option>`).join("");
    $("f-hab").innerHTML = '<option value="">Todas</option>' + habs.map(h => `<option value="${h}">${h} · ${window.Render.escapar(matriz.habilidades[h].nome)}</option>`).join("");
  }

  function filtrar() {
    const e = $("f-eixo").value, h = $("f-hab").value, a = $("f-acerto").value;
    let n = 0, total = 0;
    document.querySelectorAll("#sec-12 tbody tr").forEach(tr => {
      total += 1;
      const ok = (!e || tr.dataset.eixo === e) && (!h || tr.dataset.hab === h) && (!a || tr.classList.contains(a));
      tr.hidden = !ok;
      if (ok) n += 1;
    });
    $("contagem").textContent = `Apêndice: ${n} de ${total} questões visíveis.`;
  }

  async function iniciar() {
    try {
      const [ri, rm] = await Promise.all([fetch("banco/itens.json"), fetch("banco/matriz.json")]);
      itens = (await ri.json()).itens;
      matriz = await rm.json();
    } catch (e) {
      mostrarErro("Não foi possível carregar o banco de questões. Abra esta página por um servidor (GitHub Pages ou python3 -m http.server).");
      return;
    }
    let salvo = null;
    try { salvo = JSON.parse(localStorage.getItem("diag_mat_v1") || "null"); } catch (e) { salvo = null; }
    if (salvo && salvo.motor && salvo.motor.resp && salvo.motor.resp.length) {
      $("local").hidden = false;
      $("local").onclick = () => montar({ cadastro: salvo.cadastro, autoavaliacao: salvo.autoavaliacao, inicio: salvo.inicio, fim: salvo.fim, resp: salvo.motor.resp });
    }
    $("montar").onclick = () => {
      mostrarErro("");
      const codigo = $("codigo").value;
      if (!codigo.trim()) { mostrarErro("Cole o código de dados primeiro."); return; }
      try { montar(window.Relatorio.decodificar(codigo, itens, matriz)); }
      catch (e) { mostrarErro(e.message); }
    };
    ["f-eixo", "f-hab", "f-acerto"].forEach(id => { $(id).onchange = filtrar; });
    $("imprimir").onclick = () => window.print();
  }

  iniciar();
})();
