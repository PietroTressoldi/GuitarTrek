import { describe, it, expect } from 'vitest'
import { duracaoEmPassos, notaDoBaixo, notasDoTeclado } from '../notas'

describe('notas do baixo e do teclado', () => {
    it('a raiz de Lá no baixo é a corda Lá solta (MIDI 33)', () => {
        expect(notaDoBaixo({ raiz: 'A', tipo: 'dom7' }, '1')).toBe(33)
    })
    it('o 3 segue o acorde: maior sobe 4, menor sobe 3', () => {
        expect(notaDoBaixo({ raiz: 'A', tipo: 'maior' }, '3')).toBe(37)
        expect(notaDoBaixo({ raiz: 'A', tipo: 'menor' }, '3')).toBe(36)
    })
    it('o 7 de uma tríade vira a oitava', () => {
        expect(notaDoBaixo({ raiz: 'A', tipo: 'maior' }, '7')).toBe(45)
    })
    it('o teclado empilha o acorde a partir do Dó 3', () => {
        expect(notasDoTeclado({ raiz: 'C', tipo: 'maj7' })).toEqual([48, 52, 55, 59])
    })
})

describe('duração', () => {
    it('cada "-" segura mais um passo', () => {
        expect(duracaoEmPassos('1--.5...', 0)).toBe(3)
        expect(duracaoEmPassos('1--.5...', 4)).toBe(1)
    })
    it('não passa do fim do compasso', () => {
        expect(duracaoEmPassos('X---', 0)).toBe(4)
    })
})