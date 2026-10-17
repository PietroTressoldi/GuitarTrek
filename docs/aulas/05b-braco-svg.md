# Aula 05b — O braço da guitarra em SVG

> 💡 Abra com **`Ctrl+Shift+V`**. Deixe rodando `npm run dev --prefix web` (navegador em http://localhost:5173) e, em outro terminal, `npm run test --prefix web`.

Na aula 05 o app aprendeu teoria. Agora ele vai **desenhar** essa teoria: um componente `<Fretboard>` que mostra qualquer escala no braço, com a tônica destacada, e uma página **Escalas** para escolher tom e escala. Esse braço é a peça central do improviso: é nele que, mais tarde, as notas do acorde vão acender e a nota que você tocar vai piscar.

**O que você vai aprender:**
1. **SVG**: desenhar com código (linhas, círculos, texto)
2. `viewBox`: um desenho que estica sem perder qualidade
3. Gerar desenho repetido com `Array.from` + `map` (e `flatMap`)
4. Props tipadas no seu próprio componente
5. `<select>` controlado e o `as` do TypeScript
6. `Record<NomeEscala, string>`: o compilador cobrando que nada falte
7. Animação de entrada e saída com `AnimatePresence`
8. Prop opcional com valor padrão e um botão de alternar (Notas / Graus)

---

## Parte 0 — O que é SVG?

Até agora tudo na tela era **HTML**: caixas (`div`, `section`) que o navegador empilha sozinho. Para um desenho, isso não serve: você quer dizer "uma linha **daqui até ali**".

**SVG** é uma linguagem de desenho dentro do HTML. Se você já viu o `Canvas` do WPF, é a mesma ideia: você posiciona cada forma por coordenadas.

```tsx
<svg viewBox="0 0 100 50">
  <line x1={0} y1={25} x2={100} y2={25} />
  <circle cx={50} cy={25} r={10} />
  <text x={50} y={45}>oi</text>
</svg>
```

| Elemento | O que desenha |
|---|---|
| `<line x1 y1 x2 y2>` | Uma linha do ponto (x1, y1) até (x2, y2). |
| `<circle cx cy r>` | Um círculo com centro (cx, cy) e raio r. |
| `<text x y>` | Um texto naquele ponto. |
| `<g>` | Um **grupo**: junta formas para tratar como uma só (como um `Panel`). |

Duas regras que pegam todo mundo:
- O **y cresce para baixo**. (0, 0) é o canto **de cima** à esquerda, igual no WPF.
- **`viewBox="0 0 100 50"`** cria um "papel" de 100 × 50 unidades. O navegador estica esse papel para o tamanho real do `<svg>` na tela. Você desenha em unidades fixas e o desenho se adapta a qualquer tela, sempre nítido.

As cores no SVG não são `bg-` e `text-`. São:
- **`fill`**: a cor de **dentro** da forma. No Tailwind: `fill-primary`, `fill-card`...
- **`stroke`**: a cor do **contorno** (e de uma linha). No Tailwind: `stroke-border`... A grossura é o atributo `strokeWidth`.

Os tokens são os mesmos de sempre, então o braço muda de cor junto com o tema.

---

## Parte 1 — Que nota fica em cada casa?

Antes de desenhar, o app precisa saber a nota de cada (corda, casa).

### Passo 1.1 — Crie `web/src/theory/braco.ts`

```ts
import { transpor, type Nota } from './notas'

// corda 0 = Mi aguda (em cima, como na tablatura); corda 5 = Mi grave
export const AFINACAO_PADRAO: Nota[] = ['E', 'B', 'G', 'D', 'A', 'E']

export function notaNaCasa(corda: number, casa: number): Nota {
  return transpor(AFINACAO_PADRAO[corda], casa)
}
```

Cada casa sobe um semitom. Então a nota na casa 5 da corda Lá é "Lá transposto 5 semitons" = Ré. Você já tinha o `transpor`; agora só aplica na corda certa.

> A corda **0** é a **Mi aguda**, e ela fica **em cima**, como na tablatura. Assim o desenho fica igual ao que você vê olhando o braço deitado no colo.

### Passo 1.2 — Teste

Crie `web/src/theory/braco.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { notaNaCasa } from './braco'

describe('braço', () => {
  it('casa 5 da 6ª corda é Lá', () => {
    expect(notaNaCasa(5, 5)).toBe('A')
  })
  it('casa 12 é a oitava da corda solta', () => {
    expect(notaNaCasa(0, 12)).toBe('E')
  })
  it('casa 2 da corda Sol é Lá', () => {
    expect(notaNaCasa(2, 2)).toBe('A')
  })
})
```

**✅ O que você deve ver:** no terminal do Vitest, os dois arquivos verdes e `13 passed` (os 10 da aula 05 + 3).

---

## Parte 2 — A página Escalas

Primeiro uma página vazia no menu, para ter onde ver o braço nascer.

### Passo 2.1 — Crie `web/src/pages/Escalas.tsx`

```tsx
export function Escalas() {
  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-4xl">Escalas</h1>
    </section>
  )
}
```

### Passo 2.2 — Rota

Em `web/src/main.tsx`, junto dos outros imports de página:

```tsx
import { Escalas } from './pages/Escalas'
```

E dentro de `children`, depois da linha do `afinador`:

```tsx
      { path: 'escalas', element: <Escalas /> },
```

### Passo 2.3 — Menu

Em `web/src/components/Layout.tsx`, acrescente `Music` no import do `lucide-react` (a primeira linha de import de ícones) e um item no array `menu`, depois do Metrônomo:

```tsx
    { para: '/escalas', rotulo: 'Escalas', icone: Music },
```

**✅ O que você deve ver:** "Escalas" no menu, com o ícone de nota musical. Clicando, aparece o título.

---

## Parte 3 — O componente `<Fretboard>`, uma camada por vez

Vamos montar o braço como uma pintura: **trastes**, depois **cordas**, depois **números**, e por último as **notas** por cima. No SVG, **o que vem depois no código fica por cima** no desenho.

### Passo 3.1 — As medidas

Crie `web/src/components/Fretboard.tsx`:

```tsx
import { AFINACAO_PADRAO } from '@/theory/braco'

const CASAS = 15
const LARGURA_CASA = 60
const ESPACO_CORDA = 30
const X_PESTANA = 40
const Y_TOPO = 24

const LARGURA = X_PESTANA + CASAS * LARGURA_CASA + 10
const ALTURA = Y_TOPO + 5 * ESPACO_CORDA + 44

function yCorda(corda: number) {
  return Y_TOPO + corda * ESPACO_CORDA
}

function xCasa(casa: number) {
  return casa === 0 ? X_PESTANA / 2 : X_PESTANA + (casa - 0.5) * LARGURA_CASA
}
```

| Código | O que significa |
|---|---|
| Constantes em MAIÚSCULAS | Medidas em **unidades do viewBox**, não em pixels. Ficam **fora** do componente porque nunca mudam (como `const` no topo de uma classe C#). |
| `X_PESTANA = 40` | A pestana (onde as cordas soltas terminam) fica a 40 unidades da esquerda. Sobra espaço à esquerda para as notas das cordas soltas. |
| `yCorda(corda)` | Altura de cada corda: a corda 0 em `Y_TOPO`, e cada próxima 30 unidades abaixo. |
| `xCasa(casa)` | Onde desenhar a **nota** de uma casa: no **meio** da casa (por isso o `- 0.5`). A casa 0 (corda solta) fica antes da pestana. |
| `casa === 0 ? a : b` | Operador ternário, igual ao do C#. Repare no `===` (três iguais): em JavaScript, compare sempre com `===`. O `==` converte tipos de jeitos estranhos (`0 == ''` é `true`!). |

> `ponytail:` todas as casas têm a mesma largura. Na guitarra de verdade elas encolhem em direção ao corpo. Fica mais fácil de ler assim; dá para trocar depois mexendo só no `xCasa`.

### Passo 3.2 — O SVG com os trastes

Embaixo das funções:

```tsx
export function Fretboard() {
  const casas = Array.from({ length: CASAS + 1 }, (_, i) => i)

  return (
    <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="w-full min-w-160">
      {casas.map((casa) => (
        <line
          key={casa}
          x1={X_PESTANA + casa * LARGURA_CASA}
          x2={X_PESTANA + casa * LARGURA_CASA}
          y1={yCorda(0)}
          y2={yCorda(5)}
          strokeWidth={casa === 0 ? 6 : 2}
          className="stroke-border"
        />
      ))}
    </svg>
  )
}
```

| Código | O que significa |
|---|---|
| `Array.from({ length: 16 }, (_, i) => i)` | Cria `[0, 1, 2, ..., 15]`. É o `Enumerable.Range(0, 16)` do C#. O `_` é o nome convencional para "parâmetro que eu não uso". |
| `` `0 0 ${LARGURA} ${ALTURA}` `` | **Template string** (crases): o `$"0 0 {largura} {altura}"` do C#. |
| `w-full min-w-160` | Ocupa toda a largura, mas nunca menos de 640px (160 × 4px, a escala de espaçamento do Tailwind). No celular, o braço não vira um risquinho: ele rola de lado. |
| `x1 = x2` | Linha **vertical**: mesmo x em cima e embaixo. Vai da corda 0 até a 5. |
| `strokeWidth={casa === 0 ? 6 : 2}` | A primeira linha é a pestana, bem mais grossa. |

Agora mostre o componente na página. Em `Escalas.tsx`, importe e use embaixo do título:

```tsx
import { Fretboard } from '@/components/Fretboard'
```

```tsx
      <div className="overflow-x-auto rounded-xl border bg-card p-4">
        <Fretboard />
      </div>
```

`overflow-x-auto` = "se não couber na largura, mostre uma barra de rolagem lateral".

**✅ O que você deve ver:** um cartão com 16 linhas verticais finas e a primeira grossa.

> 💬 **Comentário dentro do JSX** é `{/* assim */}`. Um `// comentário` entre as tags **não** é comentário: vira texto que o React tenta desenhar. O `//` só vale fora das tags, no código TypeScript normal.

> ⚠️ **Tudo saiu preto ou invisível?** O Tailwind às vezes não percebe classes novas (`stroke-border`, `fill-primary`...) num arquivo recém-criado. Pare o `npm run dev` (`Ctrl+C`) e rode de novo.

### Passo 3.3 — As cordas

Dentro do `<svg>`, **depois** do `casas.map(...)`:

```tsx
      {AFINACAO_PADRAO.map((_, corda) => (
        <line
          key={corda}
          x1={X_PESTANA}
          x2={LARGURA - 10}
          y1={yCorda(corda)}
          y2={yCorda(corda)}
          strokeWidth={1 + corda * 0.4}
          className="stroke-muted-foreground"
        />
      ))}
```

| Código | O que significa |
|---|---|
| `AFINACAO_PADRAO.map((_, corda) => ...)` | O `map` também entrega o **índice** como segundo parâmetro (como o `Select((x, i) => ...)` do LINQ). Aqui só o índice interessa. |
| `y1 = y2` | Linha **horizontal**. |
| `1 + corda * 0.4` | Corda 0 (Mi aguda) com 1, corda 5 (Mi grave) com 3. As graves ficam mais grossas, como de verdade. |

**✅ O que você deve ver:** um braço de verdade, com 6 cordas (as de baixo mais grossas) cruzando os trastes.

### Passo 3.4 — Marcações e números das casas

**Antes** do `casas.map` dos trastes (para ficar embaixo de tudo), acrescente as bolinhas de marcação:

```tsx
      {[3, 5, 7, 9, 15].map((casa) => (
        <circle key={casa} cx={xCasa(casa)} cy={yCorda(2.5)} r={5} className="fill-muted" />
      ))}
      <circle cx={xCasa(12)} cy={yCorda(1.5)} r={5} className="fill-muted" />
      <circle cx={xCasa(12)} cy={yCorda(3.5)} r={5} className="fill-muted" />
```

`yCorda(2.5)` = o meio do caminho entre a corda 2 e a 3. A função aceita números quebrados sem problema. A casa 12 ganha a marcação dupla, como no braço real.

E **depois** das cordas, os números embaixo:

```tsx
      {casas.slice(1).map((casa) => (
        <text key={casa} x={xCasa(casa)} y={ALTURA - 12} textAnchor="middle" fontSize={11} className="fill-muted-foreground">
          {casa}
        </text>
      ))}
```

| Código | O que significa |
|---|---|
| `casas.slice(1)` | O array sem o primeiro item (a casa 0 não tem número). É o `.Skip(1)`. |
| `textAnchor="middle"` | O `x` é o **meio** do texto, não o começo. Assim o número fica centralizado na casa. |
| Texto usa `fill` | No SVG, a cor do texto também é `fill`, não `text-`. |

**✅ O que você deve ver:** bolinhas discretas nas casas 3, 5, 7, 9, 12 (dupla) e 15, e os números de 1 a 15 embaixo.

---

## Parte 4 — As notas da escala

### Passo 4.1 — Props

O componente precisa saber **qual** escala desenhar. Em C#, isso seriam parâmetros do construtor. No React, são **props**. Troque o topo do arquivo (os imports) por:

```tsx
import { AFINACAO_PADRAO, notaNaCasa } from '@/theory/braco'
import { notasDaEscala, type NomeEscala } from '@/theory/escalas'
import type { Nota } from '@/theory/notas'
```

E troque a linha `export function Fretboard() {` por:

```tsx
type Props = {
  tonica: Nota
  escala: NomeEscala
}

export function Fretboard({ tonica, escala }: Props) {
  const notas = notasDaEscala(tonica, escala)
```

(mantenha a linha do `const casas = ...` logo embaixo).

| Código | O que significa |
|---|---|
| `type Props = { ... }` | O "contrato" do componente: quais props ele recebe e de que tipo. Você já viu isso no `PaginaEmBreve`. |
| `{ tonica, escala }: Props` | Desestruturação: as props chegam num objeto e já tiramos as duas de dentro. |

O VS Code vai sublinhar `<Fretboard />` em `Escalas.tsx`: faltam as props obrigatórias. Corrija lá:

```tsx
        <Fretboard tonica="A" escala="pentaMenor" />
```

### Passo 4.2 — Desenhe as notas

**Por último** dentro do `<svg>` (depois dos números, para ficar por cima de tudo):

```tsx
      {AFINACAO_PADRAO.flatMap((_, corda) =>
        casas.map((casa) => {
          const nota = notaNaCasa(corda, casa)
          if (!notas.includes(nota)) return null
          const ehTonica = nota === tonica
          return (
            <g key={`${corda}-${casa}`}>
              <circle
                cx={xCasa(casa)}
                cy={yCorda(corda)}
                r={11}
                strokeWidth={2}
                className={ehTonica ? 'fill-primary stroke-primary' : 'fill-card stroke-cat-escalas'}
              />
              <text
                x={xCasa(casa)}
                y={yCorda(corda)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fontWeight={600}
                className={ehTonica ? 'fill-primary-foreground' : 'fill-foreground'}
              >
                {nota}
              </text>
            </g>
          )
        }),
      )}
```

| Código | O que significa |
|---|---|
| `flatMap` | Para cada corda, o `casas.map` devolve um array de 16 coisas. O `map` daria um array de arrays; o `flatMap` "achata" tudo num array só. É o `SelectMany` do LINQ. |
| `return null` | Em JSX, `null` = "não desenhe nada". Casas cuja nota não está na escala ficam vazias. |
| `key={`${corda}-${casa}`}` | A `key` precisa ser única **na lista inteira**: "0-5", "3-12"... |
| `<g>` | Agrupa o círculo com o texto: a nota vira uma peça só (vai ser útil para animar). |
| `dominantBaseline="central"` | Centraliza o texto **na vertical** (o `textAnchor` cuidou da horizontal). |
| Tônica `fill-primary` | A tônica é preenchida com a cor principal (âmbar no tema amp), como a "luz piloto" do design. As outras notas ficam vazadas, com contorno da cor do pedal de escalas. |

**✅ O que você deve ver:** a pentatônica de Lá espalhada pelo braço inteiro, com os **Lás preenchidos** (casa 5 da 6ª corda, casa 7 da 4ª, casa 12 da 5ª...) e as outras notas como anéis. Procure o famoso "shape 1" da penta na casa 5: está lá.

---

## Parte 5 — Escolher tom e escala

### Passo 5.1 — Os nomes bonitos

`pentaMenor` é bom para código, ruim para gente. Em `Escalas.tsx`, acima do `export function Escalas`, crie os rótulos:

```tsx
const ROTULOS = {
  maior: 'Maior',
  menor: 'Menor natural',
  pentaMenor: 'Pentatônica menor',
  pentaMaior: 'Pentatônica maior',
  blues: 'Blues',
  dorico: 'Dórico',
  mixolidio: 'Mixolídio',
  lidio: 'Lídio',
} satisfies Record<NomeEscala, string>

const NOMES = Object.keys(ROTULOS) as NomeEscala[]
```

E os imports no topo do arquivo:

```tsx
import { useState } from 'react'
import { NOTAS, type Nota } from '@/theory/notas'
import { notasDaEscala, type NomeEscala } from '@/theory/escalas'
```

| Código | O que significa |
|---|---|
| `Record<NomeEscala, string>` | Na aula 05 as chaves eram "qualquer string". Agora são **exatamente** os nomes de escala. Apague a linha do `lidio`: o TypeScript reclama que falta `lidio`. Adicione uma escala nova em `escalas.ts` e ele cobra o rótulo aqui. O compilador não deixa você esquecer. (Ponha a linha de volta.) |
| `Object.keys(ROTULOS)` | A lista de chaves do objeto: `['maior', 'menor', ...]`. |
| `as NomeEscala[]` | O `Object.keys` sempre devolve `string[]` (o TypeScript não arrisca mais que isso). O `as` diz "confie em mim, são nomes de escala". É um **cast**, como `(NomeEscala[])x` no C#: use só quando você tem certeza. |

### Passo 5.2 — Estado e selects

Troque o corpo do componente `Escalas` por:

```tsx
export function Escalas() {
  const [tonica, setTonica] = useState<Nota>('A')
  const [escala, setEscala] = useState<NomeEscala>('pentaMenor')

  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-4xl">Escalas</h1>

      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          Tônica
          <select
            value={tonica}
            onChange={(e) => setTonica(e.target.value as Nota)}
            className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
          >
            {NOTAS.map((nota) => (
              <option key={nota}>{nota}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          Escala
          <select
            value={escala}
            onChange={(e) => setEscala(e.target.value as NomeEscala)}
            className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
          >
            {NOMES.map((nome) => (
              <option key={nome} value={nome}>
                {ROTULOS[nome]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="font-heading text-xl font-semibold font-stretch-expanded">
        {notasDaEscala(tonica, escala).join('  ·  ')}
      </p>

      <div className="overflow-x-auto rounded-xl border bg-card p-4">
        <Fretboard tonica={tonica} escala={escala} />
      </div>
    </section>
  )
}
```

| Código | O que significa |
|---|---|
| `useState<Nota>('A')` | O `<Nota>` diz o tipo do estado. Sem ele, o TypeScript acharia que é `string` e o `<Fretboard>` reclamaria. |
| `<select value={...} onChange={...}>` | Um select **controlado**: o React manda no valor (como o `ComboBox` com `SelectedItem` em binding). É o mesmo padrão dos inputs do metrônomo. |
| `e.target.value as Nota` | O select sempre devolve `string`. Como só existem opções de notas válidas, o cast é seguro. |
| `<option>{nota}</option>` | Sem `value`, o valor da opção é o próprio texto. |
| `<option value={nome}>{ROTULOS[nome]}</option>` | Aqui o texto ("Pentatônica menor") e o valor (`pentaMenor`) são diferentes. |
| `.join('  ·  ')` | Junta o array num texto: `string.Join("  ·  ", lista)`. |

**✅ O que você deve ver:** escolha **C** e **Maior**: o braço inteiro se enche (escala de 7 notas) com os Dós preenchidos. Volte para **A / Pentatônica menor**: o braço fica bem mais vazio (5 notas). O texto acima mostra as notas.

---

## Parte 6 — Animando a troca

Hoje as notas aparecem e somem de uma vez. Vamos fazer cada nota **crescer** ao entrar e **encolher** ao sair. Você já usou `motion.div` no `Layout`; para SVG existe `motion.g`.

O problema: quando uma nota **sai** da escala, o React simplesmente a remove, e não sobra nada para animar. O **`AnimatePresence`** resolve isso: ele segura o elemento removido na tela até a animação de saída (`exit`) terminar.

### Passo 6.1

No `Fretboard.tsx`, importe:

```tsx
import { AnimatePresence, motion } from 'motion/react'
```

Envolva o bloco das notas (o `AFINACAO_PADRAO.flatMap(...)`) com `<AnimatePresence>`, e troque o `<g key=...>` e o `</g>` por:

```tsx
            <motion.g
              key={`${corda}-${casa}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
            >
```

```tsx
            </motion.g>
```

Fica assim:

```tsx
      <AnimatePresence>
        {AFINACAO_PADRAO.flatMap((_, corda) =>
          casas.map((casa) => {
            ...
            return (
              <motion.g key=... initial=... animate=... exit=... transition=...>
                <circle ... />
                <text ...>{nota}</text>
              </motion.g>
            )
          }),
        )}
      </AnimatePresence>
```

| Código | O que significa |
|---|---|
| `initial={{ scale: 0 }}` | Ao aparecer, começa com tamanho zero... |
| `animate={{ scale: 1 }}` | ...e cresce até o tamanho normal. |
| `exit={{ scale: 0 }}` | Ao sair, encolhe até sumir. Só funciona dentro do `AnimatePresence`. |
| A `key` importa | A `key` é `corda-casa`. Se a nota daquela casa continua na escala nova, a key é a mesma e o React **mantém** a bolinha (sem animar). Só as notas que **entram** ou **saem** animam. |

**✅ O que você deve ver:** troque de **Pentatônica menor** para **Blues**: só o **Ré#** (a "blue note") brota nas casas novas; o resto fica parado. Troque para **Maior**: algumas notas somem encolhendo, outras surgem. Troque a tônica: o braço inteiro se rearranja.

> O `MotionConfig reducedMotion="user"` que você pôs no `main.tsx` continua valendo: quem pede "menos movimento" no sistema operacional vê a troca sem animação.

---

## Parte 7 — Notas ou graus?

Nome de nota (A, C, D...) muda a cada tom. **Grau** (1, b3, 4, 5, b7...) é a posição da nota **dentro** da escala e vale para qualquer tom. Improvisadores pensam em graus: "vou mirar na **b3**", "resolvo na **1**". Se você decora o shape em graus, ele funciona em todos os tons. Vamos pôr um botão **Notas / Graus** em cima do braço.

### Passo 7.1 — Uma função `grau` no `theory/`

Você já tem `GRAUS` e `distancia` em `web/src/theory/notas.ts`. No fim desse arquivo, acrescente:

```ts
export function grau(tonica: Nota, nota: Nota): string {
  return GRAUS[distancia(tonica, nota)]
}
```

A distância em semitons (0 a 11) vira índice no array: 0 → `'1'`, 3 → `'b3'`, 10 → `'b7'`...

E um teste no `teoria.test.ts` (importe `grau` de `./notas` no topo):

```ts
describe('graus', () => {
  it('C é a b3 de Lá', () => {
    expect(grau('A', 'C')).toBe('b3')
  })
  it('a tônica é 1', () => {
    expect(grau('E', 'E')).toBe('1')
  })
  it('penta menor em graus', () => {
    expect(notasDaEscala('A', 'pentaMenor').map((n) => grau('A', n))).toEqual(['1', 'b3', '4', '5', 'b7'])
  })
})
```

**✅ O que você deve ver:** `16 passed`. O último teste é a "fórmula" da pentatônica menor, `1 b3 4 5 b7`, que vale em qualquer tom.

### Passo 7.2 — A prop `mostrar` no `<Fretboard>`

No `Fretboard.tsx`, troque o import de `notas`:

```tsx
import { grau, type Nota } from '@/theory/notas'
```

Acima do `type Props`, crie o tipo das duas opções:

```tsx
export type Exibicao = 'nota' | 'grau'
```

E acrescente a prop:

```tsx
type Props = {
  tonica: Nota
  escala: NomeEscala
  mostrar?: Exibicao
}

export function Fretboard({ tonica, escala, mostrar = 'nota' }: Props) {
```

| Código | O que significa |
|---|---|
| `'nota' \| 'grau'` | Um union type de duas strings, como o `Nota` da aula 05. Só esses dois valores passam. |
| `export type` | O `Escalas.tsx` vai precisar desse tipo também. |
| `mostrar?:` | O `?` torna a prop **opcional**: quem usa o `<Fretboard>` pode não passar. |
| `mostrar = 'nota'` | O **valor padrão** quando ninguém passa. É igual a um parâmetro opcional no C#: `void Fretboard(..., string mostrar = "nota")`. |

Agora, no `<text>` da nota, troque `{nota}` por:

```tsx
                {mostrar === 'grau' ? grau(tonica, nota) : nota}
```

**✅ O que você deve ver:** nada muda ainda (o padrão é `'nota'`). Para testar, em `Escalas.tsx` escreva `<Fretboard tonica={tonica} escala={escala} mostrar="grau" />`: o braço mostra `1`, `b3`, `4`... Depois tire o `mostrar="grau"`.

### Passo 7.3 — O botão de alternar

Em `Escalas.tsx`, importe o tipo e o `grau`:

```tsx
import { Fretboard, type Exibicao } from '@/components/Fretboard'
import { grau, NOTAS, type Nota } from '@/theory/notas'
```

(se o `GRAUS` estiver nesse import, pode tirar: quem usa agora é a função `grau`).

Embaixo do `const NOMES = ...`, as opções do botão:

```tsx
const OPCOES = [
  { valor: 'nota', rotulo: 'Notas' },
  { valor: 'grau', rotulo: 'Graus' },
] satisfies { valor: Exibicao; rotulo: string }[]
```

Dentro do componente, junto dos outros `useState`:

```tsx
  const [mostrar, setMostrar] = useState<Exibicao>('nota')
```

E, **dentro** da `<div className="flex flex-wrap gap-4">`, depois do segundo `</label>`, o botão:

```tsx
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          Mostrar
          <div className="flex rounded-md border bg-card p-1">
            {OPCOES.map((opcao) => (
              <button
                key={opcao.valor}
                aria-pressed={mostrar === opcao.valor}
                onClick={() => setMostrar(opcao.valor)}
                className={`flex items-center gap-2 rounded px-3 py-1 text-sm transition-colors ${
                  mostrar === opcao.valor ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mostrar === opcao.valor && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
                {opcao.rotulo}
              </button>
            ))}
          </div>
        </div>
```

| Código | O que significa |
|---|---|
| `satisfies { valor: Exibicao; rotulo: string }[]` | Confere que cada opção tem um `valor` válido. Escreva `'graus'` (com s) e o TypeScript reclama. |
| `aria-pressed={...}` | Diz aos leitores de tela que esse botão está "apertado" ou não, como um toggle. |
| `` `... ${ condição ? 'a' : 'b' }` `` | A mesma técnica do menu no `Layout.tsx`: classes fixas + classes que dependem do estado. |
| `{condição && <span ... />}` | Só desenha a luz piloto no botão ativo. O `&&` no JSX quer dizer "se for verdade, mostre isto". |
| A luz piloto | É o mesmo pontinho âmbar do menu lateral: o design marca o ativo com a "luz", não com o fundo âmbar cheio. |

Por fim, passe o estado para o braço:

```tsx
        <Fretboard tonica={tonica} escala={escala} mostrar={mostrar} />
```

**✅ O que você deve ver:** um botão "Notas | Graus" ao lado dos selects, com a luz âmbar no ativo. Clique em **Graus**: os círculos passam a mostrar `1 b3 4 5 b7`. Mude a tônica para **E**: com **Notas**, todos os nomes mudam; com **Graus**, os números ficam iguais e o desenho só **anda** no braço. É por isso que improvisador pensa em graus.

### Passo 7.4 — A linha de cima também

A linha com `A · C · D · E · G` deveria obedecer o botão. Troque:

```tsx
        {notasDaEscala(tonica, escala).join('  ·  ')}
```

por:

```tsx
        {notasDaEscala(tonica, escala)
          .map((nota) => (mostrar === 'grau' ? grau(tonica, nota) : nota))
          .join('  ·  ')}
```

`map` antes do `join`: primeiro transforma cada nota (em nome ou grau), depois junta. É o `string.Join(" · ", lista.Select(...))`.

**✅ O que você deve ver:** com **Graus**, a linha mostra `1 · b3 · 4 · 5 · b7`. Troque para **Blues**: aparece o `b5`, a "blue note".

---

## Resumo

| Conceito | C# / WPF | Aqui |
|---|---|---|
| Desenho por coordenadas | `Canvas`, `Line`, `Ellipse` | `<svg>`, `<line>`, `<circle>` |
| Escala do desenho | `Viewbox` | `viewBox="0 0 L A"` |
| Cor de preenchimento / contorno | `Fill` / `Stroke` | `fill-*` / `stroke-*` + `strokeWidth` |
| `Enumerable.Range` | | `Array.from({ length }, (_, i) => i)` |
| `SelectMany` / `Skip` | LINQ | `flatMap` / `slice` |
| Cast | `(Tipo)x` | `x as Tipo` |
| Dicionário que exige todas as chaves | — | `satisfies Record<NomeEscala, string>` |
| Animar entrada/saída | Storyboard | `motion.g` + `AnimatePresence` |
| Parâmetro opcional | `string mostrar = "nota"` | `mostrar?: Exibicao` + `mostrar = 'nota'` |

---

## Exercícios

**1.** Mostre só até a casa 12. Mude **uma** constante.

<details><summary>Gabarito</summary>

`const CASAS = 12`. Tudo (trastes, números, notas, largura do SVG) é calculado a partir dela. A marcação da casa 15 vai ficar desenhada fora do braço: tire o `15` do array de marcações, ou filtre com `.filter((c) => c <= CASAS)`.
</details>

**2.** Prepare o terreno do improviso: outra prop **opcional**, como o `mostrar` da Parte 7: `alvos?: Nota[]` (as notas do acorde que está tocando). Notas da escala que estão em `alvos` ficam com o contorno grosso (`strokeWidth` 4). Teste em `Escalas.tsx` com `alvos={notasDoAcorde('A', 'dom7')}`.

<details><summary>Gabarito</summary>

```tsx
type Props = {
  tonica: Nota
  escala: NomeEscala
  mostrar?: Exibicao
  alvos?: Nota[]
}

export function Fretboard({ tonica, escala, mostrar = 'nota', alvos = [] }: Props) {
```

No `<circle>`:

```tsx
                strokeWidth={alvos.includes(nota) ? 4 : 2}
```

Mesmo esquema do `mostrar`: o `?` torna a prop opcional e `alvos = []` dá o valor padrão. Com A7 na penta de Lá, os anéis grossos ficam em A, E e G: as notas-alvo que você descobriu na aula 05. No módulo do improviso, esses alvos vão mudar sozinhos a cada compasso da backing track.
</details>
