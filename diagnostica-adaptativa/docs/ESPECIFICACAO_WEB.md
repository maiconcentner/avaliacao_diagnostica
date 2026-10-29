# Especificação da versão web · para implementar no Claude Code

## 1. Arquitetura

- **Hospedagem:** site estático no GitHub Pages. Sem servidor e sem build obrigatório: HTML, CSS e JS puros.
- **Dados:** a página carrega `banco/itens.json` e `banco/matriz.json` por `fetch`. As figuras ficam em `banco/figuras/`.
- **Renderização:** Markdown (tabelas, listas, parágrafos) com marked e matemática com KaTeX auto-render.
  - Delimitadores: `$...$` e `$$...$$`.
  - O cifrão literal vem escapado como `\$` (por exemplo, `R\$ 50,00`). Proteja o LaTeX antes de passar pelo Markdown, ou renderize o KaTeX depois do Markdown, para o `\` não ser comido.
- **Estado:** `localStorage`, com chave versionada (`diag_mat_v1`). Salvar a cada resposta e oferecer "Continuar de onde parei". Envolver tudo em try/catch.
- **Motor:** porte fiel de `scripts/motor_referencia.py` para `motor.js`, com as mesmas constantes, a mesma grade EAP e a mesma regra de escolha e de sondagem.

Estrutura sugerida do repositório:

```
index.html          (boas-vindas, cadastro, autoavaliação, teste, relatório: SPA simples)
css/estilo.css      (inclui @media print para o PDF)
js/motor.js         (porte do motor de referência)
js/app.js           (telas, estado, temporização)
js/relatorio.js     (cálculos e montagem do relatório)
banco/              (copiar a pasta banco/ deste projeto)
```

## 2. Contrato de dados

### Item (`banco/itens.json → itens[]`)

```json
{
  "id": "ENEM2024-Q161",
  "origem": {"tipo": "ENEM|FUVEST|AUTORAL", "prova": "ENEM 2024", "ano": 2024, "questao": 161, "nota": ""},
  "eixo": "D", "habilidade": "D2", "nivel": 2, "b": -0.5,
  "enunciado": "markdown com $LaTeX$",
  "figuras": ["banco/figuras/....png"],
  "alternativas": [{"letra": "A", "texto": "...", "erro": "hipótese de erro ou null se correta"}],
  "gabarito": "C",
  "resolucao": "texto curto",
  "tempo_estimado_s": 120
}
```

Cuidados:

- **Gabarito e resolução não podem aparecer para a aluna** durante o teste. No relatório final, mostrar só o que está na seção 5.
- **Mostrar a fonte** em cada questão real: "ENEM 2024 · questão 161". Nos itens autorais, não mostrar nada.

### Resposta registrada

```json
{"id": "...", "eixo": "D", "habilidade": "D2", "nivel": 2, "letra": "B" | null,
 "acertou": false, "erro": "texto do distrator", "confianca": "certeza|duvida|chutei|nao_sei",
 "tempo_s": 84, "modo": "rodizio|sondagem", "theta_eixo": -0.31}
```

## 3. Motor (resumo; a referência é o código Python)

| Parâmetro | Valor |
|---|---|
| Modelo | P = 0,2 + 0,8 / (1 + e^(−1,7(θ − b))) |
| Grade EAP | θ de −3 a 3, passo 0,05 (121 pontos) |
| Priori por eixo | N(−0,5; 1,5) |
| Ordem dos eixos | B, A, C, D, H, E, G, I, F (rodízio, pulando eixos fechados) |
| Por eixo | mínimo 3 itens; fecha com EP < 0,5 ou 6 itens |
| Total | máximo 45 itens |
| Sondagem | erro em item N ≥ 2 → enfileira 1 pré-requisito ainda não testado, com nível ≤ N − 1; máximo 6 |
| Escolha | menor \|b − θ\| − 0,05·peso_enem − 0,02 se ENEM; prioriza habilidades não vistas se houver item a até 1 de distância; desempate aleatório |
| "Não sei resolver" | letra = null, conta como erro, confianca = "nao_sei" |

Status de cada habilidade:

- **dominada:** acertou e não errou item de nível igual ou menor que o maior acerto;
- **lacuna:** não acertou nenhum item e errou algum de nível ≤ 2;
- **em desenvolvimento:** os demais casos com resposta;
- **não avaliada:** sem itens respondidos.

O nível geral é a média de θ dos eixos ponderada pela soma dos `peso_enem` das habilidades de cada eixo. A conversão de θ em nível segue `matriz.niveis[].faixa_theta`.

**Teste de aceitação do porte:** com a mesma sequência de respostas, o θ por eixo do JS deve bater com o do Python até a 3ª casa. Sugestão: exportar do Python 3 sequências fixas para um `teste_motor.json` e checar no navegador.

## 4. Telas e comportamento

1. **Boas-vindas:**
   - o teste se adapta às respostas dela;
   - errar ajuda a mostrar onde focar;
   - leva cerca de 1h30, com pausa possível;
   - usar papel e lápis, sem calculadora;
   - o resultado aparece no final.
2. **Cadastro:** nome, curso pretendido e provas (ENEM, FUVEST, UNESP, outras).
3. **Autoavaliação:** 9 eixos com escala de 1 a 5 ("O quanto você se sente segura em...").
4. **Questão:**
   - enunciado, figura (clique para ampliar) e 5 alternativas grandes, fáceis de tocar no celular;
   - depois de escolher a alternativa, aparecem 3 botões de confiança ("Tinha certeza", "Fiquei em dúvida", "Chutei");
   - o botão secundário "Não sei resolver" fica sempre visível;
   - o "Avançar" só habilita depois de escolher a confiança.
5. **Feedback:** só "Resposta registrada", sem certo ou errado. Barra de progresso estimada (questão X de cerca de 40). Sem cronômetro visível.
6. **Pausa:** botão "Pausar e continuar depois".
7. **Relatório:** na mesma página, ao final. Botões "Exportar PDF" (`window.print()` com CSS de impressão em A4) e "Copiar código de dados".

**Acessibilidade e celular:**

- fonte base de 18px;
- contraste AA;
- layout de uma coluna em telas pequenas;
- teclas 1 a 5 para as alternativas e Enter para avançar, no computador.

**Tom dos textos:** acolhedor e factual, sem infantilizar. Nunca usar "fraco" ou "ruim". Usar "a desenvolver", "base a retomar" e "você já domina".

## 5. Relatório (o que ela exporta em PDF)

| Seção | Conteúdo |
|---|---|
| 1. Identificação | Nome, data, início e fim, duração, número de questões, provas que vai fazer |
| 2. Nível geral | Nível estimado com a faixa (θ ± EP convertida em nível) e um parágrafo de leitura gerado por regra |
| 3. Perfil por eixo | Barras horizontais com θ, faixa de incerteza e o rótulo do nível; marcar as fronteiras N1/N2/N3/N4 |
| 4. Autoavaliação × resultado | Por eixo, o que ela marcou (1 a 5) ao lado do nível medido; destacar onde ela se subestimou |
| 5. Mapa de habilidades | Grade das 41 habilidades, colorida por status, com legenda |
| 6. Pontos fortes | Habilidades dominadas, ordenadas pelo peso no ENEM |
| 7. A desenvolver e base a retomar | Lacunas e itens em desenvolvimento; para cada lacuna, mostrar a cadeia de pré-requisitos (ex.: "E4 Pitágoras ← A4 potências e raízes") |
| 8. Confiança × acerto | Quadrantes com contagem; lista "Você sabia mais do que achava" (acertos com dúvida ou chute) e "Atenção: certeza no erro" |
| 9. Erros mais frequentes | Agrupar o campo `erro` das respostas erradas; mostrar até 8 |
| 10. Tempo | Média por nível; respostas abaixo de 20 s marcadas como possível chute |
| 11. Plano de ação preliminar | Top 8 de `plano_acao()` com a regra da seção 7.1 do PLANO, em linguagem simples ("Retomar: porcentagem, aumentos e descontos sucessivos") |
| 12. Apêndice para o professor | Tabela questão a questão: nº, id/fonte, habilidade, nível, resposta, gabarito, acerto, confiança, tempo, erro. No fim, o código de dados: JSON de respostas, cadastro e autoavaliação, compactado (LZ-string ou base64) |

O CSS de impressão:

- quebra de página antes das seções 5, 8 e 12;
- esconde os botões;
- usa cores que funcionam em impressão.

O apêndice pode ter um título discreto ("Para o professor"). Não há problema em ela ver o gabarito nessa hora, porque o teste já terminou.

## 6. Opcionais

- **Tela do professor** (`professor.html`): cola o código de dados e reconstrói o relatório, com filtros por eixo e habilidade. Útil para comparar aplicações futuras.
- **Envio automático:** POST do JSON para um Google Apps Script que grava numa planilha. Só ativar com o consentimento dela e avisando na tela de boas-vindas.
- **Itens UNESP:** basta acrescentar ao `itens.json` no mesmo formato e rodar `python3 scripts/validar_banco.py`.

## 7. Prompt sugerido para o Claude Code

> Leia `docs/ESPECIFICACAO_WEB.md`, `docs/PLANO.md` e `scripts/motor_referencia.py`. Implemente a avaliação diagnóstica adaptativa como site estático para GitHub Pages, seguindo a estrutura da seção 1. Porte o motor para `js/motor.js` mantendo exatamente as constantes e regras do Python, e crie o teste de aceitação descrito na seção 3. Use marked e KaTeX via CDN com versão fixa. Faça o relatório da seção 5 com CSS de impressão A4. Teste no navegador: faça um teste completo respondendo ao acaso, confira se o relatório aparece inteiro e se o PDF sai sem cortes.
