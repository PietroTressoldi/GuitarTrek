import { TrendingUp } from 'lucide-react'
import { PaginaEmBreve } from '../components/PaginaEmBreve'

export function Progresso() {
    return (
        <PaginaEmBreve
            title='Progresso'
            description='Seus BPMs ao longo do tempo, streak e recordes.'
            icon={TrendingUp}
        />
    )
}