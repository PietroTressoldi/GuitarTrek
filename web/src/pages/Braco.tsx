import { useState } from 'react'
import { Escalas } from './Escalas'
import { Acordes } from './Acordes'

const MODOS = [
    { valor: 'escalas', rotulo: 'Escalas' },
    { valor: 'acordes', rotulo: 'Acordes' },
] as const

type Modo = (typeof MODOS)[number]['valor']

export function Braco() {
    const [modo, setModo] = useState<Modo>('escalas')

    return (
        <section className="flex flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <h1 className="text-4xl">Braço</h1>
                <div className="flex rounded-md border bg-card p-1">
                    {MODOS.map((opcao) => (
                        <button
                            key={opcao.valor}
                            aria-pressed={modo === opcao.valor}
                            onClick={() => setModo(opcao.valor)}
                            className={`flex items-center gap-2 rounded px-3 py-1 text-sm transition-colors ${
                                modo === opcao.valor ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {modo === opcao.valor && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
                            {opcao.rotulo}
                        </button>
                    ))}
                </div>
            </div>
            {modo === 'escalas' ? <Escalas /> : <Acordes />}
        </section>
    )
}
