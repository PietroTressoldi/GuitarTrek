# Aula 03 — Metrônomo (parte 1): o relógio que não atrasa

> 💡 Abra com **`Ctrl+Shift+V`**. Deixe rodando: `npm run dev --prefix web` e o navegador em http://localhost:5173/metronomo. **Ligue o som.**

Nesta aula você constrói a primeira ferramenta de verdade do GuitarTrek: um **metrônomo preciso**, com BPM, compasso, acento no tempo 1 e luzes que piscam no tempo.

**O que você vai aprender:**
1. Por que um metrônomo no navegador é mais difícil do que parece
2. **Web Audio**: gerar som com código
3. **Custom hook**: criar o seu próprio `use...`
4. `useRef`: guardar um valor sem redesenhar a tela
5. `useEffect` com **limpeza** (o `Dispose` do React)
6. Eventos: `onClick` e `onChange`

**Fica para a aula 03b:** tap tempo, subdivisões (colcheia, tercina...), speed trainer, drone e o painel flutuante.

---

## Parte 0 — O problema: o relógio do JavaScript atrasa

O jeito "óbvio" de fazer um metrônomo seria:

```ts
setInterval(tocarClique, 600)   // a cada 600 ms (100 BPM), toque um clique
```

`setInterval(funcao, ms)` chama a função de tempos em tempos, como um `System.Threading.Timer` do C#. O problema é que ele **não é pontual**. O navegador só executa o timer quando está livre: se ele estiver desenhando uma animação, ou se a aba estiver em segundo plano, o clique sai 10, 20, às vezes 100 ms atrasado. Para um músico, 20 ms já é um metrônomo "bêbado".

### A solução: dois relógios

O navegador tem **outro relógio**, o do **áudio**, que é preciso ao microssegundo. A ideia é usar os dois juntos:

| Relógio | Preciso? | Papel |
|---|---|---|
| `setInterval` (JavaScript) | ❌ | Um **agendador** que acorda a cada 25 ms e pergunta: "tem clique para tocar nos próximos 100 ms?" |
| `AudioContext` (áudio) | ✅ | Recebe o clique **com o horário exato marcado** e toca na hora certa, mesmo que o JavaScript esteja ocupado. |

Pense num restaurante: o **garçom** (setInterval) passa de vez em quando e anota os pedidos com antecedência. A **cozinha** (o áudio) entrega cada prato no horário exato que está escrito no pedido. Se o garçom atrasar um pouco, não tem problema, porque ele sempre anota com folga.

Esse padrão se chama **lookahead scheduler** (agendador com antecedência).

---

## Parte 1 — O hook começa simples: só o estado

### O que é um custom hook?

Você já usou hooks prontos: `useState`, `useEffect`, `useLocation`. Um **custom hook** é uma função **sua** que usa outros hooks por dentro. É como uma **classe de serviço** em C#: ela esconde a lógica complicada e entrega para a tela só o que interessa.

Regra do React: o nome de um hook **sempre começa com `use`**.

### Passo 1.1 — Crie o arquivo

Crie a pasta `web/src/hooks` e, dentro dela, o arquivo `useMetronome.ts`.

> Repare: a extensão é **`.ts`**, não `.tsx`. O `x` é para arquivos que têm JSX (tags `<...>`). O hook não desenha nada, então é `.ts`.

Digite:

```ts
import { useState } from 'react'

export function useMetronome() {
  const [bpm, setBpm] = useState(100)
  const [tempos, setTempos] = useState(4)
  const [tocando, setTocando] = useState(false)

  return { bpm, setBpm, tempos, setTempos, tocando, setTocando }
}
```

| Código | O que significa |
|---|---|
| `useState(100)` | BPM começa em 100. |
| `tempos` | Quantos tempos tem o compasso (4 = 4/4). |
| `tocando` | Se o metrônomo está ligado. |
| `return { bpm, setBpm, ... }` | Devolve um **objeto** com tudo que a tela vai usar. `{ bpm }` é um atalho para `{ bpm: bpm }`. Em C# seria como devolver `new { Bpm = bpm, ... }`. |

### Passo 1.2 — Use o hook na página

Substitua **todo** o `web/src/pages/Metronomo.tsx` por:

```tsx
import { Minus, Plus } from 'lucide-react'
import { useMetronome } from '@/hooks/useMetronome'

export function Metronomo() {
  const { bpm, setBpm } = useMetronome()

  function mudarBpm(valor: number) {
    setBpm(Math.min(300, Math.max(30, valor)))
  }

  return (
    <section className="flex max-w-xl flex-col gap-10">
      <h1 className="text-4xl">Metrônomo</h1>

      <div className="flex flex-col items-center gap-8 rounded-lg border bg-card p-8">
        <div className="flex items-center gap-6">
          <button
            onClick={() => mudarBpm(bpm - 1)}
            aria-label="Diminuir BPM"
            className="rounded-md border p-2 text-muted-foreground hover:text-foreground"
          >
            <Minus className="size-5" />
          </button>

          <div className="text-center">
            <span className="block font-heading text-7xl font-semibold tabular-nums font-stretch-expanded">{bpm}</span>
            <span className="text-sm text-muted-foreground">BPM</span>
          </div>

          <button
            onClick={() => mudarBpm(bpm + 1)}
            aria-label="Aumentar BPM"
            className="rounded-md border p-2 text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
```

### Linha a linha (as partes novas)

| Código | O que significa |
|---|---|
| `const { bpm, setBpm } = useMetronome()` | **Desestruturação**: pega só `bpm` e `setBpm` do objeto que o hook devolveu. Em C# seria `var (bpm, setBpm) = ...` com uma tupla. |
| `function mudarBpm(valor: number)` | Uma função **dentro** do componente. Ela enxerga `setBpm` porque está no mesmo bloco. |
| `Math.min(300, Math.max(30, valor))` | Prende o valor entre 30 e 300. É o `Math.Clamp(valor, 30, 300)` do C#. |
| `<button>` | Um botão HTML. |
| `onClick={() => mudarBpm(bpm - 1)}` | **Evento de clique**: "quando clicar, execute esta função". É o `button.Click += (s, e) => ...` do C#. Repare no `() =>`: passamos **uma função para ser chamada depois**. Se você escrever `onClick={mudarBpm(bpm - 1)}` (sem o `() =>`), ela roda **na hora**, a cada vez que a tela é desenhada. Esse erro é muito comum. |
| `aria-label="Diminuir BPM"` | O botão só tem um ícone, sem texto. O `aria-label` é o nome que leitores de tela (usados por pessoas cegas) vão falar. |
| `block` | Faz o `span` ocupar a linha inteira, para o "BPM" ir para baixo do número. |
| `text-7xl` | Número enorme (72px). |
| `tabular-nums` | Todos os algarismos com a **mesma largura**. Sem isso, o número "pula" de lado quando muda de 111 para 100, porque o "1" é mais estreito. |

**✅ O que você deve ver:** um painel com "100 BPM" grande. Clique em **+** e **−**: o número muda. Tente passar de 300 ou descer de 30: ele trava.

---

## Parte 2 — Fazendo barulho: Web Audio

### Os conceitos

A **Web Audio API** é um "estúdio" dentro do navegador. Você liga aparelhos uns nos outros, como pedais numa pedaleira:

```
[Oscilador] ──▶ [Volume] ──▶ [Alto-falante]
  gera o som     controla       destination
  (um "bip")     o volume
```

| Peça | O que é |
|---|---|
| `AudioContext` | O estúdio inteiro. Tem o **relógio preciso**: `ctx.currentTime` (em segundos, desde que o estúdio foi ligado). |
| `OscillatorNode` | Gera uma onda sonora numa frequência. 1000 Hz soa como um "bip" agudo. |
| `GainNode` | Controla o volume. |
| `ctx.destination` | A saída: o alto-falante. |

### Passo 2.1 — A função que toca um clique

No **final** do `useMetronome.ts` (depois do `}` que fecha o `useMetronome`), adicione:

```ts
function tocarClique(ctx: AudioContext, quando: number, acento: boolean) {
  const osc = ctx.createOscillator()
  const volume = ctx.createGain()

  osc.frequency.value = acento ? 1500 : 1000
  volume.gain.setValueAtTime(0.6, quando)
  volume.gain.exponentialRampToValueAtTime(0.001, quando + 0.05)

  osc.connect(volume).connect(ctx.destination)
  osc.start(quando)
  osc.stop(quando + 0.05)
}
```

| Código | O que significa |
|---|---|
| `function tocarClique(...)` sem `export` | Função **privada** deste arquivo (o `private` do C#). Só o hook usa. |
| `quando: number` | O horário **exato** do clique, no relógio do áudio. Esse é o segredo da precisão. |
| `acento ? 1500 : 1000` | O tempo 1 do compasso soa mais agudo (1500 Hz), para você saber onde o compasso começa. |
| `setValueAtTime(0.6, quando)` | No instante do clique, volume em 60%. |
| `exponentialRampToValueAtTime(0.001, quando + 0.05)` | E em 50 ms ele cai até quase zero. Isso transforma um "biiiip" contínuo num "tic" seco. |
| `osc.connect(volume).connect(ctx.destination)` | Liga os cabos: oscilador → volume → alto-falante. |
| `osc.start(quando)` / `osc.stop(quando + 0.05)` | Liga e desliga **no horário marcado**. A gente entrega o "pedido" para a cozinha e ela cuida do resto. |

Ainda não toca nada: ninguém chama essa função. É o próximo passo. (O VS Code vai sublinhar `tocarClique` avisando que ela não é usada. É normal, o aviso some na Parte 3.)

---

## Parte 3 — O agendador: `useRef` e `useEffect` com limpeza

### Conceito novo: `useRef`

Lembra que **toda vez** que um `useState` muda, o React redesenha o componente? Às vezes você quer guardar um valor **sem** redesenhar a tela. Para isso existe o `useRef`:

```ts
const audio = useRef<AudioContext | null>(null)
audio.current = new AudioContext()   // guarda
audio.current                        // lê
```

| | `useState` | `useRef` |
|---|---|---|
| Mudar o valor redesenha a tela? | ✅ Sim | ❌ Não |
| Como lê | `bpm` | `bpmRef.current` |
| Como muda | `setBpm(120)` | `bpmRef.current = 120` |
| Em C# seria | uma propriedade com `PropertyChanged` | um **campo privado** comum |

`AudioContext | null` quer dizer "ou um AudioContext, ou nada". É o `AudioContext?` do C#.

### Conceito novo: a "foto" (closure)

O agendador vai rodar dentro de um `setInterval`. A função que você passa para o `setInterval` **tira uma foto** das variáveis no momento em que foi criada. Se ela usasse `bpm` direto, ficaria vendo o BPM **antigo para sempre**, mesmo que você clicasse em +.

A solução é guardar o BPM também num `useRef`. Como o ref é uma **caixa**, a foto guarda a caixa, e quando você olha dentro dela (`.current`) vê sempre o valor atual. Em C#, é a diferença entre copiar um `int` e guardar a referência de um objeto.

### Conceito novo: `useEffect` com limpeza

Na aula 01 você usou `useEffect(() => { ... }, [])` para buscar dados uma vez. Agora vamos usar duas coisas novas:

- **Dependências** `[tocando]`: o efeito roda de novo **toda vez que `tocando` mudar**.
- **Limpeza**: se o efeito **devolver uma função**, o React chama essa função antes de rodar o efeito de novo, ou quando a página é fechada. É o `Dispose()` do C#: desligar o que você ligou.

```ts
useEffect(() => {
  const id = setInterval(...)        // liga
  return () => clearInterval(id)     // limpeza: desliga
}, [tocando])
```

Sem a limpeza, cada clique em "Começar" criaria um agendador **a mais**, e você ouviria dois, três metrônomos ao mesmo tempo.

### Passo 3.1 — O hook completo

Substitua a parte de cima do `useMetronome.ts` (do `import` até o `}` que fecha `useMetronome`, **mantendo** a função `tocarClique` embaixo) por:

```ts
import { useEffect, useRef, useState } from 'react'

const INTERVALO_MS = 25    // de quanto em quanto tempo o agendador acorda
const JANELA_S = 0.1       // até quanto do futuro ele agenda os cliques

export function useMetronome() {
  const [bpm, setBpm] = useState(100)
  const [tempos, setTempos] = useState(4)
  const [tocando, setTocando] = useState(false)
  const [tempoAtual, setTempoAtual] = useState(-1)

  const audio = useRef<AudioContext | null>(null)
  const bpmRef = useRef(bpm)
  const temposRef = useRef(tempos)

  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { temposRef.current = tempos }, [tempos])

  useEffect(() => {
    if (!tocando) return

    audio.current ??= new AudioContext()
    const ctx = audio.current
    ctx.resume()

    let proximoClique = ctx.currentTime + 0.05
    let tempo = 0
    const timeouts: number[] = []

    const agendador = setInterval(() => {
      while (proximoClique < ctx.currentTime + JANELA_S) {
        tocarClique(ctx, proximoClique, tempo === 0)

        const esteTempo = tempo
        const atraso = (proximoClique - ctx.currentTime) * 1000
        timeouts.push(setTimeout(() => setTempoAtual(esteTempo), atraso))

        proximoClique += 60 / bpmRef.current
        tempo = (tempo + 1) % temposRef.current
      }
    }, INTERVALO_MS)

    return () => {
      clearInterval(agendador)
      timeouts.forEach(clearTimeout)
      setTempoAtual(-1)
    }
  }, [tocando])

  return { bpm, setBpm, tempos, setTempos, tocando, setTocando, tempoAtual }
}
```

### Linha a linha

| Código | O que significa |
|---|---|
| `const INTERVALO_MS = 25` (fora da função) | Constantes do arquivo, como um `const` de classe em C#. Escritas em MAIÚSCULAS por convenção. |
| `tempoAtual` | Qual tempo do compasso está soando agora (0, 1, 2, 3). Começa em `-1`, que significa "nenhum". É um `useState` porque **a tela precisa redesenhar** para acender a luz. |
| `useEffect(() => { bpmRef.current = bpm }, [bpm])` | "Sempre que `bpm` mudar, copie para a caixa." Assim o agendador vê o BPM novo **sem precisar parar**. |
| `if (!tocando) return` | Se o metrônomo está parado, o efeito não faz nada. |
| `audio.current ??= new AudioContext()` | "Se ainda não existe um estúdio, crie um." O `??=` é **igual ao do C#**. Criamos só uma vez e reaproveitamos. |
| `ctx.resume()` | Os navegadores deixam o áudio "pausado" até o usuário interagir com a página (para sites não começarem a tocar sozinhos). Como chegamos aqui por um clique, podemos liberar. |
| `let proximoClique = ctx.currentTime + 0.05` | `let` é uma variável que **pode mudar** (o `const` não pode). O primeiro clique sai daqui a 50 ms. |
| `const timeouts: number[] = []` | Uma lista vazia de números. Vamos guardar aqui os timers das luzes para poder cancelá-los. |
| `while (proximoClique < ctx.currentTime + JANELA_S)` | **O coração do agendador:** "enquanto o próximo clique cair dentro dos próximos 100 ms, agende-o." |
| `tocarClique(ctx, proximoClique, tempo === 0)` | Entrega o pedido para a "cozinha": toque neste horário exato, com acento se for o tempo 1. **Atenção:** em JavaScript, comparação é com `===` (três sinais de igual). O `==` existe, mas tem regras estranhas. Use sempre `===`. |
| `setTimeout(() => setTempoAtual(esteTempo), atraso)` | `setTimeout` executa **uma vez**, depois de um tempo. Acendemos a luz no mesmo instante em que o som vai tocar. (A luz pode ter alguns ms de atraso, mas o olho não percebe. O ouvido percebe, por isso o **som** usa o relógio preciso.) |
| `const esteTempo = tempo` | Tira uma "foto" do número do tempo **agora**, porque `tempo` vai mudar na linha de baixo. |
| `proximoClique += 60 / bpmRef.current` | Avança para o próximo clique. Em 100 BPM, 60 / 100 = 0,6 segundo entre cliques. |
| `tempo = (tempo + 1) % temposRef.current` | Conta 0, 1, 2, 3, 0, 1... O `%` é o **resto da divisão**, igual ao C#. |
| `return () => { ... }` | **A limpeza:** para o agendador, cancela as luzes pendentes e apaga todas. |
| `}, [tocando])` | Roda de novo quando `tocando` mudar: ligar cria o agendador, desligar chama a limpeza. |

### Passo 3.2 — O botão Começar/Parar

No `Metronomo.tsx`:

1. Troque o import da lucide por:
   ```tsx
   import { Minus, Pause, Play, Plus } from 'lucide-react'
   ```
2. Troque a desestruturação por:
   ```tsx
   const { bpm, setBpm, tocando, setTocando } = useMetronome()
   ```
3. Logo **antes** do `</div>` que fecha o painel (o da `bg-card`), adicione:
   ```tsx
        <button
          onClick={() => setTocando(!tocando)}
          className="flex items-center gap-2 rounded-md bg-primary px-8 py-3 font-semibold text-primary-foreground"
        >
          {tocando ? <Pause className="size-5" /> : <Play className="size-5" />}
          {tocando ? 'Parar' : 'Começar'}
        </button>
   ```

- `setTocando(!tocando)`: o `!` inverte. Se está tocando, para; se está parado, começa.
- `{tocando ? <Pause /> : <Play />}`: o mesmo `? :` do C#, agora escolhendo **qual ícone** desenhar.

**✅ O que você deve ver e ouvir:** clique em **Começar**: "TIC tic tic tic, TIC tic tic tic". O primeiro de cada grupo de 4 é mais agudo. Com ele tocando, clique em **+** várias vezes: o andamento acelera **sem parar**. Clique em **Parar**: silêncio.

---

## Parte 4 — As luzes do tempo

Agora a parte visual: uma bolinha para cada tempo, que acende no momento do clique. A do tempo 1 acende **âmbar com brilho**, como a luz piloto do menu.

### Conceito novo: `Array.from`

Precisamos de 4 bolinhas se o compasso for 4/4, e 3 se for 3/4. Mas não temos uma lista, só o **número** `tempos`. O `Array.from` cria uma lista a partir de um tamanho:

```ts
Array.from({ length: 4 }, (_, i) => i)   // [0, 1, 2, 3]
```

É o `Enumerable.Range(0, 4)` do C#. O `_` é um parâmetro que a gente **ignora** (como o `_` de descarte do C#), e o `i` é a posição.

### Passo 4.1 — Desenhe as luzes

No `Metronomo.tsx`:

1. Adicione o import do Motion:
   ```tsx
   import { motion } from 'motion/react'
   ```
2. Pegue também `tempos` e `tempoAtual` do hook:
   ```tsx
   const { bpm, setBpm, tempos, tocando, setTocando, tempoAtual } = useMetronome()
   ```
3. Logo **depois** da linha `<div className="flex flex-col items-center gap-8 rounded-lg border bg-card p-8">`, adicione:
   ```tsx
        <div className="flex gap-4">
          {Array.from({ length: tempos }, (_, i) => (
            <motion.span
              key={i}
              animate={{ scale: tempoAtual === i ? 1.4 : 1 }}
              transition={{ duration: 0.08 }}
              className={`size-4 rounded-full ${
                tempoAtual === i
                  ? i === 0
                    ? 'bg-primary shadow-[0_0_16px_var(--primary)]'
                    : 'bg-foreground'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
   ```

| Código | O que significa |
|---|---|
| `motion.span` | Um `span` que sabe se animar (você já usou o `motion.div`). |
| `animate={{ scale: tempoAtual === i ? 1.4 : 1 }}` | Se esta é a bolinha do tempo atual, ela **cresce 40%**. Se não, volta ao tamanho normal. O Motion anima a mudança sozinho. |
| `duration: 0.08` | Bem rápido (80 ms), para acompanhar o andamento. |
| `tempoAtual === i ? (i === 0 ? ... : ...) : ...` | Um `? :` dentro de outro: se está acesa e é o tempo 1, âmbar com brilho; se está acesa e é outro tempo, clara; se está apagada, `bg-muted`. |

**✅ O que você deve ver:** 4 bolinhas apagadas. Ao começar, elas acendem uma por vez, no ritmo do som, e a primeira acende âmbar com brilho. Ao parar, todas apagam.

---

## Parte 5 — Slider e compasso

### Passo 5.1 — O slider de BPM

Logo **depois** do `</div>` que fecha o bloco do BPM (o `flex items-center gap-6`), adicione:

```tsx
        <input
          type="range"
          min={30}
          max={300}
          value={bpm}
          onChange={(e) => mudarBpm(Number(e.target.value))}
          aria-label="BPM"
          className="w-full accent-primary"
        />
```

| Código | O que significa |
|---|---|
| `<input type="range">` | Um **slider** nativo do navegador. Não precisamos de biblioteca. |
| `value={bpm}` | O slider **mostra** o valor do estado. |
| `onChange={(e) => ...}` | Evento disparado quando o usuário arrasta. O `e` (de *event*) traz informações, como o `EventArgs` do C#. |
| `e.target.value` | O valor do slider. Ele vem como **texto** (`"120"`), por isso o `Number(...)`, que é o `int.Parse` do JavaScript. |
| `accent-primary` | Pinta o slider com a cor de destaque do tema. |

Repare que os botões +/− e o slider usam **o mesmo estado**: mexa em um e o outro acompanha. Essa ideia de "uma única fonte da verdade" aparece o tempo todo em React.

### Passo 5.2 — O compasso

1. No topo do `Metronomo.tsx`, logo abaixo dos imports, adicione:
   ```tsx
   const COMPASSOS = [2, 3, 4, 6]
   ```
2. Pegue `setTempos` do hook:
   ```tsx
   const { bpm, setBpm, tempos, setTempos, tocando, setTocando, tempoAtual } = useMetronome()
   ```
3. Logo **depois** do `<input ... />`, adicione:
   ```tsx
        <div className="flex gap-2">
          {COMPASSOS.map((n) => (
            <button
              key={n}
              onClick={() => setTempos(n)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tempos === n ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {n}/4
            </button>
          ))}
        </div>
   ```

É o mesmo `.map()` do menu da aula 02, agora gerando botões.

**✅ O que você deve ver:** o metrônomo completo, com luzes, BPM, slider, botões 2/4 3/4 4/4 6/4 e o botão Começar. Com ele tocando, troque para 3/4: o número de bolinhas muda e o acento passa a cair a cada 3 cliques, como numa valsa.

---

## Parte 6 — Teste de precisão 🎯

Abra no celular um metrônomo de referência (o do Google funciona: pesquise "metrônomo") em **100 BPM**. Comece os dois ao mesmo tempo e deixe tocar por **2 minutos**. Se no fim eles ainda estiverem batendo juntos, seu agendador está perfeito.

> Se você testar com `setInterval` puro, no lugar do agendador, vai ouvir os dois se separarem em poucos segundos, principalmente se você trocar de aba.

---

## 🏋️ Exercícios

### Exercício 1 — Som de madeira 🪵
Deixe o clique mais grave, parecido com um bloco de madeira: acento em 1200 Hz e os outros tempos em 800 Hz.

<details><summary>Resposta</summary>

No `tocarClique`, troque a linha da frequência por:
```ts
osc.frequency.value = acento ? 1200 : 800
```

</details>

### Exercício 2 — Compasso 5/4 🎼
Adicione o compasso 5/4 (o de "Take Five").

<details><summary>Resposta</summary>

Só a lista muda: `const COMPASSOS = [2, 3, 4, 5, 6]`. O botão novo, as 5 bolinhas e o acento a cada 5 cliques aparecem sozinhos.

</details>

### Exercício 3 — Barra de espaço ⌨️
Faça a **barra de espaço** ligar e desligar o metrônomo.

<details><summary>Dica</summary>

Use um `useEffect` no `Metronomo.tsx` que "escuta" o teclado com `window.addEventListener('keydown', funcao)`. Na **limpeza**, remova com `window.removeEventListener('keydown', funcao)`. A tecla de espaço tem `e.code === 'Space'`.

</details>

<details><summary>Resposta</summary>

Adicione `useEffect` no import do React (`import { useEffect } from 'react'`) e, dentro do componente, antes do `return`:

```tsx
useEffect(() => {
  function aoTeclar(e: KeyboardEvent) {
    if (e.code === 'Space') {
      e.preventDefault()          // impede a página de rolar
      setTocando(!tocando)
    }
  }
  window.addEventListener('keydown', aoTeclar)
  return () => window.removeEventListener('keydown', aoTeclar)
}, [tocando, setTocando])
```

Por que `[tocando]` nas dependências? Por causa da "foto": a função `aoTeclar` guarda o valor de `tocando` do momento em que foi criada. Toda vez que `tocando` muda, o efeito remove o ouvinte antigo (limpeza) e cria um novo, com a foto atualizada.

</details>

### Exercício 4 — Pergunta rápida 🤔
No agendador, por que usamos `bpmRef.current` e não simplesmente `bpm`?

<details><summary>Resposta</summary>

Por causa da "foto" (closure). A função do `setInterval` foi criada quando você clicou em Começar e ficou com o `bpm` daquele momento. Se usasse `bpm`, mudar o andamento com o metrônomo tocando não teria efeito. O `bpmRef` é uma caixa: a foto guarda a caixa, e o `.current` sempre tem o valor novo.

</details>

---

## 📖 Glossário novo

| Termo | Significado |
|---|---|
| **Custom hook** | Função sua que começa com `use` e usa outros hooks. Como uma classe de serviço. |
| **`useRef`** | Caixa que guarda um valor sem redesenhar a tela. Como um campo privado. |
| **Limpeza (cleanup)** | Função devolvida pelo `useEffect` para desligar o que ele ligou. O `Dispose` do React. |
| **Dependências** | A lista `[...]` do `useEffect`: o efeito roda de novo quando algo nela muda. |
| **Closure ("foto")** | Uma função lembra as variáveis do momento em que foi criada. |
| **`setInterval` / `setTimeout`** | Executar algo repetidamente / uma vez depois de um tempo. Imprecisos para áudio. |
| **Web Audio / `AudioContext`** | O "estúdio" de som do navegador, com relógio preciso. |
| **Oscilador / Gain** | Gerador de som / controle de volume. |
| **Lookahead scheduler** | Agendar os sons com um pouco de antecedência, no relógio do áudio. |
| **`===`** | Comparação de igualdade em JavaScript. Use sempre esta, não `==`. |
| **Evento (`onClick`, `onChange`)** | Função chamada quando o usuário faz algo. Como os eventos do C#. |

---

✅ **Terminou?** Me avise. Na **aula 03b** o metrônomo ganha tap tempo, subdivisões, speed trainer, drone e um painel flutuante que acompanha você em qualquer tela.
