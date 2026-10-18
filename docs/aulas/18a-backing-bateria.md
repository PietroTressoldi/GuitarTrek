# Aula 18a — Backing tracks: bateria e progressões

> 💡 Abra com **`Ctrl+Shift+V`**. Deixe rodando `npm run dev --prefix web` e o `npm run test --prefix web`.

Começa o módulo de **backing tracks** (issue #18): uma base para você improvisar em cima, com bateria, baixo e acordes. Ele vem em 3 aulas:

| Aula | O que sai |
|---|---|
| **18a** (esta) | Página **Backing tracks** com **bateria** de verdade, 4 estilos, 6 progressões em qualquer tom, o compasso atual aceso e o acorde grande |
| 18b | **Baixo** e **acordes** tocando junto, swing (blues shuffle e bossa) e um mixer |
| 18c | O `<Fretboard>` acendendo o acorde atual, o **montador** de progressões e a API para salvar (o backend é seu, com roteiro curto) |

A ideia central desta aula: **música vira dado**. Uma progressão é uma lista de graus (`'I7', 'IV7', 'V7'`). Um ritmo de bateria é uma string (`'X...x...X...x...'`). O sequenciador só lê esses dados e agenda os sons, com o mesmo agendador do metrônomo.

**O que você vai aprender:**
1. **Generics** num componente (`<Alternador>` serve para qualquer tipo de opção)
2. **Regex** em TypeScript e desestruturar um array
3. Strings como "partitura" e `Partial<Record<...>>`
4. **Promise** (`.then`), o `Task` do JavaScript
5. Um **sequenciador** de 16 passos em cima do agendador do metrônomo

> 📦 Eu já instalei o pacote **`smplr`** (`npm install smplr` dentro de `web`). Ele toca **samples** (gravações de instrumentos de verdade) no horário exato que você pedir. Por isso o `package.json` aparece modificado.

---

## Parte 1 — O `<Alternador>`

Na aula 05d ficou anotado: o botão com a luz piloto já aparece **5 vezes** (modo, posição, forma e duas vezes Notas/Graus). Cada cópia tem as mesmas 15 linhas, só mudando a lista de opções e o estado. Hora de virar componente.

O problema: cada cópia tem um **tipo** diferente. O `mostrar` é `Exibicao`, o `posicao` é `number | null`, a `forma` é `Forma | null`. Um componente só, com tipos diferentes a cada uso... você conhece isso do C#: **generics**.

### Passo 1.1 — O componente

Crie `web/src/components/Alternador.tsx`:

```tsx
type Props<T> = {
    opcoes: readonly { valor: T; rotulo: string }[]
    valor: T
    onChange: (valor: T) => void
}

export function Alternador<T extends string | number | null>({ opcoes, valor, onChange }: Props<T>) {
    return (
        <div className="flex w-fit rounded-md border bg-card p-1">
            {opcoes.map((opcao) => (
                <button
                    key={opcao.rotulo}
                    aria-pressed={valor === opcao.valor}
                    onClick={() => onChange(opcao.valor)}
                    className={`flex items-center gap-2 rounded px-3 py-1 text-sm tabular-nums transition-colors ${
                        valor === opcao.valor ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    {valor === opcao.valor && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
                    {opcao.rotulo}
                </button>
            ))}
        </div>
    )
}
```

O miolo é a mesma cópia de sempre. O novo está nas duas primeiras linhas de cada bloco:

| Código | O que significa |
|---|---|
| `type Props<T> = {...}` | Um tipo **genérico**: `Props<T>` é como `class Props<T>` no C#. O `T` é "o tipo da opção", decidido em cada uso. |
| `opcoes: readonly {...}[]` | `readonly` = "eu só leio esta lista". É o `IReadOnlyList<T>` do C#. Precisa para aceitar listas `as const` (como o `MODOS` da Braço), que são somente leitura. |
| `onChange: (valor: T) => void` | Uma **função** como prop: recebe um `T` e não devolve nada. É o `Action<T>` do C#. |
| `function Alternador<T extends string \| number \| null>` | A função é genérica em `T`. O `extends` é o `where T : ...` do C#: `T` tem que ser texto, número ou `null`, porque é o que dá para comparar com `===`. |

E o melhor: você **não escreve** o `T` ao usar. O TypeScript **deduz** pelo que você passa, como o C# deduz em `Enumerable.Repeat(5, 3)`. Se você passar `valor={mostrar}` (um `Exibicao`), o `T` vira `Exibicao`, e o `onChange` passa a exigir uma função que aceite `Exibicao`.

### Passo 1.2 — Usando na Braço

Em `web/src/pages/Braco.tsx`, importe:

```tsx
import { Alternador } from '@/components/Alternador'
```

E troque **todo** o `<div className="flex rounded-md border bg-card p-1">...</div>` (com o `map` dos botões dentro) por:

```tsx
                <Alternador opcoes={MODOS} valor={modo} onChange={setModo} />
```

Uma linha no lugar de quinze. Repare no `onChange={setModo}`: você passa a **própria função** `setModo`, sem `() =>`. Ela já é "uma função que recebe um modo", exatamente o que o `onChange` pede.

**✅ O que você deve ver:** a página Braço igual a antes. Para testar o tipo, troque para `valor={'xyz'}`: o VS Code sublinha, porque `'xyz'` não é um modo. Desfaça.

### Passo 1.3 — Nas outras 4

**`Escalas.tsx`** (importe o `Alternador` igual). O "Mostrar" fica:

```tsx
                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Mostrar
                    <Alternador opcoes={OPCOES} valor={mostrar} onChange={setMostrar} />
                </div>
```

A posição não tinha uma lista de opções pronta: ela era montada dentro do `map`. Monte a lista logo abaixo do `const quantas = ...`:

```tsx
    const opcoesPosicao = [
        { valor: null, rotulo: 'Todas' },
        ...Array.from({ length: quantas }, (_, i) => ({ valor: i, rotulo: String(i + 1) })),
    ]
```

E o bloco da posição vira:

```tsx
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                Posição
                <Alternador opcoes={opcoesPosicao} valor={posicao} onChange={setPosicao} />
            </div>
```

| Código | O que significa |
|---|---|
| `...Array.from(...)` | O `...` espalha a lista gerada **dentro** da outra, depois do "Todas" (o spread da 05c). |
| `({ valor: i, rotulo: ... })` | Os parênteses em volta do `{}` dizem "isto é um **objeto**", não o corpo da função. Sem eles, o JavaScript acharia que `{` abre um bloco de código. |
| `String(i + 1)` | Número para texto, o `.ToString()`. O `rotulo` é `string`, então `1` não serve, tem que ser `'1'`. |

**`Acordes.tsx`** (importe igual):

```tsx
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            Forma CAGED
            <Alternador opcoes={OPCOES_FORMA} valor={forma} onChange={setForma} />
          </div>

          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            Mostrar
            <Alternador opcoes={OPCOES} valor={mostrar} onChange={setMostrar} />
          </div>
```

**✅ O que você deve ver:** Braço, Escalas e Acordes **exatamente** como antes, com todos os botões funcionando. Foram cerca de 60 linhas a menos. E se um dia o botão mudar de visual, você muda num lugar só.

---

## Parte 2 — `cifra()`: o nome do acorde num lugar só

A página nova vai escrever cifras (A7, D7, E7), igual à Acordes. O `SIMBOLOS` hoje mora no `Acordes.tsx`, e página não deve importar de página. Ele vai para a teoria.

**Recorte** o `const SIMBOLOS = {...} satisfies Record<TipoAcorde, string>` do `Acordes.tsx` e **cole** em `web/src/theory/acordes.ts`, logo abaixo do `export type TipoAcorde`. Embaixo dele, acrescente:

```ts
export function cifra(raiz: Nota, tipo: TipoAcorde) {
    return raiz + SIMBOLOS[tipo]
}
```

No `Acordes.tsx`, importe `cifra` de `@/theory/acordes` e troque o `{raiz}` + `{SIMBOLOS[tipo]}` do título grande por:

```tsx
            {cifra(raiz, tipo)}
```

**✅ O que você deve ver:** a página Acordes igual, com "C7", "Cm7"... no título.

---

## Parte 3 — Progressões em graus

### O conceito

Uma progressão escrita em **graus** vale para qualquer tom. O blues de 12 é sempre `I7 IV7 V7`: em Lá é A7, D7, E7; em Mi é E7, A7, B7. A notação:

| Escrita | Significa |
|---|---|
| `I`, `IV`, `V` (maiúsculo) | Acorde **maior** no 1º, 4º, 5º grau da escala maior |
| `ii`, `vi` (minúsculo) | Acorde **menor** |
| `7` no fim | Com sétima: `V7` = dominante (7), `ii7` = menor com sétima (m7) |
| `7M` no fim | Sétima maior: `I7M` = C7M em Dó |
| `b` na frente | Meio tom abaixo: `bVII` em Lá = Sol (e não Sol#) |

### Passo 3.1 — `web/src/theory/progressoes.ts`

Crie o arquivo:

```ts
import { transpor, type Nota } from './notas'
import type { TipoAcorde } from './acordes'

export type Acorde = { raiz: Nota; tipo: TipoAcorde }

const NUMERAIS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
const SEMITONS = [0, 2, 4, 5, 7, 9, 11] // onde cada grau cai na escala maior
```

`NUMERAIS[3]` é `'IV'` e `SEMITONS[3]` é `5`: o IV grau fica 5 semitons acima da tônica. As duas listas andam juntas pelo índice. `import type` importa **só o tipo**: some do JavaScript final, porque tipo não existe em tempo de execução.

### Passo 3.2 — `acordeDoGrau`

```ts
export function acordeDoGrau(tom: Nota, grau: string): Acorde {
    const partes = grau.match(/^(b?)([IViv]+)(7M|7)?$/)
    if (!partes) throw new Error(`Grau inválido: ${grau}`)
    const [, bemol, numeral, sufixo] = partes
    const menor = numeral === numeral.toLowerCase()
    const semitons = SEMITONS[NUMERAIS.indexOf(numeral.toUpperCase())] - (bemol ? 1 : 0)
    const tipo = sufixo === '7M' ? 'maj7' : sufixo === '7' ? (menor ? 'm7' : 'dom7') : menor ? 'menor' : 'maior'
    return { raiz: transpor(tom, semitons), tipo }
}
```

A linha do `match` é uma **regex**, igual ao `Regex.Match` do C#. Em JavaScript ela vai entre barras `/.../`, direto no código, sem aspas:

| Pedaço | Casa com |
|---|---|
| `^` ... `$` | Começo e fim do texto: a regex tem que pegar **tudo** |
| `(b?)` | Grupo 1: um `b` opcional |
| `([IViv]+)` | Grupo 2: uma ou mais letras I, V, i, v (o numeral) |
| `(7M\|7)?` | Grupo 3, opcional: `7M` ou `7` |

| Código | O que significa |
|---|---|
| `grau.match(...)` | Devolve um array com o texto inteiro e os grupos, ou `null` se não casar. Para `'bVII'`: `['bVII', 'b', 'VII', undefined]`. |
| `if (!partes) throw ...` | Se veio `null`, erro na hora, com o grau na mensagem. Depois dessa linha o TypeScript **sabe** que `partes` não é `null`, como o C# faz depois de um `if (x is null) throw`. |
| `const [, bemol, numeral, sufixo] = partes` | **Desestruturar array**: pega as posições em variáveis. A vírgula no começo **pula** a posição 0 (o texto inteiro). É o `var (_, bemol, numeral, sufixo) = ...` do C#. |
| `numeral === numeral.toLowerCase()` | Se ficar igual em minúsculo, ele **já era** minúsculo: acorde menor. |
| `(bemol ? 1 : 0)` | O `bemol` é `'b'` ou `''`. Texto vazio conta como **falso** num `?:` (*falsy*). Então: tem bemol → desce 1 semitom. |
| `const tipo = ... ? ... : ...` | Ternários encadeados: lê-se como um `switch`. `7M` → maj7; `7` → m7 ou dom7; sem sufixo → menor ou maior. |

### Passo 3.3 — As progressões prontas

Embaixo, no mesmo arquivo:

```ts
export const PROGRESSOES = {
    blues12: { nome: 'Blues de 12', compassos: ['I7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'] },
    pop: { nome: 'I–V–vi–IV', compassos: ['I', 'V', 'vi', 'IV'] },
    anos50: { nome: 'I–vi–IV–V', compassos: ['I', 'vi', 'IV', 'V'] },
    doisCincoUm: { nome: 'ii–V–I', compassos: ['ii7', 'V7', 'I7M', 'I7M'] },
    andaluza: { nome: 'Andaluza', compassos: ['i', 'bVII', 'bVI', 'V'] },
    modal: { nome: 'Vamp dórico', compassos: ['i7', 'IV7'] },
} satisfies Record<string, { nome: string; compassos: string[] }>

export type NomeProgressao = keyof typeof PROGRESSOES
```

Cada item da lista `compassos` é **um compasso**. O padrão `satisfies` + `keyof typeof` é o mesmo do `ESCALAS` (aula 05).

> 🎸 A **andaluza** em Lá menor é Am, G, F, E: o som "flamenco". O **vamp dórico** (Am7, D7 em Lá) é a base de *Oye Como Va* e de muito jam: dois acordes para sempre, ótimo para treinar o modo dórico da página Braço.

### Passo 3.4 — Testes

Crie `web/src/theory/progressoes.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { acordeDoGrau, PROGRESSOES } from './progressoes'

describe('progressões', () => {
    it('V7 de Lá é E7', () => {
        expect(acordeDoGrau('A', 'V7')).toEqual({ raiz: 'E', tipo: 'dom7' })
    })
    it('minúsculo é menor: vi de Dó é Lá menor', () => {
        expect(acordeDoGrau('C', 'vi')).toEqual({ raiz: 'A', tipo: 'menor' })
    })
    it('bemol desce meio tom: bVII de Lá é Sol', () => {
        expect(acordeDoGrau('A', 'bVII')).toEqual({ raiz: 'G', tipo: 'maior' })
    })
    it('ii–V–I em Dó', () => {
        expect(PROGRESSOES.doisCincoUm.compassos.map((g) => acordeDoGrau('C', g))).toEqual([
            { raiz: 'D', tipo: 'm7' },
            { raiz: 'G', tipo: 'dom7' },
            { raiz: 'C', tipo: 'maj7' },
            { raiz: 'C', tipo: 'maj7' },
        ])
    })
})
```

`toEqual` compara objetos **pelo conteúdo** (o `toBe` compararia a referência, como `ReferenceEquals`).

**✅ O que você deve ver:** `28 passed`.

---

## Parte 4 — Bateria como partitura

### O conceito

Um compasso de 4 tempos dividido em **semicolcheias** tem **16 passos**. Cada peça da bateria vira uma string de 16 caracteres: `X` = batida forte, `x` = fraca, `.` = silêncio.

```
passo:     0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15
tempo:     1               2               3               4
kick:      X   .   .   .   .   .   .   .   X   .   X   .   .   .   .   .
snare:     .   .   .   .   X   .   .   .   .   .   .   .   X   .   .   .
chimbal:   X   .   x   .   X   .   x   .   X   .   x   .   X   .   x   .
```

É o "boom-tchá" do rock: bumbo no 1 e no 3, caixa no 2 e no 4, chimbal em colcheias. É exatamente a grade dos programas de bateria eletrônica.

### Passo 4.1 — `web/src/backing/estilos.ts`

Crie a pasta `backing` dentro de `src` e o arquivo:

```ts
// Cada linha é 1 compasso em 16 passos (semicolcheias). Os tempos 1, 2, 3 e 4 caem nos passos 0, 4, 8 e 12.
// 'X' = forte, 'x' = fraco, '.' = silêncio
type PecaBateria = 'kick' | 'snare' | 'hhclosed' | 'hhopen' | 'stick' | 'ride'

export const ESTILOS = {
    rock: {
        nome: 'Rock',
        bateria: {
            kick: 'X.......X.X.....',
            snare: '....X.......X...',
            hhclosed: 'X.x.X.x.X.x.X.x.',
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
```

| Código | O que significa |
|---|---|
| `'kick' \| 'snare' \| ...` | Os nomes das peças **são** os nomes dos samples da bateria que vamos usar (uma LinnDrum, a "LM-2"). `hhclosed` = chimbal fechado, `hhopen` = aberto, `stick` = aro da caixa, `ride` = prato de condução. |
| `Record<PecaBateria, string>` | "Um texto para **cada** peça": obrigaria a ter todas as 6. |
| `Partial<...>` | Deixa todas **opcionais**. O rock não usa `ride`, a balada não usa `snare`. Mas uma peça com nome errado (`kik`) dá erro: o tipo só aceita as 6. |

No funk, os `x` fracos da caixa (passos 7, 9 e 15) são as **ghost notes**: toques leves que dão o balanço.

### Passo 4.2 — Um teste que protege a digitação

Contar 16 caracteres no olho é fácil de errar. Crie `web/src/backing/estilos.test.ts`:

```ts
import { it, expect } from 'vitest'
import { ESTILOS } from './estilos'

it('todo padrão tem 16 passos, só com X, x e .', () => {
    for (const estilo of Object.values(ESTILOS)) {
        for (const padrao of Object.values(estilo.bateria)) {
            expect(padrao).toMatch(/^[Xx.]{16}$/)
        }
    }
})
```

`Object.values(obj)` = os valores de um objeto, como `dicionario.Values`. A regex `[Xx.]{16}` = "exatamente 16 caracteres, cada um X, x ou ponto" (dentro de `[]` o ponto é ponto mesmo, não "qualquer coisa").

**✅ O que você deve ver:** `29 passed`. Apague um ponto de qualquer padrão: o teste quebra. Ponha de volta.

---

## Parte 5 — Samples com o `smplr`

O metrônomo carrega 5 arquivos `.wav` da pasta `public/sons`. Uma bateria tem dezenas de samples, e um baixo tem um por nota. O `smplr` resolve isso: ele baixa os samples de um repositório público na internet na primeira vez (depois o navegador guarda em cache) e toca cada um no **horário exato** do relógio do áudio, igual ao nosso `tocarAmostra`.

```ts
const bateria = DrumMachine(ctx, { instrument: 'LM-2' })
bateria.ready.then(() => { /* carregou */ })
bateria.start({ note: 'kick', time: 1.5, velocity: 110 })
```

| Código | O que significa |
|---|---|
| `DrumMachine(ctx, {...})` | Cria a bateria ligada ao nosso `AudioContext`. Começa a baixar os samples na hora. |
| `bateria.ready` | Uma **Promise**: o `Task` do JavaScript. Ela "termina" quando os samples chegarem. |
| `.then(() => ...)` | "Quando terminar, rode isto." É o `.ContinueWith(...)` do C#. (O `await` também existe e faz o mesmo, mas dentro de um `useEffect` o `.then` é mais simples.) |
| `start({ note, time, velocity })` | Toca a peça `note` no segundo `time` do relógio do áudio. `velocity` vai de 0 a 127 (padrão MIDI): a força da batida. |

> ⚠️ Precisa de internet na **primeira** vez que a página abre. Sem internet, o botão fica em "Carregando…".

---

## Parte 6 — O hook `useBacking`

Este é o coração. Abra o `useMetronome.ts` ao lado: a estrutura é **a mesma**. O que muda é que, em vez de um clique por tempo, cada volta do agendador olha os **16 passos** e toca as peças que têm `X` ou `x` naquele passo.

Crie `web/src/hooks/useBacking.ts`:

```ts
import { useEffect, useRef, useState } from 'react'
import { DrumMachine } from 'smplr'
import type { Nota } from '@/theory/notas'
import { PROGRESSOES, type NomeProgressao } from '@/theory/progressoes'
import { ESTILOS, type NomeEstilo } from '@/backing/estilos'

const INTERVALO_MS = 25
const JANELA_S = 0.1
const PASSOS = 16

export function useBacking() {
    const [tocando, setTocando] = useState(false)
    const [carregado, setCarregado] = useState(false)
    const [bpm, setBpm] = useState(90)
    const [tom, setTom] = useState<Nota>('A')
    const [estilo, setEstilo] = useState<NomeEstilo>('rock')
    const [progressao, setProgressao] = useState<NomeProgressao>('blues12')
    const [compassoAtual, setCompassoAtual] = useState(-1)

    const audio = useRef<AudioContext | null>(null)
    const bateria = useRef<DrumMachine | null>(null)
```

Os estados são o que a tela mostra e controla. `carregado` começa `false` e vira `true` quando os samples chegarem. `compassoAtual` é `-1` quando está parado, como o `tempoAtual` do metrônomo.

### Passo 6.1 — Criar o áudio e a bateria

```ts
    useEffect(() => {
        const ctx = new AudioContext()
        audio.current = ctx
        const drums = DrumMachine(ctx, { instrument: 'LM-2' })
        drums.ready.then(() => {
            bateria.current = drums
            setCarregado(true)
        })
        return () => {
            ctx.close()
        }
    }, [])
```

Igual ao do metrônomo, trocando o `carregarAmostra` pelo `DrumMachine`. O `[]` no fim: roda **uma vez**, quando a página abre.

### Passo 6.2 — A config que o agendador lê

```ts
    const config = useRef({ bpm, estilo, progressao })
    useEffect(() => {
        config.current = { bpm, estilo, progressao }
    })
```

O mesmo truque do metrônomo (aula 03b): o agendador roda dentro de um `setInterval` criado **uma vez**, então ele lê os valores mais novos por esta "caixinha" `config`, que é atualizada a cada desenho. Mudou o estilo tocando? Ele troca no **próximo passo**, sem parar.

### Passo 6.3 — O sequenciador

```ts
    useEffect(() => {
        const ctx = audio.current
        if (!tocando || !ctx) return
        ctx.resume()

        let proximoPasso = ctx.currentTime + 0.05
        let passo = 0
        let compasso = 0
        const timeouts: number[] = []

        const agendador = setInterval(() => {
            while (proximoPasso < ctx.currentTime + JANELA_S) {
                const c = config.current

                if (passo === 0) {
                    const esteCompasso = compasso
                    const atraso = (proximoPasso - ctx.currentTime) * 1000
                    timeouts.push(window.setTimeout(() => setCompassoAtual(esteCompasso), atraso))
                }

                for (const [peca, padrao] of Object.entries(ESTILOS[c.estilo].bateria)) {
                    const letra = padrao[passo]
                    if (letra !== '.') {
                        bateria.current?.start({ note: peca, time: proximoPasso, velocity: letra === 'X' ? 110 : 60 })
                    }
                }

                proximoPasso += 60 / c.bpm / 4
                passo = (passo + 1) % PASSOS
                if (passo === 0) compasso = (compasso + 1) % PROGRESSOES[c.progressao].compassos.length
            }
        }, INTERVALO_MS)

        return () => {
            clearInterval(agendador)
            timeouts.forEach(clearTimeout)
            setCompassoAtual(-1)
        }
    }, [tocando])

    return { tocando, setTocando, carregado, bpm, setBpm, tom, setTom, estilo, setEstilo, progressao, setProgressao, compassoAtual }
}
```

O esqueleto (`setInterval` + `while` + janela + `timeouts` + limpeza no `return`) é **copiado** do metrônomo. As novidades:

| Código | O que significa |
|---|---|
| `if (passo === 0)` | Passo 0 = começo de compasso. Agenda o aviso para a tela acender o compasso, **no horário em que ele soar**, como o `tempoAtual` do metrônomo. |
| `const esteCompasso = compasso` | Uma **cópia** do número, presa à função do `setTimeout`. Sem ela, a função leria `compasso` **quando rodasse**, lá no futuro, e ele já teria mudado. É a mesma armadilha do C# com lambda dentro de `for` capturando a variável do loop. |
| `window.setTimeout(...)` | O `setTimeout` do **navegador**, que devolve um `number`. Sem o `window.`, o TypeScript pega o do Node (um objeto `Timeout`) e reclama do `number[]`. É exatamente o erro que o `tsc` aponta no `useMetronome.ts` desde a aula 03 (exercício 4 abaixo). |
| `Object.entries(...bateria)` | Lista de pares `[chave, valor]`: `['kick', 'X.......X.X.....']`, `['snare', ...]`. É o `foreach (var (peca, padrao) in dicionario)` do C#. |
| `padrao[passo]` | Em JavaScript, `texto[3]` é o 4º caractere, como no C#. |
| `bateria.current?.start(...)` | O `?.` chama **só se** não for `null`, igual ao C#. |
| `letra === 'X' ? 110 : 60` | Forte ou fraco vira a força da batida. |
| `60 / c.bpm / 4` | Duração de um tempo (`60 / bpm` segundos) dividida em 4 semicolcheias. A 90 BPM: 0,167 s por passo. |
| `% PROGRESSOES[...].compassos.length` | No último compasso da progressão, volta para o 0. O blues de 12 dá a volta a cada 12 compassos. |

O `tom` **não aparece** no agendador: bateria não tem tom. Ele entra na 18b, com o baixo.

**✅ O que você deve ver:** nada ainda na tela, mas nenhum erro vermelho no VS Code.

---

## Parte 7 — A página

### Passo 7.1 — Rota e menu

- Crie `web/src/pages/Backing.tsx` (o conteúdo vem no passo 7.2).
- Em `main.tsx`: `import { Backing } from './pages/Backing.tsx'` e `{ path: 'backing', element: <Backing /> }` depois da linha do `braco`.
- Em `Layout.tsx`: o ícone `Drum` no import do `lucide-react` e `{ para: '/backing', rotulo: 'Backing tracks', icone: Drum }` depois do Braço.

### Passo 7.2 — `Backing.tsx`

```tsx
import { Pause, Play } from 'lucide-react'
import { NOTAS, type Nota } from '@/theory/notas'
import { cifra } from '@/theory/acordes'
import { acordeDoGrau, PROGRESSOES, type NomeProgressao } from '@/theory/progressoes'
import { ESTILOS, type NomeEstilo } from '@/backing/estilos'
import { useBacking } from '@/hooks/useBacking'

const NOMES_ESTILO = Object.keys(ESTILOS) as NomeEstilo[]
const NOMES_PROGRESSAO = Object.keys(PROGRESSOES) as NomeProgressao[]

export function Backing() {
    const b = useBacking()
    const compassos = PROGRESSOES[b.progressao].compassos.map((grau) => acordeDoGrau(b.tom, grau))
    const indiceAtual = b.compassoAtual === -1 ? -1 : b.compassoAtual % compassos.length
    const atual = compassos[indiceAtual]

    return (
        <section className="flex max-w-5xl flex-col gap-8">
            <h1 className="text-4xl">Backing tracks</h1>

            <div className="flex flex-wrap items-end gap-4">
                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Tom
                    <select
                        value={b.tom}
                        onChange={(e) => b.setTom(e.target.value as Nota)}
                        className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                    >
                        {NOTAS.map((nota) => (
                            <option key={nota}>{nota}</option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Estilo
                    <select
                        value={b.estilo}
                        onChange={(e) => b.setEstilo(e.target.value as NomeEstilo)}
                        className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                    >
                        {NOMES_ESTILO.map((nome) => (
                            <option key={nome} value={nome}>
                                {ESTILOS[nome].nome}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Progressão
                    <select
                        value={b.progressao}
                        onChange={(e) => b.setProgressao(e.target.value as NomeProgressao)}
                        className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                    >
                        {NOMES_PROGRESSAO.map((nome) => (
                            <option key={nome} value={nome}>
                                {PROGRESSOES[nome].nome}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    BPM
                    <input
                        type="number"
                        min={40}
                        max={240}
                        value={b.bpm}
                        onChange={(e) => b.setBpm(Number(e.target.value))}
                        className="w-20 rounded-md border bg-card px-3 py-2 text-sm tabular-nums text-foreground"
                    />
                </label>

                <button
                    onClick={() => b.setTocando(!b.tocando)}
                    disabled={!b.carregado}
                    className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
                >
                    {b.tocando ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
                    {!b.carregado ? 'Carregando…' : b.tocando ? 'Parar' : 'Tocar'}
                </button>
            </div>

            <p className="font-heading text-6xl font-semibold font-stretch-expanded">{atual ? cifra(atual.raiz, atual.tipo) : '—'}</p>

            <div className="grid grid-cols-4 gap-2">
                {compassos.map((acorde, i) => (
                    <div
                        key={i}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-3 font-heading font-semibold font-stretch-expanded transition-colors ${
                            i === indiceAtual ? 'bg-secondary text-foreground' : 'bg-card text-muted-foreground'
                        }`}
                    >
                        {i === indiceAtual && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
                        {cifra(acorde.raiz, acorde.tipo)}
                    </div>
                ))}
            </div>
        </section>
    )
}
```

Os `select` e o `label` você já conhece. O que importa:

| Código | O que significa |
|---|---|
| `const b = useBacking()` | Tudo do hook num objeto só, como o `m` da página do Metrônomo. |
| `compassos = ...map((grau) => acordeDoGrau(b.tom, grau))` | Graus viram acordes **no tom escolhido**. Trocou o tom: a página desenha de novo e todos os acordes mudam, mesmo tocando. |
| `b.compassoAtual % compassos.length` | Proteção: se você trocar de um blues (12 compassos) para um pop (4) no meio, o agendador ainda pode estar no compasso 9 até dar a volta. O `%` mantém o índice dentro da lista. |
| `compassos[indiceAtual]` | Com `-1` (parado), o JavaScript devolve `undefined` em vez de dar erro. Por isso o `atual ? ... : '—'`. |
| `disabled={!b.carregado}` | O botão fica apagado (`disabled:opacity-50`) até os samples chegarem. |
| `grid grid-cols-4` | Grade de 4 colunas: o blues de 12 vira 3 linhas de 4, do jeito que todo músico escreve. |
| `key={i}` | Aqui o índice serve de chave: o mesmo acorde aparece várias vezes (A7 4 vezes), então a cifra não é única. |

**✅ O que você deve ver:**
- "Backing tracks" no menu com o ícone de tambor. O botão mostra **Carregando…** por um instante e vira **Tocar**.
- Em **A / Rock / Blues de 12**, a grade A7 D7 A7 A7 / D7 D7 A7 A7 / E7 D7 A7 E7.
- **Tocar**: a bateria de rock, e a luz piloto andando pelos compassos, um a cada 4 tempos. O acorde grande acompanha.
- Troque o **estilo** tocando: a batida muda na hora, sem perder o compasso.
- Troque o **tom** para **E**: a grade vira E7 A7 B7.
- Troque o BPM para 120: acelera sem parar.

---

## Resumo

| Conceito | C# | TypeScript |
|---|---|---|
| Componente/classe genérica | `class X<T> where T : ...` | `function X<T extends ...>(props: Props<T>)` |
| Lista só leitura | `IReadOnlyList<T>` | `readonly T[]` |
| Função como parâmetro | `Action<T>` | `(valor: T) => void` |
| Regex | `Regex.Match(s, @"...")` | `s.match(/.../)` |
| Desestruturar array | `var (_, a, b) = ...` | `const [, a, b] = lista` |
| Tudo opcional | (não tem direto) | `Partial<T>` |
| Valores / pares de um dicionário | `.Values` / `foreach (var (k, v) in d)` | `Object.values(o)` / `Object.entries(o)` |
| Tarefa assíncrona | `Task` + `.ContinueWith` | `Promise` + `.then` |

---

## Exercícios

**1.** Faça a barra de **espaço** tocar e parar a backing track, como no Metrônomo. Dica: o `useEffect` com `keydown` está no começo do `Metronomo.tsx`.

<details><summary>Gabarito</summary>

No `Backing.tsx`, importe `useEffect` de `react` e, logo depois do `const b = useBacking()`:

```tsx
    const { tocando, setTocando } = b
    useEffect(() => {
        function aoTeclar(e: KeyboardEvent) {
            if (e.code === 'Space') {
                e.preventDefault()
                setTocando(!tocando)
            }
        }
        window.addEventListener('keydown', aoTeclar)
        return () => window.removeEventListener('keydown', aoTeclar)
    }, [tocando, setTocando])
```

A desestruturação no começo é para a lista do `useEffect` ficar `[tocando, setTocando]`, igual ao Metrônomo.

> ⚠️ Se você estiver com o foco num `select` ou no campo de BPM, o espaço também vai para eles. Clique fora antes.
</details>

**2.** Crie a progressão **blues menor**: `i7 iv7 i7 i7 iv7 iv7 i7 i7 bVI7 V7 i7 V7`. Em Lá, que acordes saem no 9º e no 10º compasso?

<details><summary>Gabarito</summary>

Em `progressoes.ts`, dentro do `PROGRESSOES`:

```ts
    bluesMenor: { nome: 'Blues menor', compassos: ['i7', 'iv7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'bVI7', 'V7', 'i7', 'V7'] },
```

Ela aparece no select sozinha: o `NOMES_PROGRESSAO` vem de `Object.keys`. Em Lá: **F7** e **E7**. O `bVI7` é maiúsculo, então é dominante. É o som de *The Thrill Is Gone*.
</details>

**3.** No rock, troque o último chimbal do compasso (passo 14) por um **chimbal aberto** (`hhopen`), aquele "tsss" antes do 1.

<details><summary>Gabarito</summary>

```ts
            hhclosed: 'X.x.X.x.X.x.X...',
            hhopen: '..............x.',
```

Os dois mudam no passo 14: o fechado sai (`.`) e o aberto entra (`x`). O teste da Parte 4 continua passando: os dois têm 16 caracteres.
</details>

**4.** Conserte o erro antigo do `tsc` no `useMetronome.ts` (linha ~112), aquele que aparece no `npm run build` desde a aula 03.

<details><summary>Gabarito</summary>

```ts
                    timeouts.push(window.setTimeout(() => setTempoAtual(tempo), atraso))
```

Mesmo motivo do Passo 6.3: sem o `window.`, o TypeScript usa o `setTimeout` do Node, que devolve um objeto, e o array é `number[]`. Rode `npx tsc -b` dentro de `web`: o erro do `useMetronome` some (o do `PainelFlutuante.jsx` continua, esse é outra história).
</details>
