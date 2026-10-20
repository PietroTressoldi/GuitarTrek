import { describe, it, expect } from 'vitest'
import { transpor, distancia } from '../notas'
import { notasDaEscala } from '../escalas'
import { ACORDES, FORMAS, notasDoAcorde, papel, voicing, type Forma, type TipoAcorde } from '../acordes'
import { grau, NOTAS } from '../notas'
import { notaNaCasa } from '../braco'
import { funcao } from '../progressoes'

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

describe('voicings', () => {
    it('Lá maior aberto', () => {
        expect(voicing('A', 'maior', 'A')).toEqual(['0-0', '1-2', '2-2', '3-2', '4-0'])
    })
    it('F com pestana na casa 1', () => {
        expect(voicing('F', 'maior', 'E')).toEqual(['0-1', '1-1', '2-2', '3-3', '4-3', '5-1'])
    })
    it('C aberto na forma de C', () => {
        expect(voicing('C', 'maior', 'C')).toEqual(['0-0', '1-1', '2-0', '3-2', '4-3'])
    })
    it('todas as formas CAGED só tocam notas do acorde, com tônica e 3ª, dentro do braço', () => {
        for (const raiz of NOTAS)
            for (const tipo of Object.keys(ACORDES) as TipoAcorde[])
                for (const forma of Object.keys(FORMAS) as Forma[]) {
                    const tocadas = voicing(raiz, tipo, forma).map((k) => {
                        const [corda, casa] = k.split('-').map(Number)
                        expect(casa).toBeGreaterThanOrEqual(0)
                        expect(casa).toBeLessThanOrEqual(17)
                        return notaNaCasa(corda, casa)
                    })
                    const acorde = notasDoAcorde(raiz, tipo)
                    expect(tocadas.every((n) => acorde.includes(n))).toBe(true)
                    expect(tocadas).toContain(acorde[0])
                    expect(tocadas).toContain(acorde[1])
                }
    })
})

describe('papel da nota no acorde', () => {
    it('A7: A é 1, C# é 3, E é 5, G é 7', () => {
        expect(['A', 'C#', 'E', 'G'].map((n) => papel('A', 'dom7', n as 'A'))).toEqual(['1', '3', '5', '7'])
    })
    it('no D7, o G (meio tom acima do F#) é tensão; o E é só escala', () => {
        expect(papel('D', 'dom7', 'G')).toBe('tensao')
        expect(papel('D', 'dom7', 'E')).toBe('escala')
    })
    it('no E7, o C (meio tom acima do B) é tensão', () => {
        expect(papel('E', 'dom7', 'C')).toBe('tensao')
    })
})

describe('função do grau', () => {
    it('I tônica, IV subdominante, V dominante', () => {
        expect(['I7', 'IV7', 'V7', 'vi', 'ii7', 'bVII'].map(funcao)).toEqual(['T', 'S', 'D', 'T', 'S', 'S'])
    })
})