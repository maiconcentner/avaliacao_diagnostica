# Diagnóstica Adaptativa · Matemática pré-vestibular

Sistema de avaliação diagnóstica adaptativa para a aluna particular (ENEM e vestibulares de Medicina e Odontologia, 2026).

| Arquivo | Para quê |
|---|---|
| `docs/PLANO.md` | Plano completo: calendário, matriz, algoritmo, relatório, plano de ação e cronograma |
| `docs/ESPECIFICACAO_WEB.md` | O que implementar no Claude Code, com contrato de dados, telas, relatório e prompt pronto |
| `docs/CURADORIA.md` | Fontes, critérios, conferência de gabarito e limites do banco |
| `banco/itens.json` | 160 itens (ENEM 2022/2024, FUVEST 2018 a 2024, autorais) |
| `banco/matriz.json` | 9 eixos, 41 habilidades, pré-requisitos, pesos e níveis |
| `banco/figuras/` | Figuras dos itens |
| `banco/Banco_Diagnostica.xlsx` | O banco em planilha, para revisão |
| `scripts/motor_referencia.py` | Motor adaptativo de referência (TRI 3PL simplificada, EAP por eixo) e simulação de perfis |
| `scripts/validar_banco.py` | Valida o banco e regenera a planilha |

Para validar: `python3 scripts/validar_banco.py`
Para simular perfis: `python3 scripts/motor_referencia.py`
