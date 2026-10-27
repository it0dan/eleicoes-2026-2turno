#!/usr/bin/env bash
# Processa todas as UFs (e o exterior) do 2º turno; pula as que já terminaram.
cd "$(dirname "$0")"
mkdir -p dados2t
# Primeiro os estados necessários para fechar a prova nacional; por último os que, mesmo no pior caso
# (todos os votos de Lula ali após as 17h), não mudam a conclusão. Ver exportar_painel.py e src/services/prorrogacao.ts.
for uf in ac al am ap ba ce df es go ma mg pa pb pe pi pr rj rn rs se sp ms mt ro rr sc to zz; do
  if [ -f "dados2t/$uf.ok" ]; then echo "$uf já feito"; continue; fi
  RITMO_MAX="${RITMO_MAX:-28}" python3 -I ./urnas.py "$uf" "dados2t/$uf.jsonl" 0 32 2>>dados2t/progresso.log || continue
  # Urnas trocadas no dia: relê o log (sem linhas repetidas) e confere com o BU; depois atualiza o painel.
  RITMO_MAX="${RITMO_MAX:-28}" python3 -I ./refazer_logs_trocados.py "$uf" >>dados2t/progresso.log 2>&1
  touch "dados2t/$uf.ok"
  python3 -I ./exportar_painel.py >>dados2t/progresso.log 2>&1
done
echo "FIM $(date)" >> dados2t/progresso.log
