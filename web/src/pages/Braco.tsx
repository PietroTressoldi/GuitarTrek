import { useState } from 'react'
import { Escalas } from './Escalas'
import { Acordes } from './Acordes'
import { Alternador } from '@/components/Alternador'
import type { Nota } from '@/theory/notas'
import type { NomeEscala } from '@/theory/escalas'
import type { Forma, TipoAcorde } from '@/theory/acordes'
import type { Exibicao } from '@/components/Fretboard'
import { EscalaNoAcorde } from './EscalasNoAcorde'

const MODOS = [
    { valor: 'escalas', rotulo: 'Escalas' },
    { valor: 'acordes', rotulo: 'Acordes' }, 
    { valor: 'caged', rotulo: 'Escala + Acorde' }
] as const

type Modo = (typeof MODOS)[number]['valor']

// As escolhas valem para os 3 modos: trocar de modo não perde nada
export type OpcoesBraco = {
    tonica: Nota
    escala: NomeEscala
    tipo: TipoAcorde
    forma: Forma | null
    posicao: number | null
    mostrar: Exibicao
}

export type PropsModo = {
    opcoes: OpcoesBraco
    mudar: (novas: Partial<OpcoesBraco>) => void
}

const INICIAIS: OpcoesBraco = { tonica: 'A', escala: 'pentaMenor', tipo: 'm7', forma: 'E', posicao: null, mostrar: 'nota' }

export function Braco() {
    const [modo, setModo] = useState<Modo>('escalas')
    const [opcoes, setOpcoes] = useState(INICIAIS)
    const mudar = (novas: Partial<OpcoesBraco>) => setOpcoes((atuais) => ({ ...atuais, ...novas }))

    return (
        <section className="flex flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <h1 className="text-4xl">Braço</h1>
                <Alternador opcoes={MODOS} valor={modo} onChange={setModo} />
            </div>
            {modo === 'escalas' && <Escalas opcoes={opcoes} mudar={mudar} />}
            {modo === 'acordes' && <Acordes opcoes={opcoes} mudar={mudar} />}
            {modo === 'caged' && <EscalaNoAcorde opcoes={opcoes} mudar={mudar} />}
        </section>
    )
}
