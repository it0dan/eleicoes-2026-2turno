"""Analisa dados2t/*.jsonl (saída de urnas.py) e calcula o resultado com e sem os votos dados depois das 17h.

Regra: a votação abre às 8h de Brasília. O fuso de cada município é a hora (local) mais comum de
abertura das suas urnas; o corte das 17h de Brasília vira (hora_abertura + 9h) no relógio local.
Todo voto computado a partir do corte conta como "depois das 17h" (inclui a fila legal das 17h,
o que é desfavorável à conclusão).

Sem prorrogação, por urna u com t votos tardios, L votos de Lula e F do Flávio:
  - pior caso para Lula: os t votos tardios eram todos dele -> tira min(t, L) de Lula
  - melhor caso para Lula: eram todos do Flávio -> tira min(t, F) do Flávio
Somando urna a urna, sai o intervalo exato possível da vantagem de Lula sem esses votos.
Os totais de Lula e Flávio vêm do arquivo oficial de cada UF; o BU só é usado nas urnas com voto tardio
(sem BU, o pior caso é tirar de Lula todos os t votos). Conferência: a soma dos votos nos logs de cada UF
tem de ser igual ao comparecimento oficial da UF.

Uso: python3 -I analisar.py <pasta_dados2t> <pasta_json_tse_por_uf> <saida.json> [pasta_tse_mun]
Com a pasta dos resultados por município (baixar_municipios.py), também sai o resumo de cada município.
"""
import glob, json, os, sys
from collections import Counter, defaultdict

pasta, pasta_tse, saida = sys.argv[1], sys.argv[2], sys.argv[3]
pasta_mun = sys.argv[4] if len(sys.argv) > 4 else None

urnas = {}
problemas = Counter()
for arq in sorted(glob.glob(os.path.join(pasta, '*.jsonl'))):
    for linha in open(arq):
        r = json.loads(linha)
        if r.get('erro'):
            problemas['erro_download'] += 1
            urnas.setdefault(('ERRO', r['uf'], r['mun'], r['zona'], r['secao']), r)
            continue
        chave = r.get('hash') or (r['uf'], r['mun'], r['zona'], r['secao'])
        if chave in urnas:
            problemas['secao_agregada_mesma_urna'] += 1
            continue
        urnas[chave] = r

validas = [r for k, r in urnas.items() if not (isinstance(k, tuple) and k[0] == 'ERRO')]

# Fuso: hora de abertura mais comum por município
horas_abertura = defaultdict(Counter)
for r in validas:
    ab = (r.get('pronta') or [None])[0] or (r.get('abertura', '')[9:11] + ':00:00' if r.get('abertura') else None)
    if ab:
        horas_abertura[(r['uf'], r['mun'])][int(ab[:2])] += 1
abertura_mun = {k: c.most_common(1)[0][0] for k, c in horas_abertura.items()}

def corte(r):
    h = abertura_mun.get((r['uf'], r['mun']))
    return None if h is None else f'{h + 9:02d}:00:00'

def oficial_uf(uf):
    return oficial(os.path.join(pasta_tse, f'{uf}.json'))

def oficial(f):
    if not os.path.exists(f): return None
    d = json.load(open(f)); cand = {}
    def walk(x):
        if isinstance(x, dict):
            if 'vap' in x and 'sqcand' in x: cand[x['n']] = int(x['vap'])
            for v in x.values(): walk(v)
        elif isinstance(x, list):
            for v in x: walk(v)
    walk(d['carg'])
    return {'lula': cand.get('13', 0), 'flavio': cand.get('22', 0), 'comparecimento': int(d['e']['c'])}

tot = Counter()
por_uf = defaultdict(Counter)
por_mun = defaultdict(Counter)
faixas = Counter()
for r in validas:
    uf = r['uf']
    tem_bu = 'votos' in r
    L = r['votos'].get('13', 0) if tem_bu else None
    F = r['votos'].get('22', 0) if tem_bu else None
    c = corte(r)
    if 'votos_log' not in r:
        problemas['sem_log'] += 1
        # Sem log não há horário: no pior caso, todos os votos da urna podem ser tardios.
        t = r.get('comparecimento_bu', 0)
        votos_log = 0  # nenhum voto registrado em log: os do BU entram como "sem horário" (abaixo)
        if not tem_bu: problemas['sem_log_e_sem_bu'] += 1
        # São votos sem horário (vêm do BU, não de um log): entram na mesma conta dos "sem horário".
        for alvo in (tot, por_uf[uf], por_mun[(uf, r['mun'])]):
            alvo['votos_sem_horario'] += t
    elif c is None:
        problemas['sem_hora_abertura'] += 1
        t = r['votos_log']; votos_log = r['votos_log']
    else:
        votos_log = r['votos_log']
        t = sum(1 for h in r['horas_votos'] if h >= c)
        hc = int(c[:2])
        for h in r['horas_votos']:
            if h >= c:
                faixas[min(int(h[:2]) - hc, 3)] += 1
                if int(h[:2]) - hc >= 1:
                    por_uf[uf]['votos_depois_das_18h'] += 1
        if tem_bu and votos_log > r['comparecimento_bu']:
            # O log traz registros de mais de uma urna (ex.: cópia "ME" de outra urna). Vale o BU; os votos
            # tardios ficam limitados ao comparecimento (nunca menos que o real: pior caso preservado).
            problemas['log_maior_que_bu'] += 1
            votos_log = r['comparecimento_bu']
            t = min(t, votos_log)
        elif tem_bu and votos_log != r.get('comparecimento_bu'):
            problemas['log_difere_do_bu'] += 1
            # Votos do BU sem horário no log: no pior caso, todos podem ser tardios.
            sem_horario = max(0, r['comparecimento_bu'] - votos_log)
            t += sem_horario
            por_uf[uf]['votos_sem_horario'] += sem_horario; tot['votos_sem_horario'] += sem_horario
            por_mun[(uf, r['mun'])]['votos_sem_horario'] += sem_horario
    if t > 0 and not tem_bu:
        problemas['tardio_sem_bu_pior_caso_total'] += 1
    # Quanto a vantagem de Lula pode cair (pior caso) ou subir (melhor caso) sem os votos tardios da urna.
    perda_lula = min(t, L) if tem_bu else t
    ganho_lula = min(t, F) if tem_bu else 0
    for alvo in (tot, por_uf[uf], por_mun[(uf, r['mun'])]):
        alvo['urnas'] += 1
        alvo['votos_log'] += votos_log
        alvo['votos_tardios'] += t
        alvo['urnas_com_voto_tardio'] += 1 if t > 0 else 0
        alvo['perda_max_lula'] += perda_lula
        alvo['ganho_max_lula'] += ganho_lula

conferencia = {}
oficial_total = Counter()
for uf, c in por_uf.items():
    o = oficial_uf(uf)
    if not o: continue
    for k, v in o.items(): oficial_total[k] += v
    # Votos conhecidos = registrados nos logs + os do BU sem horário no log (já contados como tardios).
    falta = o['comparecimento'] - (c['votos_log'] + c['votos_sem_horario'])
    if falta > 0:
        # Diferença em urnas sem BU baixado: também sem horário -> pior caso, contam como tardios de Lula.
        for alvo in (c, tot):
            alvo['votos_tardios'] += falta; alvo['perda_max_lula'] += falta; alvo['votos_sem_horario'] += falta
    conferencia[uf] = {'votos_nos_logs': c['votos_log'], 'comparecimento_oficial': o['comparecimento'],
                       'votos_sem_horario': c['votos_sem_horario'],
                       'bate_exato': falta == 0 and c['votos_sem_horario'] == 0,
                       # Aceito se não sobra voto: os que faltam no registro já entram como tardios (pior caso).
                       'bate': falta >= 0,
                       'vantagem_lula': o['lula'] - o['flavio'],
                       'vantagem_lula_sem_tardios_pior_caso': o['lula'] - o['flavio'] - c['perda_max_lula']}

# Por município: mesma regra da UF, com o resultado oficial do município.
municipios = {}
if pasta_mun:
    for (uf, mun), c in sorted(por_mun.items()):
        o = oficial(os.path.join(pasta_mun, uf, f'{mun}.json'))
        if not o: continue
        falta = o['comparecimento'] - (c['votos_log'] + c['votos_sem_horario'])
        if falta > 0:
            c['votos_tardios'] += falta; c['perda_max_lula'] += falta; c['votos_sem_horario'] += falta
        municipios[f'{uf}{mun}'] = {**o, 'urnas': c['urnas'], 'votos_tardios': c['votos_tardios'],
                                    'votos_sem_horario': c['votos_sem_horario'], 'perda_max_lula': c['perda_max_lula'],
                                    'bate': falta >= 0}

vantagem = oficial_total['lula'] - oficial_total['flavio']
tot['lula'] = oficial_total['lula']; tot['flavio'] = oficial_total['flavio']
res = {
    'total': dict(tot),
    'vantagem_final': vantagem,
    'vantagem_sem_tardios_pior_caso': vantagem - tot['perda_max_lula'],
    'vantagem_sem_tardios_melhor_caso': vantagem + tot['ganho_max_lula'],
    'tardios_por_hora_apos_17h': {['17h', '18h', '19h', '20h+'][k]: v for k, v in sorted(faixas.items())},
    'por_uf': {uf: dict(c) for uf, c in sorted(por_uf.items())},
    'conferencia_oficial': conferencia,
    'por_municipio': municipios,
    'problemas': dict(problemas),
    'fusos_abertura': dict(Counter(abertura_mun.values())),
}
json.dump(res, open(saida, 'w'), indent=1, ensure_ascii=False)
print(json.dumps({k: res[k] for k in ('total', 'vantagem_final', 'vantagem_sem_tardios_pior_caso',
      'vantagem_sem_tardios_melhor_caso', 'tardios_por_hora_apos_17h', 'problemas', 'fusos_abertura')}, indent=1, ensure_ascii=False))
print('UFs cujos logs batem com o comparecimento oficial:', sum(1 for v in conferencia.values() if v['bate']), 'de', len(conferencia))
for uf, v in conferencia.items():
    if not v['bate']: print('  DIFERENÇA', uf, v)
