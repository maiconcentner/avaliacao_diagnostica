/*
 * Renderização de Markdown (marked) com matemática (KaTeX).
 * O LaTeX é retirado do texto antes do Markdown e devolvido já renderizado depois,
 * para o Markdown não comer as barras invertidas. O cifrão literal vem escapado (R\$ 50,00).
 * Se as bibliotecas do CDN não carregarem, o texto aparece cru, mas legível.
 */
(function (raiz) {
  "use strict";

  const MARCA_A = "", MARCA_B = "", DOLAR = "";

  function escapar(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function renderTex(tex, display) {
    tex = tex.replace(new RegExp(DOLAR, "g"), "\\$");
    if (raiz.katex) {
      try {
        return raiz.katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: "ignore" });
      } catch (e) { /* cai no texto cru */ }
    }
    return escapar(display ? `$$${tex}$$` : `$${tex}$`);
  }

  function md(fonte, inline) {
    const formulas = [];
    const guardar = display => (_, tex) => { formulas.push(renderTex(tex, display)); return MARCA_A + (formulas.length - 1) + MARCA_B; };
    let s = String(fonte || "").replace(/\\\$/g, DOLAR);
    s = s.replace(/\$\$([\s\S]+?)\$\$/g, guardar(true));
    s = s.replace(/\$([^$]+?)\$/g, guardar(false));

    let html;
    if (raiz.marked) {
      const opc = { gfm: true, breaks: true };
      html = inline ? raiz.marked.parseInline(s, opc) : raiz.marked.parse(s, opc);
    } else {
      html = escapar(s).replace(/\n/g, "<br>");
      if (!inline) html = `<p>${html}</p>`;
    }
    html = html
      .replace(/<table>/g, '<div class="tabela-rolagem"><table>')
      .replace(/<\/table>/g, "</table></div>")
      .replace(new RegExp(MARCA_A + "(\\d+)" + MARCA_B, "g"), (_, k) => formulas[Number(k)])
      .replace(new RegExp(DOLAR, "g"), "$");
    return html;
  }

  raiz.Render = { md, escapar };
})(window);
