import { ACORDES } from '@/theory/acordes'
import { distancia } from '@/theory/notas'
import type { Acorde } from '@/theory/progressoes'

// Nas partituras do baixo: cada número é uma nota do acorde do compasso
const CODIGOS: Record<string, (intervalos: number[]) => number> = {
    '1': () => 0,
    '3': (i) => i[1],
    '5': (i) => i[2],
    '6': () => 9,
    '7': (i) => i[3] ?? 12, // tríade não tem 7ª: toca a oitava
    '8': () => 12,
}

const MI_GRAVE = 28 // MIDI do Mi solto do baixo (E1)
const DO_CENTRAL = 48 // MIDI do Dó 3, onde começa o teclado

// A nota MIDI do baixo para um código ('1', '5', '8'...) sobre um acorde
export function notaDoBaixo(acorde: Acorde, codigo: string): number {
    const raiz = MI_GRAVE + distancia('E', acorde.raiz)
    return raiz + CODIGOS[codigo](ACORDES[acorde.tipo])
}

// As notas MIDI do acorde no teclado, empilhadas a partir da raiz
export function notasDoTeclado(acorde: Acorde): number[] {
    const raiz = DO_CENTRAL + distancia('C', acorde.raiz)
    return ACORDES[acorde.tipo].map((intervalo) => raiz + intervalo)
}

// Quantos passos dura a nota que começa em `passo`: ela mesma mais os '-' logo depois
export function duracaoEmPassos(padrao: string, passo: number): number {
    let fim = passo + 1
    while (padrao[fim] === '-') fim++
    return fim - passo
}