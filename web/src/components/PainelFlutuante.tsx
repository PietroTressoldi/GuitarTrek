import { Link, useLocation } from 'react-router'
import { Pause, Play, X } from 'lucide-react'
import { NOTAS } from '@/hooks/useDrone'
import { useAudio } from './ProvedorDeAudio'
import { AnimatePresence, motion } from 'motion/react'

export function PainelFlutuante() {

    const { metronomo: m, drone } = useAudio()
    const { pathname } = useLocation()

    if (pathname === '/metronomo' || pathname === '/backing') return null

    return (
        <AnimatePresence>
            {pathname !== '/metronomo' && (
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 24 }}
                    className="fixed right-4 bottom-20 z-10 flex items-center gap-3 rounded-full border bg-card py-2 pr-2 pl-4 shadow-[0_8px_24px_var(--sombra)] md:right-8 md:bottom-8"
                >
                    <motion.span
                        key={m.tempoAtual}
                        initial={m.tempoAtual >= 0 ? { scale: 2, opacity: 1 } : false}
                        animate={{ scale: 1, opacity: 0.3 }}
                        transition={{ duration: 0.3 }}
                        className={`size-2 rounded-full bg-current ${m.tempoAtual === 0 && m.acento ? 'text-primary' : 'text-foreground'}`}
                    />
                    <Link to="/metronomo" className='flex items-baseline gap-1.5'>
                        <span className='font-heading text-lg font-semibold tabular-nums font-stretch-expanded'>{m.bpm}</span>
                        <span className='text-xs text-muted-foreground'>BPM</span>
                    </Link>

                    {
                        drone.tocando && (
                            <button
                                onClick={() => drone.setTocando(false)}
                                aria-label="Parar o drone"
                                className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                                Drone {NOTAS[drone.tonica]}
                                <X className="size-3.5" />
                            </button>
                        )
                    }

                    <button
                        onClick={() => m.setTocando(!m.tocando)}
                        aria-label={m.tocando ? 'Parar o metrônomo' : 'Começar o metrônomo'}
                        className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground hover:brightness-110"
                    >
                        {m.tocando ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
                    </button>
                </motion.div>
            )}
        </AnimatePresence >
    )
}