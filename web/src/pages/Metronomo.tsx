import { Hand, Minus, Pause, Play, Plus, Volume2 } from 'lucide-react'
import { SONS, useMetronome } from '@/hooks/useMetronome'
import { IconeSubdivisao, IconesSom } from '@/components/IconesMusicais'
import { motion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'

const COMPASSOS = [2, 3, 4, 5, 6, 7]

const SUBDIVISOES = [
    { valor: 1, nome: 'Semínima' },
    { valor: 2, nome: 'Colcheia' },
    { valor: 3, nome: 'Tercina' },
    { valor: 4, nome: 'Semicolcheia' },
]

const ANDAMENTOS = [
    { ate: 60, nome: 'Largo' },
    { ate: 76, nome: 'Adagio' },
    { ate: 108, nome: 'Andante' },
    { ate: 120, nome: 'Moderato' },
    { ate: 156, nome: 'Allegro' },
    { ate: 176, nome: 'Vivace' },
    { ate: 200, nome: 'Presto' },
    { ate: Infinity, nome: 'Prestissimo' },
]

export function Metronomo() {

    const m = useMetronome()
    const { tocando, setTocando } = m

    const andamento = ANDAMENTOS.find((a) => m.bpm < a.ate)!.nome

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
        <section className="flex max-w-5xl flex-col gap-8">
            <h1 className="text-4xl">Metrônomo</h1>

            <div className="grid items-start gap-6 lg:grid-cols-2">
                {/* Painel principal: visor + transporte */}
                <div className="flex flex-col gap-8 rounded-lg border bg-background px-5 pt-6 pb-8 shadow-[inset_0_2px_14px_var(--sombra)]">
                    <div className="flex gap-2">
                        {Array.from({ length: m.tempos }, (_, i) => {
                            const aceso = m.tempoAtual === i
                            return (
                                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                                    <motion.span
                                        animate={{ opacity: aceso ? 1 : 0.25 }}
                                        transition={{ duration: aceso ? 0 : 0.25 }}
                                        className={`h-1.5 w-full rounded-full bg-current ${i === 0 && m.acento ? 'text-primary' : 'text-foreground'} ${aceso ? 'shadow-[0_0_12px_currentColor]' : ''}`}
                                    />
                                    <span className={`text-xs tabular-nums ${aceso ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {i + 1}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="font-heading text-8xl leading-none font-semibold tabular-nums font-stretch-expanded sm:text-9xl">
                            {m.bpm}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            BPM <span className="ml-2 italic">{andamento}</span>
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <BotaoRedondo rotulo="Diminuir BPM" onClick={() => m.mudarBpm(m.bpm - 1)}>
                        <Minus className="size-4" />
                    </BotaoRedondo>
                    <input
                        type="range"
                        min={30}
                        max={300}
                        value={m.bpm}
                        onChange={(e) => m.mudarBpm(Number(e.target.value))}
                        aria-label="BPM"
                        className="w-full accent-primary"
                    />
                    <BotaoRedondo rotulo="Aumentar BPM" onClick={() => m.mudarBpm(m.bpm + 1)}>
                        <Plus className="size-4" />
                    </BotaoRedondo>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={m.tap}
                        className="flex items-center gap-2 rounded-lg border px-5 py-3.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        <Hand className="size-5" />
                        Tap
                    </button>
                    <button
                        onClick={() => setTocando(!tocando)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3.5 font-semibold text-primary-foreground hover:brightness-110"
                    >
                        {tocando ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
                        {tocando ? 'Parar' : 'Começar'}
                        <kbd className="ml-2 hidden rounded border border-primary-foreground/30 px-1.5 text-xs font-medium opacity-70 sm:inline">
                            espaço
                        </kbd>
                    </button>
                </div>
                <div className="flex flex-col gap-6">
                    <Grupo titulo="Compasso">
                        <div className="grid grid-cols-6 gap-2">
                            {COMPASSOS.map((n) => (
                                <Escolha key={n} ativo={m.tempos === n} onClick={() => m.setTempos(n)} rotulo={`${n} por 4`}>
                                    <span className="flex flex-col items-center font-heading text-lg leading-none font-semibold tabular-nums font-stretch-expanded">
                                        <span>{n}</span>
                                        <span className="my-1 h-px w-4 bg-current opacity-40" />
                                        <span>4</span>
                                    </span>
                                </Escolha>
                            ))}
                        </div>
                    </Grupo>
                </div>
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

function Escolha({ ativo, onClick, rotulo, children }: { ativo: boolean; onClick: () => void; rotulo?: string; children: ReactNode }) {
    return (
        <button
            onClick={onClick}
            aria-pressed={ativo}
            aria-label={rotulo}
            className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border px-1 py-3 transition-colors ${ativo
                ? 'border-primary/50 bg-accent text-foreground'
                : 'border-transparent bg-background/50 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
        >
            {ativo && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
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

function BotaoRedondo({ rotulo, onClick, children }: { rotulo: string; onClick: () => void; children: ReactNode }) {
    return (
        <button
            onClick={onClick}
            aria-label={rotulo}
            className="grid size-10 shrink-0 place-items-center rounded-full border text-muted-foreground hover:bg-accent hover:text-foreground"
        >
            {children}
        </button>
    )
}

function Grupo({ titulo, extra, children }: { titulo: string; extra?: ReactNode; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
            <div className="flex min-h-6 items-center justify-between gap-4">
                <h2 className="text-sm font-semibold">{titulo}</h2>
                {extra}
            </div>
            {children}
        </div>
    )
}