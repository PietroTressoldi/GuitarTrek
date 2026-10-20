import { ElectricPiano, Sampler, Smolken, Soundfont, SplendidGrandPiano, type Smplr } from 'smplr'

export type Canal = 'bateria' | 'baixo' | 'teclado'

export const CANAIS: Canal[] = ['bateria', 'baixo', 'teclado']

type Timbre = { nome: string; criar: (ctx: AudioContext) => Smplr }

const SAMPLES = 'https://smpldsnds.github.io'

// Uma bateria vira um Sampler com 2 gravações por peça: 'kick-X' (forte) e 'kick-x' (fraca)
function kit(ctx: AudioContext, pasta: string, pecas: Record<string, [string, string]>) {
    const buffers: Record<string, string> = {}
    for (const [peca, [forte, fraca]] of Object.entries(pecas)) {
        buffers[`${peca}-X`] = `${SAMPLES}/${pasta}/${forte}.m4a`
        buffers[`${peca}-x`] = `${SAMPLES}/${pasta}/${fraca}.m4a`
    }
    // ponytail: o smplr 1.1.0 vira NaN se estes 3 faltarem (copia `undefined` por cima do padrão); tirar quando corrigirem
    return Sampler(ctx, { buffers, detune: 0, decayTime: 0.3, lpfCutoffHz: 20000 })
}

const soundfont = (instrument: string) => (ctx: AudioContext) => Soundfont(ctx, { instrument })

export const TIMBRES = {
    bateria: {
        acustica: {
            nome: 'Acústica (Pearl)',
            criar: (ctx) =>
                kit(ctx, 'hydrogen-drum-samples', {
                    kick: ['h2ogmbd/Kick-Hard', 'h2ogmbd/Kick-Soft'],
                    snare: ['h2ogmsn/Snare-Hard', 'h2ogmsn/Snare-Soft'],
                    hhclosed: ['h2ogmhh/HatClosed-Hard', 'h2ogmhh/HatClosed-Soft'],
                    hhopen: ['h2ogmhh/HatOpen-Med', 'h2ogmhh/HatOpen-Soft'],
                    stick: ['h2ogmsn/SideStick-Hard', 'h2ogmsn/SideStick-Soft'],
                    ride: ['h2ogmcy/Ride-Hard', 'h2ogmcy/Ride-Soft'],
                    crash: ['h2ogmcy/Crash-Hard', 'h2ogmcy/Crash-Soft'],
                    tom1: ['h2ogmht/Tom1-Hard', 'h2ogmht/Tom1-Soft'],
                    tom2: ['h2ogmmt/Tom2-Hard', 'h2ogmmt/Tom2-Soft'],
                    tom3: ['h2ogmft/TomFloor-Hard', 'h2ogmft/TomFloor-Soft'],
                }),
        },
        eletronica: {
            nome: 'Eletrônica (LM-2)',
            criar: (ctx) =>
                kit(ctx, 'drum-machines/LM-2', {
                    kick: ['kick', 'kick'],
                    snare: ['snare-h', 'snare-m'],
                    hhclosed: ['hhclosed', 'hhclosed-short'],
                    hhopen: ['hhopen', 'hhopen'],
                    stick: ['stick-h', 'stick-m'],
                    ride: ['ride', 'ride'],
                    crash: ['crash', 'crash'],
                    tom1: ['tom-h', 'tom-h'],
                    tom2: ['tom-m', 'tom-m'],
                    tom3: ['tom-l', 'tom-l'],
                }),
        },
    },
    baixo: {
        dedo: { nome: 'Elétrico (dedo)', criar: soundfont('electric_bass_finger') },
        palheta: { nome: 'Elétrico (palheta)', criar: soundfont('electric_bass_pick') },
        fretless: { nome: 'Fretless', criar: soundfont('fretless_bass') },
        acustico: { nome: 'Acústico', criar: (ctx) => Smolken(ctx, { instrument: 'Pizzicato' }) },
    },
    teclado: {
        piano: {
            nome: 'Piano de cauda',
            // só a região onde o teclado toca (Dó 3 até Si 4): baixa bem menos
            criar: (ctx) => SplendidGrandPiano(ctx, { notesToLoad: { notes: Array.from({ length: 24 }, (_, i) => 48 + i) } }),
        },
        wurli: { nome: 'Piano elétrico', criar: (ctx) => ElectricPiano(ctx, { instrument: 'WurlitzerEP200' }) },
        orgao: { nome: 'Órgão', criar: soundfont('drawbar_organ') },
    },
} satisfies Record<Canal, Record<string, Timbre>>

export type Timbres = { [C in Canal]: keyof (typeof TIMBRES)[C] }

// Onde cada canal fica no estéreo (-1 esquerda, 1 direita) e quanto reverb leva
export const SALA: Record<Canal, { pan: number; reverb: number }> = {
    bateria: { pan: 0, reverb: 0.12 },
    baixo: { pan: 0, reverb: 0 },
    teclado: { pan: 0.25, reverb: 0.25 },
}

export function criarTimbre(ctx: AudioContext, canal: Canal, nome: string): Smplr {
    const timbre = (TIMBRES[canal] as Record<string, Timbre>)[nome]
    return timbre.criar(ctx)
}