import { distancia, transpor, type Nota } from './notas'
import { AFINACAO_PADRAO } from './braco'

export const ACORDES = {
    maior: [0, 4, 7],
    menor: [0, 3, 7],
    dom7: [0, 4, 7, 10],
    m7: [0, 3, 7, 10],
    maj7: [0, 4, 7, 11],
} satisfies Record<string, number[]>

export type TipoAcorde = keyof typeof ACORDES

export function notasDoAcorde(raiz: Nota, tipo: TipoAcorde): Nota[] {
    return ACORDES[tipo].map((intervalo) => transpor(raiz, intervalo))
}

type Desenho = Record<TipoAcorde, (number | null)[]>

// CAGED: cada forma é um acorde aberto (C, A, G, E, D) que vira móvel com pestana.
// Os números são casas relativas à tônica na corda indicada; negativo = antes da tônica, null = não toca.
export const FORMAS = {
    C: {
        corda: 4,
        desenho: {
            maior: [-3, -2, -3, -1, 0, null],
            menor: [null, -2, -3, -2, 0, null],
            dom7: [-3, -2, 0, -1, 0, null],
            m7: [null, -2, 0, -2, 0, null],
            maj7: [-3, -3, -3, -1, 0, null],
        } satisfies Desenho,
    },
    A: {
        corda: 4,
        desenho: {
            maior: [0, 2, 2, 2, 0, null],
            menor: [0, 1, 2, 2, 0, null],
            dom7: [0, 2, 0, 2, 0, null],
            m7: [0, 1, 0, 2, 0, null],
            maj7: [0, 2, 1, 2, 0, null],
        } satisfies Desenho,
    },
    G: {
        corda: 5,
        desenho: {
            maior: [0, -3, -3, -3, -1, 0],
            menor: [0, 0, -3, -3, -2, 0],
            dom7: [-2, -3, -3, -3, -1, 0],
            m7: [-2, 0, -3, -3, -2, 0],
            maj7: [-1, -3, -3, -3, -1, 0],
        } satisfies Desenho,
    },
    E: {
        corda: 5,
        desenho: {
            maior: [0, 0, 1, 2, 2, 0],
            menor: [0, 0, 0, 2, 2, 0],
            dom7: [0, 0, 1, 0, 2, 0],
            m7: [0, 0, 0, 0, 2, 0],
            maj7: [0, 0, 1, 1, 2, 0],
        } satisfies Desenho,
    },
    D: {
        corda: 3,
        desenho: {
            maior: [2, 3, 2, 0, null, null],
            menor: [1, 3, 2, 0, null, null],
            dom7: [2, 1, 2, 0, null, null],
            m7: [1, 1, 2, 0, null, null],
            maj7: [2, 2, 2, 0, null, null],
        } satisfies Desenho,
    },
}

export type Forma = keyof typeof FORMAS

export function voicing(raiz: Nota, tipo: TipoAcorde, forma: Forma): string[] {
    const { corda, desenho } = FORMAS[forma]
    const casas = desenho[tipo]
    let casaRaiz = distancia(AFINACAO_PADRAO[corda], raiz)
    // C, G e D têm notas antes da tônica: se alguma cairia antes da casa 0, sobe uma oitava
    if (casaRaiz + Math.min(...casas.map((d) => d ?? 0)) < 0) casaRaiz += 12
    return casas.flatMap((d, c) => (d === null ? [] : [`${c}-${casaRaiz + d}`]))
}
