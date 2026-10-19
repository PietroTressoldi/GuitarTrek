import { transpor, type Nota } from './notas'
import { FORMAS, voicing, type Forma, type TipoAcorde } from './acordes'
import type { NomeEscala } from './escalas';
import { janela } from './braco';

export type Acorde = { raiz: Nota; tipo: TipoAcorde }

const NUMERAIS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
const SEMITONS = [0, 2, 4, 5, 7, 9, 11] // onde cada grau cai na escala maior

export function acordeDoGrau(tom: Nota, grau: string): Acorde {
    const partes = grau.match(/^(b?)([IViv]+)(7M|7)?$/) /*Devolve um array com o texto inteiro e os grupos, ou null se não casar. Para 'bVII': ['bVII', 'b', 'VII', undefined]. */
    if (!partes) throw new Error(`Grau inválido: ${grau}`) /*Se veio null, erro na hora, com o grau na mensagem. Depois dessa linha o TypeScript sabe que partes não é null, como o C# faz depois de um if (x is null) throw. */

    const [, bemol, numeral, sufixo] = partes  //Desestruturar array: pega as posições em variáveis. A vírgula no começo pula a posição 0 (o texto inteiro). É o var (_, bemol, numeral, sufixo) = ... do C#.

    const menor = numeral === numeral.toLowerCase()//const menor = numeral === numeral.toLowerCase()

    const semitons = SEMITONS[NUMERAIS.indexOf(numeral.toUpperCase())] - (bemol ? 1 : 0) //O bemol é 'b' ou ''. Texto vazio conta como falso num ?: (falsy). Então: tem bemol → desce 1 semitom.

    const tipo = sufixo === '7M' ? 'maj7' : sufixo === '7' ? (menor ? 'm7' : 'dom7') : menor ? 'menor' : 'maior' //Ternários encadeados: lê-se como um switch. 7M → maj7; 7 → m7 ou dom7; sem sufixo → menor ou maior.

    return { raiz: transpor(tom, semitons), tipo }
}

export const PROGRESSOES = {
    blues12: { nome: 'Blues de 12', escala: 'blues', compassos: ['I7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'] },
    pop: { nome: 'I–V–vi–IV', escala: 'pentaMaior', compassos: ['I', 'V', 'vi', 'IV'] },
    anos50: { nome: 'I–vi–IV–V', escala: 'pentaMaior', compassos: ['I', 'vi', 'IV', 'V'] },
    doisCincoUm: { nome: 'ii–V–I', escala: 'maior', compassos: ['ii7', 'V7', 'I7M', 'I7M'] },
    andaluza: { nome: 'Andaluza', escala: 'menor', compassos: ['i', 'bVII', 'bVI', 'V'] },
    modal: { nome: 'Vamp dórico', escala: 'dorico', compassos: ['i7', 'IV7'] },
    bluesMenor: { nome: 'Blues menor', escala: 'pentaMenor', compassos: ['i7', 'iv7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'bVI7', 'V7', 'i7', 'V7'] },
} satisfies Record<string, { nome: string; escala: NomeEscala; compassos: string[] }>

export type NomeProgressao = keyof typeof PROGRESSOES

// O meio da janela de um desenho: a casa "em volta" da qual ele fica
function centro(desenho: string[]) {
    const [de, ate] = janela(desenho)
    return (de + ate) / 2
}

// Das 5 formas do acorde, a que fica mais perto de outro desenho
export function formaPerto(raiz: Nota, tipo: TipoAcorde, perto: string[]): string[] {
    const alvo = centro(perto)
    const desenhos = (Object.keys(FORMAS) as Forma[]).map((f) => voicing(raiz, tipo, f))
    return desenhos.sort((a, b) => Math.abs(centro(a) - alvo) - Math.abs(centro(b) - alvo))[0]
}