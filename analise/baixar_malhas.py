"""Baixa do IBGE a malha dos municípios de cada estado (TopoJSON) para o mapa do painel.

Uso: python3 -I baixar_malhas.py
- src/data/malhas/<uf>.json: qualidade mínima (mapa na página, leve);
- src/data/malhas-detalhe/<uf>.json: qualidade intermediária (tela cheia, para aproximar bem).
Fonte: API de malhas do IBGE (servicodados.ibge.gov.br/api/v3/malhas). Cada polígono traz "codarea" = código IBGE
do município (7 dígitos), o mesmo "cdi" da lista de municípios do TSE (tse_mun/cm.json).
"""
import gzip, json, os, urllib.request

aqui = os.path.dirname(os.path.abspath(__file__))
URL = ('https://servicodados.ibge.gov.br/api/v3/malhas/estados/{uf}'
       '?intrarregiao=municipio&formato=application/json&qualidade={qualidade}')
PASTAS = {'minima': 'malhas', 'intermediaria': 'malhas-detalhe'}

ufs = [ab['cd'] for ab in json.load(open(os.path.join(aqui, 'tse_mun', 'cm.json')))['abr'] if ab['cd'] != 'zz']
for (qualidade, pasta), uf in ((q, u) for q in PASTAS.items() for u in ufs):
    destino = os.path.join(aqui, '..', 'src', 'data', pasta)
    os.makedirs(destino, exist_ok=True)
    req = urllib.request.Request(URL.format(uf=uf.upper(), qualidade=qualidade),
                                 headers={'User-Agent': 'painel-eleicoes-brasil'})
    corpo = urllib.request.urlopen(req, timeout=60).read()
    topo = json.loads(gzip.decompress(corpo) if corpo[:2] == b'\x1f\x8b' else corpo)  # a API às vezes manda gzip
    # Só o necessário: arcos, transformação e o código de cada município.
    for obj in topo['objects'].values():
        for g in obj['geometries']:
            g['properties'] = {'codarea': g['properties']['codarea']}
    with open(os.path.join(destino, f'{uf}.json'), 'w') as f:
        json.dump(topo, f, separators=(',', ':'))
    print(qualidade, uf, sum(len(o['geometries']) for o in topo['objects'].values()), 'municípios')
