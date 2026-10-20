import { it, expect } from 'vitest'
import { ESTILOS } from '../estilos'

it('todo padrão tem 16 passos, só com X, x e .', () => {
    for (const estilo of Object.values(ESTILOS)) {
        for (const padrao of Object.values(estilo.bateria)) {
            expect(padrao).toMatch(/^[Xx.]{16}$/)
        }
    }
})

it('baixo e teclado têm 16 passos e não começam segurando nada', () => {
    for (const estilo of Object.values(ESTILOS)) {
        expect(estilo.baixo).toMatch(/^[135678.][135678.-]{15}$/)
        expect(estilo.teclado).toMatch(/^[Xx.][Xx.-]{15}$/)
    }
})
