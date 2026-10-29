# Avaliação Diagnóstica Adaptativa de Matemática · Pré-vestibular

Plano completo · Prof. Maicon Centner · 28/10/2026

## 1. Contexto

- **Aluna:** aluna particular, egressa do Ensino Médio, que vai prestar ENEM e vestibulares para Medicina e Odontologia neste ano.
- **Autoavaliação:** ela se diz "nível 1", mas reconhece vários nomes de conteúdos. A insegurança pode estar escondendo conhecimento. O diagnóstico precisa separar o que ela não sabe do que ela sabe e não confia.
- **Entrega:** página publicada no GitHub Pages. Ela faz o teste online, vê o resultado e o nível estimado só no final, exporta o relatório em PDF e envia ao professor.

### Calendário (fonte: FUVEST e VUNESP, divulgado em 2026)

| Data | Prova | Observação |
|---|---|---|
| 01/11 (dom) | FUVEST 1ª fase | Daqui a 4 dias. O diagnóstico não chega a tempo de mudar essa prova. |
| 08/11 (dom) | ENEM, 1º dia | Linguagens, Humanas e Redação |
| 15/11 (dom) | ENEM, 2º dia | **Matemática** e Natureza |
| 22/11 (dom) | UNESP 1ª fase | Conhecimentos gerais |
| 06 e 07/12 | FUVEST 2ª fase | Se ela passar na 1ª fase |
| 13 e 14/12 | UNESP 2ª fase | Se ela passar na 1ª fase |

A UFSCar seleciona pelo SISU, então a nota do ENEM cobre essa parte.

**Consequência para o plano:** o diagnóstico precisa ser aplicado o quanto antes (até sexta, 30/10). O plano de ação deixa de ser uma recomposição longa e vira um plano de reta final de cerca de 2 semanas até o ENEM, com foco no que mais rende ponto.

## 2. Objetivos do diagnóstico

1. Estimar o nível dela em cada eixo e um nível geral, em quatro faixas:
   - **N1:** base do Fundamental;
   - **N2:** Médio básico, ENEM fácil;
   - **N3:** ENEM médio e difícil;
   - **N4:** vestibulares paulistas.
2. Apontar pontos fortes, pontos fracos e a base matemática fragilizada, rastreando os pré-requisitos.
3. Separar quatro situações, cruzando acerto com confiança:
   - **acerto com certeza:** domínio;
   - **acerto com dúvida ou chute:** sabe e não confia;
   - **erro com certeza:** erro conceitual fixado;
   - **erro com dúvida ou "não sei":** lacuna reconhecida.
4. Registrar o tipo de erro cometido, pelo distrator escolhido (análise do erro).
5. Gerar um rascunho de plano de ação ordenado por prioridade.

## 3. Matriz de habilidades

41 habilidades em 9 eixos. Cada habilidade tem pré-requisitos e peso de incidência no ENEM e nos vestibulares (3 alto, 2 médio, 1 baixo). Arquivo: `banco/matriz.json`.

| Eixo | Habilidades |
|---|---|
| A. Números e operações | A1 operações e sinais · A2 frações · A3 sistema de numeração · A4 potências e raízes · A5 notação científica e ordem de grandeza · A6 divisibilidade, MMC, MDC, primos |
| B. Proporcionalidade | B1 razão e proporção · B2 regra de três e divisão proporcional · B3 porcentagem · B4 escala · B5 unidades de medida |
| C. Álgebra | C1 expressões e modelagem · C2 equação do 1º grau · C3 sistemas · C4 produtos notáveis e fatoração · C5 equação do 2º grau |
| D. Funções | D1 leitura de gráficos e tabelas · D2 afim · D3 quadrática · D4 exponencial · D5 logaritmo · D6 conceito, composição e inversa |
| E. Geometria plana | E1 ângulos e polígonos · E2 áreas e perímetros · E3 semelhança e Tales · E4 Pitágoras · E5 circunferência e círculo |
| F. Trigonometria | F1 triângulo retângulo · F2 ciclo e funções · F3 leis dos senos e cossenos |
| G. Geometria espacial | G1 sólidos e planificações · G2 prismas e cilindros · G3 cones, pirâmides e esferas |
| H. Estatística, contagem e probabilidade | H1 média, mediana, moda · H2 princípio multiplicativo · H3 arranjos e combinações · H4 probabilidade |
| I. Sequências, financeira e analítica | I1 PA · I2 PG · I3 juros · I4 geometria analítica |

Habilidades de maior peso no ENEM, que pesam mais no nível geral e na prioridade do plano: B1, B2, B3, B4, D1, D2, E2, G2, H1, H4 e C2.

## 4. Banco de questões

| Origem | Itens | Observação |
|---|---|---|
| ENEM 2022 e 2024 | 63 | Provas oficiais do INEP, caderno de Matemática |
| FUVEST 2018 a 2024 | 42 | 1ª fase, com figuras originais |
| Autorais | 55 | Base N1 e lacunas de cobertura, com erro mapeado em cada distrator |
| **Total** | **160** | Todas as 41 habilidades cobertas |

Cada item traz:

- eixo, habilidade e nível;
- dificuldade (b);
- enunciado em Markdown com LaTeX;
- figuras;
- 5 alternativas, cada distrator com o erro mapeado;
- gabarito conferido por resolução;
- resolução curta;
- tempo estimado.

Detalhes da curadoria em `docs/CURADORIA.md`.

**Lacuna conhecida:** não há itens da UNESP. Não encontrei fonte estruturada e confiável com gabarito. Os itens da FUVEST cobrem o estilo dos vestibulares paulistas. Se você tiver provas da UNESP em PDF, dá para incluir uns 10 itens depois.

## 5. Como o teste funciona

### 5.1 Fluxo da aluna

1. **Boas-vindas:** explica que o teste se adapta a ela e que errar faz parte (é assim que o teste descobre onde ajudar). Orienta usar papel e lápis, sem calculadora, como no ENEM.
2. **Cadastro rápido:** nome, curso pretendido e provas que vai fazer.
3. **Autoavaliação inicial:** em cada um dos 9 eixos, "o quanto você se sente segura" (1 a 5). No relatório, isso é comparado com o nível medido. Para uma aluna insegura, ver a diferença entre o que ela acha e o que ela mostrou é uma informação poderosa.
4. **Questões, uma por tela.** Depois de marcar a alternativa, ela informa a confiança: "tinha certeza", "fiquei em dúvida" ou "chutei". Há também o botão "Não sei resolver", que vale como erro, mas sem o ruído do chute.
5. **Avanço sem correção visível:** ao avançar, o sistema corrige e escolhe a próxima questão, mas não mostra se ela acertou. Aparece só "Resposta registrada".
6. **Barra de progresso** por quantidade aproximada de questões, sem cronômetro na tela. O tempo é medido, mas não exibido, para não aumentar a ansiedade.
7. **Pausa:** ela pode parar e retomar depois no mesmo navegador.
8. **Fim:** relatório completo com o nível estimado e botão "Exportar PDF".

### 5.2 Algoritmo adaptativo

Implementado em `scripts/motor_referencia.py`, que serve de especificação para a versão web.

- **Modelo:** TRI de 3 parâmetros simplificada, com uma proficiência θ por eixo. A dificuldade b vem do nível do item: N1 = −1,5; N2 = −0,5; N3 = 0,5; N4 = 1,5. O acerto ao acaso é c = 0,2 (5 alternativas).
- **Estimativa:** EAP em grade, com priori N(−0,5; 1,5). Começa no N2, não no N1, porque ela se subestima.
- **Ordem dos eixos:** rodízio entre os eixos, começando por Proporcionalidade e Números, que são os mais familiares e servem de aquecimento.
- **Escolha do item:** dentro do eixo, o item mais informativo, com dificuldade mais próxima do θ atual. Prioriza habilidades ainda não vistas e as de maior peso no ENEM.
- **Sondagem de pré-requisito:** se ela erra um item de N2 ou acima, o sistema testa uma habilidade pré-requisito ainda não avaliada, num nível abaixo. Exemplo: errou Pitágoras, testa potências e raízes. Máximo de 6 sondagens.
- **Parada por eixo:** mínimo de 3 itens. O eixo fecha quando o erro-padrão cai abaixo de 0,5 ou chega a 6 itens.
- **Parada geral:** 45 itens ou todos os eixos fechados. Duração estimada de 75 a 100 minutos.

### 5.3 Quão confiável é a estimativa

Rodei 200 a 300 simulações para cada perfil de aluna. A tabela mostra em que porcentagem das simulações o teste acertou o nível:

| Perfil simulado | Nível geral correto | Nível do eixo exato | Nível do eixo com até 1 de diferença |
|---|---|---|---|
| Base fraca (N1) | 95% | 76% | 97% |
| Insegura, real entre N2 e N3 | 82% | 53% | 97% |
| Média ENEM (N3) | 87% | 57% | 98% |
| Forte (N4) | 60% | 50% | 96% |

Leitura:

- **Nível geral:** confiável.
- **Nível por eixo:** é uma boa indicação, mas deve ser lido como faixa. Com cerca de 5 itens por eixo, essa é a precisão possível. Por isso o relatório mostra θ com a faixa de incerteza, e não só o rótulo do nível.
- **Perfil forte:** o teste tende a subestimar, porque há poucos itens N4 em alguns eixos. Para o perfil provável dela, isso não pesa.

## 6. Relatório final

O relatório é o que ela exporta em PDF e envia. Especificação detalhada em `docs/ESPECIFICACAO_WEB.md`. Seções:

1. **Identificação:** nome, data, duração, número de questões.
2. **Nível geral estimado,** com texto de leitura em linguagem acolhedora e factual.
3. **Perfil por eixo:** barras com θ, faixa de incerteza e nível.
4. **Autoavaliação × resultado,** eixo por eixo.
5. **Mapa das 41 habilidades:** dominada, em desenvolvimento, lacuna ou não avaliada.
6. **Pontos fortes.**
7. **Pontos a desenvolver e base fragilizada,** com a cadeia de pré-requisitos.
8. **Confiança × acerto:** os quatro quadrantes, com a lista "você sabia mais do que achava".
9. **Erros mais frequentes,** a partir dos distratores escolhidos.
10. **Tempo:** média por nível e respostas rápidas demais (possível chute).
11. **Plano de ação preliminar,** gerado por regra (seção 7).
12. **Apêndice para o professor:** tabela questão a questão e código de dados (JSON compactado), para reimportar e analisar.

## 7. Plano de ação

### 7.1 Regra de prioridade (gerada automaticamente no relatório)

Para cada habilidade, calcula-se uma prioridade:

> prioridade = peso no ENEM × lacuna + bônus

O fator de lacuna vale:

- 1,0 se a habilidade for lacuna;
- 0,6 se estiver em desenvolvimento;
- 0,4 se não foi avaliada e o eixo ficou abaixo de N3;
- 0 se estiver dominada.

Os bônus somam:

- **+0,5** se a habilidade for pré-requisito de outra que ela errou;
- **+0,3** se houve erro com certeza (erro conceitual fixado).

As 8 primeiras viram o plano.

### 7.2 Estrutura da reta final (a ajustar com o resultado)

| Bloco | Período | Foco |
|---|---|---|
| 1. Consertar a base que mais rende | 30/10 a 07/11 | As habilidades de maior prioridade com peso alto no ENEM (porcentagem, proporção, leitura de gráfico, áreas e volumes, estatística). Primeiro os erros conceituais (erro com certeza), depois as lacunas. |
| 2. Treino no formato ENEM | 09 a 14/11 | Itens N2 e N3 do ENEM, cronometrados (cerca de 3 min por questão). Estratégia de prova: resolver primeiro as fáceis, não deixar em branco, conferir as de "acerto inseguro". |
| 3. Vestibular | 16 a 21/11 | Para a UNESP: funções, trigonometria e geometria analítica, conforme o diagnóstico, com itens N3 e N4. |
| 4. Depois das 1ªs fases | dezembro em diante | Se ela for para a 2ª fase ou decidir prestar em 2027, um plano longo de recomposição pelos pré-requisitos, com planejamento reverso a partir da matriz. |

### 7.3 Trabalho com a insegurança

- Mostrar a ela, com os dados do relatório, as questões que acertou marcando "chutei" ou "dúvida".
- Ensinar estratégias de conferência que dão segurança: estimar a ordem de grandeza, testar a alternativa na equação, desenhar a situação.
- No ENEM, a coerência pesa na TRI. Garantir os acertos nas questões fáceis (N2) vale mais que arriscar as difíceis. Para uma aluna insegura, isso é um bom argumento: ela não precisa acertar as difíceis para ter boa nota.

## 8. Cronograma de execução

| Quando | O quê | Quem |
|---|---|---|
| 28/10 | Matriz, banco, motor de referência, plano e especificação | Feito |
| 28 e 29/10 | Revisão rápida do banco na planilha `Banco_Diagnostica.xlsx` | Maicon |
| 29/10 | Implementação web no Claude Code (`docs/ESPECIFICACAO_WEB.md`) e publicação no GitHub Pages | Maicon |
| 29/10 | Teste completo no celular e no computador, incluindo a exportação do PDF | Maicon |
| até 30/10 | Aplicação com a aluna | Aluna |
| 31/10 | Análise do relatório e fechamento do plano de ação | Maicon |

## 9. Riscos e cuidados

- **Tempo:** a aplicação precisa acontecer até 30/10 para o plano ter efeito antes do ENEM.
- **Fadiga:** 45 questões é bastante. A pausa com retomada resolve, mas o ideal é uma sessão só, num horário tranquilo.
- **Chute:** o parâmetro de acerto ao acaso e o botão "Não sei resolver" reduzem o efeito. Respostas muito rápidas aparecem marcadas no relatório.
- **Uso das questões oficiais:** as provas do ENEM são públicas (INEP). As da FUVEST são usadas aqui para fins educacionais, com fonte citada em cada item.
- **Privacidade:** os dados ficam só no navegador dela até ela exportar. Nada é enviado a servidor, a não ser que você decida ativar um envio automático (opção descrita na especificação).
