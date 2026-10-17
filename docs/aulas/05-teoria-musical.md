# Aula 05 — Teoria musical em código (e o primeiro teste)

> 💡 Abra com **`Ctrl+Shift+V`**. Nesta aula **não tem tela nova**: você vai escrever o "cérebro musical" do app e conferir com **testes automáticos** no terminal.

Esta é a primeira aula da **trilha do improviso**. Para o app mostrar uma escala no braço, acender as notas do acorde que está tocando na backing track ou saber se a nota que você tocou está na escala, primeiro ele precisa *saber teoria*. Isso vira uma pasta `web/src/theory` só com **funções puras** (sem React, sem tela), testadas com **Vitest**.

**O que você vai aprender:**
1. `as const` e tipos a partir de valores (`typeof`, `keyof`)
2. **Union types** (`'C' | 'D' | ...`): o "enum" do TypeScript
3. `%` com número negativo (a pegadinha da volta no braço)
4. `map` e `filter`: o LINQ do JavaScript
5. `satisfies` e `Record`
6. **Vitest**: o xUnit do front-end

**Fica para a próxima aula (05b):** o componente `<Fretboard>` em SVG, que desenha essas notas no braço.

> ⚙️ Eu já instalei o Vitest e criei o script `npm run test` no `web/package.json`. Você não precisa instalar nada.

---

## Parte 0 — A ideia: música é aritmética de 12

Uma oitava tem **12 notas**, cada uma a um **semitom** (1 casa no braço) da outra:

```
C  C#  D  D#  E  F  F#  G  G#  A  A#  B   (e volta pro C)
0  1   2  3   4  5  6   7  8   9  10  11
```

Tudo o resto é **distância** (intervalo) em semitons a partir de uma nota:

| Coisa | Em semitons a partir da tônica |
|---|---|
| Escala maior | 0, 2, 4, 5, 7, 9, 11 |
| Pentatônica menor | 0, 3, 5, 7, 10 |
| Acorde maior | 0, 4, 7 |
| Acorde com 7ª (A7, E7...) | 0, 4, 7, 10 |

Então "Lá pentatônica menor" é só: pegue o Lá (9) e some 0, 3, 5, 7, 10. Passou de 11? Dá a volta (é o `% 12`). Isso é exatamente o que você vai programar.

> Por que usar sustenidos (`C#`) e nunca bemóis (`Db`)? Para simplificar: são a mesma tecla. Mostrar o nome certo (Db vs C#) fica para depois, se fizer falta.

---

## Parte 1 — As 12 notas

### Passo 1.1 — Crie o arquivo

Crie a pasta `web/src/theory` e, dentro dela, `notas.ts` (`.ts`, sem `x`: não tem tela).

Digite:

```ts
export const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

export type Nota = (typeof NOTAS)[number]
```

### Linha a linha

| Código | O que significa |
|---|---|
| `export const NOTAS = [...]` | Um array com as 12 notas. `export` deixa outros arquivos importarem (como `public` numa classe C#). |
| `as const` | "Isto nunca muda". Sem ele, o TypeScript acha que é um `string[]` qualquer. Com ele, sabe que é exatamente `'C'`, depois `'C#'`... É parecido com um `static readonly` cujos valores o compilador conhece. |
| `export type Nota = ...` | Cria um **tipo** chamado `Nota`. |
| `typeof NOTAS` | "O tipo da variável `NOTAS`". |
| `[number]` | "O tipo de qualquer item dela". |

O resultado é que `Nota` vale `'C' | 'C#' | 'D' | ... | 'B'`. Isso é um **union type**: "um destes valores, e só estes". É o papel do `enum` no C#, só que os valores são as próprias strings.

**✅ O que você deve ver:** passe o mouse em cima de `Nota` no VS Code. Aparece a lista `"C" | "C#" | "D" | ...`.

Teste o que o tipo protege. Embaixo, escreva:

```ts
const errada: Nota = 'H'
```

**✅ O que você deve ver:** sublinhado vermelho em `'H'` ("Type '"H"' is not assignable to type 'Nota'"). O TypeScript não deixa uma nota inventada passar, igual o C# não deixa passar um valor que não existe no `enum`. **Apague essa linha** antes de seguir.

### Passo 1.2 — Transpor uma nota

Embaixo do `type`, digite:

```ts
export function transpor(nota: Nota, semitons: number): Nota {
  const indice = NOTAS.indexOf(nota)
  const novo = (((indice + semitons) % 12) + 12) % 12
  return NOTAS[novo]
}
```

| Código | O que significa |
|---|---|
| `(nota: Nota, semitons: number): Nota` | Recebe uma nota e um número, devolve uma nota. Em C#: `Nota Transpor(Nota nota, int semitons)`. No TS o tipo vem **depois** do nome. |
| `NOTAS.indexOf(nota)` | Posição da nota no array (C=0, A=9). Igual ao `IndexOf` do C#. |
| `% 12` | Resto da divisão, para dar a volta: B (11) + 1 = 12 → `12 % 12` = 0 = C. |
| `+ 12) % 12` | A pegadinha: em JavaScript (e em C#!), `-1 % 12` dá **-1**, não 11. Somar 12 e fazer `% 12` de novo garante um número de 0 a 11. Assim, C - 1 semitom = B. |
| `NOTAS[novo]` | Pega a nota nessa posição. |

### Passo 1.3 — Distância entre duas notas

Embaixo, digite:

```ts
export function distancia(de: Nota, ate: Nota): number {
  return (((NOTAS.indexOf(ate) - NOTAS.indexOf(de)) % 12) + 12) % 12
}
```

Quantos semitons subindo de `de` até `ate`. Ex.: de A (9) até E (4): 4 - 9 = -5 → vira 7 (uma 5ª justa). Vai servir para saber "essa nota é a 3ª do acorde?".

---

## Parte 2 — O primeiro teste

### O que é o Vitest?

É o **xUnit do front**. Você escreve arquivos `*.test.ts` e o Vitest roda todos e diz o que passou. A comparação:

| xUnit (C#) | Vitest (TS) |
|---|---|
| `public class NotasTests` | `describe('notas', () => { ... })` |
| `[Fact] public void Sobe_um_tom()` | `it('sobe um tom', () => { ... })` |
| `Assert.Equal("D", resultado)` | `expect(resultado).toBe('D')` |
| `dotnet test` | `npm run test --prefix web` |

### Passo 2.1 — Crie o teste

Crie `web/src/theory/teoria.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { transpor, distancia } from './notas'

describe('notas', () => {
  it('sobe um tom de C para D', () => {
    expect(transpor('C', 2)).toBe('D')
  })
  it('dá a volta no B', () => {
    expect(transpor('B', 1)).toBe('C')
  })
  it('desce com número negativo', () => {
    expect(transpor('C', -1)).toBe('B')
  })
  it('mede a distância de A até E', () => {
    expect(distancia('A', 'E')).toBe(7)
  })
})
```

| Código | O que significa |
|---|---|
| `import { ... } from 'vitest'` | Traz as funções de teste. |
| `from './notas'` | `./` = "nesta mesma pasta". Sem o `.ts` no final. |
| `describe('notas', () => { ... })` | Agrupa testes. O segundo argumento é uma função (`() => { }`) com os testes dentro. |
| `it('texto', () => { ... })` | Um teste. O texto aparece no relatório. |
| `expect(x).toBe('D')` | "Espero que `x` seja `'D'`". Se não for, o teste falha e mostra o que veio. |

### Passo 2.2 — Rode

No terminal, na raiz do projeto:

```powershell
npm run test --prefix web
```

**✅ O que você deve ver:** `✓ src/theory/teoria.test.ts (4 tests)` em verde e `Tests 4 passed`. O Vitest fica **assistindo**: salve qualquer arquivo e ele roda de novo sozinho. Deixe ele aberto. Para sair, `q` (ou `Ctrl+C`).

### Passo 2.3 — Veja um teste falhar (de propósito)

No `notas.ts`, apague o `+ 12) % 12` do `transpor`, deixando:

```ts
  const novo = (indice + semitons) % 12
```

Salve. **✅ O que você deve ver:** `desce com número negativo` fica vermelho, com `expected undefined to be 'B'` (`NOTAS[-1]` não existe). O teste pegou o bug da pegadinha. **Desfaça** (`Ctrl+Z`) e veja tudo verde de novo.

---

## Parte 3 — Escalas

### Passo 3.1 — Crie `web/src/theory/escalas.ts`

```ts
import { transpor, type Nota } from './notas'

export const ESCALAS = {
  maior: [0, 2, 4, 5, 7, 9, 11],
  menor: [0, 2, 3, 5, 7, 8, 10],
  pentaMenor: [0, 3, 5, 7, 10],
  pentaMaior: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
  dorico: [0, 2, 3, 5, 7, 9, 10],
  mixolidio: [0, 2, 4, 5, 7, 9, 10],
} satisfies Record<string, number[]>

export type NomeEscala = keyof typeof ESCALAS

export function notasDaEscala(tonica: Nota, escala: NomeEscala): Nota[] {
  return ESCALAS[escala].map((intervalo) => transpor(tonica, intervalo))
}
```

### Linha a linha

| Código | O que significa |
|---|---|
| `type Nota` dentro do `import` | Importa só o **tipo**. O `type` avisa que isso some depois de compilar (tipos não existem quando o código roda). |
| `{ maior: [...], ... }` | Um **objeto**: pares nome → valor. Pense num `Dictionary<string, int[]>` escrito direto no código. |
| `satisfies Record<string, number[]>` | `Record<string, number[]>` é o tipo "dicionário de string para array de número". O `satisfies` **confere** que o objeto segue esse formato, sem esquecer os nomes exatos (`maior`, `menor`...). Se você digitar `[0, 'dois']`, dá erro. |
| `keyof typeof ESCALAS` | "As chaves do objeto": vira `'maior' \| 'menor' \| 'pentaMenor' \| ...`. Ao adicionar uma escala nova, o tipo atualiza sozinho. |
| `.map((intervalo) => ...)` | Transforma cada item do array. É o `.Select(intervalo => ...)` do LINQ. |
| `: Nota[]` | Devolve um array de notas (`List<Nota>`). |

### Passo 3.2 — Teste

No `teoria.test.ts`, acrescente o import no topo:

```ts
import { notasDaEscala } from './escalas'
```

E, no fim do arquivo, um novo grupo:

```ts
describe('escalas', () => {
  it('Lá pentatônica menor', () => {
    expect(notasDaEscala('A', 'pentaMenor')).toEqual(['A', 'C', 'D', 'E', 'G'])
  })
  it('Dó maior não tem sustenido', () => {
    expect(notasDaEscala('C', 'maior')).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
  })
})
```

> **`toEqual` e não `toBe`**: `toBe` confere se é **o mesmo objeto** (como `ReferenceEquals`). Dois arrays com o mesmo conteúdo são objetos diferentes, então para arrays usa-se `toEqual`, que compara item por item (como `SequenceEqual`).

**✅ O que você deve ver:** `6 passed`. Se Lá penta der errado, confira os números do `pentaMenor`.

---

## Parte 4 — Acordes e notas-alvo

Esta é a parte que mais importa para o improviso: **notas-alvo** são as notas do acorde que está tocando. Cair nelas na troca de acorde é o que faz um solo soar "dentro".

### Passo 4.1 — Crie `web/src/theory/acordes.ts`

```ts
import { transpor, type Nota } from './notas'

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
```

Nada novo: é o mesmo padrão das escalas. (Repetição de propósito: o padrão vira reflexo.)

### Passo 4.2 — Teste com `filter`

No `teoria.test.ts`, import:

```ts
import { notasDoAcorde } from './acordes'
```

E no fim:

```ts
describe('acordes', () => {
  it('A7 = A C# E G', () => {
    expect(notasDoAcorde('A', 'dom7')).toEqual(['A', 'C#', 'E', 'G'])
  })
  it('as notas de A7 que estão na penta de Lá', () => {
    const penta = notasDaEscala('A', 'pentaMenor')
    const alvo = notasDoAcorde('A', 'dom7').filter((n) => penta.includes(n))
    expect(alvo).toEqual(['A', 'E', 'G'])
  })
})
```

| Código | O que significa |
|---|---|
| `.filter((n) => ...)` | Mantém só os itens em que a função dá `true`. É o `.Where(n => ...)` do LINQ. |
| `penta.includes(n)` | "O array tem esse item?". É o `.Contains(n)`. |

O último teste é teoria de verdade: num blues em Lá, tocando a penta menor sobre o A7, as notas-alvo "seguras" são **A, E e G**. O **C#** (a 3ª maior do A7) não está na penta. É por isso que guitarristas de blues "puxam" o C (bend) até o C#: você acabou de provar isso em código.

**✅ O que você deve ver:** `8 passed`, tudo verde.

---

## Resumo

| Conceito | C# | TypeScript |
|---|---|---|
| Valores fixos | `enum Nota { C, D }` | `type Nota = 'C' \| 'D'` (union) |
| Constante conhecida | `static readonly` | `as const` |
| Dicionário literal | `new Dictionary<string,int[]> {...}` | `{ maior: [...] } satisfies Record<string, number[]>` |
| Chaves de um tipo | — | `keyof typeof X` |
| `Select` / `Where` / `Contains` | LINQ | `map` / `filter` / `includes` |
| Teste | xUnit `[Fact]`, `Assert.Equal` | Vitest `it`, `expect().toBe/toEqual` |

---

## Exercícios

**1.** Adicione a escala **lídio** (`0, 2, 4, 6, 7, 9, 11`) e um teste: Fá lídio = F G A B C D E.

<details><summary>Gabarito</summary>

Em `escalas.ts`, dentro de `ESCALAS`:

```ts
  lidio: [0, 2, 4, 6, 7, 9, 11],
```

Em `teoria.test.ts`, dentro do `describe('escalas', ...)`:

```ts
  it('Fá lídio', () => {
    expect(notasDaEscala('F', 'lidio')).toEqual(['F', 'G', 'A', 'B', 'C', 'D', 'E'])
  })
```

Repare que o tipo `NomeEscala` já aceita `'lidio'` sem você mexer nele: é o `keyof typeof`.
</details>

**2.** Escreva `estaNaEscala(nota, tonica, escala)` em `escalas.ts`, devolvendo `true`/`false`. (É o que o app vai usar para dizer se a nota que você tocou "está dentro".) Teste: C# **não** está em Lá penta menor; D está.

<details><summary>Gabarito</summary>

```ts
export function estaNaEscala(nota: Nota, tonica: Nota, escala: NomeEscala): boolean {
  return notasDaEscala(tonica, escala).includes(nota)
}
```

```ts
  it('C# fora e D dentro de Lá penta', () => {
    expect(estaNaEscala('C#', 'A', 'pentaMenor')).toBe(false)
    expect(estaNaEscala('D', 'A', 'pentaMenor')).toBe(true)
  })
```

Lembre de importar `estaNaEscala` no teste.
</details>

**3.** No blues de 12 em Lá, os acordes são A7, D7 e E7. Escreva um teste com as notas-alvo (na penta de Lá) do **D7** e do **E7**. Antes de rodar, tente adivinhar.

<details><summary>Gabarito</summary>

D7 = D F# A C → na penta: **D, A, C**. E7 = E G# B D → na penta: **E, D**.

```ts
  it('alvos do D7 e do E7 na penta de Lá', () => {
    const penta = notasDaEscala('A', 'pentaMenor')
    expect(notasDoAcorde('D', 'dom7').filter((n) => penta.includes(n))).toEqual(['D', 'A', 'C'])
    expect(notasDoAcorde('E', 'dom7').filter((n) => penta.includes(n))).toEqual(['E', 'D'])
  })
```

No E7 sobram poucas notas-alvo: é por isso que muita gente "erra" a virada do V no blues. O app vai treinar exatamente isso.
</details>
