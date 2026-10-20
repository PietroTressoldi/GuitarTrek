import type { Timbres } from './timbres'

// Cada linha é 1 compasso em 16 passos (semicolcheias). Os tempos 1, 2, 3 e 4 caem nos passos 0, 4, 8 e 12.
// Bateria e teclado: 'X' = forte, 'x' = fraco, '.' = silêncio.
// Baixo: '1' '3' '5' '6' '7' '8' = nota do acorde ('8' = oitava).
// Em todos: '-' segura a nota de antes.
// swing: 0 = reto, 1 = shuffle (a 2ª colcheia de cada tempo cai na 3ª nota da tercina)
export type PecaBateria = 'kick' | 'snare' | 'hhclosed' | 'hhopen' | 'stick' | 'ride' | 'crash' | 'tom1' | 'tom2' | 'tom3'

export type Estilo = {
    nome: string
    swing: number
    bateria: Partial<Record<PecaBateria, string>>
    refrao: Partial<Record<PecaBateria, string>> // o que muda na bateria quando a volta é de refrão
    baixo: string
    teclado: string
    timbres: Timbres // o som que combina com o estilo; dá para trocar no mixer
}

export const ESTILOS = {
    rock: {
        nome: 'Rock',
        swing: 0,
        bateria: {
            kick: 'X.......X.X.....',
            snare: '....X.......X...',
            hhclosed: 'X.x.X.x.X.x.X...',
            hhopen: '..............x.',
        },
        refrao: { hhclosed: '................', hhopen: '................', ride: 'X.x.X.x.X.x.X.x.', kick: 'X.X.....X.X.....' },
        baixo: '1.1.1.1.1.1.1.1.',
        teclado: 'X-------X-------',
        timbres: { bateria: 'acustica', baixo: 'palheta', teclado: 'orgao' },
    },
    pop: {
        nome: 'Pop',
        swing: 0,
        bateria: {
            kick: 'X.....x.X.......',
            snare: '....X.......X...',
            hhclosed: 'xxXxxxXxxxXxxxXx',
        },
        refrao: { hhclosed: '................', ride: 'X.x.X.x.X.x.X.x.', snare: '....X.......X..x' },
        baixo: '1-----1-5-----5-',
        teclado: 'X--.X--.X--.X--.',
        timbres: { bateria: 'acustica', baixo: 'dedo', teclado: 'piano' },
    },
    funk: {
        nome: 'Funk',
        swing: 0,
        bateria: {
            kick: 'X..x..x...X..x..',
            snare: '....X..x.x..X..x',
            hhclosed: 'XxXxXxXxXxXxXxXx',
        },
        refrao: { hhclosed: 'XxXxXx.xXxXxXx.x', hhopen: '......x.......x.' },
        baixo: '1..8..1...5.7.8.',
        teclado: '..x...x...x.x...',
        timbres: { bateria: 'acustica', baixo: 'dedo', teclado: 'wurli' },
    },
    balada: {
        nome: 'Balada',
        swing: 0,
        bateria: {
            kick: 'X.......X.....x.',
            stick: '....X.......X...',
            ride: 'X...x...X...x...',
        },
        refrao: { stick: '................', ride: '................', snare: '....X.......X...', hhclosed: 'x.x.x.x.x.x.x.x.' },
        baixo: '1-------5-------',
        teclado: 'X---------------',
        timbres: { bateria: 'acustica', baixo: 'dedo', teclado: 'piano' },
    },
    shuffle: {
        nome: 'Shuffle',
        swing: 1,
        bateria: {
            kick: 'X.......X.......',
            snare: '....X.......X...',
            hhclosed: 'X.x.X.x.X.x.X.x.',
        },
        refrao: { hhclosed: '................', ride: 'X.x.X.x.X.x.X.x.' },
        baixo: '1.3.5.6.8.6.5.3.',
        teclado: '....X-......X-..',
        timbres: { bateria: 'acustica', baixo: 'dedo', teclado: 'orgao' },
    },
    bossa: {
        nome: 'Bossa',
        swing: 0,
        bateria: {
            kick: 'X..xX..xX..xX..x',
            stick: 'X..X..X...X..X..',
            hhclosed: 'xxxxxxxxxxxxxxxx',
        },
        refrao: { hhclosed: '................', ride: 'x.x.x.x.x.x.x.x.' },
        baixo: '1-----5-1-----5-',
        teclado: 'x..x..x...x..x..',
        timbres: { bateria: 'acustica', baixo: 'acustico', teclado: 'piano' },
    },
} satisfies Record<string, Estilo>

export type NomeEstilo = keyof typeof ESTILOS