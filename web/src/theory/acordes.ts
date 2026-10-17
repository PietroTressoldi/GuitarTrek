import { transpor, type Nota } from "./notas";

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