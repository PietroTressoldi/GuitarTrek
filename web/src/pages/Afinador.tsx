import { AudioWaveform } from 'lucide-react'
import { PaginaEmBreve } from '../components/PaginaEmBreve'

export function Afinador() {
    return (
        <PaginaEmBreve
            title='Afinador'
            description='Seu afinador para deixar a guitarra no ponto, com referência visual e sonora.'
            icon={AudioWaveform}
        />
    )
}