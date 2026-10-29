/*
 * Teste de aceitação do porte (ESPECIFICACAO_WEB.md, seção 3).
 * Refaz no JS as sequências gravadas pelo motor Python (teste/teste_motor.json):
 * - a cada passo, o item escolhido pelo Python precisa estar entre os "melhores" do JS
 *   (o sorteio de desempate é forçado para o mesmo item) e o modo precisa coincidir;
 * - o θ do eixo precisa bater até a 3ª casa;
 * - o resultado final (eixos, habilidades, quadrantes, nível geral e plano) precisa ser igual.
 */
(function (raiz) {
  "use strict";

  function verificar(MotorDiag, itens, matriz, casos) {
    const linhas = [];
    let falhas = 0, maxDif = 0;
    const falha = msg => { falhas += 1; linhas.push("  FALHA: " + msg); };

    for (const caso of casos) {
      let esperado = null;
      const rng = {
        choice(lista) {
          const it = lista.find(i => i.id === esperado);
          if (!it) throw new Error(`o item ${esperado} não está entre os melhores do JS (${lista.map(i => i.id).join(", ")})`);
          return it;
        }
      };
      const m = new MotorDiag.Motor(itens, matriz, rng);
      const antes = falhas;
      try {
        caso.passos.forEach((p, k) => {
          esperado = p.id;
          const prox = m.proximo();
          if (!prox) throw new Error(`passo ${k + 1}: JS terminou antes do Python`);
          if (prox.modo !== p.modo) falha(`passo ${k + 1}: modo ${prox.modo} ≠ ${p.modo}`);
          m.responder(prox.item, p.letra, p.confianca, p.tempo_s, prox.modo);
          const r = m.resp[m.resp.length - 1];
          const dif = Math.abs(m.post[r.eixo].media - p.media);
          maxDif = Math.max(maxDif, dif, Math.abs(m.post[r.eixo].ep - p.ep));
          if (Math.abs(r.theta_eixo - p.theta_eixo) > 0.0005) falha(`passo ${k + 1}: θ ${r.theta_eixo} ≠ ${p.theta_eixo}`);
        });
        if (m.proximo() !== null) falha("o JS ainda escolheria outro item, o Python já tinha terminado");
      } catch (e) {
        falha(e.message);
      }
      const rj = m.resultado(), rp = caso.resultado;
      const comparar = (rotulo, a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) falha(`${rotulo}: JS ${JSON.stringify(a)} ≠ Python ${JSON.stringify(b)}`); };
      comparar("theta_geral", rj.theta_geral, rp.theta_geral);
      comparar("nivel_geral", rj.nivel_geral, rp.nivel_geral);
      comparar("total_itens", rj.total_itens, rp.total_itens);
      for (const e of Object.keys(rp.eixos)) comparar(`eixo ${e}`, rj.eixos[e], rp.eixos[e]);
      for (const h of Object.keys(rp.habilidades)) comparar(`habilidade ${h}`, rj.habilidades[h], rp.habilidades[h]);
      for (const k of ["acerto_seguro", "acerto_inseguro", "erro_seguro", "erro_inseguro"]) comparar(`quadrante ${k}`, rj.confianca[k], rp.confianca[k] || 0);
      comparar("plano de ação",
        rj.plano_acao.map(x => [x.habilidade, x.status, x.prioridade]),
        rp.plano_acao.map(x => [x.habilidade, x.status, x.prioridade]));
      linhas.splice(linhas.length - (falhas - antes), 0,
        `${falhas === antes ? "OK   " : "FALHA"} ${caso.nome}: ${caso.passos.length} itens, N${rj.nivel_geral} (θ geral ${rj.theta_geral})`);
    }
    linhas.push(`Maior diferença de θ/EP entre JS e Python (sem arredondar): ${maxDif.toExponential(2)}`);
    linhas.push(falhas ? `${falhas} falha(s).` : "Porte aprovado: o JS reproduz o motor Python.");
    return { ok: falhas === 0, linhas };
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { verificar };
  else raiz.TesteMotor = { verificar };
})(typeof window !== "undefined" ? window : globalThis);
