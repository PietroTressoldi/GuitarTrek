# Aula 05d — Dicionário de acordes

> 💡 Abra com **`Ctrl+Shift+V`**. Deixe rodando `npm run dev --prefix web` e o `npm run test --prefix web`.

Última aula do módulo 5. Você vai criar a página **Acordes**: escolhe tônica, tipo (maior, menor, 7, m7, 7M) e desenho (tônica na 6ª ou na 5ª corda; na Parte 4 viram as 5 formas do CAGED), e o braço mostra **onde pôr os dedos**, com todas as outras notas do acorde apagadas em volta. Essas notas apagadas são o **arpejo** do acorde no braço inteiro. É exatamente o que o improviso vai acender a cada troca de acorde da backing track.

E o melhor: o `<Fretboard>` quase não muda. Ele vai deixar de ser "o braço das escalas" e virar **o braço de qualquer conjunto de notas**.

**O que você vai aprender:**
1. **Refatorar** um componente para ficar genérico (e o TypeScript apontando tudo que quebrou)
2. Objetos dentro de objetos, e desestruturar com `const { a, b } = obj`
3. `type` de atalho (*alias*) e o tipo `(number | null)[]`
4. `flatMap` devolvendo `[]` para **pular** itens
5. Juntar duas páginas em uma e o sistema **CAGED**

---

## Parte 0 — Acordes móveis

Quase todo acorde com pestana vem de dois desenhos de acordes abertos:

| Desenho | Vem de | Tônica na | Exemplo |
|---|---|---|---|
| **Forma de Mi** | Mi aberto (E) | 6ª corda | F com pestana na casa 1 = Mi aberto "subido" 1 casa |
| **Forma de Lá** | Lá aberto (A) | 5ª corda | C com pestana na casa 3 = Lá aberto subido 3 casas |

Ou seja: um acorde é **um desenho fixo** + **uma casa de partida**. O desenho diz "quantas casas acima da pestana" vai cada dedo; a casa de partida é onde a tônica cai na corda da tônica. É a mesma ideia do `shape` da aula 05c: dados simples + uma conta.

Escrevendo o desenho como "casas acima da pestana", da corda 0 (Mi aguda) até a 5 (Mi grave):

```
Mi maior aberto:  e 0 · B 0 · G 1 · D 2 · A 2 · E 0   →  [0, 0, 1, 2, 2, 0]
Lá maior aberto:  e 0 · B 2 · G 2 · D 2 · A 0 · E x   →  [0, 2, 2, 2, 0, null]
```

O `null` é a corda que **não toca** (o "x" das cifras).

---

## Parte 1 — O `<Fretboard>` genérico

Hoje o braço recebe `escala` e calcula as notas sozinho. Para mostrar um acorde, ele precisa receber **as notas prontas**.

### Passo 1.1 — Troque a prop

No `Fretboard.tsx`:
1. No `type Props`, troque `escala: NomeEscala` por:
   ```tsx
     notas: Nota[]
   ```
2. Na assinatura, troque `escala` por `notas`:
   ```tsx
   export function Fretboard({ tonica, notas, mostrar = 'nota', alvos = [], destaque = [] }: Props) {
   ```
3. **Apague** a linha `const notas = notasDaEscala(tonica, escala)` (as notas agora chegam prontas).
4. **Apague** o import de `@/theory/escalas` (ninguém mais usa aqui).

**✅ O que você deve ver:** sublinhado vermelho no `Escalas.tsx`. O VS Code avisa: `Property 'notas' is missing` e `'escala' does not exist`. Esse é o maior presente do TypeScript numa refatoração: ele **lista todo lugar que quebrou**. Em JavaScript puro, você só descobriria clicando na página.

### Passo 1.2 — Conserte quem usa

Em `Escalas.tsx`, no `<Fretboard>`, troque `escala={escala}` por:

```tsx
          notas={notasDaEscala(tonica, escala)}
```

**✅ O que você deve ver:** sem erros, e a página Escalas funcionando **igual a antes** (troque escala, posição, notas/graus). Refatorar = mudar o código **sem mudar** o que ele faz.

---

## Parte 2 — Os desenhos em dados

### Passo 2.1 — Em `web/src/theory/acordes.ts`

Ajuste os imports no topo:

```ts
import { distancia, transpor, type Nota } from './notas'
import { AFINACAO_PADRAO } from './braco'
```

E no fim do arquivo:

```ts
type Desenho = Record<TipoAcorde, (number | null)[]>

export const FORMAS = {
  E: {
    corda: 5,
    desenho: {
      maior: [0, 0, 1, 2, 2, 0],
      menor: [0, 0, 0, 2, 2, 0],
      dom7: [0, 0, 1, 0, 2, 0],
      m7: [0, 0, 0, 0, 2, 0],
      maj7: [0, 0, 1, 1, 2, 0],
    } satisfies Desenho,
  },
  A: {
    corda: 4,
    desenho: {
      maior: [0, 2, 2, 2, 0, null],
      menor: [0, 1, 2, 2, 0, null],
      dom7: [0, 2, 0, 2, 0, null],
      m7: [0, 1, 0, 2, 0, null],
      maj7: [0, 2, 1, 2, 0, null],
    } satisfies Desenho,
  },
}

export type Forma = keyof typeof FORMAS
```

| Código | O que significa |
|---|---|
| `type Desenho = ...` | Um **apelido** de tipo, para não repetir o tipo longo duas vezes. Como um `using Desenho = Dictionary<...>;` no C#. Sem `export`: só este arquivo usa. |
| `(number \| null)[]` | "Array de itens que são número **ou** null". Os parênteses importam: `number \| null[]` seria "um número, ou um array de nulls". |
| `Record<TipoAcorde, ...>` | Igual aos `ROTULOS` da 05b: **todo** tipo de acorde precisa ter desenho. Se um dia você criar um tipo novo em `ACORDES`, o TypeScript cobra o desenho dele aqui (é o exercício 2). |
| `E: { corda: 5, desenho: {...} }` | Objeto dentro de objeto. Cada forma sabe **em qual corda** está a tônica e **qual é o desenho** de cada tipo. |
| `keyof typeof FORMAS` | `'E' \| 'A'`. |

> Pode conferir os desenhos com a guitarra no colo: o `dom7` da forma de Mi é o E7 aberto (`0 0 1 0 2 0`), o `m7` da forma de Lá é o Am7 aberto (`x 0 2 0 1 0`, lido de trás para frente).

### Passo 2.2 — A função `voicing`

"Voicing" é o nome que músicos dão a **um jeito específico** de montar o acorde no instrumento. Embaixo:

```ts
export function voicing(raiz: Nota, tipo: TipoAcorde, forma: Forma): string[] {
  const { corda, desenho } = FORMAS[forma]
  const casaRaiz = distancia(AFINACAO_PADRAO[corda], raiz)
  return desenho[tipo].flatMap((d, c) => (d === null ? [] : [`${c}-${casaRaiz + d}`]))
}
```

| Código | O que significa |
|---|---|
| `const { corda, desenho } = FORMAS[forma]` | **Desestruturação de objeto**: tira as duas propriedades de dentro numa linha. É como `var (corda, desenho) = ...` com uma tupla no C#. |
| `distancia(AFINACAO_PADRAO[corda], raiz)` | Onde a tônica cai na corda da tônica. C na forma de Lá: distância de Lá até Dó = **3** → pestana na casa 3. Se der 0, é o **acorde aberto**! |
| `flatMap((d, c) => ...)` | Para cada corda `c`, com `d` casas acima da pestana... |
| `d === null ? [] : [chave]` | ...devolve um array **vazio** (corda que não toca) ou um array **com uma chave**. O `flatMap` achata tudo, e os vazios simplesmente somem. É um `map` + `filter` numa passada só. |
| `` `${c}-${casaRaiz + d}` `` | A mesma chave `"corda-casa"` do `shape`. O `<Fretboard>` já sabe destacar isso pela prop `destaque`. |

### Passo 2.3 — Testes

Em `web/src/theory/teoria.test.ts`, importe `voicing` (de `./acordes`) e acrescente:

```ts
describe('voicings', () => {
  it('Lá maior aberto', () => {
    expect(voicing('A', 'maior', 'A')).toEqual(['0-0', '1-2', '2-2', '3-2', '4-0'])
  })
  it('F com pestana na casa 1', () => {
    expect(voicing('F', 'maior', 'E')).toEqual(['0-1', '1-1', '2-2', '3-3', '4-3', '5-1'])
  })
})
```

**✅ O que você deve ver:** `22 passed`. Repare no primeiro: Lá aberto **não tem** chave da corda 5. O `null` sumiu, como queríamos.

---

## Parte 3 — A página Acordes

### Passo 3.1 — Rota e menu

Igual à 05b:
- Crie `web/src/pages/Acordes.tsx` com um componente `Acordes` só com o título (`<h1 className="text-4xl">Acordes</h1>` dentro de uma `<section className="flex flex-col gap-8">`).
- Em `main.tsx`: o import e `{ path: 'acordes', element: <Acordes /> }`.
- Em `Layout.tsx`: o ícone `Grid3x3` no import do `lucide-react` e o item `{ para: '/acordes', rotulo: 'Acordes', icone: Grid3x3 }` depois de Escalas.

**✅ O que você deve ver:** "Acordes" no menu, abrindo a página com o título.

> 🔁 Na Parte 4, essa rota e esse item de menu dão lugar à página **Braço**.

### Passo 3.2 — Rótulos e símbolos

No topo do `Acordes.tsx`:

```tsx
import { useState } from 'react'
import { Fretboard } from '@/components/Fretboard'
import { grau, NOTAS, type Nota } from '@/theory/notas'
import { notasDoAcorde, voicing, type Forma, type TipoAcorde } from '@/theory/acordes'

const ROTULOS = {
  maior: 'Maior',
  menor: 'Menor',
  dom7: '7',
  m7: 'm7',
  maj7: '7M',
} satisfies Record<TipoAcorde, string>

const SIMBOLOS = {
  maior: '',
  menor: 'm',
  dom7: '7',
  m7: 'm7',
  maj7: '7M',
} satisfies Record<TipoAcorde, string>

const TIPOS = Object.keys(ROTULOS) as TipoAcorde[]

const OPCOES_FORMA = [
  { valor: 'E', rotulo: 'Tônica na 6ª' },
  { valor: 'A', rotulo: 'Tônica na 5ª' },
] satisfies { valor: Forma; rotulo: string }[]
```

`ROTULOS` é o nome no menu ("Maior"); `SIMBOLOS` é como se escreve na cifra (C, Cm, C7, Cm7, C7M). Nada novo aqui: são os padrões da 05b.

### Passo 3.3 — O componente

Troque o `export function Acordes` por:

```tsx
export function Acordes() {
  const [raiz, setRaiz] = useState<Nota>('C')
  const [tipo, setTipo] = useState<TipoAcorde>('maior')
  const [forma, setForma] = useState<Forma>('A')
  const notas = notasDoAcorde(raiz, tipo)

  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-4xl">Acordes</h1>

      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          Tônica
          <select
            value={raiz}
            onChange={(e) => setRaiz(e.target.value as Nota)}
            className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
          >
            {NOTAS.map((nota) => (
              <option key={nota}>{nota}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          Tipo
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoAcorde)}
            className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {ROTULOS[t]}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          Desenho
          <div className="flex rounded-md border bg-card p-1">
            {OPCOES_FORMA.map((opcao) => (
              <button
                key={opcao.valor}
                aria-pressed={forma === opcao.valor}
                onClick={() => setForma(opcao.valor)}
                className={`flex items-center gap-2 rounded px-3 py-1 text-sm transition-colors ${
                  forma === opcao.valor ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {forma === opcao.valor && <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
                {opcao.rotulo}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-baseline gap-4">
        <span className="font-heading text-5xl font-semibold font-stretch-expanded">
          {raiz}
          {SIMBOLOS[tipo]}
        </span>
        <span className="text-muted-foreground">
          {notas.map((nota) => `${nota} (${grau(raiz, nota)})`).join('  ·  ')}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card p-4">
        <Fretboard tonica={raiz} notas={notas} destaque={voicing(raiz, tipo, forma)} />
      </div>
    </section>
  )
}
```

É quase tudo repetição das páginas anteriores, de propósito. O que importa está nas últimas linhas:

| Código | O que significa |
|---|---|
| `const notas = notasDoAcorde(raiz, tipo)` | Calculado a cada desenho, a partir do estado (como o `quantas` da 05c). |
| `{raiz}{SIMBOLOS[tipo]}` | Dois textos colados: `C` + `m7` = **Cm7**. |
| `` `${nota} (${grau(raiz, nota)})` `` | "E (3)": a nota e o grau dela **no acorde**. Num C7: C (1) · E (3) · G (5) · A# (b7). |
| `notas={notas}` | O braço genérico da Parte 1, agora com as notas **do acorde**. |
| `destaque={voicing(...)}` | Acende só onde os dedos vão; o resto do arpejo fica apagado. |

**✅ O que você deve ver:**
- **C / Maior / Tônica na 5ª**: o C com pestana na casa 3 aceso (Dós preenchidos, E e G como anéis), e todos os outros C, E e G do braço apagados em volta.
- **A / Maior / Tônica na 5ª**: o Lá **aberto** (a distância deu 0).
- **F / Maior / Tônica na 6ª**: o F com pestana na casa 1.
- **E / 7 / Tônica na 6ª**: o E7 aberto.
- Troque o tipo de **Maior** para **Menor**: só **uma** bolinha anda uma casa para trás (a 3 vira b3). A diferença entre maior e menor é literalmente um semitom.

---

## Parte 4 — Uma página só, CAGED completo e graus

> ✍️ Esta parte **já está no seu código** (o Claude fez a pedido seu). Aqui é para **ler** e entender o que mudou, com cada arquivo aberto ao lado.

### 4.1 — A página Braço

Escalas e acordes são o mesmo braço visto de dois jeitos, então ficaram numa página só: `web/src/pages/Braco.tsx`.

```tsx
const MODOS = [
    { valor: 'escalas', rotulo: 'Escalas' },
    { valor: 'acordes', rotulo: 'Acordes' },
] as const

type Modo = (typeof MODOS)[number]['valor']
```

| Código | O que significa |
|---|---|
| `as const` | "Não generalize": o TypeScript guarda `'escalas'` e `'acordes'` como **valores exatos**, não como `string`. É o mesmo truque do `NOTAS` da aula 05. |
| `(typeof MODOS)[number]['valor']` | Leia por partes: o tipo do array, depois o tipo de **um item qualquer** (`[number]`), depois o campo `valor`. Resultado: `'escalas' \| 'acordes'`. O tipo sai **dos dados**: um modo novo no array já entra no tipo. |

E no fim do componente:

```tsx
{modo === 'escalas' ? <Escalas /> : <Acordes />}
```

É só isso: a Braço tem o título e o botão de modo, e **mostra uma das suas páginas** como se fosse uma peça. Componente é uma função que devolve tela, então `<Escalas />` entra dentro de outro componente igual a um `<Fretboard />`. Por isso o `<h1>` saiu de `Escalas.tsx` e `Acordes.tsx`: o título agora é da Braço.

No `main.tsx` as duas rotas viraram `{ path: 'braco', element: <Braco /> }`, e no `Layout.tsx` os dois itens de menu viraram `{ para: '/braco', rotulo: 'Braço', icone: Music }` (o `Grid3x3` saiu do import).

> ⚠️ Trocar de modo **zera** a página que sumiu: a tônica escolhida em Escalas volta para A quando você vai em Acordes e volta. O React **desmonta** o componente que saiu da tela, e o `useState` dele vai junto. Se um dia incomodar, a solução é "subir o estado": guardar a tônica na `Braco` e passar para as duas por prop.

**✅ O que você deve ver:** no menu, **Braço** no lugar de Escalas e Acordes. No canto do título, o botão **Escalas | Acordes**.

### 4.2 — CAGED: as 5 formas

As formas de Mi e de Lá não são as únicas. Todo acorde maior aberto que você conhece (**C, A, G, E, D**) vira uma forma móvel, e elas se encaixam **em sequência** ao longo do braço, nesta ordem: C → A → G → E → D → C de novo, uma oitava acima. Daí o nome **CAGED**. Saber as 5 é saber o mesmo acorde em **qualquer região** do braço, que é o que o improviso pede: o acorde (e o arpejo) sempre perto da mão.

Em `acordes.ts`, o `FORMAS` agora tem as 5, na ordem do CAGED. As novas têm algo diferente:

```ts
    C: {
        corda: 4,
        desenho: {
            maior: [-3, -2, -3, -1, 0, null],
```

**Números negativos.** No C aberto (`x 3 2 0 1 0`) a tônica está na casa 3 da corda Lá, e as outras notas estão **antes** dela. Escrevendo "casas a partir da tônica", sai `-3, -2, -3, -1, 0`. O mesmo acontece no G (tônica na 6ª) e no D (tônica na 4ª, `corda: 3`).

Isso pede um ajuste no `voicing`:

```ts
    let casaRaiz = distancia(AFINACAO_PADRAO[corda], raiz)
    // C, G e D têm notas antes da tônica: se alguma cairia antes da casa 0, sobe uma oitava
    if (casaRaiz + Math.min(...casas.map((d) => d ?? 0)) < 0) casaRaiz += 12
```

| Código | O que significa |
|---|---|
| `let` | Como o `const`, mas **pode** ser reatribuído. Precisa, porque o `casaRaiz` pode mudar na linha de baixo. |
| `d ?? 0` | Troca os `null` por 0 antes de calcular o mínimo (o `??` da 05c). |
| `Math.min(...lista)` | O menor número. O `...` "espalha" o array em argumentos: `Math.min(-3, -2, -3, -1, 0, 0)`. É o `lista.Min()` do LINQ. |
| `casaRaiz += 12` | Lá na forma de C: a tônica cairia na casa 0, e o desenho pediria a casa **-3**, que não existe. Doze casas acima é a mesma nota, então o acorde vai para a casa 12. |

O teste novo em `teoria.test.ts` passa por **todas** as combinações: 12 tônicas × 5 tipos × 5 formas. Para cada uma, confere que toda nota tocada é do acorde, que tônica e 3ª estão lá e que nenhuma casa sai de 0 a 17. Dados escritos à mão erram fácil; um teste que varre tudo pega o erro antes da tela.

> Duas formas não têm a **5ª**: Cm e Cm7 na forma de C. É normal: a 5ª é a nota que menos faz falta num acorde, e muito desenho de verdade a deixa de fora. Por isso o teste exige só tônica e 3ª.

O seletor de forma agora é `Forma | null`, igual ao de posição da 05c:

```tsx
const OPCOES_FORMA = [
    { valor: null, rotulo: 'Todas' },
    ...(Object.keys(FORMAS) as Forma[]).map((f) => ({ valor: f, rotulo: f })),
] satisfies { valor: Forma | null; rotulo: string }[]
```

E **Todas** acende as 5 formas de uma vez:

```tsx
const destaque = forma === null ? (Object.keys(FORMAS) as Forma[]).flatMap((f) => voicing(raiz, tipo, f)) : voicing(raiz, tipo, forma)
```

O `flatMap` junta as 5 listas de chaves numa só (o `SelectMany` do LINQ).

**✅ O que você deve ver:**
- **C / Maior / Todas**: os desenhos encostando um no outro: C aberto, A na casa 3, G na 5, E na 8, D na 10.
- Clique em **G**: só a forma de G acende, entre as casas 5 e 8.
- **A / Maior / C**: a forma de C de Lá vai para a casa 12, porque não cabe antes da casa 0.

### 4.3 — Graus nos acordes

O exercício 3 lá embaixo também já está feito: a página Acordes ganhou o botão **Notas / Graus**, copiado da `Escalas.tsx` (o `OPCOES`, o estado `mostrar` e o botão, com `mostrar={mostrar}` no `<Fretboard>`).

**✅ O que você deve ver:** C7 com **Graus** e forma **Todas**: as bolinhas acesas mostram `1 3 5 b7` nas 5 formas. Ande pelas formas olhando **onde cai a 3**: ela muda de corda em cada forma, e achar a 3 rápido em qualquer região é metade do improviso sobre acordes.

> O mesmo botão de luz piloto agora aparece 5 vezes (modo, posição, forma e duas vezes Notas/Graus). Já passou da hora de virar um componente `<Alternador>`: fica como primeiro passo da próxima aula de front.

---

## Fechando o módulo 5

Com isso, o módulo 5 tem: `theory/` testado (notas, escalas, acordes, braço, shapes, voicings CAGED), o `<Fretboard>` genérico com destaque e animação, e a página **Braço** com escalas e acordes. Na issue #5, só fica aberto "Diagrama no detalhe do exercício", que depende da Biblioteca (#4) e entra junto com ela.

O próximo passo da trilha do improviso é o módulo de **backing tracks** (#18), que vai fazer o braço acender o acorde certo a cada compasso.

---

## Resumo

| Conceito | C# | TypeScript |
|---|---|---|
| Apelido de tipo | `using X = ...;` | `type X = ...` |
| Nullable em array | `int?[]` | `(number \| null)[]` |
| Desestruturar objeto | `var (a, b) = tupla` | `const { a, b } = obj` |
| Map + filtro numa passada | `SelectMany(x => cond ? [] : [y])` | `flatMap(x => cond ? [] : [y])` |
| Refatorar com segurança | Erros de compilação | Os mesmos erros, no VS Code, na hora |
| Mínimo de uma lista | `lista.Min()` | `Math.min(...lista)` |
| Tipo tirado dos dados | (não tem direto) | `(typeof LISTA)[number]['campo']` |

---

## Exercícios

**1.** Mostre um **×** à esquerda das cordas que **não tocam** (no C com tônica na 5ª, a Mi grave). Dica: uma corda não toca quando nenhuma chave do `destaque` começa com `"corda-"`. `destaque.some(...)` é o `.Any(...)` do LINQ, e `texto.startsWith(...)` é o `StartsWith`.

<details><summary>Gabarito</summary>

No `Fretboard.tsx`, **depois** do `</AnimatePresence>` (para ficar por cima das bolinhas apagadas):

```tsx
      {destaque.length > 0 &&
        AFINACAO_PADRAO.map((_, corda) =>
          destaque.some((chave) => chave.startsWith(`${corda}-`)) ? null : (
            <text
              key={corda}
              x={X_PESTANA / 2}
              y={yCorda(corda)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={14}
              className="fill-muted-foreground"
            >
              ×
            </text>
          ),
        )}
```

Na página Escalas o × nunca aparece: todo shape usa as 6 cordas.
</details>

**2.** Crie o acorde **sus4** (intervalos `0, 5, 7`: tônica, 4ª e 5ª). Comece só pelo `ACORDES` e veja o que o TypeScript cobra. Desenhos: C `[-2, -2, -3, 0, 0, null]`, A `[0, 3, 2, 2, 0, null]`, G `[0, -2, -3, -3, 0, 0]`, E `[0, 0, 2, 2, 2, 0]`, D `[3, 3, 2, 0, null, null]`.

<details><summary>Gabarito</summary>

Ao pôr `sus4: [0, 5, 7]` no `ACORDES`, aparecem erros nos cinco `desenho` (falta `sus4`) e nos `ROTULOS`/`SIMBOLOS` do `Acordes.tsx`. É o `Record` trabalhando: um tipo novo de acorde não fica pela metade.

```ts
      sus4: [-2, -2, -3, 0, 0, null],  // em FORMAS.C.desenho
      sus4: [0, 3, 2, 2, 0, null],     // em FORMAS.A.desenho
      sus4: [0, -2, -3, -3, 0, 0],     // em FORMAS.G.desenho
      sus4: [0, 0, 2, 2, 2, 0],        // em FORMAS.E.desenho
      sus4: [3, 3, 2, 0, null, null],  // em FORMAS.D.desenho
```

```tsx
  sus4: 'sus4',   // em ROTULOS e em SIMBOLOS
```

D / sus4 / A: o Dsus4 com pestana na casa 5. E de graça: o teste das 5 formas passa a conferir o sus4 também, em todos os tons. No sus4, o `acorde[1]` que o teste exige é a 4 (não a 3), exatamente a nota que define o acorde. Se ele quebrar, o erro está no desenho. Compare com o D maior: a 3 (F#) sobe meio tom e vira a 4 (G).
</details>

**3.** *(Já feito na Parte 4.3, fica como leitura.)* Ponha o botão **Notas / Graus** também na página Acordes. Você já fez isso uma vez: copie da `Escalas.tsx` o `OPCOES`, o estado `mostrar` e o botão, e passe `mostrar` para o `<Fretboard>`.

<details><summary>Gabarito</summary>

Os mesmos trechos da Parte 7 da aula 05b. Lembre de importar `type Exibicao` de `@/components/Fretboard`. Com **Graus** num C7, as bolinhas acesas mostram `1 3 5 b7`. Em qualquer acorde com 7 (C7, Cm7, C7M), compare onde a **7** cai: ela é a nota que mais muda o "sabor" do acorde, e é uma das notas-alvo mais fortes do improviso.

> Se você está copiando o mesmo botão pela terceira vez, é sinal de que ele deveria virar um componente (`<Alternador>`). Fica anotado para quando aparecer a quarta.
</details>
