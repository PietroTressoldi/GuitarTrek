import { describe, it, expect } from 'vitest'
import { bateriaDoCompasso, tamanhoDaSecao } from '../bateria'
import { ESTILOS } from '../estilos'

const rock = ESTILOS.rock

describe('bateria que muda ao longo da música', () => {
    it('a seção tem pelo menos 8 compassos', () => {
        expect(tamanhoDaSecao(12)).toBe(12)
        expect(tamanhoDaSecao(4)).toBe(8)
        expect(tamanhoDaSecao(2)).toBe(8)
    })
    it('no meio da frase, toca o groove normal', () => {
        expect(bateriaDoCompasso(rock, 1, 12, 0)).toEqual(rock.bateria)
    })
    it('o 1º compasso da seção começa com prato', () => {
        expect(bateriaDoCompasso(rock, 0, 12, 0).crash?.[0]).toBe('X')
    })
    it('o último compasso tem a virada nos tons, e o groove some no fim', () => {
        const ultimo = bateriaDoCompasso(rock, 11, 12, 0)
        expect(ultimo.tom3).toBe('...............X')
        expect(ultimo.hhclosed?.slice(8)).toBe('........')
        expect(ultimo.kick?.slice(0, 8)).toBe(rock.bateria.kick.slice(0, 8))
    })
    it('no fim de cada frase de 4, uma mini-virada só no último tempo', () => {
        expect(bateriaDoCompasso(rock, 3, 12, 0).snare?.slice(12)).toBe('X.XX')
    })
    it('a 2ª seção é o refrão: troca o chimbal pelo prato de condução', () => {
        const refrao = bateriaDoCompasso(rock, 1, 12, 1)
        expect(refrao.ride).toBe(rock.refrao.ride)
        expect(refrao.hhclosed).toBe('................')
    })
    it('todo padrão, depois de virada e prato, continua com 16 passos', () => {
        for (const estilo of Object.values(ESTILOS)) {
            for (let compasso = 0; compasso < 12; compasso++) {
                for (const padrao of Object.values(bateriaDoCompasso(estilo, compasso, 12, compasso % 2))) {
                    expect(padrao).toMatch(/^[Xx.]{16}$/)
                }
            }
        }
    })
})