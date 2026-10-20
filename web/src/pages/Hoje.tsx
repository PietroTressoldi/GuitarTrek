import { Guitar } from 'lucide-react'
import { PaginaEmBreve } from '../components/PaginaEmBreve'

export function Hoje() {
    return (
        <PaginaEmBreve
            title='Treino de Hoje'
            description='Seu treino do dia vai aparecer aqui, com cada exercício, o BPM alvo e o botão para começar.'
            icon={Guitar}
        />
    )
}