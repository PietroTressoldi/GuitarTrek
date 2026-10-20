import type { ReactNode } from 'react'

const PAPEIS = [
    { cor: 'bg-primary', nome: '1 · tônica do acorde' },
    { cor: 'bg-grau-3', nome: '3 · diz se é maior ou menor' },
    { cor: 'bg-foreground', nome: '5' },
    { cor: 'bg-grau-7', nome: '7 · a cor do acorde' },
]

// A legenda das cores do braço quando tem um acorde na tela. `extra` = um item a mais no fim.
export function LegendaPapeis({ extra }: { extra?: ReactNode }) {
    return (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {PAPEIS.map((p) => (
                <span key={p.nome} className="flex items-center gap-2">
                    <span className={`size-3.5 rounded-full ${p.cor}`} /> {p.nome}
                </span>
            ))}
            <span className="flex items-center gap-2">
                <span className="size-3 rounded-full border-2 border-tensao" /> Tensão: não pare nela
            </span>
            <span className="flex items-center gap-2">
                <span className="size-3 rounded-full border-2 border-cat-escalas opacity-60" /> Resto da escala
            </span>
            {extra && <span className="flex items-center gap-2">{extra}</span>}
        </div>
    )
}