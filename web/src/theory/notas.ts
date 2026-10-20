export const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
export type Nota = (typeof NOTAS)[number]
export const GRAUS = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7']

export function transpor(nota: Nota, semitons: number): Nota {
    const indice = NOTAS.indexOf(nota)
    const novo = (((indice + semitons) % 12) + 12) % 12

    return NOTAS[novo]
}

export function distancia(de: Nota, ate: Nota): number {
    return (((NOTAS.indexOf(ate) - NOTAS.indexOf(de)) % 12) + 12) % 12
}

export function grau(tonica: Nota, nota: Nota): string {
    return GRAUS[distancia(tonica, nota)]
}
