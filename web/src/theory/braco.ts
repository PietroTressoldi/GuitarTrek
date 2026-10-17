import { transpor, type Nota } from "./notas";

//corda 0 = Mi aguda (em cima, como na tablaruta) 5 - mi grave
export const AFINACAO_PADRAO: Nota[] = ['E', 'B', 'G', 'D', 'A', 'E']

//Cada casa sobe um semitom. Então a nota na casa 5 da corda Lá é "Lá transposto 5 semitons" = Ré. com o metodo transpor, é só aplicar na corda certa.
export function notaNaCasa(corda: number, casa: number): Nota {
    return transpor(AFINACAO_PADRAO[corda], casa)
}


