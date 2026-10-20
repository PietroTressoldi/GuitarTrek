# Aula 05e — A escala dentro do CAGED

> 💡 Abra com **`Ctrl+Shift+V`**. Deixe rodando `npm run dev --prefix web` e o `npm run test --prefix web`.

Uma aula curta, que volta ao módulo 5 antes de terminar as backing tracks. O Braço ganha um terceiro modo, **Escala + acorde**: você escolhe uma escala e um acorde, e o braço mostra a **forma CAGED do acorde acesa**, com a **escala em volta dela** e o resto do braço apagado.

É assim que se improvisa sobre uma progressão: você não pensa "estou na caixa 1 da penta". Você pensa "estou em cima do A7 na forma de E, e a escala está aqui em volta". Quando o acorde troca, você procura a forma do próximo acorde **na mesma região**. Isso é a aula 18c: a função que você cria hoje é exatamente o que a backing track vai usar a cada compasso.

**O que você vai aprender:**
1. Mover constantes de um arquivo de **página** para a **teoria** (e por que vale a pena)
2. Uma função com dois `for` e um `Math.max` para "travar" um valor
3. O `.sort()` que **muda** o array original (pegadinha clássica)
4. **Tuplas** (`[number, number]`), e desenhar no SVG com `<rect>`, `<polyline>` e a ordem das camadas
5. **Subir o estado**: as escolhas passam a morar no Braço, e valem para os 3 modos
6. Mostrar um entre 3 componentes com `&&`, e o `.filter` (o `Where` do LINQ)

---

## Parte 0 — A ideia

Pegue o **A7 na forma de E** (pestana na casa 5). As notas dele vão da casa 5 à casa 7. Agora acenda as notas da **pentatônica menor de Lá** que estão da casa 4 à casa 8 (o acorde com **1 casa de folga** para cada lado):

```
casa:    4   5   6   7   8
e   ─────1───────────b3──      1 = A   (tônica)
B   ─────5───────────b7──      b3 = C
G   ────b3───3───4───────      3 = C#  ← do acorde, mas FORA da penta
D   ────b7───────1───────      4 = D
A   ─────4───────5───────      5 = E
E   ─────1───────────b3──      b7 = G
```

Duas coisas para reparar:

- **Sai a caixa 1 da penta**, exatamente a da aula 05c. As caixas da penta não são decoreba: cada uma "mora" em volta de uma forma do acorde.
- **O 3 (C#) aparece**, mesmo não estando na penta menor. Ele é a nota que diz "isso é maior". Tocar a penta menor e **mirar no C#** nas trocas é o som do blues. Por isso o braço precisa mostrar as notas do acorde **mesmo quando estão fora da escala**.

A regra em uma frase: **chaves da escala entre (casa mais baixa do acorde − 1) e (casa mais alta + 1)**, e mais as chaves do próprio acorde.

---

## Parte 1 — Os rótulos vão para a teoria

A página nova vai precisar dos nomes das escalas ("Pentatônica menor") e dos acordes ("Maior", "7"). Hoje eles estão **presos** dentro de `Escalas.tsx` e `Acordes.tsx`, como `const ROTULOS`. Para usar numa terceira página, ou você copia (e um dia as cópias ficam diferentes), ou move para um lugar que as três importam. Movemos para `theory/`, junto do tipo que eles descrevem.

> Em C#, é como tirar um `Dictionary` de dentro de um `Form` e pôr numa classe `static` de domínio. Quem precisa importa.

### Passo 1.1 — Escalas

1. Em `web/src/pages/Escalas.tsx`, **recorte** (`Ctrl+X`) o bloco inteiro do `const ROTULOS = { ... } satisfies Record<NomeEscala, string>`.
2. Em `web/src/theory/escalas.ts`, **logo abaixo** da linha `export type NomeEscala = keyof typeof ESCALAS`, cole e mude o começo para:
   ```ts
   export const ROTULOS_ESCALA = {
   ```
   O `export` deixa outros arquivos importarem. O nome ganha o `_ESCALA` porque agora ele vive num lugar onde "ROTULOS de quê?" não é óbvio.
3. De volta ao `Escalas.tsx`, no import de `@/theory/escalas`, acrescente `ROTULOS_ESCALA`:
   ```tsx
   import { notasDaEscala, ROTULOS_ESCALA, type NomeEscala } from '@/theory/escalas'
   ```
4. Troque os **dois** usos: `Object.keys(ROTULOS)` vira `Object.keys(ROTULOS_ESCALA)`, e `{ROTULOS[nome]}` vira `{ROTULOS_ESCALA[nome]}`.

**✅ O que você deve ver:** antes do passo 3, o VS Code sublinha de vermelho os dois `ROTULOS` (`Cannot find name 'ROTULOS'`). Depois do passo 4, nenhum erro, e a página Escalas funcionando **igual**.

### Passo 1.2 — Acordes

A mesmíssima coisa em `web/src/pages/Acordes.tsx`:

1. Recorte o `const ROTULOS = { ... } satisfies Record<TipoAcorde, string>`.
2. Cole em `web/src/theory/acordes.ts`, logo abaixo de `export type TipoAcorde = keyof typeof ACORDES`, como:
   ```ts
   export const ROTULOS_ACORDE = {
   ```
3. No `Acordes.tsx`, acrescente `ROTULOS_ACORDE` ao import de `@/theory/acordes`.
4. Troque `Object.keys(ROTULOS)` por `Object.keys(ROTULOS_ACORDE)`, e `{ROTULOS[t]}` por `{ROTULOS_ACORDE[t]}`.

**✅ O que você deve ver:** a página Acordes igual a antes. Repare que agora o `acordes.ts` tem `SIMBOLOS` (`'7'`, `'m7'`, para a cifra) e `ROTULOS_ACORDE` (`'Maior'`, `'7'`, para os botões) lado a lado. Se um dia você criar o sus4, os dois `Record` cobram o rótulo **no mesmo arquivo**.

---

## Parte 2 — As funções `janela` e `aoRedor`

São duas funções pequenas. A `janela` responde "de que casa até que casa vai a região deste acorde?". A `aoRedor` usa essa resposta para achar as notas da escala dentro da região. Ficam separadas porque o `<Fretboard>` também vai precisar da janela sozinha, para pintar a faixa da região (Parte 3).

### Passo 2.1 — Em `web/src/theory/braco.ts`

No **fim** do arquivo:

```ts
// A faixa de casas em volta de um desenho: da casa mais baixa - 1 até a mais alta + 1
export function janela(desenho: string[]): [number, number] {
    const casas = desenho.map((chave) => Number(chave.split('-')[1]))
    return [Math.max(0, Math.min(...casas) - 1), Math.max(...casas) + 1]
}

// As chaves das notas que caem dentro da janela de um desenho
export function aoRedor(desenho: string[], notas: Nota[]): string[] {
    const [de, ate] = janela(desenho)
    const chaves: string[] = []
    for (let corda = 0; corda < 6; corda++) {
        for (let casa = de; casa <= ate; casa++) {
            if (notas.includes(notaNaCasa(corda, casa))) chaves.push(`${corda}-${casa}`)
        }
    }
    return chaves
}
```

| Código | O que significa |
|---|---|
| `desenho: string[]` | As chaves `"corda-casa"` de um acorde, como o `voicing` devolve: `['0-5', '1-5', '2-6', ...]`. As funções não sabem que é um acorde, então servem para **qualquer** desenho. |
| `: [number, number]` | **Tupla**: um array com exatamente 2 números, nessa ordem. É o `(int, int)` do C#. O TypeScript não deixa devolver 1 ou 3 itens. |
| `Number(chave.split('-')[1])` | `'2-6'.split('-')` dá `['2', '6']`. A posição `[1]` é a casa, ainda como texto. `Number(...)` converte, como o `int.Parse` do C#. Você já viu essa linha no `shape` do blues. |
| `Math.min(...casas) - 1` | A casa mais baixa do acorde, menos 1 de folga. Os `...` "espalham" o array como argumentos, igual ao `shape`. |
| `Math.max(0, ...)` | **Trava** o valor em 0: "o maior entre 0 e a conta". Num acorde aberto (casa mais baixa = 0), `0 - 1 = -1`, e não existe casa −1. É o `Math.Max(0, x)` do C#, com o mesmo nome. |
| `const [de, ate] = janela(desenho)` | Desestrutura a tupla em duas variáveis, como o `var (de, ate) = Janela(desenho);` do C#. Você já fez isso com o `match` na aula 18a. |
| `for (let corda = 0; corda < 6; corda++)` | Idêntico ao `for` do C#. Só troca `int` por `let`. |
| `notas.includes(...)` | `true` se a nota daquela casa está na lista. É o `.Contains` do C#. |
| `chaves.push(...)` | Acrescenta no fim do array, o `.Add` da `List<T>`. |

### Passo 2.2 — Testes

Em `web/src/theory/tests/braco.test.ts`, deixe os imports do topo assim:

```ts
import { aoRedor, notaNaCasa, shape } from "../braco";
import { voicing } from "../acordes";
import { notasDaEscala } from "../escalas";
```

E no fim do arquivo:

```ts
describe('escala ao redor do acorde', () => {
    it('A7 na forma de E + penta menor = a caixa 1', () => {
        const caixa = aoRedor(voicing('A', 'dom7', 'E'), notasDaEscala('A', 'pentaMenor'))
        expect(caixa.sort()).toEqual(shape('A', 'pentaMenor', 0).sort())
    })
    it('não passa da pestana', () => {
        expect(aoRedor(['0-0'], ['D#'])).toEqual(['3-1'])
    })
})
```

O primeiro teste é a Parte 0 escrita em código: a escala em volta do A7 tem que ser **a mesma** caixa que o `shape` da aula 05c já calculava. São duas contas completamente diferentes chegando ao mesmo resultado, e isso dá muita confiança nas duas.

O `.sort()` está ali porque a **ordem** das chaves é diferente: o `shape` anda da corda grave para a aguda, e o `aoRedor` faz o contrário. O `toEqual` compara posição por posição, então ordenamos os dois lados antes.

> ⚠️ **Pegadinha:** o `.sort()` do JavaScript **muda o array original** e devolve ele mesmo, como o `List<T>.Sort()` do C#. Ele não cria uma cópia ordenada como o `OrderBy` do LINQ. No teste tanto faz, porque ninguém usa os arrays depois. Mas no código do app, ordenar um array que veio de uma prop ou do estado é um bug difícil de achar.

O segundo teste confere a trava do `Math.max`. O desenho `['0-0']` fica na casa 0, então sem a trava a janela iria da casa −1 à 1. Na casa −1 da Mi aguda, o `notaNaCasa` devolveria D# (meio tom abaixo de Mi), e a chave `'0--1'` entraria no resultado. Com a trava, só sobra o D# de verdade: corda Ré, casa 1.

**✅ O que você deve ver:** `31 passed`. Para provar que o 2º teste vale alguma coisa, troque `Math.max(0, Math.min(...casas) - 1)` por `Math.min(...casas) - 1`: ele fica vermelho, mostrando `'0--1'` e `'5--1'` a mais. Depois desfaça.

---

## Parte 3 — O `<Fretboard>` mostra o acorde dentro da escala

Hoje o braço tem dois visuais: tônica (âmbar cheio) e nota da escala (só o contorno). Com acorde e escala juntos na tela, isso não basta: você precisa bater o olho e saber **o que é acorde e o que é escala**. Então o braço ganha 4 coisas:

| O quê | Como fica |
|---|---|
| **Nota do acorde** | Bolinha clara e cheia. A tônica do acorde continua âmbar cheia. |
| **O desenho** | Uma linha suave ligando as notas do acorde, para a forma (o "desenho do E") aparecer como uma coisa só. |
| **Resto da escala** | Só o contorno, **menor** e um pouco transparente. Fica em segundo plano. |
| **A região** | Uma faixa âmbar bem leve atrás das casas da janela. |

E o braço precisa mostrar as notas do acorde **mesmo que elas não estejam em `notas`** (o C# da Parte 0).

Tudo isso acontece em `web/src/components/Fretboard.tsx`.

### Passo 3.1 — A prop `desenhos`

O braço vai receber os **desenhos** do acorde, um para cada forma. Com uma forma só, é uma lista com 1 desenho. Com "Todas", são 5. Cada desenho é uma lista de chaves, então o tipo é uma **lista de listas**: `string[][]`, o `List<List<string>>` do C#. Ele precisa vir separado por forma porque a linha liga as notas **de uma forma**, e não as do braço inteiro.

No `type Props`, embaixo de `destaque?: string[]`:

```tsx
    desenhos?: string[][]
```

Na assinatura, depois do `destaque = []`:

```tsx
export function Fretboard({ tonica, notas, mostrar = 'nota', alvos = [], destaque = [], desenhos = [] }: Props) {
```

E logo na primeira linha dentro da função:

```tsx
    const acorde = desenhos.flat()
    const comAcorde = acorde.length > 0
    // com várias formas ("Todas") as faixas se sobrepõem e viram listras: só desenha com uma
    const faixa = desenhos.length === 1 ? janela(desenhos[0]) : null
```

| Código | O que significa |
|---|---|
| `desenhos.flat()` | "Achata" a lista de listas numa lista só: `[['0-5', '1-5'], ['0-8']]` vira `['0-5', '1-5', '0-8']`. É o `SelectMany(x => x)` do LINQ. Serve para perguntar "esta casa é do acorde?" sem se importar com a forma. |
| `comAcorde` | Se tem acorde na tela. Nas páginas Escalas e Acordes, ninguém passa `desenhos`, então ele é `false` e o braço fica igual a antes. |
| `faixa` | A janela `[de, ate]` da forma, ou `null` com várias formas. O `null` é de propósito: com "Todas", 5 faixas se sobrepondo deixam o braço listrado. |

Acrescente `janela` ao import de `@/theory/braco`, no topo:

```tsx
import { AFINACAO_PADRAO, janela, notaNaCasa } from '@/theory/braco'
```

### Passo 3.2 — A faixa da região

Primeiro, uma função de posição, junto das outras (`yCorda` e `xCasa`), no topo do arquivo:

```tsx
// Onde começa a faixa de uma casa: na borda esquerda dela (a casa 0 começa no canto do braço)
function xFaixa(casa: number) {
    return casa === 0 ? 0 : X_PESTANA + (casa - 1) * LARGURA_CASA
}
```

O `xCasa` dá o **meio** da casa, onde vai a bolinha. A faixa precisa da **borda**: a casa 5 começa no traste 4. A casa 0 (corda solta) começa no canto esquerdo do desenho.

Agora, dentro do `<svg>`, como **primeiro filho** (antes do `casas.map` dos trastes):

```tsx
            {faixa && (
                <rect
                    x={xFaixa(faixa[0])}
                    y={Y_TOPO - 16}
                    width={X_PESTANA + faixa[1] * LARGURA_CASA - xFaixa(faixa[0])}
                    height={5 * ESPACO_CORDA + 32}
                    rx={8}
                    className="fill-primary opacity-10"
                />
            )}
```

| Código | O que significa |
|---|---|
| Primeiro filho | No SVG, **quem vem depois fica por cima**, como camadas num editor de imagem. A faixa vem antes de tudo para ficar **atrás** das cordas e das notas. Não existe `z-index` no SVG: a ordem é a camada. |
| `{faixa && (...)}` | Se `faixa` é `null`, nada aparece. O `&&` de sempre. |
| `<rect>` | Um retângulo. `x` e `y` são o canto de cima à esquerda, e `rx` arredonda os cantos. |
| `faixa[0]` e `faixa[1]` | A casa inicial e a final da tupla. |
| `width={...}` | Da borda esquerda da casa `de` até a borda direita da casa `ate`. A borda direita de uma casa é o traste dela: `X_PESTANA + casa * LARGURA_CASA`, a mesma conta dos trastes logo abaixo. |
| `y` e `height` | Da corda de cima (16 unidades acima) até a de baixo (16 abaixo), para a faixa "abraçar" as bolinhas. |
| `fill-primary opacity-10` | Âmbar com 10% de opacidade, um brilho bem leve. Sempre pelo token, nada de cor fixa. |

### Passo 3.3 — A linha do desenho

Logo **antes** do `<AnimatePresence>` (assim a linha fica por cima das cordas, mas embaixo das bolinhas):

```tsx
            {desenhos.map((desenho, i) => (
                <polyline
                    key={i}
                    points={desenho
                        .map((chave) => {
                            const [corda, casa] = chave.split('-').map(Number)
                            return `${xCasa(casa)},${yCorda(corda)}`
                        })
                        .join(' ')}
                    fill="none"
                    strokeWidth={3}
                    strokeLinejoin="round"
                    className="stroke-foreground opacity-25"
                />
            ))}
```

| Código | O que significa |
|---|---|
| `<polyline>` | Uma linha que passa por vários pontos, na ordem. Os pontos são um texto: `"x1,y1 x2,y2 x3,y3"`. |
| `chave.split('-').map(Number)` | `'2-6'` vira `['2', '6']` e depois `[2, 6]`. Passar `Number` direto para o `map` é o mesmo que `(texto) => Number(texto)`. Em C# seria `.Select(int.Parse)`. |
| `const [corda, casa] = ...` | A desestruturação de array de novo. |
| `.join(' ')` | Junta os pontos com espaço, no formato que o `points` quer. |
| `fill="none"` | Sem preenchimento: só o traço. Sem isso, o SVG pinta a área "dentro" da linha. |
| `strokeLinejoin="round"` | Arredonda as dobras da linha, para ela não ter pontas. |
| `key={i}` | Aqui a posição serve de chave, porque a lista de desenhos é refeita do zero a cada troca. |

O `voicing` devolve as chaves da corda 0 até a 5, em ordem, então a linha desce pelas cordas e desenha a forma.

### Passo 3.4 — As cores

Agora são 4 visuais (tônica do acorde, tônica que não é do acorde, nota do acorde, resto da escala). Um ternário com 4 saídas no `className` ficaria ilegível, e ele apareceria duas vezes (círculo e texto). Então vira uma função. Embaixo do `export type Exibicao`:

```tsx
// [cor do círculo, cor do texto]. Com um acorde na tela, só a tônica DO ACORDE fica cheia em âmbar.
function cores(ehTonica: boolean, doAcorde: boolean, comAcorde: boolean): [string, string] {
    if (ehTonica && (doAcorde || !comAcorde)) return ['fill-primary stroke-primary', 'fill-primary-foreground']
    if (ehTonica) return ['fill-card stroke-primary', 'fill-primary']
    if (doAcorde) return ['fill-foreground stroke-foreground', 'fill-background']
    return ['fill-card stroke-cat-escalas', 'fill-foreground']
}
```

Leia de cima para baixo, como um `switch`:

1. **Tônica**, e (é do acorde **ou** não tem acorde na tela) → âmbar cheio. O "não tem acorde" mantém as páginas Escalas e Acordes iguais a antes.
2. **Tônica**, mas fora do acorde → só o **contorno** âmbar. Na Parte 0, o Lá da corda Ré na casa 7 é tônica da escala mas não faz parte do desenho do A7. Cheio, ele pareceria nota do acorde.
3. **Do acorde** → cheio na cor do texto. O número em cima usa `fill-background` (a cor do **fundo** da página), porque está sobre um círculo claro. No tema `treino`, isso se inverte sozinho.
4. **O resto** → o contorno de sempre.

Devolver uma tupla `[string, string]` é o mesmo truque da `janela`: duas respostas numa só chamada.

### Passo 3.5 — Quem aparece, e como

Dentro do `casas.map((casa) => { ... })`, hoje o começo é:

```tsx
                        const nota = notaNaCasa(corda, casa)
                        if (!notas.includes(nota)) return null
                        const ehTonica = nota === tonica
                        const chave = `${corda}-${casa}`
                        const apagada = destaque.length > 0 && !destaque.includes(chave)
```

Troque essas 5 linhas por:

```tsx
                        const nota = notaNaCasa(corda, casa)
                        const chave = `${corda}-${casa}`
                        const doAcorde = acorde.includes(chave)
                        if (!notas.includes(nota) && !doAcorde) return null
                        const ehTonica = nota === tonica
                        const apagada = destaque.length > 0 && !destaque.includes(chave)
                        const soEscala = comAcorde && !doAcorde
                        const [corCirculo, corTexto] = cores(ehTonica, doAcorde, comAcorde)
```

| Código | O que significa |
|---|---|
| A `chave` subiu | Agora o `if` precisa dela. |
| `if (!notas.includes(nota) && !doAcorde)` | "Pula a casa se a nota **não** está na escala **e** a casa **não** é do acorde." O C# está fora da penta, mas a casa `2-6` está no acorde, então ele aparece. |
| `soEscala` | "Tem acorde na tela, e esta nota não é dele": é o resto da escala, que vai ficar menor e mais apagado. |
| `const [corCirculo, corTexto] = cores(...)` | A tupla desestruturada. |

Por último, troque 4 atributos mais abaixo:

| Onde | Antes | Depois |
|---|---|---|
| `animate` do `<motion.g>` | `opacity: apagada ? 0.15 : 1` | `opacity: apagada ? 0.1 : soEscala ? 0.6 : 1` |
| `r` do `<circle>` | `r={11}` | `r={soEscala ? 9 : 11}` |
| `className` do `<circle>` | o ternário da tônica | `className={corCirculo}` |
| `className` do `<text>` | o ternário da tônica | `className={corTexto}` |

O que está fora da região cai de 15% para 10%, e o resto da escala fica com 60% e um raio menor. É uma **hierarquia**: acorde em primeiro plano, escala em segundo e o resto do braço quase sumindo.

**✅ O que você deve ver:** nada muda nas páginas Escalas e Acordes. Ninguém passa `desenhos`, então `comAcorde` é `false`: sem faixa, sem linha, e `cores` cai sempre no 1º ou no 4º caso. Esse é o teste de que a refatoração não quebrou nada.

---

## Parte 4 — As escolhas sobem para o Braço

Hoje cada modo guarda as próprias escolhas com `useState`: a página Escalas tem a **sua** tônica, e a Acordes tem **outra**. Escolha Mi em Escalas, clique em Acordes, e lá está o Dó de novo. Pior: quando você volta para Escalas, ela também esqueceu o Mi. O `{modo === 'escalas' && <Escalas />}` **desmonta** a página quando o modo muda, e o estado dela vai embora junto.

A solução tem nome no React: **subir o estado** (*lifting state up*). Se dois componentes precisam do mesmo dado, ele mora no **pai** dos dois, e desce para eles por props. O pai aqui é o `Braco.tsx`, que nunca desmonta enquanto você está na página.

> Em C#, é a diferença entre cada `UserControl` ter o próprio campo `Tonica` e o `Form` guardar um objeto de opções e passar a referência para todos.

### Passo 4.1 — O estado no `Braco.tsx`

Em `web/src/pages/Braco.tsx`, junte estes imports aos que já existem:

```tsx
import type { Exibicao } from '@/components/Fretboard'
import type { Nota } from '@/theory/notas'
import type { NomeEscala } from '@/theory/escalas'
import type { Forma, TipoAcorde } from '@/theory/acordes'
```

O `import type` traz **só o tipo**. Ele some quando o código vira JavaScript, porque tipos não existem na hora de rodar.

Embaixo da linha `type Modo = ...`:

```tsx
// As escolhas valem para os 3 modos: trocar de modo não perde nada
export type OpcoesBraco = {
    tonica: Nota
    escala: NomeEscala
    tipo: TipoAcorde
    forma: Forma | null
    posicao: number | null
    mostrar: Exibicao
}

export type PropsModo = {
    opcoes: OpcoesBraco
    mudar: (novas: Partial<OpcoesBraco>) => void
}

const INICIAIS: OpcoesBraco = { tonica: 'A', escala: 'pentaMenor', tipo: 'm7', forma: 'E', posicao: null, mostrar: 'nota' }
```

| Código | O que significa |
|---|---|
| `OpcoesBraco` | **Todas** as escolhas dos 3 modos num objeto só. Cada modo usa as que precisa: Escalas ignora `tipo` e `forma`, Acordes ignora `escala` e `posicao`. |
| `PropsModo` | As props que os 3 modos vão receber: as opções e uma função para mudá-las. Tem `export` porque cada página vai importar. |
| `Partial<OpcoesBraco>` | O mesmo `Partial` da aula 18a: **todos os campos ficam opcionais**. Assim dá para chamar `mudar({ tonica: 'E' })` sem passar os outros 5. |
| `(novas: ...) => void` | O tipo de uma função que recebe `novas` e não devolve nada. É o `Action<Partial<OpcoesBraco>>` do C#. |
| `INICIAIS` | Os valores de quando você abre a página. A penta menor com Am7 combinam: todas as notas do acorde estão na escala. |

Dentro do `Braco()`, embaixo do `useState` do `modo`:

```tsx
    const [opcoes, setOpcoes] = useState(INICIAIS)
    const mudar = (novas: Partial<OpcoesBraco>) => setOpcoes((atuais) => ({ ...atuais, ...novas }))
```

| Código | O que significa |
|---|---|
| `useState(INICIAIS)` | Não precisa do `<OpcoesBraco>`: o TypeScript tira o tipo do valor inicial, que já tem tipo. |
| `{ ...atuais, ...novas }` | Um objeto **novo**: copia todos os campos de `atuais`, e depois os de `novas` por cima. `{ ...{ tonica: 'A', escala: 'blues' }, ...{ tonica: 'E' } }` dá `{ tonica: 'E', escala: 'blues' }`. É o `with` dos `record` do C#: `atuais with { Tonica = "E" }`. |
| `setOpcoes((atuais) => ...)` | O `set` recebendo uma **função** em vez do valor. O React chama essa função com o valor mais recente. Se duas mudanças acontecerem no mesmo clique, a segunda não apaga a primeira. |
| `({ ... })` | Os parênteses em volta do objeto são obrigatórios. Sem eles, `=> {` seria lido como o começo do **corpo** da função, e não como um objeto. |

E passe as duas coisas para os modos:

```tsx
            {modo === 'escalas' ? <Escalas opcoes={opcoes} mudar={mudar} /> : <Acordes opcoes={opcoes} mudar={mudar} />}
```

**✅ O que você deve ver:** vermelho nos dois componentes: `Property 'opcoes' does not exist`. O TypeScript está avisando que Escalas e Acordes ainda não sabem receber essas props. Vamos ensinar.

### Passo 4.2 — Escalas recebe as opções

Em `web/src/pages/Escalas.tsx`:

1. Apague o import de `useState` (ninguém mais vai usar aqui) e acrescente:
   ```tsx
   import type { PropsModo } from './Braco'
   ```
2. Troque a assinatura e os 4 `useState` por:
   ```tsx
   export function Escalas({ opcoes, mudar }: PropsModo) {
       const { tonica, escala, mostrar, posicao } = opcoes
   ```
   A desestruturação cria `tonica`, `escala`, `mostrar` e `posicao` com os **mesmos nomes** de antes. Por isso o resto do JSX continua funcionando sem mudar nada. Só os `set` precisam mudar.
3. Troque os 4 lugares que usavam `set`:

   | Antes | Depois |
   |---|---|
   | `onChange={(e) => setTonica(e.target.value as Nota)}` | `onChange={(e) => mudar({ tonica: e.target.value as Nota })}` |
   | o `onChange` da escala, com `setEscala` e `setPosicao(null)` | `onChange={(e) => mudar({ escala: e.target.value as NomeEscala, posicao: null })}` |
   | `onChange={setMostrar}` | `onChange={(m) => mudar({ mostrar: m })}` |
   | `onChange={setPosicao}` | `onChange={(p) => mudar({ posicao: p })}` |

   A troca de escala, que fazia **dois** `set`, agora é **um** `mudar` com dois campos.

### Passo 4.3 — Acordes recebe as opções

Em `web/src/pages/Acordes.tsx`, o mesmo esquema: tire o `useState` do import, importe `type PropsModo` de `'./Braco'`, e troque a assinatura e os 4 `useState` por:

```tsx
export function Acordes({ opcoes, mudar }: PropsModo) {
  const { tonica: raiz, tipo, forma, mostrar } = opcoes
```

O `tonica: raiz` é novo: **desestruturar renomeando**. "Pegue o campo `tonica` e ponha numa variável chamada `raiz`." Nas opções o nome é `tonica`, mas esta página sempre chamou de `raiz`, e assim o resto dela não precisa mudar.

Depois troque os `set`:

| Antes | Depois |
|---|---|
| `onChange={(e) => setRaiz(e.target.value as Nota)}` | `onChange={(e) => mudar({ tonica: e.target.value as Nota })}` |
| `onChange={(e) => setTipo(e.target.value as TipoAcorde)}` | `onChange={(e) => mudar({ tipo: e.target.value as TipoAcorde })}` |
| `onChange={setForma}` | `onChange={(f) => mudar({ forma: f })}` |
| `onChange={setMostrar}` | `onChange={(m) => mudar({ mostrar: m })}` |

**✅ O que você deve ver:** sem erros. No Braço, escolha **Mi** e **Graus** em Escalas, clique em **Acordes**: lá está o **Em7** com graus. Volte para Escalas: o Mi continua lá.

> Se você escrever `mudar({ tonca: 'E' })` (com erro de digitação), o TypeScript reclama: `tonca` não existe em `OpcoesBraco`. O `Partial` deixa os campos opcionais, mas não deixa inventar campos.

---

## Parte 5 — A página

### Passo 5.1 — O componente

Crie `web/src/pages/EscalaNoAcorde.tsx`. Ele é uma mistura de `Escalas.tsx` com `Acordes.tsx`, e já nasce recebendo as opções do Braço. Vamos por partes.

**Imports e opções**, no topo:

```tsx
import { Fretboard, type Exibicao } from '@/components/Fretboard'
import { Alternador } from '@/components/Alternador'
import { grau, NOTAS, type Nota } from '@/theory/notas'
import { estaNaEscala, notasDaEscala, ROTULOS_ESCALA, type NomeEscala } from '@/theory/escalas'
import { cifra, FORMAS, notasDoAcorde, ROTULOS_ACORDE, voicing, type Forma, type TipoAcorde } from '@/theory/acordes'
import { aoRedor } from '@/theory/braco'
import type { PropsModo } from './Braco'

const NOMES_ESCALA = Object.keys(ROTULOS_ESCALA) as NomeEscala[]

const OPCOES_TIPO = (Object.keys(ROTULOS_ACORDE) as TipoAcorde[]).map((t) => ({ valor: t, rotulo: ROTULOS_ACORDE[t] }))

const OPCOES_FORMA = [
    { valor: null, rotulo: 'Todas' },
    ...(Object.keys(FORMAS) as Forma[]).map((f) => ({ valor: f, rotulo: f })),
] satisfies { valor: Forma | null; rotulo: string }[]

const OPCOES = [
    { valor: 'nota', rotulo: 'Notas' },
    { valor: 'grau', rotulo: 'Graus' },
] satisfies { valor: Exibicao; rotulo: string }[]
```

O `OPCOES_TIPO` é novo: em vez de um `select`, o tipo do acorde vira um `<Alternador>`. São só 5 opções, e assim você troca de 7 para m7 com um clique. O `.map` monta `{ valor: 'dom7', rotulo: '7' }` a partir do `ROTULOS_ACORDE` que você acabou de mover. Foi para isso que ele saiu da página.

**As opções e as contas**, começando o componente:

```tsx
export function EscalaNoAcorde({ opcoes, mudar }: PropsModo) {
    const { tonica, escala, tipo, forma, mostrar } = opcoes

    const notas = notasDaEscala(tonica, escala)
    const formas = forma === null ? (Object.keys(FORMAS) as Forma[]) : [forma]
    const desenhos = formas.map((f) => voicing(tonica, tipo, f))
    const regiao = desenhos.flatMap((d) => aoRedor(d, notas))
    const fora = notasDoAcorde(tonica, tipo).filter((nota) => !estaNaEscala(nota, tonica, escala))
```

| Código | O que significa |
|---|---|
| `{ opcoes, mudar }: PropsModo` | Igual às outras duas páginas: as escolhas vêm do Braço. Por isso a tônica que você escolheu em Escalas já aparece aqui. |
| `formas = forma === null ? todas : [forma]` | **Truque para não escrever o código duas vezes.** "Todas" vira a lista das 5 formas, e uma forma só vira uma lista de **um** item. Daqui para baixo, é sempre uma lista. |
| `desenhos = formas.map(...)` | Um desenho (a lista de chaves do `voicing`) por forma: a lista de listas que o `<Fretboard>` espera. Aqui é `map`, e não `flatMap`, porque cada forma tem que continuar **separada**: a linha liga só as notas de uma forma. |
| `regiao = desenhos.flatMap(... aoRedor ...)` | Para cada desenho, a escala em volta dele. Aqui é `flatMap`, porque o `destaque` quer **uma** lista só. |
| `.filter((nota) => ...)` | Fica só com os itens que fazem a função devolver `true`. É o `.Where(...)` do LINQ. Aqui: as notas do acorde que **não** estão na escala. No A7 sobre blues, `['C#']`. |

**O JSX**, ainda dentro do componente. Os controles são os mesmos das outras duas páginas, já com o `mudar`: Tônica e Escala com `select`, e Acorde, Forma e Mostrar com `<Alternador>`:

```tsx
    return (
        <section className="flex flex-col gap-8">
            <div className="flex flex-wrap gap-4">
                <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Tônica
                    <select
                        value={tonica}
                        onChange={(e) => mudar({ tonica: e.target.value as Nota })}
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
                        onChange={(e) => mudar({ escala: e.target.value as NomeEscala, posicao: null })}
                        className="rounded-md border bg-card px-3 py-2 text-sm text-foreground"
                    >
                        {NOMES_ESCALA.map((nome) => (
                            <option key={nome} value={nome}>
                                {ROTULOS_ESCALA[nome]}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Acorde
                    <Alternador opcoes={OPCOES_TIPO} valor={tipo} onChange={(t) => mudar({ tipo: t })} />
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Forma CAGED
                    <Alternador opcoes={OPCOES_FORMA} valor={forma} onChange={(f) => mudar({ forma: f })} />
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    Mostrar
                    <Alternador opcoes={OPCOES} valor={mostrar} onChange={(m) => mudar({ mostrar: m })} />
                </div>
            </div>
```

O `posicao: null` na troca de escala é pelo mesmo motivo de lá em Escalas: a posição 6 da escala maior não existe na penta. Esta página não mostra posição, mas ela é compartilhada, e você pode voltar para Escalas depois.

Depois, o título com a cifra e o aviso de notas fora da escala:

```tsx
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-heading text-5xl font-semibold font-stretch-expanded">{cifra(tonica, tipo)}</span>
                <span className="text-muted-foreground">sobre {ROTULOS_ESCALA[escala]}</span>
                {fora.length > 0 && (
                    <span className="text-muted-foreground">
                        · fora da escala:{' '}
                        <b className="text-foreground">{fora.map((nota) => `${nota} (${grau(tonica, nota)})`).join(', ')}</b>
                    </span>
                )}
            </div>
```

| Código | O que significa |
|---|---|
| `{fora.length > 0 && (...)}` | Só mostra o aviso se tiver alguma nota fora. Você já viu esse `&&` na luz piloto do `<Alternador>`. |
| `{' '}` | **Um espaço de verdade.** O JSX joga fora os espaços no fim de uma linha quando o próximo elemento está na linha de baixo. Sem isso, sairia `fora da escala:C# (3)`, tudo grudado. É feio, mas é o jeito padrão. |
| `<b>` | Negrito ("bold"). Aqui com `text-foreground` para a nota se destacar do texto apagado. |

E, por último, o braço:

```tsx
            <div className="overflow-x-auto rounded-xl border bg-card p-4">
                <Fretboard tonica={tonica} notas={notas} mostrar={mostrar} destaque={[...regiao, ...desenhos.flat()]} desenhos={desenhos} />
            </div>
```

O `destaque` recebe a região **e** o acorde. `[...a, ...b]` junta dois arrays num novo, como `a.Concat(b)` no C#. Se o acorde ficasse de fora, o C# (que não está na `regiao`, porque não está na escala) apareceria apagado.

E a **legenda**, para ninguém precisar adivinhar o que cada bolinha quer dizer:

```tsx
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                    <span className="size-3.5 rounded-full bg-primary" /> Tônica do acorde
                </span>
                <span className="flex items-center gap-2">
                    <span className="size-3.5 rounded-full bg-foreground" /> Nota do acorde
                </span>
                <span className="flex items-center gap-2">
                    <span className="size-3 rounded-full border-2 border-cat-escalas opacity-60" /> Resto da escala
                </span>
                <span className="flex items-center gap-2">
                    <span className="h-3.5 w-6 rounded bg-primary/10" /> Região da forma
                </span>
            </div>
        </section>
    )
}
```

| Código | O que significa |
|---|---|
| `<span className="size-3.5 rounded-full bg-primary" />` | Uma bolinha feita só de CSS: um `span` vazio com tamanho (`size-3.5` = 14px de largura e altura), cantos 100% redondos (`rounded-full`) e cor de fundo. Ele termina em `/>` porque não tem nada dentro. |
| `border-2 border-cat-escalas` | Para o "resto da escala": só a borda, igual ao contorno do braço. |
| `bg-primary/10` | O `/10` é a **opacidade** no Tailwind: âmbar com 10%, a mesma da faixa. Funciona com qualquer token de cor. |
| `gap-x-6 gap-y-2` | Espaço de 24px entre os itens lado a lado e de 8px entre as linhas, quando a legenda quebra no celular. |

As cores da legenda são **os mesmos tokens** do braço (`primary`, `foreground`, `cat-escalas`). Se um dia o tema mudar, os dois mudam juntos.

### Passo 5.2 — O terceiro modo no Braço

Em `web/src/pages/Braco.tsx`:

1. Importe a página, embaixo do import de `Acordes`:
   ```tsx
   import { EscalaNoAcorde } from './EscalaNoAcorde'
   ```
2. No `MODOS`, acrescente a 3ª opção:
   ```tsx
       { valor: 'caged', rotulo: 'Escala + acorde' },
   ```
3. Troque a linha do ternário (a que você editou no Passo 4.1) por:
   ```tsx
               {modo === 'escalas' && <Escalas opcoes={opcoes} mudar={mudar} />}
               {modo === 'acordes' && <Acordes opcoes={opcoes} mudar={mudar} />}
               {modo === 'caged' && <EscalaNoAcorde opcoes={opcoes} mudar={mudar} />}
   ```

Com dois modos, o ternário servia ("um **ou** outro"). Com três, um ternário encadeado ficaria ilegível. Três `&&` se leem como três `if`, e só um é verdadeiro de cada vez. Repare que o `type Modo` atualizou sozinho: ele é tirado do `MODOS`. Se você escrever `modo === 'cagde'`, o TypeScript avisa que esse modo não existe.

**✅ O que você deve ver:** no Braço, o alternador agora tem **Escalas · Acordes · Escala + acorde**. No terceiro:

- **Começa em Am7 sobre Pentatônica menor, forma E:** a faixa âmbar das casas 4 a 8, o Am7 cheio com a linha ligando o desenho, e o resto da penta menor e mais apagado em volta. Não aparece aviso: toda nota do Am7 está na penta menor.
- **Troque para Blues e acorde 7, com Graus:** agora é o A7. A forma de E mostra `1 5 b7 3 5 1` em bolinhas claras (os `1` em âmbar), e em volta aparece o resto do blues (b3, 4, b5). Ao lado do título: **fora da escala: C# (3)**. O Lá da corda Ré na casa 7 aparece só com o contorno âmbar: é tônica, mas não está no desenho.
- **Clique nas formas C, A, G, E e D:** a faixa anda pelo braço, sempre "abraçando" o acorde, e a linha mostra o formato de cada forma.
- **Todas:** a faixa some e ficam as 5 linhas, uma do lado da outra. É o mapa completo que o guitarrista de blues tem na cabeça: repare como cada forma **divide notas** com a vizinha.
- **Volte para Escalas:** ela está em **Blues** de Lá, a mesma escala. E Acordes está em **A7**.

---

## Resumo

| Conceito | C# | TypeScript |
|---|---|---|
| Constante compartilhada | `static class` de domínio | `export const` num módulo de `theory/` |
| Travar um valor | `Math.Max(0, x)` | `Math.max(0, x)` |
| Tupla | `(int, int)` | `[number, number]` |
| Achatar lista de listas | `SelectMany(x => x)` | `.flat()` |
| Camadas no SVG | (não tem) | quem vem **depois** fica por cima |
| Opacidade de um token | (não tem) | `bg-primary/10` |
| `for` | `for (int i = 0; ...)` | `for (let i = 0; ...)` |
| Ordenar no lugar | `lista.Sort()` | `array.sort()`, **muda o original** |
| Filtrar | `.Where(x => ...)` | `.filter((x) => ...)` |
| Estado compartilhado | O `Form` guarda e passa para os `UserControl` | **Subir o estado** para o pai e passar por props |
| Copiar mudando campos | `atual with { Tonica = "E" }` | `{ ...atual, tonica: 'E' }` |
| Só alguns campos | (não tem) | `Partial<T>` |
| Delegate sem retorno | `Action<T>` | `(x: T) => void` |
| Desestruturar renomeando | `var (raiz, _) = ...` | `const { tonica: raiz } = obj` |
| Juntar listas | `a.Concat(b)` | `[...a, ...b]` |
| Espaço no JSX | (não tem) | `{' '}` |

Na 18c, a backing track vai chamar `aoRedor(voicing(acordeAtual...), escala)` a cada compasso, escolhendo a forma que cai **mais perto** da região em que você está.

---

## Exercícios

**1.** Quando você troca a escala, faça o acorde mudar sozinho para o "par natural" dela: penta menor, menor e dórico → `m7`; blues e mixolídio → `dom7`; maior e lídio → `maj7`; penta maior → `maior`. Dica: um `Record<NomeEscala, TipoAcorde>`, e no `onChange` da escala mude a escala **e** o tipo no mesmo `mudar`.

<details><summary>Gabarito</summary>

No `EscalaNoAcorde.tsx`, acima do `NOMES_ESCALA`:

```tsx
const ACORDE_DA_ESCALA = {
    maior: 'maj7',
    menor: 'm7',
    pentaMenor: 'm7',
    pentaMaior: 'maior',
    blues: 'dom7',
    dorico: 'm7',
    mixolidio: 'dom7',
    lidio: 'maj7',
} satisfies Record<NomeEscala, TipoAcorde>
```

E no `select` da escala:

```tsx
                        onChange={(e) => {
                            const nova = e.target.value as NomeEscala
                            mudar({ escala: nova, posicao: null, tipo: ACORDE_DA_ESCALA[nova] })
                        }}
```

A variável `nova` existe porque a escala nova é usada **duas vezes**. Cuidado para não usar `ACORDE_DA_ESCALA[escala]`: o `escala` ainda é o valor **antigo**, porque o novo só chega no próximo render (aula 03). O `satisfies Record` cobra uma escala nova: se você criar o frígio, o TypeScript reclama aqui também.

Como o tipo é compartilhado, ele também muda na página Acordes: escolha Blues aqui e o Acordes passa a mostrar o 7.
</details>

**2.** *(No braço, sem código.)* Com **A7 sobre Blues** e **Graus**, ande pelas 5 formas e anote em que corda e casa cai o **3** (C#) em cada uma. Depois tente tocar a penta menor em cada região, terminando a frase no 3.

<details><summary>Gabarito</summary>

| Forma | Onde está o 3 (C#) |
|---|---|
| C (casa 9–12) | Mi aguda casa 9, Ré casa 11 |
| A (aberta) | Si casa 2 |
| G (casa 2–5) | Si casa 2, Lá casa 4 |
| E (casa 5–7) | Sol casa 6 |
| D (casa 7–9) | Mi aguda casa 9 |

Na forma de E, o 3 fica **meio tom acima** do b3 da penta (Sol casa 5 → casa 6). É o famoso "bend de meio tom do b3 para o 3" do blues: você sai da penta menor e cai na nota do acorde.
</details>

**3.** *(Previsão, depois confira.)* Sem olhar o app, responda: quais notas do **C7M** ficam fora da **pentatônica maior de Dó**? E do **Am7** sobre a **pentatônica menor de Lá**?

<details><summary>Gabarito</summary>

- **C7M** = C E G **B**. A penta maior de Dó é C D E G A, sem a 7. Fora: **B (7)**. As pentatônicas não têm 7 maior nem 4, e é por isso que elas "não erram": elas tiram justamente as notas que brigam com os acordes.
- **Am7** = A C E G, e tudo está na penta menor (A C D E G). Nada fica fora, e o aviso some. A penta menor **é** o Am7 com um 4 (D) a mais.
</details>
