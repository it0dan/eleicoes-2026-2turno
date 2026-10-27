"""Gera src/data/sem_prorrogacao.json com os estados já concluídos (dados2t/<uf>.ok) e, se houver os
resultados por município (tse_mun/, de baixar_municipios.py), src/data/cidades.json.

Para cada UF: votos depois das 17h, urnas com voto tardio, quanto a vantagem de Lula pode cair no pior caso
(perdaMaxLula) e se a soma dos logs bate com o comparecimento oficial.
Uso: python3 -I exportar_painel.py
"""
import glob, json, os, subprocess, sys, tempfile

aqui = os.path.dirname(os.path.abspath(__file__))
dados = os.path.join(aqui, 'dados2t')
saida = os.path.join(aqui, '..', 'src', 'data', 'sem_prorrogacao.json')
saida_cidades = os.path.join(aqui, '..', 'src', 'data', 'cidades.json')
pasta_mun = os.path.join(aqui, 'tse_mun')
tem_mun = os.path.exists(os.path.join(pasta_mun, 'cm.json'))
ufs = sorted(os.path.basename(f)[:-3] for f in glob.glob(os.path.join(dados, '*.ok')))
if not ufs:
    # Sem dados baixados (ex.: repositório recém-clonado): não sobrescreve o painel com arquivos vazios.
    sys.exit(f'Nenhum estado concluído em {dados}/ — rode rodar_todos.sh antes de exportar.')

estados = {}
with tempfile.TemporaryDirectory() as tmp:
    for uf in ufs:
        os.symlink(os.path.join(dados, f'{uf}.jsonl'), os.path.join(tmp, f'{uf}.jsonl'))
    res = os.path.join(tmp, 'res.json')
    subprocess.run([sys.executable, '-I', os.path.join(aqui, 'analisar.py'), tmp, os.path.join(aqui, 'tse'), res]
                   + ([pasta_mun] if tem_mun else []),
                   check=True, stdout=subprocess.DEVNULL)
    r = json.load(open(res))
for uf in ufs:
    c = r['por_uf'][uf]; conf = r['conferencia_oficial'][uf]
    estados[uf.upper()] = {
        'urnas': c['urnas'],
        'votosNosLogs': c['votos_log'],
        'comparecimentoOficial': conf['comparecimento_oficial'],
        'confereComTse': conf['bate'],
        'votosSemHorario': conf['votos_sem_horario'],
        'votosDepoisDas17h': c['votos_tardios'],
        'votosDepoisDas18h': c.get('votos_depois_das_18h', 0),
        'urnasComVotoDepoisDas17h': c['urnas_com_voto_tardio'],
        'perdaMaxLula': c['perda_max_lula'],
    }
json.dump({'geradoEm': __import__('time').strftime('%d/%m/%Y %H:%M'), 'estados': estados},
          open(saida, 'w'), indent=2, ensure_ascii=False)
open(saida, 'a').write('\n')
print(f'{len(estados)} estados exportados: {", ".join(estados)}')

# ---- Cidades ------------------------------------------------------------------
PEQUENAS = {'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no'}

def nome_bonito(nm):
    """'SÃO JOSÉ DO RIO PRETO' -> 'São José do Rio Preto' (também "Xique-Xique", "Dias d'Ávila")."""
    def palavra(p, i):
        if i > 0 and p.lower() in PEQUENAS: return p.lower()
        return '-'.join("'".join(x[:1].upper() + x[1:].lower() for x in parte.split("'")) for parte in p.split('-'))
    return ' '.join(palavra(p, i) for i, p in enumerate(nm.split())).replace(" D'", " d'")  # Dias d'Ávila

if tem_mun:
    campos = ['codigo', 'nome', 'capital', 'eleitores', 'comparecimento', 'lula', 'flavio', 'brancos', 'nulos',
              'secoes', 'votosDepoisDas17h', 'perdaMaxLula', 'votosSemHorario',
              # IBGE (baixar_ibge.py); null onde o IBGE não tem o dado (exterior, município criado após o Censo)
              'ibge', 'populacao', 'pibMilReais', 'agroPct']
    arq_ibge = os.path.join(aqui, 'ibge', 'municipios.json')
    ibge = json.load(open(arq_ibge)) if os.path.exists(arq_ibge) else {'municipios': {}, 'fontes': {}}

    def do_ibge(cdi):
        i = ibge['municipios'].get(cdi)
        if not i: return [cdi or None, None, None, None]
        pop, pib = i.get('populacao'), i.get('pib')
        return [cdi, int(pop) if pop else None, int(pib) if pib else None, i.get('agroPct')]

    linhas = []
    for ab in json.load(open(os.path.join(pasta_mun, 'cm.json')))['abr']:
        uf = ab['cd']
        if f'{uf}.jsonl' not in {f'{u}.jsonl' for u in ufs}: continue
        for mu in ab['mu']:
            m = r['por_municipio'].get(f"{uf}{mu['cd']}")
            if not m: continue  # sem nenhum voto (cidades do exterior onde ninguém votou)
            d = json.load(open(os.path.join(pasta_mun, uf, f"{mu['cd']}.json")))
            assert m['bate'], (uf, mu['cd'])
            linhas.append([f"{uf.upper()}{mu['cd']}", nome_bonito(mu['nm']), 1 if mu['c'] == 's' else 0,
                           int(d['e']['te']), m['comparecimento'], m['lula'], m['flavio'], int(d['v']['vb']),
                           int(d['v']['tvn']), int(d['s']['ts']), m['votos_tardios'], m['perda_max_lula'],
                           m['votos_sem_horario'], *do_ibge(mu.get('cdi'))])
    # Conferência: a soma das cidades de cada UF tem de dar o total oficial da UF (src/data/tse_6258_real_states.json).
    oficiais = json.load(open(os.path.join(aqui, '..', 'src', 'data', 'tse_6258_real_states.json')))
    for uf, e in oficiais.items():
        doUf = [l for l in linhas if l[0][:2] == uf]
        if not doUf: continue
        soma = lambda i: sum(l[i] for l in doUf)
        assert (soma(3), soma(4), soma(5), soma(6), soma(7), soma(8)) == (e['eleitorado'], e['comparecimento'],
               e['cand1_lula'], e['cand2_flavio'], e['brancos'], e['nulos']), uf
        assert soma(10) == estados[uf]['votosDepoisDas17h'], uf
    if ibge['municipios']:
        # Só municípios criados depois do Censo 2022 podem ficar sem população (hoje: Boa Esperança do Norte/MT).
        sem_ibge = sorted(l[1] for l in linhas if l[0][:2] != 'ZZ' and l[campos.index('populacao')] is None)
        print('sem população do IBGE:', sem_ibge)
        assert len(sem_ibge) <= 1, sem_ibge
    linhas.sort(key=lambda l: l[0])
    with open(saida_cidades, 'w') as f:
        f.write('{"campos":' + json.dumps(campos) + ',"fontesIbge":' + json.dumps(ibge['fontes'], ensure_ascii=False)
                + ',"cidades":[\n')
        f.write(',\n'.join(json.dumps(l, ensure_ascii=False, separators=(',', ':')) for l in linhas))
        f.write('\n]}\n')
    print(f'{len(linhas)} cidades exportadas ({sum(l[2] for l in linhas)} capitais)')
