"""Gera teste/teste_motor.json: 3 aplicações simuladas pelo motor de referência (Python),
com a sequência de itens, as respostas, o θ do eixo a cada passo e o resultado final.
O porte em JS (js/motor.js) refaz as mesmas sequências e precisa bater com estes números
(ver teste_motor.html no navegador ou `node scripts/teste_motor_node.js`).
Uso: python3 scripts/gerar_teste_motor.py"""
import json, os, random
from motor_referencia import Motor, carregar, p_acerto, ORDEM_EIXOS

SAIDA = os.path.join(os.path.dirname(__file__), "..", "teste", "teste_motor.json")

PERFIS = [
    ("base fraca (N1)", {e: -1.6 for e in ORDEM_EIXOS}, 11),
    ("insegura, real entre N2 e N3", dict(A=0.2, B=0.4, C=-0.3, D=-0.2, E=-0.6, F=-1.2, G=-0.4, H=0.1, I=-0.8), 22),
    ("forte (N4)", {e: 1.5 for e in ORDEM_EIXOS}, 33),
]


def aplicar(perfil, seed):
    rng = random.Random(seed)
    m = Motor(*carregar(), seed=seed)
    passos = []
    while True:
        prox = m.proximo()
        if not prox:
            break
        item, modo = prox
        ok = rng.random() < p_acerto(perfil[item["eixo"]], item["b"])
        if not ok and rng.random() < 0.15:          # usa também o "Não sei resolver"
            letra, conf = None, "nao_sei"
        else:
            letra = item["gabarito"] if ok else rng.choice([a["letra"] for a in item["alternativas"] if a["letra"] != item["gabarito"]])
            conf = rng.choice(["certeza", "duvida", "chutei"])
        tempo = rng.randint(8, 300)
        m.responder(item, letra, conf, tempo, modo)
        e = item["eixo"]
        passos.append(dict(id=item["id"], modo=modo, letra=letra, confianca=conf, tempo_s=tempo,
                           theta_eixo=m.resp[-1]["theta_eixo"], media=m.post[e].media, ep=m.post[e].ep))
    return passos, m.resultado()


if __name__ == "__main__":
    casos = []
    for nome, perfil, seed in PERFIS:
        passos, res = aplicar(perfil, seed)
        casos.append(dict(nome=nome, seed=seed, passos=passos, resultado=res))
        print(f"{nome}: {len(passos)} itens, nível geral N{res['nivel_geral']} (θ = {res['theta_geral']})")
    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump(dict(gerado_por="scripts/gerar_teste_motor.py", casos=casos), f, ensure_ascii=False, indent=1)
    print("Gravado:", os.path.normpath(SAIDA))
