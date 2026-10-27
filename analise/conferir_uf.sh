#!/usr/bin/env bash
# Confere um estado já concluído: votos nos logs x comparecimento oficial, votos depois das 17h e pior caso.
cd "$(dirname "$0")"
uf="$1"; tmp=$(mktemp -d)
ln -s "$PWD/dados2t/$uf.jsonl" "$tmp/$uf.jsonl"
python3 -I ./analisar.py "$tmp" tse "$tmp/res.json" > /dev/null
python3 -I - "$tmp/res.json" "$uf" <<'P'
import json, sys
r = json.load(open(sys.argv[1])); uf = sys.argv[2]
t = r['total']; c = r['conferencia_oficial'].get(uf, {})
print(f"{uf.upper()}: urnas={t['urnas']} | logs={t['votos_log']} x oficial={c.get('comparecimento_oficial')} -> {'BATE' if c.get('bate_exato') else ('BATE (%d sem horário, contados como após 17h)' % c.get('votos_sem_horario', 0) if c.get('bate') else 'NAO BATE')}"
      f" | depois das 17h={t['votos_tardios']} em {t['urnas_com_voto_tardio']} urnas | por hora={r['tardios_por_hora_apos_17h']}"
      f" | vantagem Lula={c.get('vantagem_lula')} pior caso sem tardios={c.get('vantagem_lula_sem_tardios_pior_caso')}"
      f" | problemas={r['problemas']}")
P
rm -rf "$tmp"
