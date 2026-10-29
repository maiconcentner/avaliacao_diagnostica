# Curadoria do banco de questões

## Fontes

| Fonte | O que veio | Como foi obtido |
|---|---|---|
| ENEM 2024 (INEP) | Caderno de Matemática, questões 136 a 180, com figuras e descrições de acessibilidade | Conjunto público `piresramon/gpt-4-enem` (GitHub), transcrito da prova oficial |
| ENEM 2022 (INEP) | Caderno de Matemática, questões 136 a 180 | Mesmo conjunto (texto extraído do PDF oficial, sem figuras) |
| FUVEST 2018 a 2024 (1ª fase) | Questões de Matemática, com figuras | Conjunto BLUEX (`portuguese-benchmark-datasets/BLUEX`), anotado manualmente pelos autores a partir das provas oficiais |
| Autorais | 55 itens de base (N1) e de lacunas de cobertura | Elaborados nesta curadoria |

## Critérios de seleção

- Só entraram itens que funcionam sem a figura, ou cuja figura veio junto e está legível.
- Questões em que a figura é a própria alternativa (gráficos como opção) ficaram de fora, pela dificuldade de exibir bem no celular.
- Enunciados do ENEM 2024 vieram da versão "ledor", em que a matemática é escrita por extenso ("fração, numerador..."). Foram reescritos em notação matemática (LaTeX), sem alterar dados nem comando. Esses itens estão marcados com `texto_reescrito: true`.
- Enunciados do ENEM 2022 com tabelas ou gráficos quebrados na extração foram reescritos com os dados do original, em forma de tabela.

## Conferência de gabarito

Cada item foi resolvido e a resposta comparada com o gabarito da fonte. Resultado:

| Item | O que aconteceu | Decisão |
|---|---|---|
| FUVEST 2021, Q5 (taxa da máquina de cartão) | A fonte trazia A (V = P + 0,06). A resolução dá D (V = P/0,94). | Corrigido para D, com nota no item |
| ENEM 2022, Q169 (gemas e moedas) | A leitura do comando é ambígua e a resolução não bate com o gabarito da fonte | Retirado do banco |
| ENEM 2022, Q140, Q146, Q148, Q155, Q156, Q159, Q160, Q165, Q168, Q173, Q176, Q177, Q178, Q180 | Dependem de figura ou gráfico que se perdeu na extração, ou ficaram ambíguos sem a prova original | Não incluídos |

Os outros itens selecionados tiveram o gabarito confirmado pela resolução registrada no campo `resolucao`.

## Classificação

- **Habilidade:** a principal mobilizada para resolver a questão (uma por item).
- **Nível:**
  - **N1:** conteúdo do Fundamental, aplicação direta;
  - **N2:** ENEM fácil, um ou dois passos;
  - **N3:** ENEM médio ou difícil, ou FUVEST de enunciado curto;
  - **N4:** FUVEST e ENEM difícil, com vários passos ou modelagem.
- **Erro mapeado:** hipótese do raciocínio que leva a cada distrator, no espírito da análise do erro usada no AvaliaSESI. Nos itens reais, a hipótese foi reconstruída pela conta que gera o valor do distrator.

## Limites e próximos passos

- **UNESP:** não encontrei uma fonte estruturada e confiável, com gabarito, para a 1ª fase. Para incluir, basta ter os PDFs das provas: dá para extrair umas 10 questões de Matemática e acrescentar no mesmo formato.
- **UFSCar:** seleciona pelo SISU, então os itens do ENEM cobrem essa parte.
- **Níveis:** os níveis foram atribuídos por julgamento, não por calibração estatística. Depois de algumas aplicações (com ela e com outros alunos particulares), dá para recalibrar o b de cada item com os dados reais.
- **Revisão:** a planilha `banco/Banco_Diagnostica.xlsx` traz tudo numa tabela para revisão rápida. Ajustes devem ser feitos nos arquivos de curadoria e o `itens.json` regerado, ou direto no JSON e conferidos com `python3 scripts/validar_banco.py`.
