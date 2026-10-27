"""Refaz as urnas de uma UF que têm log de urna substituída (vários arquivos no log): relê o log com a
remoção de linhas repetidas e baixa o BU, para conferir votos no log x comparecimento no BU. Regrava o .jsonl.
Uso: RITMO_MAX=8 python3 -I refazer_logs_trocados.py <uf>"""
import json, sys
sys.path.insert(0, sys.argv[0].rsplit('/', 1)[0] if '/' in sys.argv[0] else '.')
import urnas
from concurrent.futures import ThreadPoolExecutor

uf = sys.argv[1]
arq = f'dados2t/{uf}.jsonl'
regs = [json.loads(l) for l in open(arq)]
alvos = [i for i, r in enumerate(regs) if r.get('arquivos_log', 1) > 1 and not r.get('erro')]
urnas.BU_SEMPRE = True
with ThreadPoolExecutor(4) as ex:
    novos = list(ex.map(lambda i: urnas.processar(regs[i]['uf'], regs[i]['mun'], regs[i]['zona'], regs[i]['secao']), alvos))
for i, n in zip(alvos, novos):
    if not n.get('erro'): regs[i] = n
with open(arq, 'w') as f:
    for r in regs: f.write(json.dumps(r, ensure_ascii=False) + '\n')
dif = [regs[i] for i in alvos if 'comparecimento_bu' in regs[i] and regs[i]['votos_log'] != regs[i]['comparecimento_bu']]
print(f'{uf}: {len(alvos)} urnas com BU baixado; log diferente do BU em {len(dif)}; soma da diferença {sum(r["votos_log"] - r["comparecimento_bu"] for r in dif)}')
for r in dif[:15]:
    print(' ', r['mun'], r['zona'], r['secao'], 'log', r['votos_log'], 'bu', r['comparecimento_bu'], 'arquivos', r['arquivos_log'])
