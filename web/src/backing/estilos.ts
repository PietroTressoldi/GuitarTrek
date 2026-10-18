// Cada linha é 1 compasso em 16 passos (semicolcheias). Os tempos 1, 2, 3 e 4 caem nos passos 0, 4, 8 e 12.
// 'X' = forte, 'x' = fraco, '.' = silêncio
type PecaBateria = 'kick' | 'snare' | 'hhclosed' | 'hhopen' | 'stick' | 'ride'

export const ESTILOS = {
    rock: {
        nome: 'Rock',
        bateria: {
            kick: 'X.......X.X.....',
            snare: '....X.......X...',
            hhclosed: 'X.x.X.x.X.x.X...',
            hhopen: '..............x.',
        },
    },
    pop: {
        nome: 'Pop',
        bateria: {
            kick: 'X.....x.X.......',
            snare: '....X.......X...',
            hhclosed: 'xxXxxxXxxxXxxxXx',
        },
    },
    funk: {
        nome: 'Funk',
        bateria: {
            kick: 'X..x..x...X..x..',
            snare: '....X..x.x..X..x',
            hhclosed: 'XxXxXxXxXxXxXxXx',
        },
    },
    balada: {
        nome: 'Balada',
        bateria: {
            kick: 'X.......X.....x.',
            stick: '....X.......X...',
            ride: 'X...x...X...x...',
        },
    },
} satisfies Record<string, { nome: string; bateria: Partial<Record<PecaBateria, string>> }>

export type NomeEstilo = keyof typeof ESTILOS