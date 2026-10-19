import { expect, describe, it } from "vitest";
import { aoRedor, notaNaCasa, shape } from "../braco";
import { notasDaEscala } from "../escalas";
import { voicing } from "../acordes";
import { formaPerto } from "../progressoes";

describe('braço', () => {
    it('casa 5 da 6ª corda é Lá', () => {
        expect(notaNaCasa(5, 5)).toBe('A')
    })
    it('casa 12 é a oitava da corda solta', () => {
        expect(notaNaCasa(0, 12)).toBe('E')
    })
    it('casa 2 da corda Sol é Lá', () => {
        expect(notaNaCasa(2, 2)).toBe('A')
    })
})

describe('shapes', () => {
    it('Lá penta, posição 1 = a caixa da casa 5', () => {
        expect(shape('A', 'pentaMenor', 0)).toEqual([
            '5-5', '5-8', '4-5', '4-7', '3-5', '3-7', '2-5', '2-7', '1-5', '1-8', '0-5', '0-8',
        ])
    })
    it('Sol maior 3 notas por corda começa na casa 3', () => {
        expect(shape('G', 'maior', 0).slice(0, 3)).toEqual(['5-3', '5-5', '5-7'])
    })
    it('Dó penta maior pos. 5 = Lá penta menor pos. 1', () => {
        expect(shape('C', 'pentaMaior', 4)).toEqual(shape('A', 'pentaMenor', 0))
    })
    it('blues = caixa da penta + blue notes', () => {
        const blues = shape('A', 'blues', 0)
        expect(blues).toContain('4-6')
        expect(blues).toContain('2-8')
        expect(blues.length).toBe(14)
    })
})

describe('escala ao redor do acorde', () => {
    it('A7 na forma de E + penta menor = a caixa 1', () => {
        const caixa = aoRedor(voicing('A', 'dom7', 'E'), notasDaEscala('A', 'pentaMenor'))
        expect(caixa.sort()).toEqual(shape('A', 'pentaMenor', 0).sort())
    })
    it('não passa da pestana', () => {
        expect(aoRedor(['0-0'], ['D#'])).toEqual(['3-1'])
    })
    
})
describe('forma mais perto', () => {
    it('no blues em Lá, perto do A7 da casa 5 o D7 é a forma de A', () => {
        expect(formaPerto('D', 'dom7', voicing('A', 'dom7', 'E'))).toEqual(voicing('D', 'dom7', 'A'))
    })
    it('e o E7 é a forma de C', () => {
        expect(formaPerto('E', 'dom7', voicing('A', 'dom7', 'E'))).toEqual(voicing('E', 'dom7', 'C'))
    })
    it('o próprio acorde fica onde está', () => {
        const a7 = voicing('A', 'dom7', 'E')
        expect(formaPerto('A', 'dom7', a7)).toEqual(a7)
    })
})