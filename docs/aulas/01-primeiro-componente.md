# Aula 01 — Como uma página React funciona (do zero absoluto)

> 💡 Abra esta aula no VS Code com **`Ctrl+Shift+V`** para ver formatado.
> Deixe o `npm run dev` rodando e o navegador aberto em http://localhost:5173 do lado.

Nesta aula você vai entender **cada linha** do `App.tsx` que você digitou. Não precisa decorar nada, só entender a ideia. A gente vai repetir esses conceitos em todos os módulos.

---

## Parte 0 — As 3 linguagens do navegador

Todo site é feito de 3 coisas:

| Linguagem | Papel | Analogia com uma guitarra |
|---|---|---|
| **HTML** | A **estrutura**: o que existe na tela (título, botão, caixa, texto) | O corpo e o braço: as peças |
| **CSS** | A **aparência**: cor, tamanho, espaçamento, posição | A pintura e o acabamento |
| **JavaScript** | O **comportamento**: o que acontece quando algo muda ou é clicado | O que você toca nela |

Nós não escrevemos essas 3 de forma "pura". Usamos ferramentas por cima:

- **TypeScript** = JavaScript **com tipos**, como C#. O navegador não entende TypeScript, então o Vite traduz para JavaScript automaticamente.
- **React** = uma biblioteca que deixa você montar a tela em **componentes** (peças reutilizáveis).
- **Tailwind** = um jeito de escrever CSS usando **classes curtas** direto no HTML (`p-6`, `bg-neutral-950`...).
- **shadcn/ui** = componentes prontos e bonitos (Card, Badge, Button...) que ficam **dentro do seu projeto**, em `web/src/components/ui/`.
- **Vite** = o "servidor de desenvolvimento". Ele traduz tudo, serve no navegador e **atualiza a tela sozinho** quando você salva um arquivo.

---

## Parte 1 — O caminho até a sua tela

Quando você abre http://localhost:5173, acontece isso:

```
index.html  →  main.tsx  →  App.tsx  →  o que aparece na tela
```

### 1. `web/index.html`: a página "vazia"
```html
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
```
- `<div id="root"></div>` é uma **caixa vazia** com o nome "root" (raiz). Tudo do app vai ser desenhado dentro dela.
- `<script src="/src/main.tsx">` manda o navegador rodar o arquivo `main.tsx`.

### 2. `web/src/main.tsx`: liga o React na caixa
```tsx
createRoot(document.getElementById('root')!).render(<App />)
```
Lendo em português: "React, pegue a caixa `root` e desenhe o componente `App` dentro dela."

> Em C#, seria como o `Program.cs`: o ponto de entrada que dá a partida. Você quase nunca mexe nele.

### 3. `web/src/App.tsx`: o seu componente
É aqui que você trabalha. Vamos dissecar.

---

## Parte 2 — HTML em 3 minutos

HTML é feito de **tags**. Uma tag abre e fecha:

```html
<p>Olá</p>                ← um parágrafo de texto
<span>API</span>          ← um pedaço de texto "solto"
<div> ... </div>          ← uma caixa genérica (agrupa coisas)
<main> ... </main>        ← a caixa principal da página
<h1>Título</h1>           ← um título grande
```

Tags podem ter **atributos**, que são as configurações da tag:
```html
<div id="root" class="vermelho">...</div>
```

E tags podem ficar **dentro** de outras, formando uma árvore:
```html
<main>
  <div>
    <span>API</span>
  </div>
</main>
```

---

## Parte 3 — TypeScript para quem sabe C#

| C# | TypeScript | Observação |
|---|---|---|
| `using System.Linq;` | `import { useState } from "react"` | Traz algo de outro arquivo/biblioteca |
| `public class X` | `export default App` | Deixa outros arquivos usarem |
| `var x = 5;` | `const x = 5` | `const` = não muda. Ponto e vírgula é opcional |
| `string`, `bool` | `string`, `boolean` | Quase iguais |
| `string? nome` | `nome: string \| null` | O `\|` significa "OU". "Pode ser string ou null" |
| `x => x * 2` | `(x) => x * 2` | Lambda: igualzinho! Em TS se chama *arrow function* |
| `a == b` | `a === b` | Em TS use sempre **três** iguais (compara direito) |
| `ok ? "sim" : "não"` | `ok ? 'sim' : 'não'` | Ternário: igual. Aspas simples ou duplas, tanto faz |
| `record Health(string Status, bool Database)` | `type Health = { status: string, database: boolean }` | Descreve o "formato" de um objeto |

### A sua linha 6
```ts
type Health = { status: string, database: boolean }
```
"Um `Health` é um objeto que tem `status` (texto) e `database` (verdadeiro/falso)." É exatamente o JSON que a sua API devolve: `{"status":"ok","database":true}`. É o equivalente a um **DTO**.

### Desestruturação (aparece muito!)
```ts
const pessoa = { nome: "Pietro", idade: 25 }
const { nome, idade } = pessoa   // tira os campos de dentro do objeto
```
Isso é parecido com o *deconstruct* do C#: `var (nome, idade) = pessoa;`.

---

## Parte 4 — JSX: HTML dentro do TypeScript

O arquivo termina em **`.tsx`** (TypeScript + **X**ML). Isso permite escrever **HTML no meio do código**:

```tsx
return <p>Olá</p>
```

Regras do JSX:

1. **`className` em vez de `class`** (porque `class` já é palavra reservada).
2. **Chaves `{ }` = "aqui entra código"**:
   ```tsx
   <span>{label}</span>        // mostra o valor da variável label
   ```
3. **Tag com letra Maiúscula = componente seu** (`<Card>`, `<Status>`). Tag com letra minúscula = HTML normal (`<div>`, `<p>`).
4. **`<> ... </>`** (o "fragmento") agrupa várias coisas sem criar uma caixa extra na tela.

### "if" dentro do HTML: o truque do `&&`
```tsx
{error && <p>API fora do ar 😢</p>}
```
Lê-se: "**se** `error` tiver valor, **então** mostre o parágrafo". Se `error` for `null`, não aparece nada.

```tsx
{!health && !error && <p>Verificando...</p>}
```
`!` = "não". Lê-se: "se **não** tem health **e não** tem erro, mostre 'Verificando...'".

---

## Parte 5 — Componentes e props

Um **componente** é só uma **função que retorna HTML**. A primeira letra é maiúscula.

```tsx
function Status({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div>
      <span>{label}</span>
      <Badge>{ok ? 'online' : 'offline'}</Badge>
    </div>
  )
}
```

- **Props** são os **parâmetros** do componente. Você passa como se fossem atributos HTML:
  ```tsx
  <Status label="API" ok={true} />
  ```
- `{ label, ok }` é a desestruturação: tira `label` e `ok` de dentro das props.
- `: { label: string; ok: boolean }` é o **tipo** das props, para o TypeScript te avisar se você passar errado.

> Em C#: `Status(string label, bool ok)`. Você escreveu **um** componente e usou **duas vezes** (API e Banco). É o mesmo princípio de um método reutilizável.

---

## Parte 6 — Estado (`useState`): a parte mais importante do React

```tsx
const [health, setHealth] = useState<Health | null>(null)
```

Destrinchando:
- `useState(null)` cria uma "caixinha de memória" que começa com `null`.
- Ela devolve **duas coisas**: o **valor atual** (`health`) e uma **função para mudar** o valor (`setHealth`).
- `<Health | null>` diz o tipo: "vai guardar um Health ou null".

**A regra de ouro do React:**
> Quando você chama `setHealth(algo)`, o React **roda a função `App()` de novo** e **redesenha a tela** com o valor novo.

Você **nunca** muda a tela "na mão". Você muda o **estado**, e a tela se ajusta sozinha. É como uma planilha: você muda a célula A1, e as fórmulas que dependem dela se recalculam.

---

## Parte 7 — Efeito (`useEffect`) e `fetch`: buscando dados na API

```tsx
useEffect(() => {
  fetch("/api/health")
    .then((res) => res.json())
    .then((data: Health) => setHealth(data))
    .catch((err) => setError(err.message))
}, [])
```

- **`useEffect(() => { ... }, [])`** = "rode este código **depois** de desenhar a tela, **uma vez só**". O `[]` no final significa "uma vez só". Parecido com um `OnInitialized` do Blazor.
- **`fetch("/api/health")`** = faz uma requisição HTTP GET. Igual ao `HttpClient.GetAsync` do C#.
- **`.then(...)`** = "quando terminar, faça isso". É o mesmo que um `await`:

```csharp
// C# equivalente:
var res = await http.GetAsync("/api/health");
var data = await res.Content.ReadFromJsonAsync<Health>();
setHealth(data);
```

- **`.catch(...)`** = o `catch` do try/catch: se der erro de rede, guarda a mensagem em `error`.

### A linha do tempo do que acontece (leia com calma!)

| Momento | Estado | O que aparece |
|---|---|---|
| 1. A página abre, `App()` roda | `health = null`, `error = null` | "Verificando..." |
| 2. Depois de desenhar, o `useEffect` dispara o `fetch` | (esperando a API) | "Verificando..." |
| 3. A API responde → `setHealth({status:"ok", database:true})` | `health = {...}` | — |
| 4. O React roda `App()` **de novo** | `health` preenchido | **API online, Banco online** |

Se a API estiver desligada, no passo 3 cai no `.catch`, `setError(...)` é chamado, e aparece "API fora do ar 😢".

---

## Parte 8 — CSS e Tailwind: dando aparência

### Os 2 conceitos de CSS que mais importam

**1. A caixa (box model):** todo elemento é uma caixa.
```
┌───────── margin (espaço FORA da caixa) ─────────┐
│ ┌─────── border (a borda) ───────────────────┐  │
│ │  ┌──── padding (espaço DENTRO) ──────────┐ │  │
│ │  │          conteúdo                     │ │  │
│ │  └───────────────────────────────────────┘ │  │
│ └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**2. Flexbox:** um jeito de **alinhar** caixas lado a lado ou empilhadas.
- `flex` → "os filhos desta caixa ficam **lado a lado**".
- `flex-col` → "...ou **empilhados**, um embaixo do outro".
- `items-center` → centraliza na vertical.
- `justify-center` → centraliza na horizontal.
- `justify-between` → empurra um para cada ponta (como no "API ........ online").
- `gap-3` → espaço entre os filhos.

### Traduzindo as classes do seu código

| Classe Tailwind | Significa |
|---|---|
| `flex` | Os filhos ficam lado a lado (modo flexbox) |
| `min-h-screen` | Altura mínima = a tela inteira |
| `items-center justify-center` | Centraliza o card no meio da tela |
| `bg-neutral-950` | Fundo (*bg = background*) cinza quase preto |
| `p-6` | *Padding* de tamanho 6 (= 24px) em todos os lados |
| `w-full max-w-sm` | Largura total, mas no máximo "small" (384px) |
| `flex flex-col gap-3` | Itens empilhados com espaço 3 (12px) entre eles |
| `text-red-500` | Texto vermelho, tom 500 (vai de 50 = clarinho até 950 = escuro) |
| `text-2xl` | Texto tamanho "2 extra large" |

> 💡 Passe o mouse em cima de qualquer classe no VS Code: a extensão **Tailwind CSS IntelliSense** mostra o CSS de verdade.

---

## Parte 9 — shadcn/ui: os componentes prontos

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
```
`Card`, `Badge` etc. **não são do React**. O shadcn copiou o código deles para `web/src/components/ui/`. Você pode abrir esses arquivos e ver como foram feitos. São seus, dá até para editar.

```tsx
<Badge variant={ok ? 'default' : 'destructive'}>
```
`variant` é uma **prop** do Badge que escolhe o estilo: `default` (normal) ou `destructive` (vermelho, de erro).

---

## 🏋️ Exercícios

Faça um de cada vez, salve o arquivo e olhe o navegador. Ele atualiza sozinho.

### Exercício 1 — Caça ao bug 🐛
No seu `App.tsx`, o título do card está **pequeno**, mas era para ser grande. Tem um erro de digitação em uma classe Tailwind na linha do `CardTitle`. Ache e corrija.

<details><summary>Dica</summary>

Compare letra por letra com a tabela da Parte 8: `text-2x?`

</details>

<details><summary>Resposta</summary>

Você escreveu `text-2x1` (com o **número um**). O certo é `text-2xl` (com a **letra L**, de *extra large*). O Tailwind **ignora classes que não existem sem dar erro nenhum**, por isso é um bug traiçoeiro. A extensão do Tailwind sublinha classes desconhecidas para ajudar.

</details>

### Exercício 2 — Mude a cor do fundo 🎨
Troque o fundo cinza-escuro por um azul bem escuro.

<details><summary>Resposta</summary>

Na tag `<main>`, troque `bg-neutral-950` por `bg-blue-950`. Teste também `bg-amber-900`, `bg-emerald-950`...

</details>

### Exercício 3 — Teste os estados ⚡
1. No terminal da API, aperte `Ctrl+C` para parar a API e recarregue a página (`F5`). O que aparece?
2. Rode `docker compose stop`, ligue a API de novo e recarregue. O que aparece?
3. Ligue tudo de novo com `docker compose up -d`.

<details><summary>O que deve acontecer</summary>

1. Aparece "API fora do ar 😢" (o `.catch` pegou o erro).
2. "API **online**" e "Banco de dados **offline**" em vermelho (a API respondeu `database: false`).

</details>

### Exercício 4 — Uma terceira linha ➕
Adicione uma terceira linha de status chamada **"Metrônomo"** que está **sempre online**.

<details><summary>Dica</summary>

Você já tem o componente `Status`. É só usá-lo de novo, com outros valores nas props.

</details>

<details><summary>Resposta</summary>

Logo abaixo da linha do "Banco de dados", adicione:
```tsx
<Status label="Metrônomo" ok={true} />
```

</details>

---

## 📖 Glossário rápido

| Termo | Significado |
|---|---|
| **Componente** | Função que retorna um pedaço de tela. Nome com letra maiúscula. |
| **Props** | Parâmetros de um componente (`<Status label="API" />`). |
| **Estado (state)** | Memória do componente. Quando muda, a tela é redesenhada. |
| **Hook** | Funções especiais do React que começam com `use` (`useState`, `useEffect`). |
| **Render** | O ato de o React rodar o componente e desenhar o resultado. |
| **JSX / TSX** | HTML escrito dentro do código. |
| **Promise / `.then`** | O "Task" do JavaScript: algo que termina no futuro. |
| **Classe Tailwind** | Atalho de CSS (`p-6`, `flex`, `text-red-500`). |

---

✅ **Terminou?** Você acabou de aprender o ciclo que é a base de **todo** app React:
> **estado** → **tela** → algo acontece (API respondeu, clique) → **muda o estado** → **tela redesenha**.

No próximo módulo (#2) vamos fazer a "casca" do app: menu, páginas e o visual. Lá você aprende **rotas** (trocar de página) e mais Tailwind.
