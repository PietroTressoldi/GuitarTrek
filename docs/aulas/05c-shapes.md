# Aula 05c — Shapes: a escala em caixas

> 💡 Abra com **`Ctrl+Shift+V`**. Deixe rodando `npm run dev --prefix web` (página http://localhost:5173/escalas) e o `npm run test --prefix web`.

Hoje o braço mostra a escala **inteira**: dezenas de bolinhas. Ninguém improvisa assim. Na prática você toca numa **região** do braço, num **shape** (a "caixa"): a famosa caixa da casa 5 da pentatônica de Lá é um shape. Nesta aula o app aprende a calcular os shapes de qualquer escala e tom, e a página ganha um seletor **Todo · 1 · 2 · 3…** que acende só o shape escolhido e apaga o resto.

**O que você vai aprender:**
1. Altura de nota como número (MIDI)
2. `for`, `let` e `do...while` (iguais ao C#!)
3. Uma prop com uma lista de "chaves" para destacar
4. Animar `opacity` além de `scale`
5. `number | null`: estado que pode ser "nenhum"
6. Spread (`...`) e o operador `??`

---

## Parte 0 — Como se monta um shape

Existem dois sistemas comuns, e o app usa os dois:

| Escala | Sistema | Como é |
|---|---|---|
| 5 notas (pentatônicas) | **2 notas por corda** | As 5 caixas clássicas da penta. |
| 7 notas (maior, menor, modos) | **3 notas por corda** (3NPS) | 7 shapes, um começando em cada nota da escala. |

A receita é a mesma nos dois casos:
1. Escolha uma nota da escala na **6ª corda** (a Mi grave). A posição 1 começa na 1ª nota da escala, a posição 2 na 2ª nota, e assim por diante.
2. Dali, **suba a escala** nota a nota.
3. A cada 2 (ou 3) notas, **pule para a corda de baixo** do desenho (a próxima mais aguda).

Para "subir a escala" sem se perder entre as cordas, precisamos de um número que diga **quão aguda** é cada nota, não só o nome. O Lá da casa 5 da 6ª corda e o Lá da corda Sol solta... são Lás diferentes (oitavas diferentes).

### Altura MIDI

O padrão MIDI (o mesmo dos teclados e DAWs) numera cada tecla do piano: **60 = Dó central**, e cada semitom soma 1. As cordas soltas da guitarra são:

| Corda | Nota | MIDI |
|---|---|---|
| 0 (Mi aguda) | E4 | 64 |
| 1 (Si) | B3 | 59 |
| 2 (Sol) | G3 | 55 |
| 3 (Ré) | D3 | 50 |
| 4 (Lá) | A2 | 45 |
| 5 (Mi grave) | E2 | 40 |

Duas contas resolvem tudo:
- **Casa** de uma altura numa corda = `altura - alturaDaCordaSolta`. (Lá 45 na corda Mi grave: 45 - 40 = casa 5.)
- **Nome** de uma altura = `NOTAS[altura % 12]`. O MIDI começa no Dó, igual ao seu array `NOTAS`: 45 % 12 = 9 = `'A'`.

---

## Parte 1 — A função `shape`

### Passo 1.1 — Altura das cordas soltas

Em `web/src/theory/braco.ts`, embaixo do `AFINACAO_PADRAO`:

```ts
// altura MIDI de cada corda solta: 64 = Mi aguda ... 40 = Mi grave
export const ALTURA_CORDA_SOLTA = [64, 59, 55, 50, 45, 40]
```

E ajuste os imports no topo do arquivo:

```ts
import { NOTAS, distancia, transpor, type Nota } from './notas'
import { notasDaEscala, type NomeEscala } from './escalas'
```

### Passo 1.2 — "Qual a próxima nota da escala?"

No fim do `braco.ts`:

```ts
function proximaNaEscala(altura: number, notas: Nota[]): number {
  do {
    altura++
  } while (!notas.includes(NOTAS[altura % 12]))
  return altura
}
```

| Código | O que significa |
|---|---|
| Sem `export` | Função **privada** do arquivo, como um `private` no C#. Só o `shape` usa. |
| `do { ... } while (...)` | Idêntico ao C#: roda o bloco **pelo menos uma vez** e repete enquanto a condição for verdadeira. Aqui: sobe um semitom; se a nota não está na escala, sobe de novo. |
| `altura++` | Também igual ao C#. Repare que dá para alterar o parâmetro `altura`: em JS, números são passados por valor, então quem chamou não é afetado. |

### Passo 1.3 — O `shape`

Embaixo:

```ts
export function shape(tonica: Nota, escala: NomeEscala, posicao: number): string[] {
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
```

Linha a linha:

| Código | O que significa |
|---|---|
| `posicao` | Começa em **0** (posição 1 na tela = índice 0, como em todo array). |
| `porCorda = notas.length < 7 ? 2 : 3` | Pentatônica (5 notas): 2 por corda. Escalas de 7 notas: 3 por corda. |
| `let altura = ...` | **`let`** = variável que **muda** (a altura vai subindo). Até agora você só usou `const`, que não pode ser reatribuída. Regra do dia a dia: use `const` sempre, e `let` só quando precisa mudar. |
| `distancia('E', notas[posicao])` | A casa da nota inicial na corda Mi grave. Ex.: Lá penta, posição 0: distância de Mi até Lá = 5, então começa na casa 5. Altura = 40 + 5 = 45. |
| `for (let corda = 5; corda >= 0; corda--)` | O `for` é **igual ao C#**. Vai da corda 5 (grave) até a 0 (aguda), porque subimos a escala. |
| `` `${corda}-${altura - ...}` `` | A **chave** da casa, no mesmo formato que você usou de `key` no `<Fretboard>`: `"5-5"` = corda 5, casa 5. Assim o braço vai saber direto se uma bolinha faz parte do shape. |
| `casas.push(...)` | Adiciona no fim do array: o `.Add()` da `List`. |

### Passo 1.4 — Teste com a caixa que você já conhece

No `web/src/theory/braco.test.ts`, importe `shape` junto do `notaNaCasa` e acrescente:

```ts
describe('shapes', () => {
  it('Lá penta, posição 1 = a caixa da casa 5', () => {
    expect(shape('A', 'pentaMenor', 0)).toEqual([
      '5-5', '5-8', '4-5', '4-7', '3-5', '3-7', '2-5', '2-7', '1-5', '1-8', '0-5', '0-8',
    ])
  })
  it('Sol maior 3 notas por corda começa na casa 3', () => {
    expect(shape('G', 'maior', 0).slice(0, 3)).toEqual(['5-3', '5-5', '5-7'])
  })
})
```

Leia o primeiro teste como tablatura: **5 e 8** na Mi grave, **5 e 7** na Lá, **5 e 7** na Ré, **5 e 7** na Sol, **5 e 8** na Si, **5 e 8** na Mi aguda. É a caixa 1 que todo guitarrista conhece, e o código chegou nela sozinho, só subindo a escala.

**✅ O que você deve ver:** `18 passed`.

---

## Parte 2 — O braço destaca o shape

### Passo 2.1 — Mais casas

Os shapes de 3 notas por corda que começam lá em cima vão até a casa 17. No `Fretboard.tsx`:

- troque `const CASAS = 15` por `const CASAS = 17`;
- no array das marcações, acrescente o 17: `[3, 5, 7, 9, 15, 17]`.

Tudo o resto se ajusta sozinho (você viu isso no exercício 1 da aula 05b).

### Passo 2.2 — A prop `destaque`

No `type Props`, acrescente:

```tsx
  destaque?: string[]
```

e na assinatura do componente, `destaque = []` junto das outras:

```tsx
export function Fretboard({ tonica, escala, mostrar = 'nota', alvos = [], destaque = [] }: Props) {
```

`destaque` é uma lista de chaves (`"5-5"`, `"4-7"`...). Lista vazia = "nada em destaque, mostre tudo normal".

### Passo 2.3 — Apagar o que está fora

No bloco das notas, logo depois do `const ehTonica = ...`, acrescente:

```tsx
            const chave = `${corda}-${casa}`
            const apagada = destaque.length > 0 && !destaque.includes(chave)
```

Troque o `key` do `<motion.g>` para usar a variável:

```tsx
              key={chave}
```

E o `animate`:

```tsx
              animate={{ scale: 1, opacity: apagada ? 0.15 : 1 }}
```

| Código | O que significa |
|---|---|
| `destaque.length > 0 && ...` | Só apaga alguma coisa se houver destaque. Sem isso, com a lista vazia **tudo** ficaria apagado. |
| `opacity: apagada ? 0.15 : 1` | Fora do shape, a nota fica quase transparente (15%), mas continua visível: dá para ver como uma caixa **emenda** na próxima. |
| Dentro do `animate` | Quando o destaque muda, o Motion **anima** a opacidade de um valor para o outro, num fade suave. Você não escreve nenhuma transição: só diz o estado final. |

Para testar antes do seletor, em `Escalas.tsx` passe na mão:

```tsx
destaque={['5-5', '5-8', '4-5', '4-7']}
```

**✅ O que você deve ver:** só essas 4 bolinhas acesas (as duas cordas graves da caixa 1), o resto bem apagado. Depois **tire** essa linha.

---

## Parte 3 — O seletor de posição

### Passo 3.1 — Estado que pode ser "nenhum"

Em `Escalas.tsx`, importe o `shape`:

```tsx
import { shape } from '@/theory/braco'
```

E junto dos outros estados:

```tsx
  const [posicao, setPosicao] = useState<number | null>(null)
  const quantas = notasDaEscala(tonica, escala).length
```

| Código | O que significa |
|---|---|
| `number \| null` | "Um número **ou** nada". `null` vai significar "braço todo". É o `int?` do C#. |
| `quantas` | Quantas posições existem: uma por nota da escala (5 na penta, 7 na maior). Não é estado: é **calculado** a partir do estado, a cada desenho. |

### Passo 3.2 — Zerar a posição ao trocar de escala

Pense: você está na posição 7 da escala maior e troca para a pentatônica, que só tem 5. A posição 7 não existe mais. Por isso, ao trocar de escala, voltamos para "Todo". No `<select>` da escala, troque o `onChange` por:

```tsx
            onChange={(e) => {
              setEscala(e.target.value as NomeEscala)
              setPosicao(null)
            }}
```

Repare nas **chaves** `{ }` depois do `=>`: com mais de um comando, a arrow function vira um bloco, igual a uma lambda de várias linhas no C#.

### Passo 3.3 — Os botões

Logo **depois** da `<div className="flex flex-wrap gap-4">` (depois do `</div>` que fecha a linha dos selects), acrescente:

```tsx
      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        Posição
        <div className="flex w-fit rounded-md border bg-card p-1">
          {[null, ...Array.from({ length: quantas }, (_, i) => i)].map((p) => (
            <button
              key={p ?? 'todo'}
              aria-pressed={posicao === p}
              onClick={() => setPosicao(p)}
              className={`flex items-center gap-2 rounded px-3 py-1 text-sm tabular-nums transition-colors ${
                posicao === p ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {posicao === p && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
              {p === null ? 'Todo' : p + 1}
            </button>
          ))}
        </div>
      </div>
```

| Código | O que significa |
|---|---|
| `[null, ...Array.from(...)]` | O **spread** (`...`) "espalha" um array dentro de outro. `[null, ...[0, 1, 2]]` vira `[null, 0, 1, 2]`. Assim o primeiro botão é o "Todo" e os outros são as posições. |
| `key={p ?? 'todo'}` | O **`??`** é o mesmo do C#: "se for `null`, use isto". O botão "Todo" ganha a key `'todo'`; os outros, o número. |
| `w-fit` | A caixa dos botões só ocupa a largura que precisa. |
| `p + 1` | Na tela, as posições começam em 1, para gente. No código, em 0, para o array. |
| O resto | É o mesmo botão de alternar da Parte 7 da aula 05b. |

### Passo 3.4 — Ligar no braço

No `<Fretboard>`, acrescente a prop:

```tsx
          destaque={posicao === null ? [] : shape(tonica, escala, posicao)}
```

**✅ O que você deve ver:**
- **A / Pentatônica menor / posição 1**: a caixa da casa 5 acesa, o resto apagado. Clique em **2, 3, 4, 5**: a caixa vai "andando" pelo braço, e cada uma emenda na anterior. A **5** volta a encostar na **1**, uma oitava acima.
- Ligue **Graus**: em todas as posições, o **1** (a tônica) aparece em lugares diferentes da caixa. Decorar onde está o 1 em cada caixa é o que deixa você improvisar em qualquer tom.
- **G / Maior / posição 1**: 3 notas em cada corda, começando na casa 3.
- Troque de escala com uma posição marcada: o seletor volta para **Todo**.
- **Blues**: o shape sai **torto**, descendo pelo braço. Isso é o exercício 1.

---

## Resumo

| Conceito | C# | TypeScript |
|---|---|---|
| Laços | `for`, `do...while` | Iguais |
| Variável que muda / não muda | `var` / `readonly` | `let` / `const` |
| Tipo que aceita "nada" | `int?` | `number \| null` |
| Coalescência | `x ?? y` | `x ?? y` (igual!) |
| Juntar listas | `new[] { x }.Concat(lista)` | `[x, ...lista]` |
| Adicionar | `lista.Add(x)` | `array.push(x)` |

---

## Exercícios

**1.** A escala blues tem 6 notas, então cai no "2 por corda", mas a 6ª nota (a b5) desalinha tudo e o shape vai descendo. Na prática, o shape do blues é **a caixa da pentatônica menor + a blue note onde ela cair dentro da caixa**. Faça o `shape` tratar o blues assim. Dica: comece o `shape` com um `if (escala === 'blues')` que chama o próprio `shape` com `'pentaMenor'`. A blue note é `transpor(tonica, 6)`.

<details><summary>Gabarito</summary>

No começo do `shape` (o `notaNaCasa` já está no mesmo arquivo, não precisa importar):

```ts
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
```

| Código | O que significa |
|---|---|
| `shape(tonica, 'pentaMenor', posicao)` | Uma função chamando ela mesma (**recursão**), como no C#. Aqui só um nível: o blues pede a caixa da penta. |
| `chave.split('-')[1]` | `"4-7".split('-')` = `['4', '7']`; o `[1]` pega a casa. `Number(...)` converte texto em número (`int.Parse`). |
| `Math.min(...casas)` | O `Math.min` recebe números soltos, não um array. O spread "espalha" o array nos argumentos. |
| `[...caixa, ...extras]` | Junta os dois arrays. |

Falta um detalhe: o blues tem 6 notas, então a página mostra 6 posições, mas a penta só tem 5 caixas. Em `Escalas.tsx`:

```tsx
  const quantas = escala === 'blues' ? 5 : notasDaEscala(tonica, escala).length
```

Teste no `braco.test.ts`:

```ts
  it('blues = caixa da penta + blue notes', () => {
    const blues = shape('A', 'blues', 0)
    expect(blues).toContain('4-6')
    expect(blues).toContain('2-8')
    expect(blues.length).toBe(14)
  })
```

**✅ O que você deve ver:** A / Blues / posição 1 é a caixa da casa 5 com duas notas a mais: casa 6 da corda Lá e casa 8 da corda Sol, as blue notes clássicas.
</details>

**2.** Sem rodar o código: qual posição de **Dó pentatônica maior** acende **exatamente as mesmas casas** que a posição 1 de **Lá pentatônica menor**? Depois confira na tela e escreva um teste.

<details><summary>Gabarito</summary>

A **posição 5**. Dó penta maior (C D E G A) e Lá penta menor (A C D E G) têm **as mesmas 5 notas**: são escalas **relativas**. A posição 5 de Dó começa na 5ª nota, o **A**, na casa 5, e sobe pelas mesmas notas. Resultado: a mesma caixa, só que a tônica (o **1**) agora é o Dó.

```ts
  it('Dó penta maior pos. 5 = Lá penta menor pos. 1', () => {
    expect(shape('C', 'pentaMaior', 4)).toEqual(shape('A', 'pentaMenor', 0))
  })
```

Na prática: as caixas que você já sabe da penta menor servem para a penta maior. Só muda **qual nota é a casa**. Com **Graus** ligado dá para ver isso direto.
</details>
