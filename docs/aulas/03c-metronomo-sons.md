# Aula 03c — Metrônomo (parte 3): sons de verdade

> 💡 Abra com **`Ctrl+Shift+V`**. Deixe rodando: `npm run dev --prefix web` e o navegador em http://localhost:5173/metronomo. **Ligue o som.**

## O que vamos fazer (e o que NÃO vamos fazer)

Hoje o "Cowbell" do metrônomo é uma onda quadrada fingindo ser cowbell. Vamos trocar por **gravações de verdade**: woodblock, claves, cowbell e chimbal (mais o bipe clássico).

**Só isso.** A tela **não muda** nesta aula. O visual novo é a aula 03d. Assim, se algo quebrar, você sabe que foi culpa dos sons.

Você mexe em **um único arquivo**: `web/src/hooks/useMetronome.ts`. São 5 passos pequenos. No fim de cada passo existe um "✅ confira", e no fim da aula tem o arquivo inteiro para comparar com o seu.

**Pré-requisito:** a aula 03b feita (seu `useMetronome.ts` tem `SONS`, `tocarClique`, `config`, `tap` e `trainer`).

**Já está pronto (eu fiz, é infraestrutura):**
- `web/public/sons/*.wav`: os 5 sons, já cortados para começar no instante exato da batida. Vêm de uma biblioteca de domínio público (créditos em `web/public/sons/CREDITOS.md`).

---

## Como ler as instruções desta aula

Para não ter dúvida sobre **onde** mexer, toda mudança vem neste formato:

> 📍 **Onde:** o arquivo e a parte dele.
> ❌ **Está assim hoje:** o código atual (para você achar o lugar).
> ✅ **Deixe assim:** o código novo, **completo** (não só um pedaço).

Regra: onde eu mostro "Deixe assim", você **apaga o bloco antigo inteiro e cola o novo**. Nada de adivinhar qual linha trocar.

---

## Conceitos antes do código (leia com calma, sem digitar nada ainda)

### Conceito 1 — A pasta `public/`

Tudo que está em `web/public/` é entregue **do jeito que está**, na raiz do site. É o `wwwroot` do ASP.NET.

👉 **Teste agora:** abra http://localhost:5173/sons/cowbell.wav no navegador. Vai tocar o cowbell. Feche a aba e volte.

Isso significa que, no código, o endereço do arquivo é só `/sons/cowbell.wav`.

### Conceito 2 — Coisas que demoram: `Promise`, `async` e `await`

Baixar um arquivo leva tempo. O navegador **não pode travar a tela** esperando. Então, em vez de devolver o arquivo, a função devolve uma **promessa** de que o arquivo vai chegar: uma `Promise`.

Você já conhece isso. É o `Task` do C#:

```csharp
// C#
async Task<byte[]> Baixar(string url) {
    var resposta = await http.GetAsync(url);
    return await resposta.Content.ReadAsByteArrayAsync();
}
```

```ts
// TypeScript: igualzinho
async function baixar(url: string) {
  const resposta = await fetch(url)
  return await resposta.arrayBuffer()
}
```

| C# | JavaScript | Observação |
|---|---|---|
| `Task<T>` | `Promise<T>` | "Um T que vai chegar depois" |
| `async` / `await` | `async` / `await` | Idênticos |
| `HttpClient.GetAsync(url)` | `fetch(url)` | Já vem pronto no navegador |
| `byte[]` | `ArrayBuffer` | Os bytes de um arquivo |
| `task.ContinueWith(t => ...)` | `promise.then((valor) => ...)` | "Quando chegar, rode isto" |

O `.then(...)` é o jeito de esperar **sem** `await`. Você vai usá-lo no Passo 3, e eu explico por que lá.

### Conceito 3 — O caminho de uma gravação até a caixa de som

Na aula 03 você montou: `oscilador → ganho → saída` (o oscilador inventava a onda). Agora a fonte do som é um arquivo:

```
cowbell.wav ──fetch──▶ bytes ──decodeAudioData──▶ AudioBuffer ──▶ BufferSource ──▶ ganho ──▶ 🔊
 (arquivo)           (ainda    (transforma em      (o som pronto    (o "toca-discos"   (volume)
                      cru)      números)            na memória)      que toca 1 vez)
```

Duas peças novas:
- **`AudioBuffer`**: o som já decodificado na memória. Uma lista de números (a posição do alto-falante a cada instante). Você carrega **uma vez**.
- **`BufferSource`**: o "toca-discos" que toca um `AudioBuffer`. É o primo do oscilador. **Cada um toca uma única vez**, então criamos um novo a cada clique (é barato: o `AudioBuffer`, que é a parte pesada, é sempre o mesmo).

---

## Passo 1 — Os sons viram arquivos

> 📍 **Onde:** `web/src/hooks/useMetronome.ts`, no topo, entre as duas constantes (`INTERVALO_MS`, `JANELA_S`) e o `export type SpeedTrainer`.

❌ **Está assim hoje** (apague **tudo isto**, do `export type Som` até o `]` que fecha a lista):

```ts
export type Som = {
    nome: string
    onda: OscillatorType
    acento: number     // frequência (Hz) do tempo 1
    ...
}

export const SONS: Som[] = [
    { nome: 'Eletrônico', onda: 'sine', ... },
    { nome: 'Madeira', ... },
    { nome: 'Cowbell', ... },
]
```

✅ **Deixe assim:**

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

**O que mudou, em palavras:**
- Cada som deixou de ter 6 campos (onda, 3 frequências, duração) e ficou com **2**: `id` e `nome`. Toda a "receita do som" agora está dentro do arquivo `.wav`.
- O `id` precisa ser **igual ao nome do arquivo**: `'cowbell'` ↔ `cowbell.wav`.
- A nova constante `ALTURA_ACENTO` resolve o acento. Antes, o tempo 1 usava outra frequência. Agora tocamos a **mesma gravação mais rápida**, o que a deixa mais aguda (como um disco de vinil girando rápido demais). `1.33` = uma quarta acima, o intervalo que metrônomos de verdade costumam usar.

⚠️ **O VS Code vai sublinhar de vermelho** vários lugares (`som.onda`, `c.som.sub`...). É esperado: o código ainda usa os campos que você acabou de apagar. Os passos 2 e 4 consertam. Não tente consertar agora.

---

## Passo 2 — Duas funções novas de áudio

> 📍 **Onde:** `web/src/hooks/useMetronome.ts`, no **final** do arquivo, onde fica a função `tocarClique`.

❌ **Está assim hoje:** a função `tocarClique` inteira (começa em `function tocarClique(ctx: AudioContext, ...`).

✅ **Apague a `tocarClique` inteira e deixe no lugar:**

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

### Função 1: `carregarAmostra` (baixar e decodificar), linha a linha

| Linha | O que faz |
|---|---|
| `async function ...` | Marca que a função usa `await` e devolve uma `Promise<AudioBuffer>`. |
| `await fetch(url)` | Pede o arquivo ao servidor e **espera** a resposta chegar. |
| `await resposta.arrayBuffer()` | Pega o conteúdo da resposta como bytes crus. |
| `ctx.decodeAudioData(bytes)` | Transforma os bytes do `.wav` em um `AudioBuffer`. Também devolve uma Promise, e como estamos num `return`, ela passa direto para quem chamou. |

### Função 2: `tocarAmostra` (tocar uma vez, num horário exato), linha a linha

| Linha | O que faz |
|---|---|
| `createBufferSource()` | Cria o "toca-discos" (descartável: toca uma vez). |
| `createGain()` | Cria o botão de volume (igual ao da aula 03). |
| `fonte.buffer = buffer` | Coloca o disco no toca-discos. |
| `fonte.playbackRate.value = altura` | Velocidade: `1` normal, `1.33` é 33% mais rápido e mais agudo. **É o nosso acento.** |
| `ganho.gain.value = volume` | Volume fixo. Não precisa mais daquela rampa que fazia o "tic" sumir: a gravação termina sozinha. |
| `fonte.connect(ganho).connect(ctx.destination)` | Liga os fios: toca-discos → volume → alto-falante. |
| `fonte.start(quando)` | Toca no **horário exato** do relógio do áudio (o `quando`). O agendador continua funcionando do mesmo jeito. |

Repare que **não existe `stop`**: quando a gravação acaba, a fonte para sozinha.

✅ **Confira:** o sublinhado vermelho de `tocarClique` ainda existe no `while` (vamos consertar no Passo 4). Nas duas funções novas **não** deve haver vermelho.

---

## Passo 3 — Carregar os sons quando a tela abre

Para tocar, precisamos que os 5 sons estejam **na memória antes**. O lugar certo é "uma vez, quando o metrônomo aparece na tela".

### Conceito novo — `useEffect` tem 3 formas

Você já usou duas. Agora vem a terceira:

| Como escreve | Quando roda | Analogia em C# |
|---|---|---|
| `useEffect(() => {...})` | Depois de **toda** renderização | (não tem equivalente bom) |
| `useEffect(() => {...}, [tocando])` | Quando `tocando` **muda** | Um `PropertyChanged` |
| `useEffect(() => {...}, [])` ← **nova** | **Uma vez só**, quando o componente aparece | O **construtor** |

E o `return () => {...}` de dentro do efeito roda quando o componente **sai da tela**: é o `Dispose()`.

### Conceito novo — `Record<string, T>`, o `Dictionary`

```ts
const amostras: Record<string, AudioBuffer> = {}
amostras['cowbell'] = buffer      // guardar
const b = amostras['cowbell']     // ler
```

É um `Dictionary<string, AudioBuffer>`. Uma diferença importante: ler uma chave que **não existe não dá exceção**, devolve `undefined`.

### Onde colar

> 📍 **Onde:** `web/src/hooks/useMetronome.ts`, dentro da função `useMetronome`, logo **abaixo** da linha `const audio = useRef<AudioContext | null>(null)`.

❌ **Está assim hoje:**

```ts
    const audio = useRef<AudioContext | null>(null)

    const config = useRef({ bpm, tempos, subdivisao, som, volume, acento, trainer })
```

✅ **Deixe assim** (as linhas novas são as de `amostras` até o `}, [])`):

```ts
    const audio = useRef<AudioContext | null>(null)
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

    const config = useRef({ bpm, tempos, subdivisao, som, volume, acento, trainer })
```

### Linha a linha

| Linha | O que faz |
|---|---|
| `useRef<Record<string, AudioBuffer>>({})` | Uma caixa com um dicionário vazio dentro. Vai guardar os 5 sons: `{ cowbell: ..., claves: ... }`. |
| `useEffect(() => {...}, [])` | A lista vazia = roda **uma vez**, quando a tela do metrônomo abre. |
| `const ctx = new AudioContext()` | Cria o "estúdio de áudio". Antes isso nascia no Play; agora nasce aqui, porque precisamos dele para decodificar. |
| `audio.current = ctx` | Guarda o estúdio na caixa, para o resto do hook usar. |
| `for (const s of SONS)` | O `foreach` do C#: repete para cada som da lista. |
| `` `/sons/${s.id}.wav` `` | Monta o endereço. Com `s.id = 'cowbell'` vira `/sons/cowbell.wav`. (As crases `` ` `` permitem `${...}` dentro do texto, como o `$"..."` do C#.) |
| `.then((buffer) => {...})` | "Quando o som terminar de carregar, rode isto". |
| `amostras.current[s.id] = buffer` | Guarda o som pronto no dicionário. |
| `return () => { ctx.close() }` | Ao sair da tela, desliga o áudio (o `Dispose()`). |

### Três "por quês"

1. **Por que `.then` e não `await`?** A função que vai dentro de `useEffect` **não pode ser `async`**: o React espera que ela devolva a função de limpeza, e uma função `async` devolveria uma Promise no lugar. Então usamos `.then`.
2. **Por que `amostras` é um `useRef` e não um `useState`?** Porque a tela **não precisa se redesenhar** quando um som termina de carregar. Só o agendador lê. (Mesma regra da aula 03: o que não aparece na tela vai no ref.)
3. **Os 5 sons carregam ao mesmo tempo**, ninguém espera ninguém. São arquivos de poucos KB, vindos do seu próprio computador: chegam em milissegundos.

✅ **Confira:** abra o navegador com `F12` → aba **Network** (Rede) → recarregue a página (`F5`). Digite `wav` no filtro. Devem aparecer 5 linhas: `bipe.wav`, `woodblock.wav`... com status **200**. Se aparecer **404**, o `id` de algum som não bate com o nome do arquivo.

---

## Passo 4 — O agendador toca a gravação

Agora vamos conectar tudo. Duas mudanças dentro do `useEffect` do **Play** (o que tem `[tocando]` no fim).

### 4a. O contexto de áudio já existe

> 📍 **Onde:** começo do `useEffect` que tem `if (!tocando) return`.

❌ **Está assim hoje:**

```ts
        audio.current ??= new AudioContext()
        const ctx = audio.current
        ctx.resume()
```

✅ **Deixe assim:**

```ts
        const ctx = audio.current
        if (!ctx) return
        ctx.resume()
```

**Por quê?** O Passo 3 já criou o contexto, então o Play não precisa criar. O `if (!ctx) return` só acalma o TypeScript: ele sabe que a caixa *poderia* estar vazia (`null`), e a gente garante que, se estiver, não faz nada. (`ctx.resume()` continua aí: o navegador só libera som depois de um clique do usuário, e o clique no botão Começar é esse clique.)

### 4b. Tocar a amostra em vez do oscilador

> 📍 **Onde:** dentro do `while`, logo depois das linhas `const ehTempo` e `const tempo`.

❌ **Está assim hoje** (estas 2 linhas):

```ts
                const frequencia = !ehTempo ? c.som.sub : tempo === 0 && c.acento ? c.som.acento : c.som.tempo
                tocarClique(ctx, proximoClique, c.som, frequencia, ehTempo ? c.volume : c.volume * 0.5)
```

✅ **Troque por:**

```ts
                const buffer = amostras.current[c.som.id]
                if (buffer) {
                    const altura = tempo === 0 && ehTempo && c.acento ? ALTURA_ACENTO : 1
                    tocarAmostra(ctx, buffer, proximoClique, ehTempo ? c.volume : c.volume * 0.45, altura)
                }
```

**Linha a linha:**

| Linha | O que faz |
|---|---|
| `amostras.current[c.som.id]` | Pega do dicionário o som escolhido (`c.som` é o som selecionado na tela). |
| `if (buffer) {...}` | Se o som ainda não carregou (alguém deu Play 1 milissegundo depois de abrir a tela), **pula esse clique** em vez de dar erro. |
| `tempo === 0 && ehTempo && c.acento` | Três condições juntas: é o **tempo 1**, E é o clique **do tempo** (não de uma subdivisão), E o acento está **ligado**. Só então a altura é `1.33`. |
| `? ALTURA_ACENTO : 1` | `condição ? valor_se_sim : valor_se_não`. Mesmo `?:` do C#. |
| `ehTempo ? c.volume : c.volume * 0.45` | As subdivisões tocam com 45% do volume, para os tempos continuarem se destacando. |

✅ **Confira:** os sublinhados vermelhos devem ter sumido do arquivo, **exceto** `ouvir` (que ainda não existe) se a página reclamar. Se ainda houver vermelho, compare com o arquivo completo no fim da aula.

---

## Passo 5 — Ouvir o som antes de escolher

Quando você clicar num som na tela, queremos que ele **toque uma vez**, para você ouvir. Essa função vai no hook e a página (aula 03d) a chama.

### 5a. A função

> 📍 **Onde:** no hook, logo **depois** da função `tap` e **antes** do `useEffect` do Play.

✅ **Cole:**

```ts
    function ouvir(s: Som) {
        const ctx = audio.current
        const buffer = amostras.current[s.id]
        if (!ctx || !buffer) return
        ctx.resume()
        tocarAmostra(ctx, buffer, ctx.currentTime, config.current.volume, 1)
    }
```

| Linha | O que faz |
|---|---|
| `if (!ctx \|\| !buffer) return` | Se o estúdio ou o som ainda não existem, não faz nada. (`\|\|` é o "ou" do C#.) |
| `ctx.resume()` | O contexto nasceu quando a tela abriu, **sem clique do usuário**, então o navegador o deixou "suspenso" (mudo). O clique no som é o clique do usuário que o acorda. |
| `ctx.currentTime` | "Agora" no relógio do áudio. Tocar agora = tocar já. |
| `config.current.volume` | O volume que está na tela, lido da caixa `config`. |

### 5b. Entregar a função para a página

> 📍 **Onde:** a última linha da função `useMetronome`, o `return { ... }`.

❌ **Está assim hoje:**

```ts
    return { bpm, mudarBpm, tempos, setTempos, tocando, setTocando, tempoAtual, subdivisao, setSubdivisao, som, setSom, volume, setVolume, acento, setAcento, tap, trainer, setTrainer }
```

✅ **Deixe assim** (só acrescentou `ouvir,` depois de `tap,`):

```ts
    return { bpm, mudarBpm, tempos, setTempos, tocando, setTocando, tempoAtual, subdivisao, setSubdivisao, som, setSom, volume, setVolume, acento, setAcento, tap, ouvir, trainer, setTrainer }
```

O `return` do hook é a "vitrine": só o que está nele a página consegue usar (`m.ouvir`).

---

## ✅ O que você deve ver (e ouvir)

A tela está **igual** à da aula 03b. Só que agora os botões da linha "Som" mostram **Bipe, Woodblock, Claves, Cowbell, Chimbal**.

1. Escolha **Cowbell** e dê Play. É um cowbell de verdade 🐄🔔
2. Ouça o **tempo 1 mais agudo** que os outros.
3. Troque para **Tercina**: as subdivisões soam mais baixas.
4. Troque de som **com o metrônomo tocando**: muda no clique seguinte.
5. Desmarque "Acento no 1": todos os tempos soam iguais.

(Clicar num som ainda **não** toca uma prévia: a página só vai chamar `m.ouvir` na aula 03d.)

### Se algo deu errado

| Sintoma | Causa provável |
|---|---|
| Nenhum som sai, e o console (`F12` → Console) mostra erro vermelho | Leia a primeira linha do erro. Quase sempre é um nome digitado errado. |
| Silêncio, e na aba Network aparece **404** num `.wav` | O `id` do som não bate com o nome do arquivo em `web/public/sons/`. |
| Silêncio, sem erro nenhum | O som ainda não carregou (recarregue a página e espere 1 s) ou o computador está mudo. |
| Sublinhado vermelho em `som.onda`, `tocarClique`... | Sobrou código antigo. Procure essas palavras com `Ctrl+F` e apague/troque conforme o Passo 4. |
| `Cannot read properties of null` ao dar Play | O `if (!ctx) return` do Passo 4a não está no lugar certo. |

---

## 🔍 Seu arquivo deve estar assim (compare)

<details><summary>Clique para ver o <code>useMetronome.ts</code> inteiro</summary>

```ts
import { useEffect, useRef, useState } from 'react'

const INTERVALO_MS = 25    // de quanto em quanto tempo o agendador acorda
const JANELA_S = 0.1       // até quanto do futuro ele agenda os cliques

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

export type SpeedTrainer = {
    ativo: boolean
    aumento: number    // quantos BPM sobe
    aCada: number      // a cada quantos compassos
    teto: number       // até onde vai
}

export function useMetronome() {
    const [bpm, setBpm] = useState(100)
    const [tempos, setTempos] = useState(4)
    const [tocando, setTocando] = useState(false)
    const [tempoAtual, setTempoAtual] = useState(-1)
    const [subdivisao, setSubdivisao] = useState(1)
    const [som, setSom] = useState(SONS[0])
    const [volume, setVolume] = useState(0.6)
    const [acento, setAcento] = useState(true)
    const [trainer, setTrainer] = useState<SpeedTrainer>({ ativo: false, aumento: 5, aCada: 4, teto: 160 })

    const audio = useRef<AudioContext | null>(null)
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

    const config = useRef({ bpm, tempos, subdivisao, som, volume, acento, trainer })
    const toques = useRef<number[]>([])

    useEffect(() => {
        config.current = { bpm, tempos, subdivisao, som, volume, acento, trainer }
    })

    function mudarBpm(valor: number) {
        setBpm(Math.min(300, Math.max(30, Math.round(valor))))
    }

    function tap() {
        const agora = performance.now()
        toques.current = [...toques.current.filter((t) => agora - t < 2500), agora].slice(-5)

        const t = toques.current
        if (t.length >= 2) {
            const intervaloMedio = (t[t.length - 1] - t[0]) / (t.length - 1)
            mudarBpm(60000 / intervaloMedio)
        }
    }

    function ouvir(s: Som) {
        const ctx = audio.current
        const buffer = amostras.current[s.id]
        if (!ctx || !buffer) return
        ctx.resume()
        tocarAmostra(ctx, buffer, ctx.currentTime, config.current.volume, 1)
    }

    useEffect(() => {
        if (!tocando) return

        const ctx = audio.current
        if (!ctx) return
        ctx.resume()

        let proximoClique = ctx.currentTime + 0.05
        let passo = 0          // conta cada click, inclusive as subdivisões
        let compassos = 0
        const timeouts: number[] = []

        const agendador = setInterval(() => {
            while (proximoClique < ctx.currentTime + JANELA_S) {
                const c = config.current
                const ehTempo = passo % c.subdivisao === 0
                const tempo = Math.floor(passo / c.subdivisao)

                const buffer = amostras.current[c.som.id]
                if (buffer) {
                    const altura = tempo === 0 && ehTempo && c.acento ? ALTURA_ACENTO : 1
                    tocarAmostra(ctx, buffer, proximoClique, ehTempo ? c.volume : c.volume * 0.45, altura)
                }

                if (ehTempo) {
                    const atraso = (proximoClique - ctx.currentTime) * 1000
                    timeouts.push(setTimeout(() => setTempoAtual(tempo), atraso))
                }

                proximoClique += 60 / c.bpm / c.subdivisao
                passo = (passo + 1) % (c.tempos * c.subdivisao)
                if (passo === 0) {
                    compassos++
                    const t = c.trainer
                    if (t.ativo && compassos % t.aCada === 0 && c.bpm < t.teto) {
                        c.bpm = Math.min(t.teto, c.bpm + t.aumento)
                        setBpm(c.bpm)
                    }
                }
            }
        }, INTERVALO_MS)

        return () => {
            clearInterval(agendador)
            timeouts.forEach(clearTimeout)
            setTempoAtual(-1)
        }
    }, [tocando])

    return { bpm, mudarBpm, tempos, setTempos, tocando, setTocando, tempoAtual, subdivisao, setSubdivisao, som, setSom, volume, setVolume, acento, setAcento, tap, ouvir, trainer, setTrainer }
}

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

</details>

Se o seu funciona e só difere em espaços ou linhas em branco, tudo bem.

---

## 🏋️ Exercícios

### Exercício 1 — Esperando os sons 🤔

O que acontece se você der Play **antes** de o cowbell terminar de carregar? E por que isso não é um problema na prática?

<details><summary>Resposta</summary>

`amostras.current['cowbell']` ainda é `undefined`, então o `if (buffer)` pula aquele clique: silêncio, sem erro. Assim que o `.then` guardar o buffer, o próximo clique já toca. Na prática os arquivos têm 5 a 30 KB e vêm do seu próprio computador: carregam em poucos milissegundos, muito antes de qualquer pessoa conseguir clicar.

</details>

### Exercício 2 — Pergunta rápida 🤔

Por que o acento agora usa `playbackRate` e não uma frequência diferente, como antes?

<details><summary>Resposta</summary>

Porque não existe mais oscilador: a gravação **já tem** a sua altura dentro dela. A única forma de deixá-la mais aguda (sem uma segunda gravação) é tocá-la mais rápido. Efeito colateral: ela também fica um pouco mais curta, o que nem se nota num som de 0,1 s.

</details>

### Exercício 3 — Acento mais forte 🎚️

Mude o acento para soar uma **oitava** acima (o dobro da frequência). Onde você mexe, e em quantos lugares?

<details><summary>Resposta</summary>

Em **um** lugar: a constante `ALTURA_ACENTO` no topo do arquivo, de `1.33` para `2`. É a vantagem de dar nome a um número em vez de espalhá-lo pelo código.

</details>

### Exercício 4 — Mais um instrumento 🥁 (desafio)

Crie um som "Cowbell grave" que **reaproveita** o `cowbell.wav`, sem arquivo novo. O que falta no código para um som poder usar o arquivo de outro?

<details><summary>Gabarito</summary>

Hoje o `id` serve para duas coisas: nome do arquivo **e** chave do ícone (na aula 03d). Para separar, adicione um campo `arquivo` ao `type Som`:

```ts
export type Som = { id: string; nome: string; arquivo: string }
// ...
{ id: 'cowbell-grave', nome: 'Cowbell grave', arquivo: 'cowbell' },
```

Carregue com `` `/sons/${s.arquivo}.wav` `` e guarde no dicionário pela chave `s.arquivo`. Os outros sons ganham `arquivo` igual ao `id`. Para ele soar grave de verdade, você ainda precisaria de um campo `altura` (por exemplo `0.75`) usado no `tocarAmostra` no lugar do `1`.

</details>

---

## 📖 Glossário novo

| Termo | Significado |
|---|---|
| **`public/`** | Pasta de arquivos servidos como estão, na raiz do site. O `wwwroot`. |
| **`fetch`** | Faz uma requisição HTTP. O `HttpClient` que já vem no navegador. |
| **`Promise<T>`** | Um valor que vai chegar depois. O `Task<T>`. |
| **`async` / `await`** | Iguais aos do C#. |
| **`.then(fn)`** | "Quando a Promise terminar, rode `fn` com o valor." O `ContinueWith`. |
| **`AudioBuffer`** | Um som decodificado, pronto na memória. |
| **`BufferSource`** | O "toca-discos" descartável: toca um `AudioBuffer` uma vez, num horário exato. |
| **`playbackRate`** | Velocidade da gravação: maior = mais agudo e mais curto. |
| **`useEffect(fn, [])`** | Roda uma vez, quando a tela aparece. O `return` roda quando ela some (construtor / `Dispose`). |
| **`Record<K, V>`** | O `Dictionary<K, V>`. Chave inexistente devolve `undefined`. |

---

✅ **Terminou e ouviu o cowbell?** Me avise. Na **aula 03d** vamos dar ao metrônomo a cara de um equipamento: visor com LEDs, compassos escritos como na partitura e um ícone para cada instrumento. Ela é feita em passos bem pequenos, com um "mini-curso" de como ler as classes do Tailwind.
