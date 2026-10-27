"""Cruza BU (votos por candidato) e log (hora de cada voto) de cada urna do 2º turno (pleito 3221).

Uso: python3 -I urnas.py <uf> <saida.jsonl> [limite] [paralelo]
Para cada seção grava: ids, abertura/encerramento (BU), votos por número (BU), brancos/nulos,
comparecimento, e do log: total de votos computados e horários (HH:MM:SS) de cada voto.
Não guarda os arquivos baixados.
"""
import io, json, sys, time, zipfile, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

BASE = 'https://resultados.tse.jus.br/oficial/ele2026/arquivo-urna/3221'
UA = {'User-Agent': 'painel-eleicoes-brasil (auditoria de dados abertos)'}

import http.client, threading

class Ritmo:
    """Limite de requisições/s compartilhado entre threads. O limite do servidor (Akamai) é global,
    dividido com outros usuários: ao receber 429 cai pela metade; com sucesso, sobe devagar."""
    def __init__(self, inicial=60.0, minimo=2.0, maximo=300.0):
        self.taxa, self.minimo, self.maximo = inicial, minimo, maximo
        self.trava = threading.Lock(); self.proximo = time.monotonic(); self.pausa_ate = 0.0
    def esperar(self):
        with self.trava:
            agora = time.monotonic()
            inicio = max(agora, self.proximo, self.pausa_ate)
            self.proximo = inicio + 1.0 / self.taxa
        time.sleep(max(0.0, inicio - agora))
    def sucesso(self):
        with self.trava: self.taxa = min(self.maximo, self.taxa + 0.1)
    def limitado(self, espera):
        with self.trava:
            self.taxa = max(self.minimo, self.taxa / 2)
            self.pausa_ate = max(self.pausa_ate, time.monotonic() + espera)

import os
# Teto de requisições/s (RITMO_MAX). Rajadas acima do limite do servidor rendem bloqueios de minutos.
_TETO = float(os.environ.get('RITMO_MAX', '30'))
RITMO = Ritmo(inicial=_TETO, maximo=_TETO)
_local = threading.local()

def _conexao():
    # Uma conexão HTTPS persistente (keep-alive) por thread: evita um handshake TLS por arquivo.
    c = getattr(_local, 'c', None)
    if c is None:
        c = _local.c = http.client.HTTPSConnection('resultados.tse.jus.br', timeout=60)
    return c

def _fechar():
    try: _local.c.close()
    except Exception: pass
    _local.c = None

def get(url, tentativas=8):
    caminho = url.split('resultados.tse.jus.br', 1)[1]
    erros = 0
    while True:
        RITMO.esperar()
        try:
            c = _conexao()
            c.request('GET', caminho, headers=UA)
            r = c.getresponse()
            corpo = r.read()
        except Exception:
            _fechar(); erros += 1
            if erros >= tentativas: raise
            time.sleep(2 * erros); continue
        if r.status == 200:
            RITMO.sucesso(); return corpo
        if r.status == 404:
            raise urllib.error.HTTPError(url, 404, 'Not Found', None, None)  # definitivo (seção agregada)
        if r.status in (429, 503):
            print(f'429 {time.strftime("%H:%M:%S")} ritmo {RITMO.taxa:.0f}', file=sys.stderr, flush=True)
            # Limite do servidor: espera e tenta de novo, sem contar como erro.
            RITMO.limitado(float(r.getheader('Retry-After') or r.getheader('x-ratelimit-reset') or 2) + 1)
            continue
        erros += 1
        if erros >= tentativas: raise IOError(f'HTTP {r.status}')
        time.sleep(2 * erros)

# --- BER ---------------------------------------------------------------
def tlv(b, i):
    tag = b[i]; i += 1
    if tag & 0x1f == 0x1f:
        while True:
            x = b[i]; i += 1; tag = (tag << 8) | x
            if not x & 0x80: break
    ln = b[i]; i += 1
    if ln & 0x80:
        n = ln & 0x7f; ln = int.from_bytes(b[i:i + n], 'big'); i += n
    return tag, i, i + ln

def filhos(b, ini, fim):
    out = []; i = ini
    while i < fim:
        t, s, e = tlv(b, i); out.append((t, s, e)); i = e
    return out

def inteiro(b, n): return int.from_bytes(b[n[1]:n[2]], 'big')
def texto(b, n): return b[n[1]:n[2]].decode('latin1')

def ler_bu(bu):
    _, s, e = tlv(bu, 0)
    env = next(n for n in filhos(bu, s, e) if n[0] == 0x04)
    _, cs, ce = tlv(bu, env[1])
    c = filhos(bu, cs, ce)
    datas = [texto(bu, n) for n in filhos(bu, c[5][1], c[5][2])]
    comparecimento = inteiro(bu, c[6])
    resultado = {'abertura': datas[0], 'encerramento': datas[1], 'comparecimento_bu': comparecimento,
                 'votos': {}, 'brancos': 0, 'nulos': 0, 'eleicoes': []}
    for elei in filhos(bu, c[8][1], c[8][2]):
        el = filhos(bu, elei[1], elei[2])
        cod = inteiro(bu, el[0])
        resultado['eleicoes'].append(cod)
        if cod != 6258:
            continue
        resultado['aptos'] = inteiro(bu, el[1])
        for cargo in filhos(bu, el[4][1], el[4][2]):
            cg = filhos(bu, cargo[1], cargo[2])
            seq = next(n for n in cg if n[0] == 0x30)
            for grupo in filhos(bu, seq[1], seq[2]):
                lista = next(n for n in filhos(bu, grupo[1], grupo[2]) if n[0] == 0x30)
                for ent in filhos(bu, lista[1], lista[2]):
                    campos = filhos(bu, ent[1], ent[2])
                    tipo = inteiro(bu, next(n for n in campos if n[0] == 0x81))
                    votos = inteiro(bu, next(n for n in campos if n[0] == 0x82))
                    if tipo == 1:
                        ident = next(n for n in campos if n[0] == 0xa3)
                        num = str(inteiro(bu, filhos(bu, ident[1], ident[2])[0]))
                        resultado['votos'][num] = resultado['votos'].get(num, 0) + votos
                    elif tipo == 2: resultado['brancos'] += votos
                    elif tipo == 3: resultado['nulos'] += votos
    return resultado

def _linhas_log(z):
    """Linhas de todos os logs do zip, inclusive os .jez aninhados (urna substituída durante o dia)."""
    for nome in z.namelist():
        dados = z.read(nome)
        if dados[:2] == b'PK':
            yield from _linhas_log(zipfile.ZipFile(io.BytesIO(dados)))
        else:
            yield from dados.decode('latin1').splitlines()

def horarios_log(jez):
    """(horários HH:MM:SS de cada voto computado, horários de "urna pronta", nº de arquivos), sem repetições."""
    z = zipfile.ZipFile(io.BytesIO(jez))
    horas = []; prontas = []; vistas = set()
    for linha in _linhas_log(z):
        if not linha.startswith('25/10/2026'): continue
        # O log de uma urna substituída pode vir repetido (ex.: cópia "ME"); cada linha termina num código
        # próprio, então uma linha idêntica é o mesmo registro e conta uma vez só.
        if linha in vistas: continue
        vistas.add(linha)
        p = linha.split('\t')
        if len(p) < 5: continue
        if p[4] == 'O voto do eleitor foi computado':
            horas.append(p[0][11:19])
        elif p[4].startswith('Urna pronta para receber votos'):
            prontas.append(p[0][11:19])
    horas.sort(); prontas.sort()
    return horas, prontas, len(z.namelist())

def ler_log(jez):
    horas, prontas, arquivos = horarios_log(jez)
    # Guarda o total e só os horários a partir das 12h locais (o fim do dia em qualquer fuso).
    return {'votos_log': len(horas), 'horas_votos': [h for h in horas if h >= '12:00:00'],
            'pronta': prontas, 'arquivos_log': arquivos}

BU_SEMPRE = False

def _talvez_tardio(reg):
    # Corte = abertura local + 9h (abertura às 8h de Brasília). Sem abertura conhecida: baixa o BU.
    pronta = (reg.get('pronta') or [None])[0]
    if not pronta: return True
    corte = f"{int(pronta[:2]) + 9:02d}:00:00"
    return any(h >= corte for h in reg.get('horas_votos', []))

def processar(uf, mun, zona, secao):
    base = f'{BASE}/dados/{uf}/{mun}/{zona}/{secao}'
    reg = {'uf': uf, 'mun': mun, 'zona': zona, 'secao': secao}
    try:
        aux = json.loads(get(f'{base}/p003221-{uf}-m{mun}-z{zona}-s{secao}-aux.json'))
        reg['status'] = aux.get('st')
        validos = [h for h in aux.get('hashes', []) if h.get('st') == 'Totalizado'] or aux.get('hashes', [])
        if not validos:
            reg['erro'] = 'sem hash'; return reg
        h = validos[0]
        arqs = {a['tp']: a['nm'] for a in h['arq']}
        reg['n_hashes'] = len(aux.get('hashes', []))
        reg['hash'] = h['hash']
        if 'log' in arqs:
            reg.update(ler_log(get(f"{base}/{h['hash']}/{arqs['log']}")))
        else:
            reg['sem_log'] = True
        # O BU só é necessário onde pode haver voto depois das 17h (para o limite por urna).
        # Sem log, ou com algum voto a partir das 14h locais (17h de Brasília no fuso mais a oeste), baixa o BU.
        if 'bu' in arqs and (BU_SEMPRE or reg.get('sem_log') or any(h >= '14:00:00' for h in reg.get('horas_votos', []))
                             and _talvez_tardio(reg)):
            reg.update(ler_bu(get(f"{base}/{h['hash']}/{arqs['bu']}")))
    except Exception as ex:
        reg['erro'] = repr(ex)[:200]
    return reg

def secoes(uf):
    cs = json.loads(get(f'{BASE}/config/{uf}/{uf}-p003221-cs.json'))
    for ab in cs['abr']:
        for mu in ab['mu']:
            for zo in mu['zon']:
                for se in zo['sec']:
                    yield (uf, mu['cd'], zo['cd'], se['ns'])

if __name__ == '__main__':
    uf, saida = sys.argv[1], sys.argv[2]
    limite = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] != '0' else None
    paralelo = int(sys.argv[4]) if len(sys.argv) > 4 else 16
    BU_SEMPRE = '--bu-sempre' in sys.argv
    lista = list(secoes(uf))[:limite] if limite else list(secoes(uf))
    feitas = {}
    try:
        for l in open(saida):
            try:
                r = json.loads(l)
            except json.JSONDecodeError:
                continue  # última linha cortada por uma interrupção: a seção será refeita
            # Refaz o que falhou (exceto 404 de seção agregada, que é definitivo).
            if not r.get('erro') or '404' in r['erro']:
                feitas[(r['mun'], r['zona'], r['secao'])] = l
    except FileNotFoundError:
        pass
    pendentes = [x for x in lista if (x[1], x[2], x[3]) not in feitas]
    t0 = time.time(); n = 0
    with open(saida, 'w') as f:
        for l in feitas.values(): f.write(l)
        f.flush()
        with ThreadPoolExecutor(paralelo) as ex:
            for reg in ex.map(lambda x: processar(*x), pendentes):
                f.write(json.dumps(reg, ensure_ascii=False) + '\n'); n += 1
                if n % 1000 == 0:
                    f.flush()
                    print(f'{uf}: {len(feitas) + n}/{len(lista)} ({n / (time.time() - t0):.1f}/s, ritmo {RITMO.taxa:.0f} req/s)', file=sys.stderr, flush=True)
    print(f'{uf}: {len(lista)} seções ({n} novas) em {time.time() - t0:.1f}s', file=sys.stderr, flush=True)
