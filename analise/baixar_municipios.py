"""Baixa o resultado oficial (2º turno, presidente) de cada município do site de resultados do TSE.

Uso: python3 -I baixar_municipios.py
Lê a lista de municípios (tse_mun/cm.json, com a marca de capital) e grava tse_mun/<uf>/<cd>.json.
Retoma de onde parou: arquivos já baixados não são pedidos de novo.
"""
import json, os, sys
from concurrent.futures import ThreadPoolExecutor

aqui = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, aqui)
from urnas import get  # noqa: E402  (mesmo limite de ritmo e conexões persistentes)

RESULTADOS = 'https://resultados.tse.jus.br/oficial/ele2026/6258'
pasta = os.path.join(aqui, 'tse_mun')
lista_mun = os.path.join(pasta, 'cm.json')
if not os.path.exists(lista_mun):
    open(lista_mun, 'wb').write(get(f'{RESULTADOS}/config/mun-e006258-cm.json'))

pendentes = []
for ab in json.load(open(lista_mun))['abr']:
    os.makedirs(os.path.join(pasta, ab['cd']), exist_ok=True)
    for mu in ab['mu']:
        destino = os.path.join(pasta, ab['cd'], f"{mu['cd']}.json")
        if not os.path.exists(destino):
            pendentes.append((ab['cd'], mu['cd'], destino))

def baixar(item):
    uf, cd, destino = item
    try:
        corpo = get(f'{RESULTADOS}/dados/{uf}/{uf}{cd}-c0001-e006258-u.json')
    except Exception as ex:
        return f'{uf}{cd}: {ex!r}'[:200]
    open(destino + '.tmp', 'wb').write(corpo)
    os.replace(destino + '.tmp', destino)

with ThreadPoolExecutor(16) as ex:
    erros = [e for e in ex.map(baixar, pendentes) if e]
print(f'{len(pendentes) - len(erros)} municípios baixados, {len(erros)} erros', file=sys.stderr)
for e in erros:
    print('  ', e, file=sys.stderr)
