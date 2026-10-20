# Aula 03b — Metrônomo (parte 2): subdivisões, som, tap e speed trainer

> 💡 Abra com **`Ctrl+Shift+V`**. Deixe rodando: `npm run dev --prefix web` e o navegador em http://localhost:5173/metronomo. **Ligue o som.**

O metrônomo da aula 03 já é preciso. Agora ele ganha os recursos que fazem diferença no treino:

1. **Subdivisões**: ouvir colcheias, tercinas e semicolcheias entre os tempos.
2. **Som configurável**: timbre, volume e acento liga/desliga.
3. **Tap tempo**: bater no botão para descobrir o BPM de uma música.
4. **Speed trainer**: o BPM sobe sozinho a cada N compassos, até um teto.

**Conceitos novos:** juntar vários refs num só, `children` (componente que embrulha outro conteúdo), funções passadas como props, `type` de objeto, o operador **spread** `...` (o `with` do C#), `filter` e `slice` em listas, checkbox e campo numérico.

**Fica para as aulas 03c e 03d:** sons gravados e visual de painel (o drone e o painel flutuante vêm depois).

---

## Parte 1 — Arrumar a casa antes de crescer

O hook vai ganhar 5 configurações novas. Hoje, cada configuração que o agendador lê precisa de um ref próprio (`bpmRef`, `temposRef`...). Com 7 configurações, seriam 7 refs e 7 `useEffect`. Vamos trocar tudo por **um ref só**, com um objeto dentro.

### Passo 1.1 — Um ref para todas as configurações

No `web/src/hooks/useMetronome.ts`, **apague** estas 4 linhas:

```ts
const bpmRef = useRef(bpm)
const temposRef = useRef(tempos)

useEffect(() => { bpmRef.current = bpm }, [bpm])
useEffect(() => { temposRef.current = tempos }, [tempos])
```

e coloque no lugar:

```ts
const config = useRef({ bpm, tempos })

useEffect(() => {
  config.current = { bpm, tempos }
})
```

| Código | O que significa |
|---|---|
| `useRef({ bpm, tempos })` | A caixa agora guarda um **objeto** com as duas configurações. |
| `useEffect(() => { ... })` **sem** a lista `[...]` no fim | Novidade: sem a lista de dependências, o efeito roda **depois de toda** vez que a tela é desenhada. Assim a caixa sempre tem os valores atuais, sem precisar listar cada um. |

Agora, dentro do agendador, troque `bpmRef.current` por `config.current.bpm` e `temposRef.current` por `config.current.tempos`.

### Passo 1.2 — O limite de BPM vai para o hook

A regra "BPM entre 30 e 300" está na página, mas o tap tempo e o speed trainer também vão mudar o BPM. A regra precisa ficar num lugar só: **no hook**.

1. No `Metronomo.tsx`, **recorte** (`Ctrl+X`) a função `mudarBpm` inteira.
2. Cole no `useMetronome.ts`, logo **depois** do `useEffect` que você acabou de criar, e acrescente um `Math.round`:
   ```ts
   function mudarBpm(valor: number) {
     setBpm(Math.min(300, Math.max(30, Math.round(valor))))
   }
   ```
   O `Math.round` arredonda (`Math.Round` do C#). O tap tempo vai calcular BPMs quebrados como 119,7.
3. No `return` do hook, troque `setBpm` por `mudarBpm`.

### Passo 1.3 — Guardar o hook inteiro em `m`

O hook vai devolver quase 20 coisas. Desestruturar tudo numa linha fica ilegível. No `Metronomo.tsx`, troque a linha da desestruturação por:

```tsx
const m = useMetronome()
const { tocando, setTocando } = m
```

- `m` guarda o objeto inteiro. Você usa `m.bpm`, `m.tempos`, `m.mudarBpm(...)`, como as propriedades de um objeto C#.
- A segunda linha continua desestruturando só `tocando` e `setTocando`, porque o atalho da barra de espaço usa os dois.

Agora troque, no JSX, cada `bpm` por `m.bpm`, `tempos` por `m.tempos`, `tempoAtual` por `m.tempoAtual`, `setTempos` por `m.setTempos` e `mudarBpm` por `m.mudarBpm`.

> 💡 O VS Code ajuda: ele sublinha em vermelho cada nome que não existe mais. Siga os sublinhados.

**✅ O que você deve ver:** **nada mudou**, e isso é o objetivo. Toque o metrônomo, mude o BPM tocando, troque o compasso: tudo funciona como antes. Arrumar o código sem mudar o comportamento se chama **refatorar**.

---

## Parte 2 — Componentes que embrulham: `children`

A página vai ganhar várias linhas de ajuste ("Compasso", "Subdivisão", "Som"...), todas com o mesmo formato: um rótulo à esquerda e botões à direita. Vamos criar dois componentes pequenos para isso.

### Conceito novo: `children`

Até agora, você passou dados para componentes por props com nome: `<PaginaEmBreve title="..." />`. Mas um componente também pode **embrulhar** outro conteúdo, como uma tag HTML:

```tsx
<Ajuste rotulo="Compasso">
  <button>2/4</button>
  <button>3/4</button>
</Ajuste>
```

O que está **entre** `<Ajuste>` e `</Ajuste>` chega no componente numa prop especial chamada **`children`** (filhos). O componente decide onde colocar esse conteúdo. É como um **layout** do Razor no ASP.NET, com o `@RenderBody()`.

### Passo 2.1 — Os componentes `Ajuste` e `Escolha`

No **final** do `Metronomo.tsx` (depois do `}` que fecha a função `Metronomo`), adicione:

```tsx
function Ajuste({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-28 shrink-0 text-sm text-muted-foreground">{rotulo}</span>
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
  )
}

function Escolha({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ativo}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
        ativo ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
```

E no topo, troque o import do React por:

```tsx
import { useEffect, type ReactNode } from 'react'
```

| Código | O que significa |
|---|---|
| `function Ajuste(...)` sem `export` | Componentes **privados** deste arquivo. Só a página do metrônomo usa. |
| `{ rotulo: string; children: ReactNode }` | O tipo das props escrito direto, sem criar um `type Props` separado. Serve para componentes pequenos. |
| `ReactNode` | O tipo "qualquer coisa que o React sabe desenhar": texto, número, tags, outros componentes. |
| `onClick: () => void` | Uma prop que recebe uma **função** sem parâmetros e sem retorno. É o `Action` do C#. Quem usa o `Escolha` decide o que acontece no clique. |
| `aria-pressed={ativo}` | Avisa aos leitores de tela que este botão está "apertado" (selecionado). |
| `sm:flex-row` | No celular, o rótulo fica **em cima** dos botões. A partir de telas pequenas (`sm:` = 640px), fica **ao lado**. |
| `w-28 shrink-0` | O rótulo tem largura fixa (112px), para todos os botões das linhas começarem alinhados. |
| `flex-wrap` | Se os botões não couberem numa linha, eles **quebram** para a de baixo, em vez de vazar da tela. |

### Passo 2.2 — Um painel de ajustes

1. O botão **Começar** ficou dentro da linha do BPM, ao lado do **+**. Recorte o `<button>` dele inteiro e cole logo **antes** do `</div>` que fecha o painel principal (o da `bg-card`), depois do slider.
2. Recorte o `<div className="flex gap-2">` dos compassos inteiro (até o `</div>` dele). Ele vai para um painel novo.
3. Logo **depois** do `</div>` que fecha o painel principal e **antes** do `</section>`, cole este painel novo:
   ```tsx
      <div className="flex flex-col gap-5 rounded-lg border bg-card p-6">
        <Ajuste rotulo="Compasso">
          {COMPASSOS.map((n) => (
            <Escolha key={n} ativo={m.tempos === n} onClick={() => m.setTempos(n)}>
              {n}/4
            </Escolha>
          ))}
        </Ajuste>
      </div>
   ```

Compare com o código antigo dos compassos: toda a parte do `className` com `?:` sumiu daqui e foi para dentro do `Escolha`. Vamos reaproveitar esse componente em mais 2 linhas.

**✅ O que você deve ver:** o painel principal com luzes, BPM, slider e botão Começar, e embaixo um segundo painel com "Compasso" à esquerda e os botões à direita.

---

## Parte 3 — Subdivisões

### O conceito musical

Subdividir é ouvir clicks **entre** os tempos. Em 4/4 com colcheias, você ouve 2 clicks por tempo ("1 e 2 e 3 e 4 e"). Com tercinas, 3 ("1 e a 2 e a..."). É essencial para treinar palhetada alternada e ritmo.

### A matemática

Até agora, o agendador contava **tempos**. Agora ele vai contar **passos**: cada click, inclusive os do meio.

| | Semínima (1) | Colcheia (2) | Tercina (3) |
|---|---|---|---|
| Clicks por tempo | 1 | 2 | 3 |
| Passos num compasso 4/4 | 4 | 8 | 12 |
| Intervalo a 100 BPM | 0,6 s | 0,3 s | 0,2 s |

Para cada passo:
- `passo % subdivisao === 0` → o passo cai **num tempo**: click normal (ou acento, se for o primeiro).
- Senão → é um click **do meio**: mais baixo e mais grave.
- Qual tempo? `Math.floor(passo / subdivisao)`. Por exemplo, com tercinas, o passo 7 está no tempo `floor(7 / 3) = 2`. O `Math.floor` arredonda para baixo, como o `Math.Floor` do C#.

### Passo 3.1 — O estado da subdivisão

No `useMetronome.ts`:

1. Logo abaixo do `useState` de `tempos`, adicione:
   ```ts
   const [subdivisao, setSubdivisao] = useState(1)
   ```
2. Coloque `subdivisao` nos **dois** objetos do `config`:
   ```ts
   const config = useRef({ bpm, tempos, subdivisao })

   useEffect(() => {
     config.current = { bpm, tempos, subdivisao }
   })
   ```
3. No `return`, adicione `subdivisao, setSubdivisao`.

### Passo 3.2 — O agendador conta passos

Dentro do `useEffect` do agendador:

1. Troque `let tempo = 0` por:
   ```ts
   let passo = 0          // conta cada click, inclusive as subdivisões
   ```
2. Troque **todo o conteúdo** do `while (...) { ... }` por:
   ```ts
        const c = config.current
        const ehTempo = passo % c.subdivisao === 0
        const tempo = Math.floor(passo / c.subdivisao)

        const frequencia = !ehTempo ? 600 : tempo === 0 ? 1200 : 800
        tocarClique(ctx, proximoClique, frequencia, ehTempo ? 0.6 : 0.3)

        if (ehTempo) {
          const atraso = (proximoClique - ctx.currentTime) * 1000
          timeouts.push(setTimeout(() => setTempoAtual(tempo), atraso))
        }

        proximoClique += 60 / c.bpm / c.subdivisao
        passo = (passo + 1) % (c.tempos * c.subdivisao)
   ```
3. E troque a função `tocarClique` inteira por esta versão, que recebe a frequência e o volume de fora:
   ```ts
   function tocarClique(ctx: AudioContext, quando: number, frequencia: number, volume: number) {
     const osc = ctx.createOscillator()
     const ganho = ctx.createGain()

     osc.frequency.value = frequencia
     ganho.gain.setValueAtTime(volume, quando)
     ganho.gain.exponentialRampToValueAtTime(0.001, quando + 0.05)

     osc.connect(ganho).connect(ctx.destination)
     osc.start(quando)
     osc.stop(quando + 0.05)
   }
   ```

| Código | O que significa |
|---|---|
| `const c = config.current` | Um apelido curto, para não escrever `config.current` cinco vezes. |
| `!ehTempo ? 600 : tempo === 0 ? 1200 : 800` | Click do meio: 600 Hz (mais grave). Tempo 1: 1200 Hz. Outros tempos: 800 Hz. |
| `ehTempo ? 0.6 : 0.3` | Os clicks do meio saem com **metade do volume**, para não confundir com os tempos. |
| `if (ehTempo)` | As luzes só acendem **nos tempos**. Uma luz piscando em cada semicolcheia seria rápida demais para o olho. |
| `const tempo = ...` dentro do `while` | Como ela é criada **de novo a cada volta**, cada `setTimeout` guarda a sua própria "foto". Por isso não precisamos mais do `esteTempo` da aula 03. |
| `60 / c.bpm / c.subdivisao` | O intervalo entre **passos**: o intervalo do tempo dividido pela subdivisão. |
| `% (c.tempos * c.subdivisao)` | O compasso agora tem `tempos × subdivisão` passos. |

### Passo 3.3 — A linha de subdivisão na tela

No `Metronomo.tsx`:

1. Abaixo do `const COMPASSOS`, adicione:
   ```tsx
   const SUBDIVISOES = [
     { valor: 1, nome: 'Semínima' },
     { valor: 2, nome: 'Colcheia' },
     { valor: 3, nome: 'Tercina' },
     { valor: 4, nome: 'Semicolcheia' },
   ]
   ```
2. No painel de ajustes, logo **depois** do `</Ajuste>` do compasso, adicione:
   ```tsx
        <Ajuste rotulo="Subdivisão">
          {SUBDIVISOES.map((s) => (
            <Escolha key={s.valor} ativo={m.subdivisao === s.valor} onClick={() => m.setSubdivisao(s.valor)}>
              {s.nome}
            </Escolha>
          ))}
        </Ajuste>
   ```

**✅ O que você deve ouvir:** com **Colcheia**: "TIC tic TIC tic", com o click do meio mais baixo. Com **Tercina**: três clicks por tempo, como um galope. As luzes continuam acendendo só nos tempos.

---

## Parte 4 — Som configurável

### Conceito novo: `type` de um objeto

Cada som tem 6 informações: nome, tipo de onda, 3 frequências e duração. Em vez de soltar números pelo código, vamos descrever o "formato" de um som com um `type`. É o equivalente a um `record` do C#:

```ts
export type Som = {
  nome: string
  onda: OscillatorType
  ...
}
```

`OscillatorType` é um tipo que já vem com o navegador. Ele aceita só `'sine'` (onda suave), `'triangle'` (um pouco mais "seca"), `'square'` (áspera, metálica) e `'sawtooth'` (serrote, bem brilhante). Se você digitar `'quadrado'`, o TypeScript reclama na hora, como um `enum`.

### Passo 4.1 — Os sons, como dados

No `useMetronome.ts`, logo **abaixo** das duas constantes (`INTERVALO_MS` e `JANELA_S`), adicione:

```ts
export type Som = {
  nome: string
  onda: OscillatorType
  acento: number     // frequência (Hz) do tempo 1
  tempo: number      // frequência dos outros tempos
  sub: number        // frequência das subdivisões
  duracao: number    // segundos
}

export const SONS: Som[] = [
  { nome: 'Eletrônico', onda: 'sine', acento: 1500, tempo: 1000, sub: 700, duracao: 0.05 },
  { nome: 'Madeira', onda: 'triangle', acento: 1200, tempo: 800, sub: 600, duracao: 0.03 },
  { nome: 'Cowbell', onda: 'square', acento: 800, tempo: 560, sub: 420, duracao: 0.08 },
]
```

- `Som[]` = "uma lista de Som", como `Som[]` ou `List<Som>` em C#.
- `export` nos dois: a página vai usar `SONS` para desenhar os botões.

Repare: **um som novo é só uma linha de dados**. Nenhum `if` muda.

### Passo 4.2 — Som, volume e acento no estado

1. Abaixo do `useState` da `subdivisao`, adicione:
   ```ts
   const [som, setSom] = useState(SONS[0])
   const [volume, setVolume] = useState(0.6)
   const [acento, setAcento] = useState(true)
   ```
   `SONS[0]` é o primeiro da lista (o Eletrônico). Índices começam em 0, como em C#.
2. Coloque os três nos **dois** objetos do `config`:
   ```ts
   { bpm, tempos, subdivisao, som, volume, acento }
   ```
3. No `return`, adicione `som, setSom, volume, setVolume, acento, setAcento`.

### Passo 4.3 — O agendador usa o som escolhido

No `while`, troque as duas linhas da `frequencia` e do `tocarClique` por:

```ts
        const frequencia = !ehTempo ? c.som.sub : tempo === 0 && c.acento ? c.som.acento : c.som.tempo
        tocarClique(ctx, proximoClique, c.som, frequencia, ehTempo ? c.volume : c.volume * 0.5)
```

- `tempo === 0 && c.acento`: o tempo 1 só soa diferente **se** o acento estiver ligado. O `&&` é o "e" (igual ao C#).

E atualize a `tocarClique` para usar a onda e a duração do som:

```ts
function tocarClique(ctx: AudioContext, quando: number, som: Som, frequencia: number, volume: number) {
  const osc = ctx.createOscillator()
  const ganho = ctx.createGain()

  osc.type = som.onda
  osc.frequency.value = frequencia
  ganho.gain.setValueAtTime(volume, quando)
  ganho.gain.exponentialRampToValueAtTime(0.001, quando + som.duracao)

  osc.connect(ganho).connect(ctx.destination)
  osc.start(quando)
  osc.stop(quando + som.duracao)
}
```

### Passo 4.4 — As linhas na tela

No `Metronomo.tsx`:

1. Troque o import do hook por:
   ```tsx
   import { SONS, useMetronome } from '@/hooks/useMetronome'
   ```
2. No painel de ajustes, depois da linha de subdivisão, adicione:
   ```tsx
        <Ajuste rotulo="Som">
          {SONS.map((s) => (
            <Escolha key={s.nome} ativo={m.som === s} onClick={() => m.setSom(s)}>
              {s.nome}
            </Escolha>
          ))}
        </Ajuste>
        <Ajuste rotulo="Volume">
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={m.volume}
            onChange={(e) => m.setVolume(Number(e.target.value))}
            aria-label="Volume"
            className="w-40 accent-primary"
          />
        </Ajuste>
        <Ajuste rotulo="Acento no 1">
          <input
            type="checkbox"
            checked={m.acento}
            onChange={(e) => m.setAcento(e.target.checked)}
            aria-label="Acento no 1"
            className="size-4 accent-primary"
          />
        </Ajuste>
   ```

| Código | O que significa |
|---|---|
| `m.som === s` | Compara **objetos**. Como em C# com classes, o `===` compara a **referência**: é verdadeiro só se for **o mesmo objeto** da lista. Funciona porque o estado guarda exatamente o item que você clicou. |
| `step={0.05}` | O slider anda de 5 em 5%. O mínimo é 0.05 porque o "tic" usa uma rampa exponencial, que não funciona partindo de zero. |
| `type="checkbox"` | Uma caixinha de marcar, nativa do navegador. |
| `checked` / `e.target.checked` | No checkbox, o valor não é `value`, e sim `checked` (verdadeiro ou falso). |

**✅ O que você deve ouvir:** troque entre Eletrônico, Madeira e Cowbell **com o metrônomo tocando**: o som muda no próximo click. Baixe o volume. Desmarque "Acento no 1": todos os tempos soam iguais.

---

## Parte 5 — Tap tempo

Você está ouvindo uma música e quer saber o BPM: bate no botão **Tap** junto com o tempo, 4 ou 5 vezes, e o metrônomo calcula.

### A ideia

Guardamos o **horário** de cada toque. O BPM sai do intervalo médio entre eles: se você bate a cada 500 ms, são `60000 / 500 = 120` BPM (60 000 é a quantidade de milissegundos num minuto).

Dois cuidados:
- Toques **velhos** (mais de 2,5 s atrás) são de uma tentativa anterior: jogamos fora.
- Usamos só os **últimos 5** toques, para o cálculo acompanhar se você mudar o andamento.

### Conceitos novos: `filter`, `slice` e spread em listas

| JavaScript | C# (LINQ) | O que faz |
|---|---|---|
| `lista.filter((t) => t > 5)` | `lista.Where(t => t > 5)` | Mantém só os itens que passam no teste. |
| `lista.slice(-5)` | `lista.TakeLast(5)` | Pega os últimos 5. |
| `[...lista, novo]` | `lista.Append(novo)` | Cria uma lista **nova** com tudo da antiga e mais um item. Os `...` (**spread**) "espalham" os itens da lista antiga. |

### Passo 5.1 — A função `tap` no hook

No `useMetronome.ts`:

1. Abaixo do `const config = useRef(...)`, adicione:
   ```ts
   const toques = useRef<number[]>([])
   ```
   Um ref, porque guardar os toques **não** precisa redesenhar a tela.
2. Logo **depois** da função `mudarBpm`, adicione:
   ```ts
   function tap() {
     const agora = performance.now()
     toques.current = [...toques.current.filter((t) => agora - t < 2500), agora].slice(-5)

     const t = toques.current
     if (t.length >= 2) {
       const intervaloMedio = (t[t.length - 1] - t[0]) / (t.length - 1)
       mudarBpm(60000 / intervaloMedio)
     }
   }
   ```
3. No `return`, adicione `tap`.

| Código | O que significa |
|---|---|
| `performance.now()` | O horário atual em milissegundos, bem preciso. Como um `Stopwatch` do C#. |
| `toques.current.filter((t) => agora - t < 2500)` | Joga fora os toques de mais de 2,5 s atrás. |
| `[..., agora]` | Acrescenta o toque de agora. |
| `.slice(-5)` | Fica só com os últimos 5. |
| `t[t.length - 1] - t[0]` | O tempo entre o **primeiro** e o **último** toque. |
| `/ (t.length - 1)` | Dividido pelo número de **intervalos**. 5 toques têm 4 intervalos, como 5 postes de cerca têm 4 vãos. |
| `if (t.length >= 2)` | Com um toque só não existe intervalo, então não dá para calcular. |

### Passo 5.2 — O botão Tap

No `Metronomo.tsx`, **envolva** o botão Começar numa `div` com o botão Tap ao lado:

```tsx
        <div className="flex gap-3">
          <button
            onClick={m.tap}
            className="rounded-md border px-6 py-3 font-semibold text-muted-foreground hover:text-foreground"
          >
            Tap
          </button>
          {/* aqui fica o seu <button> Começar/Parar, sem mudança */}
        </div>
```

Repare em `onClick={m.tap}`, **sem** `() =>`. Você está passando a **própria função** `tap`, para ser chamada no clique. É a mesma coisa que `onClick={() => m.tap()}`, só que mais curto. Só funciona quando a função não precisa de argumentos.

**✅ O que você deve ver:** bata no **Tap** 4 vezes, num ritmo constante. O BPM aparece. Bata mais rápido: o número sobe. Espere 3 segundos e bata de novo: começa uma medição nova.

---

## Parte 6 — Speed trainer

Para ganhar velocidade, você toca o exercício num BPM confortável e vai subindo aos poucos. O speed trainer faz isso sozinho: "subir **5** BPM a cada **4** compassos, até **160**".

### Conceito novo: spread em objetos (o `with` do C#)

As 4 configurações do speed trainer andam juntas, então vamos guardá-las num **objeto** só, dentro de um `useState`. Mas existe uma regra do React: **nunca altere o objeto do estado direto**. Isto aqui **não** funciona:

```ts
trainer.aumento = 10       // ❌ o React não percebe a mudança
```

O certo é criar um **objeto novo**, copiando o antigo e trocando só um campo:

```ts
setTrainer({ ...trainer, aumento: 10 })   // ✅
```

Os `...trainer` espalham todos os campos do objeto antigo, e `aumento: 10` sobrescreve só esse. É **exatamente** o `with` dos records do C#:

```csharp
trainer = trainer with { Aumento = 10 };
```

### Passo 6.1 — O estado do trainer

No `useMetronome.ts`:

1. Abaixo do `type Som` e da lista `SONS`, adicione:
   ```ts
   export type SpeedTrainer = {
     ativo: boolean
     aumento: number    // quantos BPM sobe
     aCada: number      // a cada quantos compassos
     teto: number       // até onde vai
   }
   ```
2. Abaixo do `useState` do `acento`, adicione:
   ```ts
   const [trainer, setTrainer] = useState<SpeedTrainer>({ ativo: false, aumento: 5, aCada: 4, teto: 160 })
   ```
   O `<SpeedTrainer>` diz ao `useState` qual é o tipo do valor.
3. Coloque `trainer` nos **dois** objetos do `config`, e `trainer, setTrainer` no `return`.

### Passo 6.2 — Subir o BPM no fim de cada compasso

No agendador:

1. Abaixo do `let passo = 0`, adicione:
   ```ts
   let compassos = 0
   ```
2. No **final** do `while` (depois da linha `passo = ...`), adicione:
   ```ts
        if (passo === 0) {
          compassos++
          const t = c.trainer
          if (t.ativo && compassos % t.aCada === 0 && c.bpm < t.teto) {
            c.bpm = Math.min(t.teto, c.bpm + t.aumento)
            setBpm(c.bpm)
          }
        }
   ```

| Código | O que significa |
|---|---|
| `if (passo === 0)` | O `passo` acabou de voltar a 0, ou seja, **terminou um compasso**. |
| `compassos++` | Soma 1, como no C#. |
| `compassos % t.aCada === 0` | A cada `aCada` compassos (4, 8, 12...). |
| `c.bpm < t.teto` | Só sobe se ainda não chegou no teto. |
| `c.bpm = ...` | Atualiza a caixa **na hora**, para o próximo click já sair no BPM novo. |
| `setBpm(c.bpm)` | E atualiza o estado, para o **número na tela** mudar. |

### Passo 6.3 — O painel do speed trainer

No `Metronomo.tsx`:

1. No final do arquivo, adicione um terceiro componente pequeno, para os campos numéricos:
   ```tsx
   function Numero({ rotulo, valor, onChange }: { rotulo: string; valor: number; onChange: (v: number) => void }) {
     return (
       <input
         type="number"
         min={1}
         value={valor}
         onChange={(e) => onChange(Number(e.target.value))}
         aria-label={rotulo}
         className="w-16 rounded-md border bg-background px-2 py-1 text-center text-foreground tabular-nums"
       />
     )
   }
   ```
   `onChange: (v: number) => void` é uma prop que recebe uma função com **um parâmetro** número. É o `Action<int>` do C#.

2. Logo **depois** do `</div>` que fecha o painel de ajustes e **antes** do `</section>`, adicione:
   ```tsx
      <div className="flex flex-col gap-5 rounded-lg border bg-card p-6">
        <label className="flex items-center gap-3 font-medium">
          <input
            type="checkbox"
            checked={m.trainer.ativo}
            onChange={(e) => m.setTrainer({ ...m.trainer, ativo: e.target.checked })}
            className="size-4 accent-primary"
          />
          Speed trainer
        </label>
        <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
          Subir
          <Numero rotulo="BPM a subir" valor={m.trainer.aumento} onChange={(v) => m.setTrainer({ ...m.trainer, aumento: v })} />
          BPM a cada
          <Numero rotulo="Compassos" valor={m.trainer.aCada} onChange={(v) => m.setTrainer({ ...m.trainer, aCada: v })} />
          compassos, até
          <Numero rotulo="BPM máximo" valor={m.trainer.teto} onChange={(v) => m.setTrainer({ ...m.trainer, teto: v })} />
          BPM.
        </p>
      </div>
   ```

| Código | O que significa |
|---|---|
| `<label>` envolvendo o checkbox | Ligação automática: clicar no **texto** "Speed trainer" também marca a caixinha. E o leitor de tela lê o texto como nome do checkbox. |
| `{ ...m.trainer, ativo: e.target.checked }` | Objeto novo com tudo igual, menos o `ativo`. |
| A frase com campos no meio | Em vez de 3 campos soltos com rótulos, a configuração vira uma **frase legível**: "Subir 5 BPM a cada 4 compassos, até 160 BPM." |

**✅ O que você deve ver e ouvir:** coloque o BPM em 100, marque **Speed trainer** com "subir 5 a cada 1 compasso, até 120" e comece. A cada compasso, o número sobe 5 (105, 110, 115, 120) e para no teto. O som acelera junto, sem tropeçar.

---

## 🏋️ Exercícios

### Exercício 1 — Um som novo 🔔
Adicione um som chamado **Agudo**, com onda `'sine'`, acento 2500 Hz, tempo 2000, sub 1500 e duração 0.02.

<details><summary>Resposta</summary>

No `useMetronome.ts`, uma linha a mais na lista `SONS`:
```ts
{ nome: 'Agudo', onda: 'sine', acento: 2500, tempo: 2000, sub: 1500, duracao: 0.02 },
```
O botão aparece sozinho no painel. Nenhuma outra linha muda: essa é a vantagem de guardar o som como **dado**.

</details>

### Exercício 2 — Tap pelo teclado ⌨️
Faça a tecla **T** funcionar como o botão Tap.

<details><summary>Dica</summary>

Você já tem um `useEffect` que escuta o teclado (o da barra de espaço). A tecla T tem `e.code === 'KeyT'`. Não esqueça de colocar `m.tap` na lista de dependências.

</details>

<details><summary>Resposta</summary>

Dentro da função `aoTeclar`, depois do `if` do espaço:
```tsx
if (e.code === 'KeyT') m.tap()
```
e a lista de dependências fica `[tocando, setTocando, m.tap]`.

</details>

### Exercício 3 — Pergunta rápida 🤔
No speed trainer, por que escrevemos `setTrainer({ ...m.trainer, aumento: v })` e não `m.trainer.aumento = v`?

<details><summary>Resposta</summary>

Porque o React só redesenha a tela quando você chama o `set...` com um valor **novo**. Se você mudar o objeto por dentro, ele continua sendo o mesmo objeto (a mesma referência), o React não percebe, e a tela não atualiza. O spread cria um objeto **novo**, como o `with` do C#.

</details>

### Exercício 4 — Pergunta rápida 🤔
Por que as luzes não acendem nos clicks das subdivisões?

<details><summary>Resposta</summary>

Por causa do `if (ehTempo)` em volta do `setTimeout` das luzes. Só os clicks que caem num tempo acendem uma luz. Em semicolcheias a 200 BPM seriam 13 piscadas por segundo, rápido demais para o olho acompanhar.

</details>

---

## 📖 Glossário novo

| Termo | Significado |
|---|---|
| **Refatorar** | Reorganizar o código sem mudar o que ele faz. |
| **`children`** | O conteúdo colocado entre a abertura e o fechamento de um componente. Como o `@RenderBody()` do Razor. |
| **`ReactNode`** | O tipo "qualquer coisa que o React desenha". |
| **Função como prop** | `onClick: () => void`, `onChange: (v: number) => void`. São os `Action` / `Action<int>` do C#. |
| **`type` de objeto** | O formato de um objeto (como um `record`). |
| **Spread `...`** | Espalha os itens de uma lista ou os campos de um objeto. `{ ...obj, campo: x }` é o `with` do C#. |
| **`filter` / `slice`** | O `Where` / `TakeLast` do LINQ. |
| **Imutabilidade** | Não alterar o estado por dentro: sempre criar um valor novo e passar para o `set...`. |
| **Subdivisão** | Clicks entre os tempos (colcheia = 2, tercina = 3, semicolcheia = 4 por tempo). |

---

✅ **Terminou?** Me avise. Na **aula 03c**: os **sons gravados de verdade** (woodblock, cowbell, chimbal...) no lugar dos bipes sintéticos.
