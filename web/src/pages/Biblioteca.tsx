import { Library } from 'lucide-react'
import { PaginaEmBreve } from '../components/PaginaEmBreve'

export function Biblioteca() {
    return (
        <PaginaEmBreve
            title='Biblioteca'
            description='Todos os exercícios e escalas, com diagramas no braço da guitarra.'
            icon={Library}
        />
    )
}