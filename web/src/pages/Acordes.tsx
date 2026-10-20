import { Fretboard, type Exibicao } from '@/components/Fretboard'
import { grau, NOTAS, type Nota } from '@/theory/notas'
import { cifra, FORMAS, notasDoAcorde, ROTULOS_ACORDE, voicing, type Forma, type TipoAcorde } from '@/theory/acordes'
import { Alternador } from '@/components/Alternador'
import type { PropsModo } from './Braco'


const TIPOS = Object.keys(ROTULOS_ACORDE) as TipoAcorde[]

const OPCOES_FORMA = [
  { valor: null, rotulo: 'Todas' },
  ...(Object.keys(FORMAS) as Forma[]).map((f) => ({ valor: f, rotulo: f })),
] satisfies { valor: Forma | null; rotulo: string }[]

const OPCOES = [
  { valor: 'nota', rotulo: 'Notas' },
  { valor: 'grau', rotulo: 'Graus' },
] satisfies { valor: Exibicao; rotulo: string }[]

export function Acordes({ opcoes, mudar }: PropsModo) {

  const { tonica: raiz, tipo, forma, mostrar } = opcoes
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
            onChange={(e) => mudar({ tonica: e.target.value as Nota })}
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
            onChange={(e) => mudar({ tipo: e.target.value as TipoAcorde })}
            className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {ROTULOS_ACORDE[t]}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          Forma CAGED
          <Alternador opcoes={OPCOES_FORMA} valor={forma} onChange={(f) => mudar({ forma: f })} />
        </div>

        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          Mostrar
          <Alternador opcoes={OPCOES} valor={mostrar} onChange={(m) => mudar({ mostrar: m })} />
        </div>
      </div>

      <div className="flex items-baseline gap-4">
        <span className="font-heading text-5xl font-semibold font-stretch-expanded">
          {cifra(raiz, tipo)}
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