import { useEffect } from 'react'
import { Pause, Play } from 'lucide-react'
import { NOTAS, type Nota } from '@/theory/notas'
import { cifra } from '@/theory/acordes'
import { acordeDoGrau, PROGRESSOES, type NomeProgressao } from '@/theory/progressoes'
import { ESTILOS, type NomeEstilo } from '@/backing/estilos'
import { useBacking } from '@/hooks/useBacking'

const NOMES_ESTILO = Object.keys(ESTILOS) as NomeEstilo[]
const NOMES_PROGRESSAO = Object.keys(PROGRESSOES) as NomeProgressao[]

export function Backing() {
    const b = useBacking()
    const { tocando, setTocando } = b
    useEffect(() => {
        function aoTeclar(e: KeyboardEvent) {
            if (e.code === 'Space') {
                e.preventDefault()
                setTocando(!tocando)
            }
        }
        window.addEventListener('keydown', aoTeclar)
        return () => window.removeEventListener('keydown', aoTeclar)
    }, [tocando, setTocando])
    const compassos = PROGRESSOES[b.progressao].compassos.map((grau) => acordeDoGrau(b.tom, grau))
    const indiceAtual = b.compassoAtual === -1 ? -1 : b.compassoAtual % compassos.length
    const atual = compassos[indiceAtual]

    return (
        <section className="flex max-w-5xl flex-col gap-8">
            <h1 className="text-4xl">Backing tracks</h1>

            <div className="flex flex-wrap items-end gap-4">
                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Tom
                    <select
                        value={b.tom}
                        onChange={(e) => b.setTom(e.target.value as Nota)}
                        className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                    >
                        {NOTAS.map((nota) => (
                            <option key={nota}>{nota}</option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Estilo
                    <select
                        value={b.estilo}
                        onChange={(e) => b.setEstilo(e.target.value as NomeEstilo)}
                        className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                    >
                        {NOMES_ESTILO.map((nome) => (
                            <option key={nome} value={nome}>
                                {ESTILOS[nome].nome}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Progressão
                    <select
                        value={b.progressao}
                        onChange={(e) => b.setProgressao(e.target.value as NomeProgressao)}
                        className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                    >
                        {NOMES_PROGRESSAO.map((nome) => (
                            <option key={nome} value={nome}>
                                {PROGRESSOES[nome].nome}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    BPM
                    <input
                        type="number"
                        min={40}
                        max={240}
                        value={b.bpm}
                        onChange={(e) => b.setBpm(Number(e.target.value))}
                        className="w-20 rounded-md border bg-card px-3 py-2 text-sm tabular-nums text-foreground"
                    />
                </label>

                <button
                    onClick={() => b.setTocando(!b.tocando)}
                    disabled={!b.carregado}
                    className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
                >
                    {b.tocando ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
                    {!b.carregado ? 'Carregando…' : b.tocando ? 'Parar' : 'Tocar'}
                </button>
            </div>

            <p className="font-heading text-6xl font-semibold font-stretch-expanded">{atual ? cifra(atual.raiz, atual.tipo) : '—'}</p>

            <div className="grid grid-cols-4 gap-2">
                {compassos.map((acorde, i) => (
                    <div
                        key={i}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-3 font-heading font-semibold font-stretch-expanded transition-colors ${i === indiceAtual ? 'bg-secondary text-foreground' : 'bg-card text-muted-foreground'
                            }`}
                    >
                        {i === indiceAtual && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
                        {cifra(acorde.raiz, acorde.tipo)}
                    </div>
                ))}
            </div>
        </section>
    )
}