import { useState } from 'react'
import { Fretboard, type Exibicao } from '@/components/Fretboard'
import { grau, NOTAS, type Nota } from '@/theory/notas'
import { FORMAS, notasDoAcorde, voicing, type Forma, type TipoAcorde } from '@/theory/acordes'

const ROTULOS = {
    maior: 'Maior',
    menor: 'Menor',
    dom7: '7',
    m7: 'm7',
    maj7: '7M',
} satisfies Record<TipoAcorde, string>

const SIMBOLOS = {
    maior: '',
    menor: 'm',
    dom7: '7',
    m7: 'm7',
    maj7: '7M',
} satisfies Record<TipoAcorde, string>

const TIPOS = Object.keys(ROTULOS) as TipoAcorde[]

const OPCOES_FORMA = [
    { valor: null, rotulo: 'Todas' },
    ...(Object.keys(FORMAS) as Forma[]).map((f) => ({ valor: f, rotulo: f })),
] satisfies { valor: Forma | null; rotulo: string }[]

const OPCOES = [
    { valor: 'nota', rotulo: 'Notas' },
    { valor: 'grau', rotulo: 'Graus' },
] satisfies { valor: Exibicao; rotulo: string }[]

export function Acordes() {
    const [raiz, setRaiz] = useState<Nota>('C')
    const [tipo, setTipo] = useState<TipoAcorde>('maior')
    const [forma, setForma] = useState<Forma | null>(null)
    const [mostrar, setMostrar] = useState<Exibicao>('nota')
    const notas = notasDoAcorde(raiz, tipo)
    // "Todas" acende as 5 formas juntas: dá pra ver como elas se encaixam ao longo do braço
    const destaque = forma === null ? (Object.keys(FORMAS) as Forma[]).flatMap((f) => voicing(raiz, tipo, f)) : voicing(raiz, tipo, forma)
  
    return (
      <section className="flex flex-col gap-8">
          
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            Tônica
            <select
              value={raiz}
              onChange={(e) => setRaiz(e.target.value as Nota)}
              className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
            >
              {NOTAS.map((nota) => (
                <option key={nota}>{nota}</option>
              ))}
            </select>
          </label>
  
          <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            Tipo
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoAcorde)}
              className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {ROTULOS[t]}
                </option>
              ))}
            </select>
          </label>
  
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            Forma CAGED
            <div className="flex rounded-md border bg-card p-1">
              {OPCOES_FORMA.map((opcao) => (
                <button
                  key={opcao.rotulo}
                  aria-pressed={forma === opcao.valor}
                  onClick={() => setForma(opcao.valor)}
                  className={`flex items-center gap-2 rounded px-3 py-1 text-sm transition-colors ${
                    forma === opcao.valor ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {forma === opcao.valor && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
                  {opcao.rotulo}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            Mostrar
            <div className="flex rounded-md border bg-card p-1">
              {OPCOES.map((opcao) => (
                <button
                  key={opcao.valor}
                  aria-pressed={mostrar === opcao.valor}
                  onClick={() => setMostrar(opcao.valor)}
                  className={`flex items-center gap-2 rounded px-3 py-1 text-sm transition-colors ${
                    mostrar === opcao.valor ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mostrar === opcao.valor && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
                  {opcao.rotulo}
                </button>
              ))}
            </div>
          </div>
        </div>
  
        <div className="flex items-baseline gap-4">
          <span className="font-heading text-5xl font-semibold font-stretch-expanded">
            {raiz}
            {SIMBOLOS[tipo]}
          </span>
          <span className="text-muted-foreground">
            {notas.map((nota) => `${nota} (${grau(raiz, nota)})`).join('  ·  ')}
          </span>
        </div>
  
        <div className="overflow-x-auto rounded-xl border bg-card p-4">
          <Fretboard tonica={raiz} notas={notas} mostrar={mostrar} destaque={destaque} />
        </div>
      </section>
    )
  }