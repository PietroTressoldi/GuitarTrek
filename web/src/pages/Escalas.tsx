import { Fretboard, type Exibicao } from '@/components/Fretboard'
import { grau, NOTAS, type Nota } from '@/theory/notas'
import { useState } from 'react'
import { notasDaEscala, type NomeEscala } from '@/theory/escalas'


const ROTULOS = {
    maior: 'Maior',
    menor: 'Menor natural',
    pentaMenor: 'Pentatônica menor',
    pentaMaior: 'Pentatônica maior',
    blues: 'Blues',
    dorico: 'Dórico',
    mixolidio: 'Mixolídio',
    lidio: 'Lídio',
} satisfies Record<NomeEscala, string>

const NOMES = Object.keys(ROTULOS) as NomeEscala[]
const OPCOES = [
    { valor: 'nota', rotulo: 'Notas' },
    { valor: 'grau', rotulo: 'Graus' },
] satisfies { valor: Exibicao; rotulo: string }[]

export function Escalas() {
    const [tonica, setTonica] = useState<Nota>('A')
    const [escala, setEscala] = useState<NomeEscala>('pentaMenor')
    const [mostrar, setMostrar] = useState<Exibicao>('nota')

    return (
        <section className="flex flex-col gap-8">
            <h1 className="text-4xl">Escalas</h1>

            <div className="flex flex-wrap gap-4">
                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Tônica
                    <select
                        value={tonica}
                        onChange={(e) => setTonica(e.target.value as Nota)}
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
                        onChange={(e) => setEscala(e.target.value as NomeEscala)}
                        className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                    >
                        {NOMES.map((nome) => (
                            <option key={nome} value={nome}>
                                {ROTULOS[nome]}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Mostrar
                    <div className="flex rounded-md border bg-card p-1">
                        {OPCOES.map((opcao) => (
                            <button
                                key={opcao.valor}
                                aria-pressed={mostrar === opcao.valor}
                                onClick={() => setMostrar(opcao.valor)}
                                className={`flex items-center gap-2 rounded px-3 py-1 text-sm transition-colors ${mostrar === opcao.valor ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {mostrar === opcao.valor && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
                                {opcao.rotulo}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <p className="font-heading text-xl font-semibold font-stretch-expanded">
                {notasDaEscala(tonica, escala)
                    .map((nota) => (mostrar === 'grau' ? grau(tonica, nota) : nota))
                    .join('  ·  ')}
            </p>

            <div className="overflow-x-auto rounded-xl border bg-card p-4">
                <Fretboard tonica={tonica} escala={escala} mostrar={mostrar} />
            </div>
        </section>
    )
}