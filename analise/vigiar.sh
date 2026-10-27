#!/usr/bin/env bash
# Emite uma linha por estado concluído, por erro ou quando o processamento termina/para.
cd "$(dirname "$0")/dados2t"
vistos=" $(ls *.ok 2>/dev/null | tr '\n' ' ') "
parado=0
while true; do
  for f in *.ok; do
    [ -e "$f" ] || continue
    case "$vistos" in *" $f "*) ;; *) echo "CONCLUIDO $(../conferir_uf.sh "${f%.ok}" | tr -d '\n')"; vistos="$vistos$f ";; esac
  done
  grep -q "^FIM" progresso.log && { echo "FIM do processamento"; exit 0; }
  if grep -qE "Traceback|Error" execucao.log progresso.log 2>/dev/null; then
    echo "ERRO: $(grep -hE 'Traceback|Error' execucao.log progresso.log | tail -1)"; exit 1
  fi
  if ! pgrep -f "rodar_todo[s].sh" > /dev/null; then
    parado=$((parado + 1)); [ $parado -ge 3 ] && { echo "PARADO: processo não está rodando"; exit 1; }
  else parado=0; fi
  sleep 20
done
