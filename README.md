# Painel Eleições Brasil · 2º turno de 2026

**Site:** https://it0dan.github.io/eleicoes-2026-2turno/

Painel com o resultado oficial da eleição para presidente (2º turno, 25/10/2026), feito para ser entendido por
qualquer pessoa, no celular ou no computador. Mostra quem ganhou no Brasil, em cada região, estado e cidade, e
responde com dados a uma pergunta: **a prorrogação da votação depois das 17h mudou o resultado?**

**Resposta: não.** Contamos, urna a urna, a hora de cada voto nos registros (logs) das 499.208 urnas publicadas
pelo TSE (o TSE totalizou 499.248 seções; as outras 40 não têm urna com log publicado). Depois das 17h foram dados 35.900 votos (0,028%). Mesmo que todos fossem de Lula, ele ainda venceria por
**4.394.810 votos** (a vantagem oficial foi de 4.430.191).

## O que tem no painel

- **Resultado** do Brasil, de uma região, de um estado ou de uma cidade, com e sem os votos dados depois das 17h.
- **Mapa** dos estados e, ao escolher um estado, das cidades dele; pode ser pintado por quem ganhou, abstenção,
  brancos e nulos, votos após 17h, riqueza por pessoa ou peso da agropecuária.
- **Análises** em forma de perguntas ("De onde veio a vantagem?", "Cidade grande vota diferente?", "Como foi a
  votação ao longo do dia?"…), cada uma com vários tipos de gráfico e a versão em tabela.
- **Explorador** para cruzar qualquer medida com outra, por cidade ou por estado.

## De onde vêm os números

Nada é estimado: todo número vem de um arquivo oficial e pode ser conferido.

| Dado | Fonte |
|---|---|
| Resultado por Brasil, estado e cidade | Site de resultados do TSE (`resultados.tse.jus.br`, eleição 6258) |
| Hora de cada voto | Registro (log) de cada urna, no mesmo site (arquivos de urna do pleito 3221) |
| População, PIB e peso da agropecuária | IBGE (API SIDRA: Censo 2022, PIB dos Municípios) |
| Contorno das cidades no mapa | IBGE (API de malhas) |

Conferências feitas a cada exportação (os scripts param se algo não bater):

- a soma dos votos nos logs de cada estado é igual ao comparecimento oficial (28 de 28 lugares, incluindo o
  exterior); votos do resultado oficial sem registro de horário (1.153, de urnas trocadas ou sem log) contam como "depois das 17h", no pior caso;
- a soma das cidades é igual ao total oficial de cada estado (eleitores, votos de cada candidato, brancos, nulos);
- a linha do tempo de cada estado soma os mesmos votos dos logs e os mesmos votos depois das 17h.

O voto é secreto: o log tem a hora de cada voto, mas não em quem foi. Por isso a conta "sem prorrogação" usa o pior
caso para Lula — todo voto depois das 17h é retirado dele.

## Rodar no seu computador

Precisa de Node.js 20 ou mais novo.

```bash
npm ci
npm run dev        # abre em http://localhost:5173
npm test           # testes (inclusive as conferências dos dados)
npm run lint
npm run build      # gera o site estático em dist/
```

## Refazer a análise

Os scripts ficam em [`analise/`](analise/) (Python 3, só biblioteca padrão). Os downloads brutos não vão para o
repositório; os scripts baixam tudo de novo do TSE e do IBGE e regravam os arquivos de `src/data/`.

```bash
cd analise
./rodar_todos.sh                      # urna a urna: índice, log e (quando preciso) boletim; várias horas
python3 -I baixar_municipios.py       # resultado oficial de cada cidade (minutos)
python3 -I baixar_ibge.py             # população e PIB (IBGE)
python3 -I baixar_malhas.py           # contornos das cidades (IBGE)
python3 -I exportar_painel.py         # gera src/data/sem_prorrogacao.json e src/data/cidades.json
python3 -I linha_do_tempo.py          # horário dos votos, dia inteiro (~5 h)
python3 -I exportar_linha_do_tempo.py # gera src/data/linha_do_tempo*.json
```

O site do TSE limita o número de pedidos por segundo; os scripts respeitam esse limite (`RITMO_MAX`, padrão 28) e
retomam de onde pararam se forem interrompidos.

## Publicação

O site é estático (React + Vite + Tailwind; gráficos com d3 e framer-motion). A cada push na branch `main`, o
workflow [`Publicar`](.github/workflows/publicar.yml) roda lint, testes e build e publica no GitHub Pages.

## Licença

Código sob a [licença MIT](LICENSE). Os dados são públicos, do TSE e do IBGE.
