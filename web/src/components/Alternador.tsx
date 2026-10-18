type Props<T> = {
    opcoes: readonly { valor: T; rotulo: string }[]
    valor: T
    onChange: (valor: T) => void
}

export function Alternador<T extends string | number | null>({ opcoes, valor, onChange }: Props<T>) {
    return (
        <div className="flex w-fit rounded-md border bg-card p-1">
            {opcoes.map((opcao) => (
                <button
                    key={opcao.rotulo}
                    aria-pressed={valor === opcao.valor}
                    onClick={() => onChange(opcao.valor)}
                    className={`flex items-center gap-2 rounded px-3 py-1 text-sm tabular-nums transition-colors ${valor === opcao.valor ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    {valor === opcao.valor && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
                    {opcao.rotulo}
                </button>
            ))}
        </div>
    )
}