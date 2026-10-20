import { Fretboard, type Exibicao } from '@/components/Fretboard'
import { grau, NOTAS, type Nota } from '@/theory/notas'
import { notasDaEscala, ROTULOS_ESCALA, type NomeEscala } from '@/theory/escalas'
import { shape } from '@/theory/braco'
import { Alternador } from '@/components/Alternador'
import type { PropsModo } from './Braco'


const NOMES = Object.keys(ROTULOS_ESCALA) as NomeEscala[]
const OPCOES = [
    { valor: 'nota', rotulo: 'Notas' },
    { valor: 'grau', rotulo: 'Graus' },
] satisfies { valor: Exibicao; rotulo: string }[]

export function Escalas({ opcoes, mudar }: PropsModo) {

    const { tonica, escala, mostrar, posicao } = opcoes
    const quantas = escala === 'blues' ? 5 : notasDaEscala(tonica, escala).length
    const opcoesPosicao = [
        { valor: null, rotulo: 'Todas' },
        ...Array.from({ length: quantas }, (_, i) => ({ valor: i, rotulo: String(i + 1) })),
    ]

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
                        {NOMES.map((nome) => (
                            <option key={nome} value={nome}>
                                {ROTULOS_ESCALA[nome]}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Mostrar
                    <Alternador opcoes={OPCOES} valor={mostrar} onChange={(m) => mudar({ mostrar: m })} />
                </div>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                Posição
                <Alternador opcoes={opcoesPosicao} valor={posicao} onChange={(p) => mudar({ posicao: p })} />
            </div>
            <p className="font-heading text-xl font-semibold font-stretch-expanded">
                {notasDaEscala(tonica, escala)
                    .map((nota) => (mostrar === 'grau' ? grau(tonica, nota) : nota))
                    .join('  ·  ')}
            </p>

            <div className="overflow-x-auto rounded-xl border bg-card p-4">
                <Fretboard tonica={tonica} notas={notasDaEscala(tonica, escala)} mostrar={mostrar} destaque={posicao === null ? [] : shape(tonica, escala, posicao)} />
            </div>
        </section>
    )
}