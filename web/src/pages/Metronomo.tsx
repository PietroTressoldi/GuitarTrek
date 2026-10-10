import { Minus, Pause, Play, Plus } from 'lucide-react'
import { useMetronome } from '@/hooks/useMetronome'
import { motion } from 'motion/react'
import { useEffect } from 'react'

const COMPASSOS = [2, 3, 4, 5, 6, 7]

export function Metronomo() {
    const { bpm, setBpm, tempos, setTempos, tocando, setTocando, tempoAtual } = useMetronome()

    function mudarBpm(valor: number) {
        setBpm(Math.min(300, Math.max(30, valor)))
    }

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
                    {Array.from({ length: tempos }, (_, i) => (
                        <motion.span
                            key={i}
                            animate={{ scale: tempoAtual === i ? 1.4 : 1 }}
                            transition={{ duration: 0.08 }}
                            className={`size-4 rounded-full ${tempoAtual === i
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
                        onClick={() => mudarBpm(bpm - 1)}
                        aria-label="Diminuir BPM"
                        className="rounded-md border p-2 text-muted-foreground hover:text-foreground"
                    >
                        <Minus className="size-5" />
                    </button>

                    <div className="text-center">
                        <span className="block font-heading text-7xl font-semibold tabular-nums font-stretch-expanded">{bpm}</span>
                        <span className="text-sm text-muted-foreground">BPM</span>
                    </div>

                    <button
                        onClick={() => mudarBpm(bpm + 1)}
                        aria-label="Aumentar BPM"
                        className="rounded-md border p-2 text-muted-foreground hover:text-foreground"
                    >
                        <Plus className="size-5" />
                    </button>
                    <button
                        onClick={() => setTocando(!tocando)}
                        className="flex items-center gap-2 rounded-md bg-primary px-8 py-3 font-semibold text-primary-foreground"
                    >
                        {tocando ? <Pause className="size-5" /> : <Play className="size-5" />}
                        {tocando ? 'Parar' : 'Começar'}
                    </button>
                </div>
                <input
                    type="range"
                    min={30}
                    max={300}
                    value={bpm}
                    onChange={(e) => mudarBpm(Number(e.target.value))}
                    aria-label="BPM"
                    className="w-full accent-primary"
                />
                <div className="flex gap-2">
                    {COMPASSOS.map((n) => (
                        <button
                            key={n}
                            onClick={() => setTempos(n)}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium ${tempos === n ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {n}/4
                        </button>
                    ))}
                </div>
            </div>
        </section>
    )
}



