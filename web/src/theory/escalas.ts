import { transpor, type Nota } from './notas'

export const ESCALAS = {
    maior: [0, 2, 4, 5, 7, 9, 11],
    menor: [0, 2, 3, 5, 7, 8, 10],
    pentaMenor: [0, 3, 5, 7, 10],
    pentaMaior: [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10],
    dorico: [0, 2, 3, 5, 7, 9, 10],
    mixolidio: [0, 2, 4, 5, 7, 9, 10],
    lidio: [0, 2, 4, 6, 7, 9, 11]
} satisfies Record<string, number[]>

export type NomeEscala = keyof typeof ESCALAS

export function notasDaEscala(tonica: Nota, escala: NomeEscala): Nota[] {
    return ESCALAS[escala].map((intervalo) => transpor(tonica, intervalo))
}

export function estaNaEscala(nota: Nota, tonica: Nota, escala: NomeEscala): boolean {
    return notasDaEscala(tonica, escala).includes(nota)
}

export const ROTULOS_ESCALA = {
    maior: 'Maior',
    menor: 'Menor natural',
    pentaMenor: 'Pentatônica menor',
    pentaMaior: 'Pentatônica maior',
    blues: 'Blues',
    dorico: 'Dórico',
    mixolidio: 'Mixolídio',
    lidio: 'Lídio',
} satisfies Record<NomeEscala, string>
