import { Hand, Minus, Pause, Play, Plus, Volume2 } from 'lucide-react'
import { SONS } from '@/hooks/useMetronome'
import { useAudio } from '@/components/ProvedorDeAudio'
import { ACORDES, NOTAS, TIMBRES } from '@/hooks/useDrone'
import { IconeSubdivisao, IconesSom } from '@/components/IconesMusicais'
import { motion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'

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

    const { metronomo: m, drone } = useAudio()
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
                <div className="flex flex-col gap-6 rounded-xl border bg-card p-5 sm:p-6 lg:sticky lg:top-12">
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
                                BPM <span className={`ml-2 italic ${m.trainer.ativo ? 'text-primary' : ''}`}>{andamento}</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-8">
                        <BotaoRedondo rotulo="Diminuir BPM" onClick={() => m.mudarBpm(m.bpm - 1)}>
                            <Minus className="size-4" />
                        </BotaoRedondo>
                        <Knob rotulo="BPM" valor={m.bpm} min={30} max={300} onChange={m.mudarBpm} />
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
                </div>

                {/* Ajustes */}
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

                    <Grupo titulo="Subdivisão">
                        <div className="grid grid-cols-4 gap-2">
                            {SUBDIVISOES.map((s) => (
                                <Escolha key={s.valor} ativo={m.subdivisao === s.valor} onClick={() => m.setSubdivisao(s.valor)}>
                                    <IconeSubdivisao valor={s.valor} className="h-8 w-auto" />
                                    <span className="text-xs">{s.nome}</span>
                                </Escolha>
                            ))}
                        </div>
                    </Grupo>

                    <Grupo titulo="Som">
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                            {SONS.map((s) => {
                                const Icone = IconesSom[s.id]
                                return (
                                    <Escolha
                                        key={s.id}
                                        ativo={m.som.id === s.id}
                                        onClick={() => {
                                            m.setSom(s)
                                            m.ouvir(s)
                                        }}
                                    >
                                        <Icone className="size-7" />
                                        <span className="text-xs">{s.nome}</span>
                                    </Escolha>
                                )
                            })}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4">
                            <label className="flex flex-1 items-center gap-3 text-sm text-muted-foreground">
                                <Volume2 className="size-5 shrink-0" />
                                <input
                                    type="range"
                                    min={0.05}
                                    max={1}
                                    step={0.05}
                                    value={m.volume}
                                    onChange={(e) => m.setVolume(Number(e.target.value))}
                                    aria-label="Volume"
                                    className="w-full min-w-32 accent-primary"
                                />
                            </label>
                            <Interruptor ligado={m.acento} onChange={m.setAcento}>
                                Acento no 1
                            </Interruptor>
                        </div>
                    </Grupo>

                    <Grupo
                        titulo="Speed trainer"
                        extra={
                            <Interruptor ligado={m.trainer.ativo} onChange={(v) => m.setTrainer({ ...m.trainer, ativo: v })}>
                                {m.trainer.ativo ? 'Ligado' : 'Desligado'}
                            </Interruptor>
                        }
                    >
                        <div className={`grid grid-cols-3 gap-2 ${m.trainer.ativo ? '' : 'opacity-50'}`}>
                            <Numero rotulo="Subir" unidade="BPM" valor={m.trainer.aumento} onChange={(v) => m.setTrainer({ ...m.trainer, aumento: v })} />
                            <Numero rotulo="A cada" unidade="compassos" valor={m.trainer.aCada} onChange={(v) => m.setTrainer({ ...m.trainer, aCada: v })} />
                            <Numero rotulo="Até" unidade="BPM" valor={m.trainer.teto} onChange={(v) => m.setTrainer({ ...m.trainer, teto: v })} />
                        </div>
                    </Grupo>
                    <Grupo
                        titulo="Drone"
                        extra={
                            <Interruptor ligado={drone.tocando} onChange={drone.setTocando}>
                                {drone.tocando ? 'Tocando' : 'Parado'}
                            </Interruptor>
                        }
                    >
                        <div className="grid grid-cols-6 gap-2">
                            {NOTAS.map((nota, i) => (
                                <Escolha key={nota} ativo={drone.tonica === i} onClick={() => drone.setTonica(i)}>
                                    <span className="font-heading font-semibold font-stretch-expanded">{nota}</span>
                                </Escolha>
                            ))}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {ACORDES.map((a) => (
                                <Escolha key={a.id} ativo={drone.acorde.id === a.id} onClick={() => drone.setAcorde(a)}>
                                    <span className="text-xs">{a.nome}</span>
                                </Escolha>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {TIMBRES.map((t) => (
                                <Escolha key={t.id} ativo={drone.timbre.id === t.id} onClick={() => drone.setTimbre(t)}>
                                    <span className="text-xs">{t.nome}</span>
                                </Escolha>
                            ))}
                        </div>
                        <label className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                            <Volume2 className="size-5 shrink-0" />
                            <input
                                type="range"
                                min={0.05}
                                max={1}
                                step={0.05}
                                value={drone.volume}
                                onChange={(e) => drone.setVolume(Number(e.target.value))}
                                aria-label="Volume do drone"
                                className="w-full accent-primary"
                            />
                        </label>
                    </Grupo>
                </div>
            </div>
        </section>
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

function Interruptor({ ligado, onChange, children }: { ligado: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
    return (
        <button
            role="switch"
            aria-checked={ligado}
            onClick={() => onChange(!ligado)}
            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
        >
            <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${ligado ? 'bg-primary' : 'bg-muted'}`}>
                <span className={`size-4 rounded-full bg-foreground transition-transform ${ligado ? 'translate-x-4 bg-primary-foreground' : ''}`} />
            </span>
            {children}
        </button>
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

function Numero({ rotulo, unidade, valor, onChange }: { rotulo: string; unidade: string; valor: number; onChange: (v: number) => void }) {
    return (
        <label className="flex flex-col gap-1.5 rounded-lg bg-background/50 px-3 py-2.5">
            <span className="text-xs text-muted-foreground">{rotulo}</span>
            <span className="flex flex-wrap items-baseline gap-x-1.5">
                <input
                    type="number"
                    min={1}
                    value={valor}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-16 min-w-0 bg-transparent font-heading text-xl font-semibold tabular-nums font-stretch-expanded text-foreground outline-none"
                />
                <span className="text-xs text-muted-foreground">{unidade}</span>
            </span>
        </label>
    )
}

let ctxTique: AudioContext | null = null
let amostraTique: AudioBuffer | null = null
let ultimoTique = 0
// Onde cada "detente" acontece dentro de /sons/knob.mp3 (segundos, picos medidos no arquivo)

const CLIQUES = [0.2351, 0.4847, 0.6811, 0.9469, 1.0066, 1.2694, 2.0716, 2.5115, 2.7279]

// Clique de knob analógico: toca só um pedacinho de um detente real, sorteado, bem baixinho
async function tique(posicao: number) {
    ctxTique ??= new AudioContext()
    const ctx = ctxTique
    amostraTique ??= await ctx.decodeAudioData(await (await fetch('/sons/knob.mp3')).arrayBuffer())
    const t = ctx.currentTime
    if (t - ultimoTique < 0.03) return // arrastando rápido: não vira metralhadora
    ultimoTique = t

    const src = ctx.createBufferSource()
    src.buffer = amostraTique
    src.playbackRate.value = 0.97 + posicao * 0.08 + Math.random() * 0.04
    const ganho = ctx.createGain()
    ganho.gain.setValueAtTime(0.18, t)
    ganho.gain.setValueAtTime(0.18, t + 0.02)
    ganho.gain.linearRampToValueAtTime(0, t + 0.04) // fade curto, sem estalo no corte
    src.connect(ganho).connect(ctx.destination)
    const inicio = CLIQUES[Math.floor(Math.random() * CLIQUES.length)] - 0.003
    src.start(t, inicio, 0.04)
}

function Knob({ rotulo, valor, min, max, onChange }: { rotulo: string; valor: number; min: number; max: number; onChange: (v: number) => void }) {
    const acumulado = useRef<number | null>(null) // valor "solto" (decimal) enquanto arrasta
    const angulo = -135 + ((valor - min) / (max - min)) * 270

    return (
        <div
            role="slider"
            tabIndex={0}
            aria-label={rotulo}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={valor}
            onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                e.currentTarget.requestPointerLock?.() // prende e esconde o cursor
                acumulado.current = valor
            }}
            onPointerMove={(e) => {
                if (acumulado.current === null) return
                const novo = Math.min(max, Math.max(min, acumulado.current - e.movementY / 2))
                acumulado.current = novo
                if (Math.round(novo) !== valor) tique(novo / max)
                onChange(novo)
            }}
            onPointerUp={() => {
                acumulado.current = null
                if (document.pointerLockElement) document.exitPointerLock()
            }}
            onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                    e.preventDefault()
                    onChange(valor + 1)
                }
                if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                    e.preventDefault()
                    onChange(valor - 1)
                }
            }}
            style={{ rotate: `${angulo}deg` }}
            className="relative size-24 shrink-0 cursor-ns-resize touch-none rounded-full border-4 border-background bg-secondary shadow-[0_6px_16px_var(--sombra)] outline-offset-4"
        >
            <span className="absolute top-2 left-1/2 h-5 w-1 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />
        </div>
    )
}