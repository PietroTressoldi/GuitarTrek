import type { LucideIcon } from 'lucide-react'

type Props = {
    title: string
    description: string
    icon: LucideIcon
}

export function PaginaEmBreve({ title, description, icon: Icon }: Props) {
    return (
        <section className='flex max-w-3xl flex-col gap-8'>
            <h1 className='text-4xl'>{title}</h1>
            <div className='flex items-start gap-4 rounded-lg border bg-card p-6'>
                <Icon className='size-5 shrink-0 text-primary' />
                <p className='max-w-md text-muted-foreground'>{description}</p>
            </div>
        </section>
    )
}