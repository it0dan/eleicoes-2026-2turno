import { useCallback, useEffect, useState } from 'react'

export type Tema = 'claro' | 'escuro'

const lerSalvo = (): Tema | null => {
  try {
    const t = localStorage.getItem('tema')
    return t === 'claro' || t === 'escuro' ? t : null
  } catch {
    return null
  }
}

const doSistema = (): Tema =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'

/** Tema atual: o escolhido pela pessoa ou, se nunca escolheu, o do sistema (acompanha mudanças). */
export function useTema() {
  const [tema, setTema] = useState<Tema>(() => lerSalvo() ?? doSistema())

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'escuro')
  }, [tema])

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const aoMudar = () => {
      if (!lerSalvo()) setTema(mq.matches ? 'escuro' : 'claro')
    }
    mq.addEventListener('change', aoMudar)
    return () => mq.removeEventListener('change', aoMudar)
  }, [])

  const alternar = useCallback(() => {
    setTema((t) => {
      const novo = t === 'escuro' ? 'claro' : 'escuro'
      try {
        localStorage.setItem('tema', novo)
      } catch {
        /* sem armazenamento: só vale nesta visita */
      }
      return novo
    })
  }, [])

  return { tema, alternar }
}
