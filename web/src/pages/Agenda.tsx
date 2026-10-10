import { CalendarDays } from 'lucide-react'
import { PaginaEmBreve } from '../components/PaginaEmBreve'

export function Agenda() {
    return (
        <PaginaEmBreve
            title='Agenda'
            description='A semana e o mês do seu plano, com o que fazer em cada dia.'
            icon={CalendarDays}
        />
    )
}