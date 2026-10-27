"""Rebaixa as urnas cujo total de votos no log difere do BU (log aninhado lido errado) e regrava o .jsonl."""
import json, sys
sys.path.insert(0, sys.argv[0].rsplit('/', 1)[0])
from urnas import processar

arq = sys.argv[1]
regs = [json.loads(l) for l in open(arq)]
n = 0
for i, r in enumerate(regs):
    if 'votos_log' in r and r['votos_log'] != r.get('comparecimento_bu'):
        novo = processar(r['uf'], r['mun'], r['zona'], r['secao'])
        if not novo.get('erro'):
            regs[i] = novo; n += 1
with open(arq, 'w') as f:
    for r in regs: f.write(json.dumps(r, ensure_ascii=False) + '\n')
restantes = sum(1 for r in regs if 'votos_log' in r and r['votos_log'] != r.get('comparecimento_bu'))
print(f'{arq}: {n} urnas refeitas, {restantes} ainda com log diferente do BU')
