/*
 * Motor da Avaliação Diagnóstica Adaptativa (Matemática, pré-vestibular).
 * Porte fiel de scripts/motor_referencia.py: mesmas constantes, mesma grade EAP,
 * mesma regra de escolha de item, de sondagem de pré-requisito e de resultado.
 *
 * Modelo: P(acerto | θ, b) = c + (1 - c) / (1 + exp(-D·a·(θ - b)))   c = 0,2, a = 1, D = 1,7
 * Estimação: EAP em grade (θ de -3 a 3, passo 0,05), priori N(-0,5; 1,5).
 *
 * Funciona no navegador (window.Motor) e no Node (module.exports).
 */
(function (raiz) {
  "use strict";

  const C_GUESS = 0.2, A = 1.0, D = 1.7;
  const GRID = Array.from({ length: 121 }, (_, k) => -3 + 0.05 * k);
  const PRIOR_MU = -0.5, PRIOR_SD = 1.5;
  const ORDEM_EIXOS = ["B", "A", "C", "D", "H", "E", "G", "I", "F"]; // B e A primeiro: aquecimento
  const MIN_EIXO = 3, MAX_EIXO = 6, SE_ALVO = 0.50;
  const MAX_TOTAL = 45, MAX_SONDAGENS = 6;
  const FAIXAS = [[-99, -1.0, 1], [-1.0, 0.0, 2], [0.0, 1.0, 3], [1.0, 99, 4]];

  // sum() do Python >= 3.12: soma compensada de Neumaier (mesmo algoritmo do CPython)
  function soma(valores) {
    let f = 0.0, c = 0.0;
    for (const x of valores) {
      const t = f + x;
      if (Math.abs(f) >= Math.abs(x)) c += (f - t) + x;
      else c += (x - t) + f;
      f = t;
    }
    if (c && Number.isFinite(c)) f += c;
    return f;
  }

  // round() do Python: arredonda pela expansão decimal exata, com empate para o par
  function arred(x, n) {
    const r = Number(x.toFixed(n));
    const exato = Math.abs(x).toFixed(100);
    const resto = exato.slice(exato.indexOf(".") + 1 + n);
    if (/^50*$/.test(resto)) {
      const m = 10 ** n;
      const baixo = Math.trunc(x * m), cima = baixo + Math.sign(x);
      return (baixo % 2 === 0 ? baixo : cima) / m;
    }
    return r === 0 ? 0 : r; // evita -0
  }

  function pAcerto(theta, b) {
    return C_GUESS + (1 - C_GUESS) / (1 + Math.exp(-D * A * (theta - b)));
  }

  function nivelDe(theta) {
    for (const [lo, hi, n] of FAIXAS) if (lo <= theta && theta < hi) return n;
    return undefined;
  }

  class Posterior {
    constructor() {
      this.w = GRID.map(t => Math.exp(-0.5 * ((t - PRIOR_MU) / PRIOR_SD) ** 2));
      this._norm();
    }
    _norm() {
      const s = soma(this.w);
      this.w = this.w.map(x => x / s);
    }
    atualizar(b, acertou) {
      this.w = this.w.map((w, k) => w * (acertou ? pAcerto(GRID[k], b) : 1 - pAcerto(GRID[k], b)));
      this._norm();
    }
    get media() {
      return soma(this.w.map((w, k) => w * GRID[k]));
    }
    get ep() {
      const m = this.media;
      return Math.sqrt(soma(this.w.map((w, k) => w * (GRID[k] - m) ** 2)));
    }
  }

  const rngPadrao = { choice: lista => lista[Math.floor(Math.random() * lista.length)] };

  class Motor {
    constructor(itens, matriz, rng) {
      this.itens = itens;
      this.hab = matriz.habilidades;
      this.rng = rng || rngPadrao;
      this.porId = new Map(itens.map(i => [i.id, i]));
      this.post = {};
      this.nEixo = {};
      for (const e of ORDEM_EIXOS) { this.post[e] = new Posterior(); this.nEixo[e] = 0; }
      this.usados = new Set();
      this.resp = [];            // histórico
      this.filaSondagem = [];    // [habilidade, nivel_max] a testar
      this.nSondagens = 0;
      this.ponteiro = 0;
    }

    // ---------- estado ----------
    eixoAberto(e) {
      const n = this.nEixo[e];
      if (n >= MAX_EIXO) return false;
      if (n >= MIN_EIXO && this.post[e].ep < SE_ALVO) return false;
      return this.itens.some(i => i.eixo === e && !this.usados.has(i.id));
    }

    terminou() {
      return this.resp.length >= MAX_TOTAL || !ORDEM_EIXOS.some(e => this.eixoAberto(e));
    }

    habsTestadas() {
      return new Set(this.resp.map(r => r.habilidade));
    }

    // ---------- escolha do próximo item: {item, modo} ou null ----------
    proximo() {
      if (this.terminou()) return null;
      while (this.filaSondagem.length) {                       // 1) sondagem de pré-requisito
        const [h, nivelMax] = this.filaSondagem.shift();
        const cand = this.itens.filter(i => i.habilidade === h && !this.usados.has(i.id) && i.nivel <= nivelMax);
        if (cand.length) {
          const theta = this.post[this.hab[h].eixo].media;
          return { item: this._maisInformativo(cand, theta), modo: "sondagem" };
        }
      }
      for (let k = 0; k < ORDEM_EIXOS.length; k++) {          // 2) rodízio entre eixos abertos
        const e = ORDEM_EIXOS[this.ponteiro % ORDEM_EIXOS.length];
        this.ponteiro += 1;
        if (this.eixoAberto(e)) return { item: this._itemDoEixo(e), modo: "rodizio" };
      }
      return null;
    }

    _itemDoEixo(e) {
      const theta = this.post[e].media;
      let cand = this.itens.filter(i => i.eixo === e && !this.usados.has(i.id));
      const testadas = this.habsTestadas();
      const novas = cand.filter(i => !testadas.has(i.habilidade));
      // prioriza habilidades ainda não vistas, desde que haja item a até 1 nível do θ atual
      if (novas.length && Math.min(...novas.map(i => Math.abs(i.b - theta))) <= 1.0) cand = novas;
      return this._maisInformativo(cand, theta);
    }

    _maisInformativo(cand, theta) {
      const dist = i => Math.abs(i.b - theta) - 0.05 * this.hab[i.habilidade].peso_enem - (i.origem.tipo === "ENEM" ? 0.02 : 0);
      const m = Math.min(...cand.map(dist));
      const melhores = cand.filter(i => dist(i) <= m + 0.01);
      return this.rng.choice(melhores);
    }

    // ---------- registro da resposta ----------
    // letra null = botão "Não sei resolver" (conta como erro; confianca = "nao_sei")
    // confianca: "certeza" | "duvida" | "chutei" | "nao_sei"
    responder(item, letra, confianca, tempo_s, modo = "rodizio") {
      const acertou = letra !== null && letra !== undefined && letra === item.gabarito;
      const e = item.eixo;
      this.post[e].atualizar(item.b, acertou);
      this.nEixo[e] += 1;
      this.usados.add(item.id);
      const erro = letra == null ? "Não soube resolver." : item.alternativas.find(a => a.letra === letra).erro;
      this.resp.push({
        id: item.id, eixo: e, habilidade: item.habilidade, nivel: item.nivel,
        letra: letra == null ? null : letra, acertou, erro, confianca,
        tempo_s, modo, theta_eixo: arred(this.post[e].media, 3)
      });
      if (!acertou && item.nivel >= 2 && this.nSondagens < MAX_SONDAGENS) {
        const testadas = this.habsTestadas();
        for (const pre of this.hab[item.habilidade].pre) {
          if (!testadas.has(pre) && this.filaSondagem.every(([p]) => p !== pre)) {
            this.filaSondagem.push([pre, item.nivel - 1]);
            this.nSondagens += 1;
            break;
          }
        }
      }
      return acertou;
    }

    // ---------- resultado ----------
    resultado() {
      const eixos = {};
      for (const e of ORDEM_EIXOS) {
        const p = this.post[e];
        eixos[e] = { theta: arred(p.media, 2), ep: arred(p.ep, 2), nivel: nivelDe(p.media), n: this.nEixo[e] };
      }
      const porHab = {};
      for (const r of this.resp) (porHab[r.habilidade] = porHab[r.habilidade] || []).push(r);
      const habs = {};
      for (const h of Object.keys(this.hab)) {
        const rs = porHab[h] || [];
        let st;
        if (!rs.length) st = "nao_avaliada";
        else {
          const ac = rs.filter(r => r.acertou).map(r => r.nivel);
          const er = rs.filter(r => !r.acertou).map(r => r.nivel);
          if (ac.length && (!er.length || Math.min(...er) > Math.max(...ac))) st = "dominada";
          else if (!ac.length && Math.min(...er) <= 2) st = "lacuna";
          else st = "em_desenvolvimento";
        }
        habs[h] = { status: st, itens: rs.length };
      }
      const quadr = { acerto_seguro: 0, acerto_inseguro: 0, erro_seguro: 0, erro_inseguro: 0 };
      for (const r of this.resp) {
        const seguro = r.confianca === "certeza";
        const k = r.acertou ? (seguro ? "acerto_seguro" : "acerto_inseguro") : (seguro ? "erro_seguro" : "erro_inseguro");
        quadr[k] += 1;
      }
      const pesos = this.pesosEixo();
      const thetaGeral = soma(ORDEM_EIXOS.map(e => eixos[e].theta * pesos[e])) / soma(Object.values(pesos));
      const plano = this.planoAcao(habs, eixos);
      return {
        theta_geral: arred(thetaGeral, 2), nivel_geral: nivelDe(thetaGeral), eixos,
        habilidades: habs, confianca: quadr, total_itens: this.resp.length, plano_acao: plano
      };
    }

    pesosEixo() {
      const pesos = {};
      for (const e of ORDEM_EIXOS) {
        pesos[e] = Object.values(this.hab).filter(v => v.eixo === e).reduce((s, v) => s + v.peso_enem, 0);
      }
      return pesos;
    }

    // prioridade = peso_enem × fator_lacuna + bônus (ver docs/PLANO.md, seção 7.1)
    planoAcao(habs, eixos, top = 8) {
      const fator = { lacuna: 1.0, em_desenvolvimento: 0.6, dominada: 0.0 };
      const fracas = Object.keys(habs).filter(h => habs[h].status === "lacuna" || habs[h].status === "em_desenvolvimento");
      const erroSeguro = new Set(this.resp.filter(r => !r.acertou && r.confianca === "certeza").map(r => r.habilidade));
      const lista = [];
      for (const [h, v] of Object.entries(habs)) {
        const st = v.status;
        const f = st in fator ? fator[st] : (eixos[this.hab[h].eixo].nivel <= 2 ? 0.4 : 0.0);
        if (f === 0) continue;
        let p = this.hab[h].peso_enem * f;
        const ehPre = fracas.some(o => this.hab[o].pre.includes(h));
        if (ehPre) p += 0.5;
        if (erroSeguro.has(h)) p += 0.3;
        lista.push({ habilidade: h, nome: this.hab[h].nome, status: st, prioridade: arred(p, 2),
                     pre_de_fraca: ehPre, erro_com_certeza: erroSeguro.has(h) });
      }
      return lista.sort((x, y) => y.prioridade - x.prioridade).slice(0, top);
    }

    // ---------- persistência (localStorage / código de dados) ----------
    estado() {
      return { resp: this.resp, fila: this.filaSondagem, nSondagens: this.nSondagens, ponteiro: this.ponteiro };
    }

    // Reconstrói o motor refazendo as atualizações das respostas na mesma ordem
    static restaurar(itens, matriz, estado, rng) {
      const m = new Motor(itens, matriz, rng);
      for (const r of estado.resp || []) {
        const item = m.porId.get(r.id);
        m.post[r.eixo].atualizar(item.b, r.acertou);
        m.nEixo[r.eixo] += 1;
        m.usados.add(r.id);
        m.resp.push(r);
      }
      m.filaSondagem = (estado.fila || []).map(x => x.slice());
      m.nSondagens = estado.nSondagens || 0;
      m.ponteiro = estado.ponteiro || 0;
      return m;
    }
  }

  const api = {
    Motor, Posterior, pAcerto, nivelDe, arred, soma,
    C_GUESS, A, D, GRID, PRIOR_MU, PRIOR_SD, ORDEM_EIXOS,
    MIN_EIXO, MAX_EIXO, SE_ALVO, MAX_TOTAL, MAX_SONDAGENS, FAIXAS
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.MotorDiag = api;
})(typeof window !== "undefined" ? window : globalThis);
