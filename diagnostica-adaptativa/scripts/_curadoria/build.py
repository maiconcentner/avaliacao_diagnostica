import json, re, os, shutil, hashlib, random, sys
sys.path.insert(0, os.path.dirname(__file__))
from matriz import MATRIZ
from curadoria_real import REAL
from curadoria_autoral import AUT

OUT = sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/outputs/diagnostica-adaptativa"
R = json.load(open("/home/claude/work/raw.json"))
L = "ABCDE"
TEMPO = {1: 60, 2: 120, 3: 180, 4: 240}
os.makedirs(f"{OUT}/banco/figuras", exist_ok=True)

import unicodedata
def mathalpha(s):
    return "".join(unicodedata.normalize("NFKC", ch) if 0x1D400 <= ord(ch) <= 0x1D7FF else ch for ch in s)

def esc_dollar(s):
    s = mathalpha(s)
    s = re.sub(r"\^3\b", "³", s); s = re.sub(r"\^2\b", "²", s)
    s = s.replace("log_2", "log₂").replace("log_10", "log₁₀").replace("cm3", "cm³").replace("m^3", "m³")
    return re.sub(r"R\$", r"R\\$", s)

def clean_stem(q):
    s = q["stem"]
    s = s.replace("[[placeholder]]", "").replace("## ", "")
    s = re.sub(r"\[IMAGE \d+\]", "", s)
    s = re.sub(r"\(cid:\d+\)", "", s)
    if q["src"].startswith("FUVEST"):
        s = re.sub(r"-\s*\n\s*", "-", s)
        s = re.sub(r"[ \t]*\n[ \t]*(?=(I{1,3}|IV|V|VI{1,3})\. |Note e adote|\n)", "\n\n", s)
        s = re.sub(r"(?<!\n)[ \t]*\n[ \t]*(?!\n)", " ", s)
    if q["src"].startswith("ENEM 2022"):
        s = re.sub(r"\s*\n\s*•", "\n- ", s)
        s = re.sub(r"(?<!\n)\n(?!\n|- )", " ", s)
    s = s.replace(" por cento", "%").replace("•", "- ")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s).strip()
    return esc_dollar(s)

def clean_alt(a):
    a = re.sub(r"^\s*([a-eA-E])\)\s*", "", a)
    a = re.sub(r"^\s*[A-E]\s{2,}", "", a)
    a = a.strip().rstrip()
    return esc_dollar(a)

def fig_paths(q):
    out = []
    for f in q["figs"]:
        if q["src"].startswith("ENEM 2024"):
            src = "/home/claude/gpt-4-enem/data/" + f
        else:
            src = "/home/claude/bluex/" + f
        if not os.path.exists(src):
            print("FIGURA FALTANDO", src); continue
        y = q["src"].split()[1]
        name = f"{q['src'].split()[0]}{y}_Q{q['num']}_{len(out)}{os.path.splitext(src)[1]}"
        shutil.copy(src, f"{OUT}/banco/figuras/{name}")
        out.append(f"banco/figuras/{name}")
    return out

itens = []
for c in REAL:
    q = R[c["idx"]]
    tipo, ano = q["src"].split()
    alts = c.get("alts") or [clean_alt(a) for a in q["alts"]]
    assert len(alts) == 5, (c["idx"], alts)
    gab = c.get("gab") or q["ans"].strip().upper()
    hab = c["hab"]; n = c["n"]
    it = dict(
        id=f"{tipo}{ano}-Q{q['num']}",
        origem=dict(tipo=tipo, prova=f"{tipo} {ano}", ano=int(ano), questao=q["num"],
                    nota=("Gabarito corrigido após resolução (fonte trazia " + q["ans"] + ")") if c.get("gab") else ""),
        eixo=MATRIZ["habilidades"][hab]["eixo"], habilidade=hab, nivel=n, b=MATRIZ["niveis"][str(n)]["b"],
        enunciado=c.get("stem") or clean_stem(q),
        figuras=[] if c.get("sem_fig") else fig_paths(q),
        alternativas=[dict(letra=L[i], texto=alts[i], erro=None if L[i] == gab else c["erros"].get(L[i], "")) for i in range(5)],
        gabarito=gab, resolucao=c["res"], tempo_estimado_s=TEMPO[n],
        texto_reescrito=bool(c.get("stem")),
    )
    itens.append(it)

cont = {}
for c in AUT:
    cont[c["hab"]] = cont.get(c["hab"], 0) + 1
    iid = f"AUT-{c['hab']}-{cont[c['hab']]:02d}"
    opts = [(c["ok"], None)] + list(c["w"])
    rnd = random.Random(int(hashlib.md5(iid.encode()).hexdigest(), 16))
    rnd.shuffle(opts)
    gab = L[[o[1] for o in opts].index(None)]
    n = c["n"]
    itens.append(dict(
        id=iid, origem=dict(tipo="AUTORAL", prova="Autoral (Maicon Centner)", ano=2026, questao=None, nota=""),
        eixo=MATRIZ["habilidades"][c["hab"]]["eixo"], habilidade=c["hab"], nivel=n, b=MATRIZ["niveis"][str(n)]["b"],
        enunciado=c["stem"], figuras=[],
        alternativas=[dict(letra=L[i], texto=opts[i][0], erro=opts[i][1]) for i in range(5)],
        gabarito=gab, resolucao=c["res"], tempo_estimado_s=TEMPO[n], texto_reescrito=False))

json.dump(MATRIZ, open(f"{OUT}/banco/matriz.json", "w"), ensure_ascii=False, indent=1)
json.dump(dict(versao="1.0", gerado_em="2026-10-28", total=len(itens), itens=itens),
          open(f"{OUT}/banco/itens.json", "w"), ensure_ascii=False, indent=1)
print("itens:", len(itens))
