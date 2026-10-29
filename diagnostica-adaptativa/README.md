# Diagnóstica Adaptativa · Matemática pré-vestibular

Sistema de avaliação diagnóstica adaptativa para a aluna particular (ENEM e vestibulares de Medicina e Odontologia, 2026).

## Site (GitHub Pages)

| Página | Para quê |
|---|---|
| `index.html` | A avaliação: boas-vindas, cadastro, autoavaliação, questões adaptativas e relatório com "Exportar PDF" |
| `professor.html` | Cola o código de dados do relatório e reconstrói tudo, com filtros por eixo, habilidade e acerto |
| `teste_motor.html` | Teste de aceitação: confere no navegador que o motor JS reproduz o Python |

| Arquivo | Para quê |
|---|---|
| `js/motor.js` | Porte fiel de `scripts/motor_referencia.py` (mesmas constantes, grade EAP, escolha e sondagem) |
| `js/app.js` | Telas, estado no `localStorage` (`diag_mat_v1`), pausa e retomada, tempo por questão (não exibido) |
| `js/relatorio.js` | As 12 seções do relatório e o código de dados (LZ-string) |
| `js/render.js` | Markdown (marked 12.0.2) com LaTeX (KaTeX 0.16.11), protegendo `$...$` e `\$` |
| `css/estilo.css` | Layout de tela (celular e computador) e impressão em A4 |

Bibliotecas externas, via jsDelivr com versão fixa: marked 12.0.2, KaTeX 0.16.11 e LZ-string 1.5.0.

### Publicar

1. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Cada push na `main` roda `.github/workflows/pages.yml`: primeiro o teste de aceitação do motor, depois a publicação.
3. Endereço: `https://<usuário>.github.io/avaliacao_diagnostica/`. A aluna usa a página inicial; o professor usa `professor.html`.

(Alternativa sem Actions: Source "Deploy from a branch", `main`, pasta `/ (root)`. A raiz redireciona para `diagnostica-adaptativa/`.)

### Rodar localmente

```bash
cd diagnostica-adaptativa && python3 -m http.server 8000
```

Depois abra `http://localhost:8000/`. Abrir o `index.html` direto do disco não funciona, porque o banco é carregado por `fetch`.

## Banco, motor e documentação

| Arquivo | Para quê |
|---|---|
| `docs/PLANO.md` | Plano completo: calendário, matriz, algoritmo, relatório, plano de ação e cronograma |
| `docs/ESPECIFICACAO_WEB.md` | Especificação da versão web: contrato de dados, telas, relatório |
| `docs/CURADORIA.md` | Fontes, critérios, conferência de gabarito e limites do banco |
| `banco/itens.json` | 160 itens (ENEM 2022/2024, FUVEST 2018 a 2024, autorais) |
| `banco/matriz.json` | 9 eixos, 41 habilidades, pré-requisitos, pesos e níveis |
| `banco/figuras/` | Figuras dos itens |
| `banco/Banco_Diagnostica.xlsx` | O banco em planilha, para revisão |
| `scripts/motor_referencia.py` | Motor adaptativo de referência (TRI 3PL simplificada, EAP por eixo) e simulação de perfis |
| `scripts/validar_banco.py` | Valida o banco e regenera a planilha |
| `scripts/gerar_teste_motor.py` | Grava `teste/teste_motor.json`: 3 aplicações do motor Python, passo a passo |
| `scripts/teste_motor_node.js` | Roda o teste de aceitação do porte no Node |

Para validar o banco:

```bash
python3 scripts/validar_banco.py
```

Para simular perfis:

```bash
python3 scripts/motor_referencia.py
```

Se mudar o motor Python ou o banco, regenere as sequências e confira o porte:

```bash
python3 scripts/gerar_teste_motor.py
```

```bash
node scripts/teste_motor_node.js
```
