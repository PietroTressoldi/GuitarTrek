import { describe, it, expect } from 'vitest'
import { acordeDoGrau, PROGRESSOES } from '../progressoes'

describe('progressões', () => {
    it('V7 de Lá é E7', () => {
        expect(acordeDoGrau('A', 'V7')).toEqual({ raiz: 'E', tipo: 'dom7' })
    })
    it('minúsculo é menor: vi de Dó é Lá menor', () => {
        expect(acordeDoGrau('C', 'vi')).toEqual({ raiz: 'A', tipo: 'menor' })
    })
    it('bemol desce meio tom: bVII de Lá é Sol', () => {
        expect(acordeDoGrau('A', 'bVII')).toEqual({ raiz: 'G', tipo: 'maior' })
    })
    it('ii–V–I em Dó', () => {
        expect(PROGRESSOES.doisCincoUm.compassos.map((g) => acordeDoGrau('C', g))).toEqual([
            { raiz: 'D', tipo: 'm7' },
            { raiz: 'G', tipo: 'dom7' },
            { raiz: 'C', tipo: 'maj7' },
            { raiz: 'C', tipo: 'maj7' },
        ])
    })
})