import { Minus, Pause, Play, Plus } from 'lucide-react'
import { SONS, useMetronome } from '@/hooks/useMetronome'
import { motion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'

const COMPASSOS = [2, 3, 4, 5, 6, 7]
const SUBDIVISOES = [
    { valor: 1, nome: 'Semínima' },
    { valor: 2, nome: 'Colcheia' },
    { valor: 3, nome: 'Tercina' },
    { valor: 4, nome: 'Semicolcheia' },
]


export function Metronomo() {

    const m = useMetronome()
    const { tocando, setTocando } = m

    useEffect(() => {
        function aoTeclar(e: KeyboardEvent) {
            if (e.code === 'Space') {
                e.preventDefault()          // impede a página de rolar
                setTocando(!tocando)
            }
        }
        window.addEventListener('keydown', aoTeclar)
        return () => window.removeEventListener('keydown', aoTeclar)
    }, [tocando, setTocando])

    return (
        <section className="flex max-w-xl flex-col gap-10">
            <h1 className="text-4xl">Metrônomo</h1>
            <div className="flex flex-col items-center gap-8 rounded-lg border bg-card p-8">
                <div className="flex gap-4">
                    {Array.from({ length: m.tempos }, (_, i) => (
                        <motion.span
                            key={i}
                            animate={{ scale: m.tempoAtual === i ? 1.4 : 1 }}
                            transition={{ duration: 0.08 }}
                            className={`size-4 rounded-full ${m.tempoAtual === i
                                ? i === 0
                                    ? 'bg-primary shadow-[0_0_16px_var(--primary)]'
                                    : 'bg-foreground'
                                : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => m.mudarBpm(m.bpm - 1)}
                        aria-label="Diminuir BPM"
                        className="rounded-md border p-2 text-muted-foreground hover:text-foreground"
                    >
                        <Minus className="size-5" />
                    </button>

                    <div className="text-center">
                        <span className="block font-heading text-7xl font-semibold tabular-nums font-stretch-expanded">{m.bpm}</span>
                        <span className="text-sm text-muted-foreground">BPM</span>
                    </div>

                    <button
                        onClick={() => m.mudarBpm(m.bpm + 1)}
                        aria-label="Aumentar BPM"
                        className="rounded-md border p-2 text-muted-foreground hover:text-foreground"
                    >
                        <Plus className="size-5" />
                    </button>

                </div>
                <input
                    type="range"
                    min={30}
                    max={300}
                    value={m.bpm}
                    onChange={(e) => m.mudarBpm(Number(e.target.value))}
                    aria-label="BPM"
                    className="w-full accent-primary"
                />
                <div className="flex gap-3">
                    <button
                        onClick={m.tap}
                        className="rounded-md border px-6 py-3 font-semibold text-muted-foreground hover:text-foreground"
                    >
                        Tap
                    </button>
                    <button
                        onClick={() => setTocando(!tocando)}
                        className="flex items-center gap-2 rounded-md bg-primary px-8 py-3 font-semibold text-primary-foreground"
                    >
                        {tocando ? <Pause className="size-5" /> : <Play className="size-5" />}
                        {tocando ? 'Parar' : 'Começar'}
                    </button>
                </div>
            </div>
            <div className="flex flex-col gap-5 rounded-lg border bg-card p-6">
                <Ajuste rotulo="Compasso">
                    {COMPASSOS.map((n) => (
                        <Escolha key={n} ativo={m.tempos === n} onClick={() => m.setTempos(n)}>
                            {n}/4
                        </Escolha>
                    ))}
                </Ajuste>
                <Ajuste rotulo="Subdivisão">
                    {SUBDIVISOES.map((s) => (
                        <Escolha key={s.valor} ativo={m.subdivisao === s.valor} onClick={() => m.setSubdivisao(s.valor)}>
                            {s.nome}
                        </Escolha>
                    ))}
                </Ajuste>
                <Ajuste rotulo="Som">
                    {SONS.map((s) => (
                        <Escolha key={s.nome} ativo={m.som === s} onClick={() => m.setSom(s)}>
                            {s.nome}
                        </Escolha>
                    ))}
                </Ajuste>
                <Ajuste rotulo="Volume">
                    <input
                        type="range"
                        min={0.05}
                        max={1}
                        step={0.05}
                        value={m.volume}
                        onChange={(e) => m.setVolume(Number(e.target.value))}
                        aria-label="Volume"
                        className="w-40 accent-primary"
                    />
                </Ajuste>
                <Ajuste rotulo="Acento no 1">
                    <input
                        type="checkbox"
                        checked={m.acento}
                        onChange={(e) => m.setAcento(e.target.checked)}
                        aria-label="Acento no 1"
                        className="size-4 accent-primary"
                    />
                </Ajuste>

            </div>
            <div className="flex flex-col gap-5 rounded-lg border bg-card p-6">
                <label className="flex items-center gap-3 font-medium">
                    <input
                        type="checkbox"
                        checked={m.trainer.ativo}
                        onChange={(e) => m.setTrainer({ ...m.trainer, ativo: e.target.checked })}
                        className="size-4 accent-primary"
                    />
                    Speed trainer
                </label>
                <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    Subir
                    <Numero rotulo="BPM a subir" valor={m.trainer.aumento} onChange={(v) => m.setTrainer({ ...m.trainer, aumento: v })} />
                    BPM a cada
                    <Numero rotulo="Compassos" valor={m.trainer.aCada} onChange={(v) => m.setTrainer({ ...m.trainer, aCada: v })} />
                    compassos, até
                    <Numero rotulo="BPM máximo" valor={m.trainer.teto} onChange={(v) => m.setTrainer({ ...m.trainer, teto: v })} />
                    BPM.
                </p>
            </div>
        </section>
    )
}

function Ajuste({ rotulo, children }: { rotulo: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="w-28 shrink-0 text-sm text-muted-foreground">{rotulo}</span>
            <div className="flex flex-wrap items-center gap-1">{children}</div>
        </div>
    )
}

function Escolha({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            onClick={onClick}
            aria-pressed={ativo}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${ativo ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
        >
            {children}
        </button>
    )
}

function Numero({ rotulo, valor, onChange }: { rotulo: string; valor: number; onChange: (v: number) => void }) {
    return (
        <input
            type="number"
            min={1}
            value={valor}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label={rotulo}
            className="w-16 rounded-md border bg-background px-2 py-1 text-center text-foreground tabular-nums"
        />
    )
}