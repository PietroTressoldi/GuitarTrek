import { describe, it, expect } from 'vitest'
import { transpor, distancia } from './notas'
import { notasDaEscala } from './escalas'
import { notasDoAcorde } from './acordes'
import { grau } from './notas'

describe('notas', () => {
    it('sobe um tom de C para D', () => {
        expect(transpor('C', 2)).toBe('D')
    })
    it('dá a volta no B', () => {
        expect(transpor('B', 1)).toBe('C')
    })
    it('desce com número negativo', () => {
        expect(transpor('C', -1)).toBe('B')
    })
    it('mede a distância de A até E', () => {
        expect(distancia('A', 'E')).toBe(7)
    })
})

describe('escalas', () => {
    it('Lá pentatônica menor', () => {
        expect(notasDaEscala('A', 'pentaMenor')).toEqual(['A', 'C', 'D', 'E', 'G'])
    })
    it('Dó maior não tem sustenido', () => {
        expect(notasDaEscala('C', 'maior')).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
    })
    it('Fá lidio', () => {
        expect(notasDaEscala('F', 'lidio')).toEqual(['F', 'G', 'A', 'B', 'C', 'D', 'E'])
    })
})

describe('acordes', () => {
    it('A7 = A C# E G', () => {
        expect(notasDoAcorde('A', 'dom7')).toEqual(['A', 'C#', 'E', 'G'])
    })
    it('as notas de A7 que estão na penta de Lá', () => {
        const penta = notasDaEscala('A', 'pentaMenor')
        const alvo = notasDoAcorde('A', 'dom7').filter((n) => penta.includes(n))
        expect(alvo).toEqual(['A', 'E', 'G'])
    })
    it('alvos do D7 e do E7 na penta de Lá', () => {
        const penta = notasDaEscala('A', 'pentaMenor')
        expect(notasDoAcorde('D', 'dom7').filter((n) => penta.includes(n))).toEqual(['D', 'A', 'C'])
        expect(notasDoAcorde('E', 'dom7').filter((n) => penta.includes(n))).toEqual(['E', 'D'])
    })
})

describe('graus', () => {
    it('C é a b3 de Lá', () => {
        expect(grau('A', 'C')).toBe('b3')
    })
    it('a tônica é 1', () => {
        expect(grau('E', 'E')).toBe('1')
    })
    it('penta menor em graus', () => {
        expect(notasDaEscala('A', 'pentaMenor').map((n) => grau('A', n))).toEqual(['1', 'b3', '4', '5', 'b7'])
    })
})


