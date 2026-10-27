"""Baixa do IBGE (API SIDRA) indicadores de cada município para cruzar com o voto: ibge/municipios.json.

Uso: python3 -I baixar_ibge.py
- População: Censo 2022 (tabela 4709, variável 93).
- PIB a preços correntes, em mil reais (tabela 5938, variável 37), último ano publicado.
- Participação da agropecuária na economia, em %: valor adicionado da agropecuária (variável 513) ÷ valor
  adicionado total (variável 498), no último ano em que os dois saem por município (a participação pronta,
  variável 516, não é publicada por município; e o ano mais recente do PIB pode vir sem esses componentes).
Saída: {"fontes": {...}, "municipios": {"<código IBGE>": {"populacao": n, "pib": mil R$, "agroPct": %}}}.
"""
import gzip, json, os, urllib.request

aqui = os.path.dirname(os.path.abspath(__file__))
saida = os.path.join(aqui, 'ibge', 'municipios.json')
os.makedirs(os.path.dirname(saida), exist_ok=True)

def sidra(caminho):
    req = urllib.request.Request(f'https://apisidra.ibge.gov.br/values{caminho}',
                                 headers={'User-Agent': 'painel-eleicoes-brasil'})
    corpo = urllib.request.urlopen(req, timeout=300).read()
    linhas = json.loads(gzip.decompress(corpo) if corpo[:2] == b'\x1f\x8b' else corpo)
    return linhas[1:]  # a primeira linha é o cabeçalho

def numero(v):
    try:
        return float(v)
    except ValueError:
        return None  # "-", "..." etc.: sem dado

municipios = {}
for l in sidra('/t/4709/n6/all/v/93/p/2022'):
    municipios.setdefault(l['D1C'], {})['populacao'] = numero(l['V'])
pib = sidra('/t/5938/n6/all/v/37/p/last')
ano_pib = pib[0]['D3N']
for l in pib:
    municipios.setdefault(l['D1C'], {})['pib'] = numero(l['V'])

componentes = {}
for l in sidra('/t/5938/n6/all/v/498,513/p/last%203'):
    componentes.setdefault(l['D3N'], {}).setdefault(l['D1C'], {})[l['D2C']] = numero(l['V'])
ano_agro = max(a for a, cds in componentes.items() if sum(1 for v in cds.values() if v.get('498')) > 5000)
for cd, v in componentes[ano_agro].items():
    # Valor adicionado total negativo (acontece em cidade de usina) não dá porcentagem: fica sem dado.
    if v.get('513') is not None and (v.get('498') or 0) > 0:
        municipios.setdefault(cd, {})['agroPct'] = round(100 * v['513'] / v['498'], 2)

json.dump({'fontes': {'populacao': 'moradores: Censo 2022 do IBGE',
                      'pib': f'riqueza das cidades: IBGE, dados de {ano_pib}',
                      'agroPct': f'agro: IBGE, dados de {ano_agro}'},
           'anoPib': ano_pib, 'anoAgro': ano_agro, 'municipios': municipios},
          open(saida, 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(municipios), 'municípios; PIB de', ano_pib, '; agropecuária de', ano_agro)
