# Aula 03c — Metrônomo (parte 3): sons de verdade e visual de painel

> 💡 Abra com **`Ctrl+Shift+V`**. Deixe rodando: `npm run dev --prefix web` e o navegador em http://localhost:5173/metronomo. **Ligue o som.**

Duas mudanças grandes nesta aula:

1. **Sons de verdade.** Até agora o "Cowbell" era uma onda quadrada fingindo ser cowbell. Agora o metrônomo toca **gravações** de instrumentos reais: woodblock, claves, cowbell e chimbal (mais o bipe clássico).
2. **Visual de painel.** A tela sai do "formulário com botões" e vira equipamento: um visor com LEDs, compassos escritos como na partitura, figuras rítmicas desenhadas e um ícone para cada instrumento.

| Antes | Depois |
|---|---|
| ![antes](img/03c-antes.png) | ![depois](img/03c-depois.png) |

**Conceitos novos:** a pasta `public/` (o `wwwroot` do front), `fetch`, `async`/`await` e `Promise` (o `Task` do JavaScript), `AudioBuffer`, `useEffect` que roda **uma vez só**, `Record` (o `Dictionary`), SVG, componente guardado numa variável, `find`, props opcionais (`?`), `grid` e `sticky` do Tailwind, `role="switch"`.

**Já está pronto (eu fiz, é infraestrutura):**
- `web/public/sons/*.wav`: os 5 sons, já cortados para começar no instante exato da batida. Vêm de uma biblioteca de domínio público (créditos em `web/public/sons/CREDITOS.md`).
- `web/src/components/IconesMusicais.tsx`: os ícones das figuras rítmicas e dos instrumentos, desenhados em SVG.
- O token `--sombra` em `web/src/index.css`, para a sombra interna do visor.

**Fica para a aula 03d:** o drone e o painel flutuante.

---

## Parte 1 — Sons gravados

### Por que o oscilador não serve

O oscilador da aula 03 gera uma onda **pura e perfeita** (seno, triângulo, quadrada). Um cowbell de verdade é um pedaço de metal vibrando de dezenas de jeitos ao mesmo tempo, com um "ataque" de baqueta no começo. Dá para imitar isso com vários osciladores e filtros (é assim que bateria eletrônica faz), mas o jeito mais simples e mais fiel é **tocar uma gravação**.

O caminho de uma gravação até a caixa de som:

```
cowbell.wav  --fetch-->  bytes  --decodeAudioData-->  AudioBuffer  --BufferSource-->  🔊
(arquivo)                                              (som pronto na memória)
```

### Conceito novo: a pasta `public/`

Tudo que está em `web/public/` é servido **do jeito que está**, na raiz do site. É o `wwwroot` do ASP.NET.

👉 Abra http://localhost:5173/sons/cowbell.wav no navegador. Ele toca o cowbell. (Feche a aba e volte.)

Então, no código, o endereço do arquivo é só `/sons/cowbell.wav`.

### Conceito novo: `fetch`, `async`/`await` e `Promise`

Baixar um arquivo demora. Em C#, você faria:

```csharp
async Task<byte[]> Baixar(string url) {
    var resposta = await http.GetAsync(url);
    return await resposta.Content.ReadAsByteArrayAsync();
}
```

Em JavaScript é **igualzinho**:

```ts
async function baixar(url: string) {
  const resposta = await fetch(url)
  return await resposta.arrayBuffer()
}
```

| C# | JavaScript |
|---|---|
| `Task<T>` | `Promise<T>` |
| `async` / `await` | `async` / `await` (mesma coisa) |
| `HttpClient.GetAsync(url)` | `fetch(url)` (já vem no navegador) |
| `byte[]` | `ArrayBuffer` |
| `task.ContinueWith(t => ...)` | `promise.then((valor) => ...)` |

O `.then` é o jeito "sem await" de esperar uma Promise: você passa uma função que roda quando o valor chegar. Vamos precisar dele no Passo 1.3.

### Passo 1.1 — Os sons viram arquivos

No `web/src/hooks/useMetronome.ts`, **troque** o `type Som` e a lista `SONS` inteiros por:

```ts
export type Som = {
  id: string      // nome do arquivo em /sons, sem o .wav
  nome: string    // o que aparece na tela
}

export const SONS: Som[] = [
  { id: 'bipe', nome: 'Bipe' },
  { id: 'woodblock', nome: 'Woodblock' },
  { id: 'claves', nome: 'Claves' },
  { id: 'cowbell', nome: 'Cowbell' },
  { id: 'chimbal', nome: 'Chimbal' },
]

const ALTURA_ACENTO = 1.33   // o tempo 1 toca o mesmo som uma quarta acima
```

Saíram `onda`, as três frequências e a `duracao`: a gravação já tem tudo isso dentro.

**E o acento?** Antes o tempo 1 tinha outra frequência. Agora tocamos a **mesma gravação um pouco mais rápida**, o que deixa o som mais agudo (como um disco girando mais rápido). `1.33` = uma quarta acima, que é o intervalo que metrônomos de verdade costumam usar.

⚠️ O VS Code vai sublinhar de vermelho os lugares que usavam `som.onda`, `som.acento` etc. Normal: os próximos passos consertam.

### Passo 1.2 — Duas funções de áudio

No **fim** do arquivo, **apague** a função `tocarClique` inteira e coloque estas duas:

```ts
async function carregarAmostra(ctx: AudioContext, url: string) {
  const resposta = await fetch(url)
  const bytes = await resposta.arrayBuffer()
  return ctx.decodeAudioData(bytes)
}

function tocarAmostra(ctx: AudioContext, buffer: AudioBuffer, quando: number, volume: number, altura: number) {
  const fonte = ctx.createBufferSource()
  const ganho = ctx.createGain()

  fonte.buffer = buffer
  fonte.playbackRate.value = altura
  ganho.gain.value = volume

  fonte.connect(ganho).connect(ctx.destination)
  fonte.start(quando)
}
```

Linha a linha:

- **`carregarAmostra`** baixa o `.wav` e o **decodifica**: transforma os bytes do arquivo em um `AudioBuffer`, que é o som já pronto na memória (uma lista de números, um por amostra). Ela é `async`, então devolve uma `Promise<AudioBuffer>`.
- **`createBufferSource()`** cria um "tocador de gravação". É o primo do oscilador: em vez de gerar uma onda, toca um `AudioBuffer`.
- **`playbackRate`** é a velocidade: `1` é normal, `1.33` é 33% mais rápido (e mais agudo). É o nosso acento.
- **`ganho.gain.value = volume`**: o volume fica fixo. Não precisa mais da rampa que fazia o "tic" sumir: a gravação já termina sozinha.
- **`fonte.start(quando)`**: igual ao oscilador, toca no **horário exato** do relógio do áudio. O agendador continua funcionando do mesmo jeito.
- Não tem `stop`: quando a gravação acaba, a fonte para sozinha.

> 🎯 Cada `BufferSource` só toca **uma vez**. Por isso criamos uma fonte nova a cada clique, como fazíamos com o oscilador. Isso é barato: o `AudioBuffer` (a parte pesada) é o mesmo, só a "agulha" é nova.

### Conceito novo: `useEffect` com `[]`, roda uma vez só

Você já viu:

- `useEffect(() => {...})` sem lista: roda **depois de toda renderização**.
- `useEffect(() => {...}, [tocando])`: roda quando `tocando` muda.

Com a lista **vazia** `[]`, ele roda **uma vez**, quando o componente aparece na tela, e o `return` roda quando ele sai. É o par construtor / `Dispose()` do C#.

É o lugar certo para carregar os sons: uma vez só, quando você abre o metrônomo.

### Conceito novo: `Record<string, T>`, o `Dictionary`

```ts
const amostras: Record<string, AudioBuffer> = {}
amostras['cowbell'] = buffer      // guardar
const b = amostras['cowbell']     // ler (undefined se não tiver)
```

É um `Dictionary<string, AudioBuffer>`. Diferença: ler uma chave que não existe **não dá exceção**, devolve `undefined`.

### Passo 1.3 — Carregar os sons ao abrir a tela

No hook, logo **abaixo** da linha `const audio = useRef<AudioContext | null>(null)`, cole:

```ts
const amostras = useRef<Record<string, AudioBuffer>>({})

useEffect(() => {
  const ctx = new AudioContext()
  audio.current = ctx
  for (const s of SONS) {
    carregarAmostra(ctx, `/sons/${s.id}.wav`).then((buffer) => {
      amostras.current[s.id] = buffer
    })
  }
  return () => {
    ctx.close()
  }
}, [])
```

- O `AudioContext` agora nasce **aqui**, quando a tela abre, e não mais no Play. Precisamos dele para decodificar os sons.
- O `for (const s of SONS)` é o `foreach` do C#.
- **Por que `.then` e não `await`?** A função que você passa para o `useEffect` **não pode ser `async`**: o React espera que ela devolva a função de limpeza, não uma Promise. Então usamos `.then`: "quando o som chegar, guarda no dicionário".
- Os 5 sons baixam **ao mesmo tempo** (ninguém espera ninguém). São arquivos pequenos: chegam em milissegundos.
- `ctx.close()` desliga o áudio quando você sai da tela. É o `Dispose()`.
- `amostras` é um **ref**, não um estado: a tela não precisa redesenhar quando um som termina de carregar. Só o agendador lê.

### Passo 1.4 — O agendador toca a gravação

No `useEffect` do `[tocando]`, **troque**:

```ts
audio.current ??= new AudioContext()
const ctx = audio.current
```

por:

```ts
const ctx = audio.current
if (!ctx) return
```

O contexto já existe (o Passo 1.3 criou). O `if (!ctx) return` só acalma o TypeScript, que sabe que o ref *poderia* ser `null`.

Agora, dentro do `while`, **troque** as duas linhas do `frequencia` e do `tocarClique(...)` por:

```ts
const buffer = amostras.current[c.som.id]
if (buffer) {
  const altura = tempo === 0 && ehTempo && c.acento ? ALTURA_ACENTO : 1
  tocarAmostra(ctx, buffer, proximoClique, ehTempo ? c.volume : c.volume * 0.45, altura)
}
```

- `if (buffer)`: se o som ainda não carregou (alguém deu Play em 1 milissegundo), pula esse clique em vez de dar erro.
- O acento só no **tempo 1** e só no clique **do tempo** (`ehTempo`): as subdivisões do tempo 1 não são acentuadas.
- As subdivisões tocam com 45% do volume, para os tempos continuarem se destacando.

### Passo 1.5 — Ouvir o som antes de escolher

Queremos que, ao clicar num som, ele toque uma vez, para você ouvir. No hook, **depois** do `useEffect` que atualiza o `config`, cole:

```ts
function ouvir(s: Som) {
  const ctx = audio.current
  const buffer = amostras.current[s.id]
  if (!ctx || !buffer) return
  ctx.resume()
  tocarAmostra(ctx, buffer, ctx.currentTime, config.current.volume, 1)
}
```

- `ctx.resume()`: o navegador só libera o som depois de um clique do usuário. Como o contexto nasceu ao abrir a tela (sem clique), ele começa "suspenso". O `resume` o acorda. (O Play já fazia isso.)
- `ctx.currentTime` = "agora".

E adicione `ouvir` no `return` do hook (depois do `tap`).

### ✅ O que você deve ver (e ouvir)

A tela ainda tem o visual antigo, mas o painel lê a lista `SONS`, então os botões já mostram **Bipe, Woodblock, Claves, Cowbell, Chimbal**.

1. Escolha **Cowbell** e dê Play. É um cowbell de verdade. 🐄🔔
2. Ouça o tempo 1 mais agudo.
3. Troque para **Tercina**: as subdivisões soam mais baixas.
4. Troque de som **com o metrônomo tocando**: muda no próximo clique.

---

## Parte 2 — Visual de painel

A ideia: a tela deve parecer um **equipamento**, não um formulário. Três regras que vamos seguir:

- **Um protagonista:** o visor (BPM + LEDs). O resto é discreto.
- **Escolhas com cara do que são:** compasso escrito como na partitura, figura rítmica desenhada, ícone do instrumento.
- **A luz piloto âmbar** marca o que está ligado, igual ao menu lateral.

### Conceito novo: SVG

SVG é um **desenho feito de texto**: em vez de pixels, você descreve formas.

```html
<svg viewBox="0 0 24 24">
  <rect x="3" y="8" width="18" height="9" rx="2.5" />   <!-- retângulo arredondado -->
  <path d="M6.5 12.5h11" />                              <!-- uma linha -->
</svg>
```

- `viewBox="0 0 24 24"`: o "papel quadriculado" tem 24 × 24 unidades. O SVG estica para qualquer tamanho sem perder qualidade.
- `<path d="...">`: um traço. `M` = "mova a caneta para", `h` = "risque na horizontal", `l` = "risque até"...
- `stroke="currentColor"`: o traço usa **a cor do texto em volta**. Por isso o ícone fica âmbar, cinza ou claro conforme o botão, sem nenhuma cor fixa. Os ícones do lucide funcionam igual.

👉 Abra `web/src/components/IconesMusicais.tsx` e dê uma olhada. Você não precisa saber desenhar SVG. Repare só em duas coisas:

1. `IconeSubdivisao` recebe `valor` e desenha **N notas** com um `map`, ligadas por uma barra (2 barras na semicolcheia, um "3" em cima na tercina). É o mesmo `Array.from` + `map` das luzes do metrônomo.
2. `IconesSom` é um **`Record`** (o dicionário da Parte 1) de **componentes**: `IconesSom['cowbell']` é o desenho do cowbell. A chave é o mesmo `id` dos sons.

### Passo 2.1 — Imports

No topo de `web/src/pages/Metronomo.tsx`, deixe os imports assim:

```tsx
import { Hand, Minus, Pause, Play, Plus, Volume2 } from 'lucide-react'
import { SONS, useMetronome } from '@/hooks/useMetronome'
import { IconeSubdivisao, IconesSom } from '@/components/IconesMusicais'
import { motion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
```

`Hand` (mão, para o Tap) e `Volume2` (alto-falante) são ícones novos do lucide.

### Passo 2.2 — Os componentes de baixo

Vamos primeiro reescrever os componentes pequenos do fim do arquivo. **Apague** `Ajuste`, `Escolha` e `Numero` e cole estes cinco.

**`Grupo`**: um cartão com título. Substitui o `Ajuste`.

```tsx
function Grupo({ titulo, extra, children }: { titulo: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <div className="flex min-h-6 items-center justify-between gap-4">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        {extra}
      </div>
      {children}
    </div>
  )
}
```

> **Conceito novo: prop opcional.** O `?` em `extra?: ReactNode` quer dizer "pode não vir", como um parâmetro `ReactNode? extra = null` no C#. Quando não vem, `{extra}` não desenha nada. Vamos usar para colocar o interruptor do speed trainer ao lado do título.

`justify-between` empurra o título para a esquerda e o `extra` para a direita.

**`Escolha`**: agora é um "ladrilho" com a luz piloto.

```tsx
function Escolha({ ativo, onClick, rotulo, children }: { ativo: boolean; onClick: () => void; rotulo?: string; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ativo}
      aria-label={rotulo}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border px-1 py-3 transition-colors ${ativo
        ? 'border-primary/50 bg-accent text-foreground'
        : 'border-transparent bg-background/50 text-muted-foreground hover:border-border hover:text-foreground'
      }`}
    >
      {ativo && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
      {children}
    </button>
  )
}
```

- `flex-col items-center`: ícone em cima, nome embaixo, centralizados.
- `border-primary/50`: a borda âmbar com **50% de opacidade**. O `/50` funciona em qualquer cor do Tailwind e continua sendo token.
- `bg-background/50`: o fundo do ladrilho é o fundo da página meio transparente, então parece "afundado" no cartão.
- **`relative` + `absolute`**: o ladrilho é `relative`, e a luz piloto é `absolute top-1.5 right-1.5`, ou seja, presa no canto superior direito **do ladrilho**. Elemento `absolute` se posiciona em relação ao pai `relative` mais próximo.
- `{ativo && <span .../>}`: só desenha a luz quando ativo. O `&&` é o "se". (Você já viu algo assim na aula 02.)
- `rotulo?`: um nome para leitores de tela, quando o conteúdo visual não diz tudo (um "4 sobre 4" desenhado não é lido como "4 por 4").

**`Interruptor`**: um botão liga/desliga (substitui os checkboxes).

```tsx
function Interruptor({ ligado, onChange, children }: { ligado: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button
      role="switch"
      aria-checked={ligado}
      onClick={() => onChange(!ligado)}
      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
    >
      <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${ligado ? 'bg-primary' : 'bg-muted'}`}>
        <span className={`size-4 rounded-full bg-foreground transition-transform ${ligado ? 'translate-x-4 bg-primary-foreground' : ''}`} />
      </span>
      {children}
    </button>
  )
}
```

- `role="switch"` + `aria-checked`: avisa o leitor de tela que isto é um interruptor e se está ligado. (Acessibilidade de graça.)
- O "trilho" é um `span` arredondado; a "bolinha" é outro `span` dentro dele.
- **`translate-x-4`**: empurra a bolinha 1rem para a direita quando ligado. Com `transition-transform`, ela **desliza** em vez de pular.

**`BotaoRedondo`**: o − e o + do BPM.

```tsx
function BotaoRedondo({ rotulo, onClick, children }: { rotulo: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={rotulo}
      className="grid size-10 shrink-0 place-items-center rounded-full border text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  )
}
```

`grid place-items-center` é o jeito mais curto de centralizar uma coisa no meio de uma caixa.

**`Numero`**: agora com rótulo e unidade, como o visor de um pedal.

```tsx
function Numero({ rotulo, unidade, valor, onChange }: { rotulo: string; unidade: string; valor: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1.5 rounded-lg bg-background/50 px-3 py-2.5">
      <span className="text-xs text-muted-foreground">{rotulo}</span>
      <span className="flex flex-wrap items-baseline gap-x-1.5">
        <input
          type="number"
          min={1}
          value={valor}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 min-w-0 bg-transparent font-heading text-xl font-semibold tabular-nums font-stretch-expanded text-foreground outline-none"
        />
        <span className="text-xs text-muted-foreground">{unidade}</span>
      </span>
    </label>
  )
}
```

- Envolver tudo num **`<label>`** liga o texto ao campo: clicar em "Subir" coloca o cursor no número. E dispensa o `aria-label`.
- `bg-transparent outline-none`: o campo some, só o número aparece. A "caixa" é o `label`.
- `items-baseline`: o número grande e a unidade pequena ficam alinhados pela **linha de base** do texto, como em "160 BPM" impresso.

### Passo 2.3 — Andamento: o nome italiano do BPM

Músicos chamam faixas de BPM por nomes: 100 BPM é *Andante*, 130 é *Allegro*. Vamos mostrar isso embaixo do número.

No topo da página, **abaixo** de `SUBDIVISOES`, cole:

```tsx
const ANDAMENTOS = [
  { ate: 60, nome: 'Largo' },
  { ate: 76, nome: 'Adagio' },
  { ate: 108, nome: 'Andante' },
  { ate: 120, nome: 'Moderato' },
  { ate: 156, nome: 'Allegro' },
  { ate: 176, nome: 'Vivace' },
  { ate: 200, nome: 'Presto' },
  { ate: Infinity, nome: 'Prestissimo' },
]
```

E dentro do `Metronomo()`, logo depois de `const { tocando, setTocando } = m`:

```tsx
const andamento = ANDAMENTOS.find((a) => m.bpm < a.ate)!.nome
```

- **`find`** é o `First` do LINQ: devolve o **primeiro** item que passa no teste. Como a lista está em ordem, o primeiro com `bpm < ate` é a faixa certa.
- `Infinity` garante que sempre tem alguém (nada é maior que infinito).
- O **`!`** diz ao TypeScript "confia, nunca vai ser `undefined`". É o `!` do C# com nullable (`valor!`). Aqui é seguro por causa do `Infinity`.

### Passo 2.4 — O esqueleto: duas colunas

Agora o `return` da página. Vamos reescrevê-lo em pedaços. **Apague** o `return (...)` inteiro e comece com o esqueleto:

```tsx
return (
  <section className="flex max-w-5xl flex-col gap-8">
    <h1 className="text-4xl">Metrônomo</h1>

    <div className="grid items-start gap-6 lg:grid-cols-2">
      {/* Painel principal: visor + transporte */}
      <div className="flex flex-col gap-6 rounded-xl border bg-card p-5 sm:p-6 lg:sticky lg:top-12">
        {/* Passo 2.5 e 2.6 entram aqui */}
      </div>

      {/* Ajustes */}
      <div className="flex flex-col gap-6">
        {/* Passo 2.7 entra aqui */}
      </div>
    </div>
  </section>
)
```

> **Conceito novo: `grid`.** O `flex` arruma itens em **uma** linha ou coluna. O `grid` arruma numa **tabela**. `lg:grid-cols-2` = "em tela grande, 2 colunas de mesma largura". Em tela pequena, sem `grid-cols`, fica uma coluna só: o visor em cima e os ajustes embaixo. Um código, dois layouts.

> **Conceito novo: `sticky`.** `lg:sticky lg:top-12` faz o painel do visor **grudar** a 3rem do topo quando você rola a página. Os ajustes rolam, o visor fica. É o comportamento de painel de equipamento: o que importa sempre à vista. O `items-start` é necessário para o `sticky` funcionar (sem ele, o grid estica o painel até a altura da outra coluna e não sobra espaço para ele "andar").

`{/* ... */}` é comentário dentro do JSX.

### Passo 2.5 — O visor

No lugar de `{/* Passo 2.5 e 2.6 entram aqui */}`, cole o visor:

```tsx
<div className="flex flex-col gap-8 rounded-lg border bg-background px-5 pt-6 pb-8 shadow-[inset_0_2px_14px_var(--sombra)]">
  <div className="flex gap-2">
    {Array.from({ length: m.tempos }, (_, i) => {
      const aceso = m.tempoAtual === i
      return (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <motion.span
            animate={{ opacity: aceso ? 1 : 0.25 }}
            transition={{ duration: aceso ? 0 : 0.25 }}
            className={`h-1.5 w-full rounded-full ${i === 0 && m.acento ? 'bg-primary' : 'bg-foreground'} ${aceso ? 'shadow-[0_0_12px_currentColor]' : ''}`}
          />
          <span className={`text-xs tabular-nums ${aceso ? 'text-foreground' : 'text-muted-foreground'}`}>
            {i + 1}
          </span>
        </div>
      )
    })}
  </div>

  <div className="flex flex-col items-center gap-1">
    <span className="font-heading text-8xl leading-none font-semibold tabular-nums font-stretch-expanded sm:text-9xl">
      {m.bpm}
    </span>
    <span className="text-sm text-muted-foreground">
      BPM <span className="ml-2 italic">{andamento}</span>
    </span>
  </div>
</div>
```

O que mudou em relação às bolinhas:

- **O visor** é uma caixa com o fundo da página (`bg-background`, mais escuro que o cartão) e uma **sombra interna** (`inset`) com o token `--sombra`. Parece uma janela afundada no painel, como o display de um pedal.
- **LEDs em barra**: cada tempo é um `div` com `flex-1` (todos dividem a largura igualmente) contendo a barra e o número do tempo embaixo.
- A **arrow function com chaves** `(_, i) => { const aceso = ...; return (...) }`: quando você precisa de uma variável antes do JSX, troca os parênteses por chaves e escreve `return`. Igual a uma lambda de várias linhas no C#.
- **Acender e apagar**: o LED apagado fica com 25% de opacidade (dá para ver que ele existe, como um LED de verdade). Ao acender: `duration: 0`, instantâneo. Ao apagar: `0.25s`, um "rastro". É assim que um LED de verdade parece ao olho.
- **O tempo 1 é âmbar** só se o acento estiver ligado: o visual diz a verdade sobre o som.
- `shadow-[0_0_12px_currentColor]`: o brilho usa a **cor do próprio elemento**. Um LED âmbar brilha âmbar, um claro brilha claro.
- `tabular-nums`: todos os números com a mesma largura, então "100" e "111" não mudam de tamanho.
- `sm:text-9xl`: o BPM é ainda maior em telas a partir de 640px.

### Passo 2.6 — BPM e transporte

Ainda dentro do painel principal, **abaixo** do visor:

```tsx
<div className="flex items-center gap-3">
  <BotaoRedondo rotulo="Diminuir BPM" onClick={() => m.mudarBpm(m.bpm - 1)}>
    <Minus className="size-4" />
  </BotaoRedondo>
  <input
    type="range"
    min={30}
    max={300}
    value={m.bpm}
    onChange={(e) => m.mudarBpm(Number(e.target.value))}
    aria-label="BPM"
    className="w-full accent-primary"
  />
  <BotaoRedondo rotulo="Aumentar BPM" onClick={() => m.mudarBpm(m.bpm + 1)}>
    <Plus className="size-4" />
  </BotaoRedondo>
</div>

<div className="flex gap-3">
  <button
    onClick={m.tap}
    className="flex items-center gap-2 rounded-lg border px-5 py-3.5 font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
  >
    <Hand className="size-5" />
    Tap
  </button>
  <button
    onClick={() => setTocando(!tocando)}
    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3.5 font-semibold text-primary-foreground hover:brightness-110"
  >
    {tocando ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
    {tocando ? 'Parar' : 'Começar'}
    <kbd className="ml-2 hidden rounded border border-primary-foreground/30 px-1.5 text-xs font-medium opacity-70 sm:inline">
      espaço
    </kbd>
  </button>
</div>
```

- O − e o + ficam nas **pontas do slider**: os três controlam a mesma coisa, então ficam juntos.
- `flex-1` no Começar: ele ocupa **todo o espaço que sobra**. É a ação principal, então é o maior botão.
- `fill-current`: preenche o ícone de play/pause (o lucide vem só com contorno). Fica com cara de botão de transporte.
- `hover:brightness-110`: no hover, clareia 10% a cor que já está lá. Não precisa de outra cor.
- **`<kbd>`**: a tag HTML para "tecla do teclado". Lembra que o espaço funciona. `hidden sm:inline` = some no celular (lá não tem teclado).

### ✅ O que você deve ver

A coluna da esquerda pronta: o visor escuro com 4 LEDs em barra e o BPM gigante com "Andante" embaixo; o slider entre − e +; Tap e um Começar largo. Dê Play: os LEDs acendem com um rastro, e o primeiro é âmbar. Arraste o BPM até 130: vira *Allegro*.

### Passo 2.7 — Os ajustes

No lugar de `{/* Passo 2.7 entra aqui */}`, os quatro grupos. Primeiro **Compasso**, escrito como na partitura:

```tsx
<Grupo titulo="Compasso">
  <div className="grid grid-cols-6 gap-2">
    {COMPASSOS.map((n) => (
      <Escolha key={n} ativo={m.tempos === n} onClick={() => m.setTempos(n)} rotulo={`${n} por 4`}>
        <span className="flex flex-col items-center font-heading text-lg leading-none font-semibold tabular-nums font-stretch-expanded">
          <span>{n}</span>
          <span className="my-1 h-px w-4 bg-current opacity-40" />
          <span>4</span>
        </span>
      </Escolha>
    ))}
  </div>
</Grupo>
```

- `grid grid-cols-6`: 6 ladrilhos de mesma largura, sempre alinhados.
- A fração é uma coluna com o número de cima, uma **linha de 1px** (`h-px`) e o 4 embaixo. `bg-current` pinta a linha com a cor do texto.
- Na partitura, a fórmula de compasso não tem a linha no meio. Aqui ela ajuda a ler "4 sobre 4" num tamanho pequeno.

**Subdivisão**, com a figura desenhada:

```tsx
<Grupo titulo="Subdivisão">
  <div className="grid grid-cols-4 gap-2">
    {SUBDIVISOES.map((s) => (
      <Escolha key={s.valor} ativo={m.subdivisao === s.valor} onClick={() => m.setSubdivisao(s.valor)}>
        <IconeSubdivisao valor={s.valor} className="h-8 w-auto" />
        <span className="text-xs">{s.nome}</span>
      </Escolha>
    ))}
  </div>
</Grupo>
```

`h-8 w-auto`: altura fixa e largura proporcional (a semicolcheia, com 4 notas, é mais larga que a semínima).

**Som**, com ícone, prévia, volume e acento:

```tsx
<Grupo titulo="Som">
  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
    {SONS.map((s) => {
      const Icone = IconesSom[s.id]
      return (
        <Escolha
          key={s.id}
          ativo={m.som.id === s.id}
          onClick={() => {
            m.setSom(s)
            m.ouvir(s)
          }}
        >
          <Icone className="size-7" />
          <span className="text-xs">{s.nome}</span>
        </Escolha>
      )
    })}
  </div>
  <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4">
    <label className="flex flex-1 items-center gap-3 text-sm text-muted-foreground">
      <Volume2 className="size-5 shrink-0" />
      <input
        type="range"
        min={0.05}
        max={1}
        step={0.05}
        value={m.volume}
        onChange={(e) => m.setVolume(Number(e.target.value))}
        aria-label="Volume"
        className="w-full min-w-32 accent-primary"
      />
    </label>
    <Interruptor ligado={m.acento} onChange={m.setAcento}>
      Acento no 1
    </Interruptor>
  </div>
</Grupo>
```

- **`const Icone = IconesSom[s.id]`**: pega o componente do dicionário e guarda numa variável. Para usar uma variável como tag (`<Icone />`), o nome **tem que começar com maiúscula**: `<icone />` o React acharia que é uma tag HTML chamada "icone".
- `grid-cols-3 sm:grid-cols-5`: no celular, 3 por linha (5 ficaria apertado demais); a partir de 640px, os 5 numa linha.
- `m.som.id === s.id`: compara pelo `id`. Antes era `m.som === s`, que compara se é **o mesmo objeto** (como `ReferenceEquals` no C#). Comparar pelo `id` é mais seguro.
- O `onClick` faz **duas** coisas: escolhe e toca uma vez.
- `onChange={m.setAcento}`: dá para passar a função direto, sem `(v) => m.setAcento(v)`. O `Interruptor` chama `onChange(true/false)`, e `setAcento` aceita exatamente isso.

**Speed trainer**, com o interruptor no título:

```tsx
<Grupo
  titulo="Speed trainer"
  extra={
    <Interruptor ligado={m.trainer.ativo} onChange={(v) => m.setTrainer({ ...m.trainer, ativo: v })}>
      {m.trainer.ativo ? 'Ligado' : 'Desligado'}
    </Interruptor>
  }
>
  <div className={`grid grid-cols-3 gap-2 ${m.trainer.ativo ? '' : 'opacity-50'}`}>
    <Numero rotulo="Subir" unidade="BPM" valor={m.trainer.aumento} onChange={(v) => m.setTrainer({ ...m.trainer, aumento: v })} />
    <Numero rotulo="A cada" unidade="compassos" valor={m.trainer.aCada} onChange={(v) => m.setTrainer({ ...m.trainer, aCada: v })} />
    <Numero rotulo="Até" unidade="BPM" valor={m.trainer.teto} onChange={(v) => m.setTrainer({ ...m.trainer, teto: v })} />
  </div>
</Grupo>
```

- **JSX dentro de uma prop**: `extra={<Interruptor .../>}`. Um pedaço de tela é um valor como outro qualquer, dá para passar como argumento.
- `opacity-50` quando desligado: os campos continuam editáveis (você pode configurar antes de ligar), mas ficam "apagados", indicando que não estão valendo.

### ✅ O que você deve ver

A tela inteira como na imagem "Depois" do começo da aula:

1. **Compasso** com frações; **Subdivisão** com as notas desenhadas; **Som** com 5 ícones. O escolhido tem borda âmbar e a luz piloto no canto.
2. Clicar num som toca ele uma vez.
3. O interruptor do acento desliza; desligado, o primeiro LED fica claro em vez de âmbar.
4. O speed trainer: desligado, os três campos ficam apagados.
5. **Role a página** num monitor grande: o visor fica parado, os ajustes rolam.
6. **Estreite a janela** (ou `F12` → ícone de celular): vira uma coluna só, com o visor em cima e os sons em 3 por linha.

---

## 🏋️ Exercícios

### Exercício 1 — Mais um instrumento 🥁

Crie um som "Cowbell grave" que **reaproveita** o `cowbell.wav` e o ícone do cowbell, sem arquivo novo. O que falta no código para um som poder usar o arquivo de outro?

<details><summary>Gabarito</summary>

Hoje o `id` serve para duas coisas: nome do arquivo **e** chave do ícone. Para separar, adicione um campo `arquivo` ao `type Som`:

```ts
export type Som = { id: string; nome: string; arquivo: string }
// ...
{ id: 'cowbell-grave', nome: 'Cowbell grave', arquivo: 'cowbell' },
```

Carregue com `` `/sons/${s.arquivo}.wav` `` e, na página, pegue o ícone com `IconesSom[s.arquivo]`. Os outros sons ganham `arquivo` igual ao `id`. Para ele soar grave de verdade, você ainda precisaria de um campo `altura` (por exemplo `0.75`) usado no `tocarAmostra` no lugar do `1`.

</details>

### Exercício 2 — Esperando os sons 🤔

O `useEffect` de carregar usa `.then`. O que acontece se você der Play **antes** de o cowbell terminar de carregar? E por que isso não é um problema na prática?

<details><summary>Resposta</summary>

O `amostras.current['cowbell']` ainda é `undefined`, então o `if (buffer)` pula aquele clique: silêncio, sem erro. Assim que o `.then` guardar o buffer, o próximo clique já toca. Na prática os arquivos têm 5 a 30 KB e vêm do seu próprio computador: carregam em poucos milissegundos, muito antes de qualquer pessoa conseguir clicar.

</details>

### Exercício 3 — Andamento na cor certa 🎨

Faça o nome do andamento (*Andante*, *Allegro*...) ficar **âmbar** quando o speed trainer estiver ligado, como um aviso de "o BPM vai mudar sozinho". Sem cor fixa!

<details><summary>Gabarito</summary>

```tsx
<span className={`ml-2 italic ${m.trainer.ativo ? 'text-primary' : ''}`}>{andamento}</span>
```

`text-primary` é o token do âmbar: se o tema mudar, o aviso muda junto.

</details>

### Exercício 4 — Pergunta rápida 🤔

Por que o acento agora usa `playbackRate` e não uma frequência diferente, como antes?

<details><summary>Resposta</summary>

Porque não existe mais oscilador: a gravação **já tem** a sua altura dentro dela. A única forma de deixá-la mais aguda (sem uma segunda gravação) é tocá-la mais rápido. Efeito colateral: ela também fica um pouco mais curta, o que nem se nota num som de 0,1 s.

</details>

---

## 📖 Glossário novo

| Termo | Significado |
|---|---|
| **`public/`** | Pasta de arquivos servidos como estão, na raiz do site. O `wwwroot`. |
| **`fetch`** | Faz uma requisição HTTP. O `HttpClient` que já vem no navegador. |
| **`Promise<T>`** | Um valor que vai chegar depois. O `Task<T>`. |
| **`async` / `await`** | Iguais aos do C#. |
| **`.then(fn)`** | "Quando a Promise terminar, roda `fn` com o valor." O `ContinueWith`. |
| **`AudioBuffer`** | Um som decodificado, pronto na memória. |
| **`BufferSource`** | Toca um `AudioBuffer` uma vez, num horário exato. |
| **`playbackRate`** | Velocidade da gravação: maior = mais agudo e mais curto. |
| **`useEffect(fn, [])`** | Roda uma vez, quando a tela aparece. O `return` roda quando ela some. |
| **`Record<K, V>`** | O `Dictionary<K, V>`. |
| **SVG** | Desenho descrito em texto, que estica sem perder qualidade. |
| **`currentColor`** | "A cor do texto aqui." Faz ícones seguirem o tema. |
| **`find`** | O `First` do LINQ (devolve `undefined` se ninguém passar). |
| **Prop opcional `?`** | Uma prop que pode não vir. |
| **`grid` / `grid-cols-N`** | Layout em tabela com N colunas iguais. |
| **`sticky`** | Gruda na tela ao rolar. |
| **`relative` / `absolute`** | O filho `absolute` se posiciona dentro do pai `relative`. |
| **`role="switch"`** | Diz ao leitor de tela que o botão é um interruptor. |

---

✅ **Terminou?** Me avise. Na **aula 03d**: o **drone** (uma nota contínua para treinar escalas e afinação) e o **painel flutuante**, que deixa o metrônomo acessível em qualquer tela do app.
