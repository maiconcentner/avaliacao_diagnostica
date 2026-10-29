"""
Motor de referência da Avaliação Diagnóstica Adaptativa (Matemática, pré-vestibular).
Especificação executável: a versão web (JS) deve reproduzir esta lógica.

Modelo: TRI de 3 parâmetros simplificada, com um θ (proficiência) por eixo.
  P(acerto | θ, b) = c + (1 - c) / (1 + exp(-D·a·(θ - b)))   c = 0,2 (5 alternativas), a = 1, D = 1,7
Estimação: EAP em grade (θ de -3 a 3, passo 0,05), priori normal N(-0,5; 1,5) (calibrada por simulação).
Uso:  python3 motor_referencia.py            -> roda simulações de perfis
"""
import json, math, random, os
from collections import defaultdict

BASE = os.path.join(os.path.dirname(__file__), "..", "banco")
C_GUESS, A, D = 0.2, 1.0, 1.7
GRID = [-3 + 0.05 * k for k in range(121)]
PRIOR_MU, PRIOR_SD = -0.5, 1.5
ORDEM_EIXOS = ["B", "A", "C", "D", "H", "E", "G", "I", "F"]   # B e A primeiro: aquecimento com conteúdos familiares
MIN_EIXO, MAX_EIXO, SE_ALVO = 3, 6, 0.50
MAX_TOTAL, MAX_SONDAGENS = 45, 6
FAIXAS = [(-99, -1.0, 1), (-1.0, 0.0, 2), (0.0, 1.0, 3), (1.0, 99, 4)]


def p_acerto(theta, b):
    return C_GUESS + (1 - C_GUESS) / (1 + math.exp(-D * A * (theta - b)))


def nivel_de(theta):
    for lo, hi, n in FAIXAS:
        if lo <= theta < hi:
            return n


class Posterior:
    def __init__(self):
        self.w = [math.exp(-0.5 * ((t - PRIOR_MU) / PRIOR_SD) ** 2) for t in GRID]
        self._norm()

    def _norm(self):
        s = sum(self.w); self.w = [x / s for x in self.w]

    def atualizar(self, b, acertou):
        self.w = [w * (p_acerto(t, b) if acertou else 1 - p_acerto(t, b)) for w, t in zip(self.w, GRID)]
        self._norm()

    @property
    def media(self):
        return sum(w * t for w, t in zip(self.w, GRID))

    @property
    def ep(self):
        m = self.media
        return math.sqrt(sum(w * (t - m) ** 2 for w, t in zip(self.w, GRID)))


class Motor:
    def __init__(self, itens, matriz, seed=None):
        self.itens = itens
        self.hab = matriz["habilidades"]
        self.rng = random.Random(seed)
        self.post = {e: Posterior() for e in ORDEM_EIXOS}
        self.n_eixo = defaultdict(int)
        self.usados = set()
        self.resp = []                 # histórico
        self.fila_sondagem = []        # habilidades pré-requisito a testar
        self.n_sondagens = 0
        self.ponteiro = 0

    # ---------- estado ----------
    def eixo_aberto(self, e):
        n = self.n_eixo[e]
        if n >= MAX_EIXO:
            return False
        if n >= MIN_EIXO and self.post[e].ep < SE_ALVO:
            return False
        return any(i["eixo"] == e and i["id"] not in self.usados for i in self.itens)

    def terminou(self):
        return len(self.resp) >= MAX_TOTAL or not any(self.eixo_aberto(e) for e in ORDEM_EIXOS)

    def habs_testadas(self):
        return {r["habilidade"] for r in self.resp}

    # ---------- escolha do próximo item ----------
    def proximo(self):
        if self.terminou():
            return None
        while self.fila_sondagem:                       # 1) sondagem de pré-requisito
            h, nivel_max = self.fila_sondagem.pop(0)
            cand = [i for i in self.itens if i["habilidade"] == h and i["id"] not in self.usados and i["nivel"] <= nivel_max]
            if cand:
                theta = self.post[self.hab[h]["eixo"]].media
                return self._mais_informativo(cand, theta), "sondagem"
        for _ in range(len(ORDEM_EIXOS)):              # 2) rodízio entre eixos abertos
            e = ORDEM_EIXOS[self.ponteiro % len(ORDEM_EIXOS)]
            self.ponteiro += 1
            if self.eixo_aberto(e):
                return self._item_do_eixo(e), "rodizio"
        return None

    def _item_do_eixo(self, e):
        theta = self.post[e].media
        cand = [i for i in self.itens if i["eixo"] == e and i["id"] not in self.usados]
        testadas = self.habs_testadas()
        novas = [i for i in cand if i["habilidade"] not in testadas]
        # prioriza habilidades ainda não vistas, desde que haja item a até 1 nível do θ atual
        if novas and min(abs(i["b"] - theta) for i in novas) <= 1.0:
            cand = novas
        return self._mais_informativo(cand, theta)

    def _mais_informativo(self, cand, theta):
        dist = lambda i: abs(i["b"] - theta) - 0.05 * self.hab[i["habilidade"]]["peso_enem"] - (0.02 if i["origem"]["tipo"] == "ENEM" else 0)
        m = min(dist(i) for i in cand)
        melhores = [i for i in cand if dist(i) <= m + 0.01]
        return self.rng.choice(melhores)

    # ---------- registro da resposta ----------
    def responder(self, item, letra, confianca, tempo_s, modo="rodizio"):
        # letra None = botão "Não sei resolver" (conta como erro; confianca = "nao_sei")
        # confianca: "certeza" | "duvida" | "chutei" | "nao_sei"
        acertou = letra is not None and letra == item["gabarito"]
        e = item["eixo"]
        self.post[e].atualizar(item["b"], acertou)
        self.n_eixo[e] += 1
        self.usados.add(item["id"])
        erro = "Não soube resolver." if letra is None else next(a for a in item["alternativas"] if a["letra"] == letra)["erro"]
        self.resp.append(dict(id=item["id"], eixo=e, habilidade=item["habilidade"], nivel=item["nivel"],
                              letra=letra, acertou=acertou, erro=erro, confianca=confianca,
                              tempo_s=tempo_s, modo=modo, theta_eixo=round(self.post[e].media, 3)))
        if not acertou and item["nivel"] >= 2 and self.n_sondagens < MAX_SONDAGENS:
            testadas = self.habs_testadas()
            for pre in self.hab[item["habilidade"]]["pre"]:
                if pre not in testadas and all(p != pre for p, _ in self.fila_sondagem):
                    self.fila_sondagem.append((pre, item["nivel"] - 1))
                    self.n_sondagens += 1
                    break
        return acertou

    # ---------- resultado ----------
    def resultado(self):
        eixos = {}
        for e in ORDEM_EIXOS:
            p = self.post[e]
            eixos[e] = dict(theta=round(p.media, 2), ep=round(p.ep, 2), nivel=nivel_de(p.media), n=self.n_eixo[e])
        habs = {}
        por_hab = defaultdict(list)
        for r in self.resp:
            por_hab[r["habilidade"]].append(r)
        for h in self.hab:
            rs = por_hab.get(h, [])
            if not rs:
                st = "nao_avaliada"
            else:
                ac = [r["nivel"] for r in rs if r["acertou"]]
                er = [r["nivel"] for r in rs if not r["acertou"]]
                if ac and (not er or min(er) > max(ac)):
                    st = "dominada"
                elif not ac and min(er) <= 2:
                    st = "lacuna"
                else:
                    st = "em_desenvolvimento"
            habs[h] = dict(status=st, itens=len(rs))
        quadr = defaultdict(int)
        for r in self.resp:
            seguro = r["confianca"] == "certeza"
            k = ("acerto_seguro" if seguro else "acerto_inseguro") if r["acertou"] else ("erro_seguro" if seguro else "erro_inseguro")
            quadr[k] += 1
        pesos = {e: sum(v["peso_enem"] for v in self.hab.values() if v["eixo"] == e) for e in ORDEM_EIXOS}
        theta_geral = sum(eixos[e]["theta"] * pesos[e] for e in ORDEM_EIXOS) / sum(pesos.values())
        plano = self.plano_acao(habs, eixos)
        return dict(theta_geral=round(theta_geral, 2), nivel_geral=nivel_de(theta_geral), eixos=eixos,
                    habilidades=habs, confianca=dict(quadr), total_itens=len(self.resp), plano_acao=plano)

    def plano_acao(self, habs, eixos, top=8):
        """prioridade = peso_enem × fator_lacuna + bônus (ver docs/PLANO.md, seção 7.1)"""
        fator = {"lacuna": 1.0, "em_desenvolvimento": 0.6, "dominada": 0.0}
        fracas = {h for h, v in habs.items() if v["status"] in ("lacuna", "em_desenvolvimento")}
        erro_seguro = {r["habilidade"] for r in self.resp if not r["acertou"] and r["confianca"] == "certeza"}
        lista = []
        for h, v in habs.items():
            st = v["status"]
            f = fator.get(st, 0.4 if eixos[self.hab[h]["eixo"]]["nivel"] <= 2 else 0.0)
            if f == 0:
                continue
            p = self.hab[h]["peso_enem"] * f
            if any(h in self.hab[o]["pre"] for o in fracas):
                p += 0.5
            if h in erro_seguro:
                p += 0.3
            lista.append(dict(habilidade=h, nome=self.hab[h]["nome"], status=st, prioridade=round(p, 2)))
        return sorted(lista, key=lambda x: -x["prioridade"])[:top]


# ---------------- simulação ----------------
def carregar():
    itens = json.load(open(os.path.join(BASE, "itens.json")))["itens"]
    matriz = json.load(open(os.path.join(BASE, "matriz.json")))
    return itens, matriz


def simular(perfil_theta, itens, matriz, seed, insegura=False):
    rng = random.Random(seed)
    m = Motor(itens, matriz, seed=seed)
    while True:
        prox = m.proximo()
        if not prox:
            break
        item, modo = prox
        th = perfil_theta[item["eixo"]]
        ok = rng.random() < p_acerto(th, item["b"])
        letra = item["gabarito"] if ok else rng.choice([a["letra"] for a in item["alternativas"] if a["letra"] != item["gabarito"]])
        if insegura:
            conf = "chutei" if rng.random() < 0.4 else "duvida"
        else:
            conf = "certeza" if ok and rng.random() < 0.7 else "duvida"
        m.responder(item, letra, conf, 90, modo)
    return m.resultado(), perfil_theta


if __name__ == "__main__":
    itens, matriz = carregar()
    perfis = {
        "base fraca (N1 em tudo)": {e: -1.6 for e in ORDEM_EIXOS},
        "insegura com nível real N2/N3": dict(A=0.2, B=0.4, C=-0.3, D=-0.2, E=-0.6, F=-1.2, G=-0.4, H=0.1, I=-0.8),
        "média ENEM (N3)": {e: 0.5 for e in ORDEM_EIXOS},
        "forte (N4)": {e: 1.5 for e in ORDEM_EIXOS},
    }
    N = 300
    for nome, perfil in perfis.items():
        erros, acertos_nivel, tot = [], 0, []
        for s in range(N):
            res, real = simular(perfil, itens, matriz, seed=s, insegura="insegura" in nome)
            for e in ORDEM_EIXOS:
                erros.append(abs(res["eixos"][e]["theta"] - real[e]))
                acertos_nivel += int(abs(res["eixos"][e]["nivel"] - nivel_de(real[e])) <= 0)
            tot.append(res["total_itens"])
        print(f"{nome:34s} itens/teste: {sum(tot)/N:4.1f}  erro médio |θ|: {sum(erros)/len(erros):.2f}  "
              f"nível do eixo exato: {100*acertos_nivel/(N*len(ORDEM_EIXOS)):.0f}%")
