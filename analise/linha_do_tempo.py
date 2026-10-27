"""Conta os votos de cada urna a cada 10 minutos, no dia inteiro, a partir dos logs do TSE.

Uso: python3 -I linha_do_tempo.py [uf ...]        (sem UF: todas as de dados2t/*.ok)
Reaproveita o hash de cada urna já gravado em dados2t/<uf>.jsonl (urnas.py) para baixar só o log, sem o índice
nem o BU. Grava dados_tempo/<uf>.jsonl com, por urna: ids, hora local de "urna pronta" e a contagem por faixa de
10 minutos em hora LOCAL ({"08:10": 37, ...}). A conversão para Brasília fica para o export (fuso por município).
Retoma de onde parou: urnas já gravadas não são baixadas de novo. Ao terminar uma UF, cria dados_tempo/<uf>.ok.
"""
import glob, json, os, sys, time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

aqui = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, aqui)
from urnas import BASE, RITMO, get, horarios_log  # noqa: E402

dados = os.path.join(aqui, 'dados2t')
saida_dir = os.path.join(aqui, 'dados_tempo')
os.makedirs(saida_dir, exist_ok=True)

def urnas_da_uf(uf):
    """Uma entrada por urna (seções agregadas compartilham o hash da urna e entram uma vez)."""
    vistos = set()
    for linha in open(os.path.join(dados, f'{uf}.jsonl')):
        r = json.loads(linha)
        if r.get('erro') or r.get('sem_log') or not r.get('hash') or r['hash'] in vistos:
            continue
        vistos.add(r['hash'])
        yield r

def processar(r):
    uf, mun, zona, secao = r['uf'], r['mun'], r['zona'], r['secao']
    reg = {'uf': uf, 'mun': mun, 'zona': zona, 'secao': secao, 'hash': r['hash']}
    try:
        jez = get(f"{BASE}/dados/{uf}/{mun}/{zona}/{secao}/{r['hash']}/o03221{uf}{mun}{zona}{secao}-log.jez")
        horas, prontas, _ = horarios_log(jez)
        reg['pronta'] = prontas[0] if prontas else None
        reg['votos'] = len(horas)
        reg['faixas'] = dict(sorted(Counter(h[:4] + '0' for h in horas).items()))  # "08:17:03" -> "08:10"
    except Exception as ex:
        reg['erro'] = repr(ex)[:200]
    return reg

def rodar(uf):
    arq = os.path.join(saida_dir, f'{uf}.jsonl')
    feitas = {}
    if os.path.exists(arq):
        for linha in open(arq):
            try:
                r = json.loads(linha)
            except json.JSONDecodeError:
                continue  # última linha cortada por interrupção
            if not r.get('erro'):
                feitas[r['hash']] = linha
    pendentes = [r for r in urnas_da_uf(uf) if r['hash'] not in feitas]
    t0 = time.time(); n = erros = 0
    with open(arq, 'w') as f:
        for linha in feitas.values(): f.write(linha)
        f.flush()
        with ThreadPoolExecutor(16) as ex:
            for reg in ex.map(processar, pendentes):
                f.write(json.dumps(reg, ensure_ascii=False, separators=(',', ':')) + '\n'); n += 1
                erros += 1 if reg.get('erro') else 0
                if n % 2000 == 0:
                    f.flush()
                    print(f'{uf}: {len(feitas) + n}/{len(feitas) + len(pendentes)} '
                          f'({n / (time.time() - t0):.1f}/s, ritmo {RITMO.taxa:.0f} req/s, erros {erros})',
                          file=sys.stderr, flush=True)
    print(f'{uf}: {len(feitas) + n} urnas ({n} novas, {erros} erros) em {time.time() - t0:.0f}s',
          file=sys.stderr, flush=True)
    if erros == 0:
        open(os.path.join(saida_dir, f'{uf}.ok'), 'w').close()

if __name__ == '__main__':
    ufs = sys.argv[1:] or sorted(os.path.basename(f)[:-3] for f in glob.glob(os.path.join(dados, '*.ok')))
    for uf in ufs:
        if os.path.exists(os.path.join(saida_dir, f'{uf}.ok')):
            continue
        rodar(uf)
    print('FIM', time.strftime('%d/%m %H:%M:%S'), file=sys.stderr, flush=True)
