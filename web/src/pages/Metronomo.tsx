import { Metronome } from 'lucide-react'
import { PaginaEmBreve } from '../components/PaginaEmBreve'

export function Metronomo() {
    return (
        <PaginaEmBreve
            title='Metrônomo'
            description='Tempo, subdivisões, speed trainer e drone. Chega no módulo 3.'
            icon={Metronome}
        />
    )
}