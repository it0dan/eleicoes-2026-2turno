"""Gera a linha do tempo da votação (votos por horário, em hora de Brasília) a partir de dados_tempo/ (linha_do_tempo.py).

Uso: python3 -I exportar_linha_do_tempo.py
- src/data/linha_do_tempo.json: Brasil e cada estado, votos a cada 10 minutos das 8h às 20h de Brasília.
- src/data/linha_do_tempo_cidades.json: cada cidade, votos por hora (8h … 20h), carregado sob demanda no painel.
Hora de Brasília: mesma regra de analisar.py — o fuso de cada município sai da hora local mais comum em que as
urnas ficaram prontas (abertura = 8h de Brasília). O exterior fica de fora: lá se vota no horário de cada país.
Conferências (assert): a soma de cada estado é igual aos votos nos logs (dados2t) e os votos a partir das 17h são
os mesmos de sem_prorrogacao.json (sem contar os "sem horário", que não estão em log nenhum).
"""
import glob, json, os
from collections import Counter, defaultdict

aqui = os.path.dirname(os.path.abspath(__file__))
pasta = os.path.join(aqui, 'dados_tempo')
dados2t = os.path.join(aqui, 'dados2t')
src = os.path.join(aqui, '..', 'src', 'data')
INICIO, FIM, PASSO = 8 * 60, 20 * 60, 10  # minutos de Brasília; [8h, 20h) em faixas de 10 min
N = (FIM - INICIO) // PASSO

ufs = sorted(os.path.basename(f)[:-3] for f in glob.glob(os.path.join(pasta, '*.ok')) if not f.endswith('zz.ok'))
semp = json.load(open(os.path.join(src, 'sem_prorrogacao.json')))['estados']
if not ufs:
    sys.exit(f'Nenhum estado concluído em {pasta}/ — rode linha_do_tempo.py antes de exportar.')

por_uf = {}
por_cidade = {}
fora = Counter()  # votos antes das 8h ou a partir das 20h de Brasília (relógio da urna fora do esperado)
for uf in ufs:
    urnas = [json.loads(l) for l in open(os.path.join(pasta, f'{uf}.jsonl'))]
    abertura = defaultdict(Counter)
    for u in urnas:
        if u.get('pronta'):
            abertura[u['mun']][int(u['pronta'][:2])] += 1
    fuso = {mun: 8 - c.most_common(1)[0][0] for mun, c in abertura.items()}  # horas a somar no relógio local

    serie = [0] * N
    for u in urnas:
        desloc = fuso.get(u['mun'], 0) * 60
        cid = por_cidade.setdefault(f"{uf.upper()}{u['mun']}", [0] * ((FIM - INICIO) // 60))
        for faixa, n in u['faixas'].items():
            m = int(faixa[:2]) * 60 + int(faixa[3:5]) + desloc
            if not INICIO <= m < FIM:
                fora[uf] += n
                continue
            serie[(m - INICIO) // PASSO] += n
            cid[(m - INICIO) // 60] += n
    por_uf[uf.upper()] = serie

    # Conferências com a análise urna a urna
    votos_log, vistos = 0, set()
    for l in open(os.path.join(dados2t, f'{uf}.jsonl')):
        r = json.loads(l)
        if r.get('erro') or r.get('sem_log') or not r.get('hash') or r['hash'] in vistos: continue
        vistos.add(r['hash']); votos_log += r.get('votos_log', 0)
    total = sum(serie) + fora[uf]
    assert total == votos_log, (uf, total, votos_log)
    tardios = sum(serie[(17 * 60 - INICIO) // PASSO:]) + sum(
        n for u in urnas for f, n in u['faixas'].items()
        if int(f[:2]) * 60 + int(f[3:5]) + fuso.get(u['mun'], 0) * 60 >= FIM)
    e = semp[uf.upper()]
    # Na análise, um log com mais votos que o BU (registros de duas urnas) tem os tardios limitados ao BU;
    # aqui contamos o log como está, então pode sobrar um pouco (nunca faltar).
    esperado = e['votosDepoisDas17h'] - e['votosSemHorario']
    assert tardios >= esperado, (uf, tardios, esperado)
    print(f'{uf}: {total} votos (= logs), {tardios} a partir das 17h (análise: {esperado}), fora 8h–20h: {fora[uf]}')

brasil = [sum(s[i] for s in por_uf.values()) for i in range(N)]
completo = len(por_uf) == 27
saida = {'inicio': '08:00', 'passoMin': PASSO, 'completo': completo, 'estadosConferidos': len(por_uf),
         'foraDoHorario': sum(fora.values()), 'brasil': brasil, 'estados': por_uf}
json.dump(saida, open(os.path.join(src, 'linha_do_tempo.json'), 'w'), separators=(',', ':'))
with open(os.path.join(src, 'linha_do_tempo_cidades.json'), 'w') as f:
    json.dump({'inicio': 8, 'cidades': por_cidade}, f, separators=(',', ':'))
print(f'{len(por_uf)} estados, {len(por_cidade)} cidades; Brasil: {sum(brasil)} votos entre 8h e 20h')
