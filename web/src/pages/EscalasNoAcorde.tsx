import { Fretboard, type Exibicao } from '@/components/Fretboard'
import { Alternador } from '@/components/Alternador'
import { grau, NOTAS, type Nota } from '@/theory/notas'
import { estaNaEscala, notasDaEscala, ROTULOS_ESCALA, type NomeEscala } from '@/theory/escalas'
import { cifra, FORMAS, notasDoAcorde, ROTULOS_ACORDE, voicing, type Forma, type TipoAcorde } from '@/theory/acordes'
import { aoRedor } from '@/theory/braco'
import type { PropsModo } from './Braco'

const NOMES_ESCALA = Object.keys(ROTULOS_ESCALA) as NomeEscala[]

const OPCOES_TIPO = (Object.keys(ROTULOS_ACORDE) as TipoAcorde[]).map((t) => ({ valor: t, rotulo: ROTULOS_ACORDE[t] }))

const OPCOES_FORMA = [
    { valor: null, rotulo: 'Todas' },
    ...(Object.keys(FORMAS) as Forma[]).map((f) => ({ valor: f, rotulo: f })),
] satisfies { valor: Forma | null; rotulo: string }[]

const OPCOES = [
    { valor: 'nota', rotulo: 'Notas' },
    { valor: 'grau', rotulo: 'Graus' },
] satisfies { valor: Exibicao; rotulo: string }[]

export function EscalaNoAcorde({ opcoes, mudar }: PropsModo) {
    const { tonica, escala, tipo, forma, mostrar } = opcoes

    const notas = notasDaEscala(tonica, escala)
    const formas = forma === null ? (Object.keys(FORMAS) as Forma[]) : [forma]
    const desenhos = formas.map((f) => voicing(tonica, tipo, f))
    const regiao = desenhos.flatMap((d) => aoRedor(d, notas))
    const fora = notasDoAcorde(tonica, tipo).filter((nota) => !estaNaEscala(nota, tonica, escala))

    return (
        <section className="flex flex-col gap-8">
            <div className="flex flex-wrap gap-4">
                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Tônica
                    <select
                        value={tonica}
                        onChange={(e) => mudar({ tonica: e.target.value as Nota })}
                        className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                    >
                        {NOTAS.map((nota) => (
                            <option key={nota}>{nota}</option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Escala
                    <select
                        value={escala}
                        onChange={(e) => mudar({ escala: e.target.value as NomeEscala, posicao: null })}
                        className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                    >
                        {NOMES_ESCALA.map((nome) => (
                            <option key={nome} value={nome}>
                                {ROTULOS_ESCALA[nome]}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Acorde
                    <Alternador opcoes={OPCOES_TIPO} valor={tipo} onChange={(t) => mudar({ tipo: t })} />
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Forma CAGED
                    <Alternador opcoes={OPCOES_FORMA} valor={forma} onChange={(f) => mudar({ forma: f })} />
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Mostrar
                    <Alternador opcoes={OPCOES} valor={mostrar} onChange={(m) => mudar({ mostrar: m })} />
                </div>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-heading text-5xl font-semibold font-stretch-expanded">{cifra(tonica, tipo)}</span>
                <span className="text-muted-foreground">sobre {ROTULOS_ESCALA[escala]}</span>
                {fora.length > 0 && (
                    <span className="text-muted-foreground">
                        · fora da escala:{' '}
                        <b className="text-foreground">{fora.map((nota) => `${nota} (${grau(tonica, nota)})`).join(', ')}</b>
                    </span>
                )}
            </div>
            <div className="overflow-x-auto rounded-xl border bg-card p-4">
                <Fretboard tonica={tonica} notas={notas} mostrar={mostrar} destaque={[...regiao, ...desenhos.flat()]} desenhos={desenhos} />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                    <span className="size-3.5 rounded-full bg-primary" /> Tônica do acorde
                </span>
                <span className="flex items-center gap-2">
                    <span className="size-3.5 rounded-full bg-foreground" /> Nota do acorde
                </span>
                <span className="flex items-center gap-2">
                    <span className="size-3 rounded-full border-2 border-cat-escalas opacity-60" /> Resto da escala
                </span>
                <span className="flex items-center gap-2">
                    <span className="h-3.5 w-6 rounded bg-primary/10" /> Região da forma
                </span>
            </div>
        </section>
    )
}