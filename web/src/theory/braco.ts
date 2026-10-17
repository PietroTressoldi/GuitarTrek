import { NOTAS, distancia, transpor, type Nota } from './notas'
import { notasDaEscala, type NomeEscala } from './escalas'

//corda 0 = Mi aguda (em cima, como na tablaruta) 5 - mi grave
export const AFINACAO_PADRAO: Nota[] = ['E', 'B', 'G', 'D', 'A', 'E']

// altura MIDI de cada corda solta: 64 = Mi aguda ... 40 = Mi grave
export const ALTURA_CORDA_SOLTA = [64, 59, 55, 50, 45, 40]

//Cada casa sobe um semitom. Então a nota na casa 5 da corda Lá é "Lá transposto 5 semitons" = Ré. com o metodo transpor, é só aplicar na corda certa.
export function notaNaCasa(corda: number, casa: number): Nota {
    return transpor(AFINACAO_PADRAO[corda], casa)
}

function proximaNaEscala(altura: number, notas: Nota[]): number {
    do {
        altura++
    } while (!notas.includes(NOTAS[altura % 12]))
    return altura
}

export function shape(tonica: Nota, escala: NomeEscala, posicao: number): string[] {
    // blues = caixa da penta menor + a blue note (b5) onde ela cair dentro da caixa
    if (escala === 'blues') {
        const caixa = shape(tonica, 'pentaMenor', posicao)
        const blueNote = transpor(tonica, 6)
        const casas = caixa.map((chave) => Number(chave.split('-')[1]))
        const extras: string[] = []
        for (let corda = 0; corda < 6; corda++) {
            for (let casa = Math.min(...casas); casa <= Math.max(...casas); casa++) {
                if (notaNaCasa(corda, casa) === blueNote) extras.push(`${corda}-${casa}`)
            }
        }
        return [...caixa, ...extras]
    }

    const notas = notasDaEscala(tonica, escala)
    const porCorda = notas.length < 7 ? 2 : 3
    let altura = ALTURA_CORDA_SOLTA[5] + distancia('E', notas[posicao])
    const casas: string[] = []

    for (let corda = 5; corda >= 0; corda--) {
        for (let i = 0; i < porCorda; i++) {
            casas.push(`${corda}-${altura - ALTURA_CORDA_SOLTA[corda]}`)
            altura = proximaNaEscala(altura, notas)
        }
    }
    return casas
}