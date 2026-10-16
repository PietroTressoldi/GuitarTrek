import { createContext, useContext, type ReactNode } from 'react'
import { useMetronome } from '@/hooks/useMetronome'
import { useDrone } from '@/hooks/useDrone'

type Audio = {
    metronomo: ReturnType<typeof useMetronome>
    drone: ReturnType<typeof useDrone>
}

const ContextoDeAudio = createContext<Audio | null>(null)

export function ProvedorDeAudio({ children }: { children: ReactNode }) {
    const metronomo = useMetronome()
    const drone = useDrone()

    return <ContextoDeAudio value={{ metronomo, drone }}>{children}</ContextoDeAudio>
}

export function useAudio() {
    const audio = useContext(ContextoDeAudio)
    if (!audio) throw new Error('useAudio só funciona dentro de <ProvedorDeAudio>')
    return audio
}