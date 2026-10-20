import type { Estilo, PecaBateria } from './estilos'

type Padroes = Partial<Record<PecaBateria, string>>

// Uma virada toma o fim do compasso: de `desde` até o passo 15, só ela toca
type Virada = { desde: number; pecas: Padroes }

// No fim da volta: 2 tempos de caixa descendo pelos tons, até o surdo
const VIRADA: Virada = {
    desde: 8,
    pecas: { kick: 'X.......', snare: 'XxXx....', tom1: '....Xx..', tom2: '......X.', tom3: '.......X' },
}

// No fim de cada frase de 4 compassos: só o último tempo, na caixa
const MINI: Virada = { desde: 12, pecas: { snare: 'X.XX' } }

const SILENCIO = '................'

function encaixar(padroes: Padroes, virada: Virada): Padroes {
    const resultado: Padroes = {}
    for (const peca of new Set([...Object.keys(padroes), ...Object.keys(virada.pecas)]) as Set<PecaBateria>) {
        const antes = (padroes[peca] ?? SILENCIO).slice(0, virada.desde)
        const depois = virada.pecas[peca] ?? SILENCIO.slice(virada.desde)
        resultado[peca] = antes + depois
    }
    return resultado
}

// Uma seção tem pelo menos 8 compassos: uma progressão de 2 ou 4 repete até completar
export function tamanhoDaSecao(compassos: number): number {
    return Math.ceil(8 / compassos) * compassos
}

// O que a bateria toca num compasso da seção. As seções se alternam: verso (par) e refrão (ímpar).
export function bateriaDoCompasso(estilo: Estilo, compasso: number, tamanho: number, secao: number): Padroes {
    const refrao = secao % 2 === 1
    let padroes: Padroes = { ...estilo.bateria, ...(refrao ? estilo.refrao : {}) }

    if (compasso === tamanho - 1) padroes = encaixar(padroes, VIRADA)
    else if (compasso % 4 === 3) padroes = encaixar(padroes, MINI)

    // Prato de ataque no 1 de cada seção e, no refrão, no começo de cada frase
    if (compasso === 0 || (refrao && compasso % 4 === 0)) {
        padroes.crash = 'X' + (padroes.crash ?? SILENCIO).slice(1)
    }
    return padroes
}