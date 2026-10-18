import { it, expect } from 'vitest'
import { ESTILOS } from '../estilos'

it('todo padrão tem 16 passos, só com X, x e .', () => {
    for (const estilo of Object.values(ESTILOS)) {
        for (const padrao of Object.values(estilo.bateria)) {
            expect(padrao).toMatch(/^[Xx.]{16}$/)
        }
    }
})