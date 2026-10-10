# Aula 02 — A casca do app: páginas, menu e tema

> 💡 Abra com **`Ctrl+Shift+V`**. Deixe rodando: `npm run dev --prefix web` e o navegador em http://localhost:5173.

Nesta aula o GuitarTrek vira um **app de verdade**: 5 páginas, um menu lateral no computador, uma barra de botões embaixo no celular e uma animação ao trocar de página. Também vamos ver como funciona o **tema** (as cores), que você vai poder trocar no futuro.

**O que você vai aprender:**
1. Variáveis de cor (tokens) e temas
2. Criar componentes em arquivos separados (`export` / `import`)
3. Listas com `.map()` (o "Select" do LINQ)
4. Rotas: cada endereço (URL) mostra uma página
5. Layout responsivo: um visual para celular, outro para computador
6. Animação com Motion

---

## Parte 0 — O que eu já preparei (e por quê)

Eu (Claude) fiz a parte "de bastidor":
- Instalei o **React Router** (as rotas), o **Motion** (as animações) e as duas fontes da direção H: **Big Shoulders Display** para títulos e **DM Sans** para textos.
- Coloquei as **cores da direção H** no arquivo `web/src/index.css`.
- Criei `web/src/lib/config.ts` com o nome do app.

### O que são "tokens" de cor?

Abra o `web/src/index.css` e olhe este trecho:

```css
[data-theme="amp"] {
  --background: #211915;   /* tolex */
  --primary: #f2a541;      /* âmbar de válvula */
  --cat-escalas: #f2c94c;
  ...
}
```

- `--primary: #f2a541;` é uma **variável de CSS**. É como uma constante em C#: `const string Primary = "#f2a541";`.
- `#f2a541` é a cor escrita em hexadecimal (vermelho, verde e azul).
- O Tailwind transforma cada variável numa classe: `bg-primary` (fundo âmbar), `text-primary` (texto âmbar), `bg-cat-escalas` (fundo amarelo-pedal)...

**A regra de ouro do projeto:**
> Nos componentes, **nunca** escreva uma cor fixa como `bg-amber-400` ou `#f2a541`. Use sempre os **nomes**: `bg-primary`, `bg-card`, `text-muted-foreground`, `bg-cat-ritmo`...

**Por quê?** No `web/index.html`, a primeira tag é:
```html
<html lang="pt-BR" data-theme="amp">
```
Esse `data-theme="amp"` escolhe qual bloco de cores vale. Se você trocar para `data-theme="treino"`, **o app inteiro troca de cara**. Isso só funciona se ninguém usar cor fixa. Você vai testar no exercício 1.

### Os nomes de cor que você vai usar

| Classe | Uso |
|---|---|
| `bg-background` / `text-foreground` | Fundo da página / texto normal |
| `bg-card` | Fundo de caixas e painéis |
| `bg-primary` / `text-primary` | Destaque (botões, item ativo) |
| `text-primary-foreground` | Texto **em cima** de algo `bg-primary` |
| `text-muted-foreground` | Texto secundário, mais apagado |
| `bg-accent` | Fundo de "passei o mouse em cima" |
| `border` | Borda com a cor padrão |
| `bg-cat-aquecimento`, `bg-cat-tecnica`, `bg-cat-escalas`, `bg-cat-ritmo`, `bg-cat-teoria` | As cores dos "pedais" de cada categoria |
| `font-heading` | A fonte de títulos (Big Shoulders) |

---

## Parte 1 — Um componente reutilizável para páginas "em breve"

Ainda não temos conteúdo para as páginas, mas todas vão ter **título + ícone + descrição**. Em vez de repetir o código 5 vezes, criamos **um** componente e passamos as diferenças por **props**, como você fez com o `Status` na aula 01.

### Passo 1.1 — Crie o arquivo

No VS Code, clique com o botão direito na pasta `web/src` → **New Folder** → `components` (se ainda não existir). Dentro dela, **New File** → `PaginaEmBreve.tsx`.

Digite:

```tsx
import type { LucideIcon } from 'lucide-react'

type Props = {
  titulo: string
  descricao: string
  icone: LucideIcon
}

export function PaginaEmBreve({ titulo, descricao, icone: Icone }: Props) {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-5xl">{titulo}</h1>
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-10 text-center">
        <Icone className="size-12 text-primary" />
        <p className="max-w-sm text-muted-foreground">{descricao}</p>
      </div>
    </section>
  )
}
```

### Linha a linha

| Código | O que significa |
|---|---|
| `import type { LucideIcon } from 'lucide-react'` | Traz o **tipo** "um ícone da biblioteca Lucide". O `type` avisa que é só um tipo, sem código. |
| `type Props = { ... }` | O formato das props, como um DTO. `icone: LucideIcon` significa que este parâmetro recebe **um componente de ícone**. |
| `export function PaginaEmBreve(...)` | O `export` deixa **outros arquivos** usarem este componente, como o `public` do C#. |
| `icone: Icone` | Desestrutura `icone` e já **renomeia** para `Icone`, com letra maiúscula. **Por quê?** O JSX só trata como componente o que começa com maiúscula. `<icone />` seria uma tag HTML (que não existe), e `<Icone />` é o componente. |
| `<section>` | Tag HTML para "uma seção da página". Funciona como uma `div`, mas com significado. |
| `className="text-5xl"` no `h1` | Título bem grande. A fonte Big Shoulders já vem automaticamente para todo `h1` (eu configurei no `index.css`). |
| `rounded-2xl` | Cantos arredondados. |
| `border-2 border-dashed` | Borda de 2px, tracejada. É o visual de "espaço reservado, em construção". |
| `p-10` | Espaço interno grande (40px). |
| `text-center` | Texto centralizado. |
| `size-12` | Largura e altura 12 (48px). |
| `max-w-sm` | O texto não passa de uma largura confortável de leitura. |

Ainda não aparece nada na tela, porque ninguém está **usando** o componente. Vamos usá-lo agora.

---

## Parte 2 — As 5 páginas

### Passo 2.1 — A página "Hoje"

Crie a pasta `web/src/pages` e, dentro dela, o arquivo `Hoje.tsx`:

```tsx
import { Guitar } from 'lucide-react'
import { PaginaEmBreve } from '@/components/PaginaEmBreve'

export function Hoje() {
  return (
    <PaginaEmBreve
      titulo="Treino de hoje"
      descricao="Seu treino do dia vai aparecer aqui, com cada exercício, o BPM alvo e o botão para começar."
      icone={Guitar}
    />
  )
}
```

- `import { Guitar } from 'lucide-react'` traz o ícone de guitarra. A Lucide tem milhares; veja em https://lucide.dev/icons.
- `'@/components/PaginaEmBreve'`: o `@` é um **atalho** que configurei e significa "a pasta `src`". Sem ele, você precisaria escrever `'../components/PaginaEmBreve'` (o `..` significa "volte uma pasta").
- `icone={Guitar}`: passamos o **componente** do ícone, sem `< />`. Quem desenha o ícone é a `PaginaEmBreve`.

### Passo 2.2 — Ver a página (teste rápido)

Abra `web/src/main.tsx`. Ele hoje desenha o `<App />` (o card da aula 01). Troque **temporariamente**:

```tsx
import App from './App.tsx'          // ← apague esta linha
import { Hoje } from './pages/Hoje'  // ← coloque esta
```
e, mais embaixo:
```tsx
<App />    // ← troque por
<Hoje />
```

**✅ O que você deve ver:** fundo marrom-escuro, o título "Treino de hoje" grande, e uma caixa tracejada com uma guitarra âmbar.

> Repare: `import App from ...` (sem chaves) e `import { Hoje } from ...` (com chaves). O `App` usa `export default` (o arquivo exporta "uma coisa principal"), e o `Hoje` usa `export function` (exportação **com nome**). Neste projeto vamos preferir sempre **com nome e com chaves**.

### Passo 2.3 — As outras 4 páginas

Crie mais 4 arquivos em `web/src/pages/`, **iguais ao Hoje.tsx**, trocando só o que está na tabela:

| Arquivo | Nome da função | Ícone (no import e no `icone=`) | `titulo` | `descricao` |
|---|---|---|---|---|
| `Agenda.tsx` | `Agenda` | `CalendarDays` | Agenda | A semana e o mês do seu plano, com o que fazer em cada dia. |
| `Metronomo.tsx` | `Metronomo` | `Metronome` | Metrônomo | Tempo, subdivisões, speed trainer e drone. Chega no módulo 3. |
| `Biblioteca.tsx` | `Biblioteca` | `Library` | Biblioteca | Todos os exercícios e escalas, com diagramas no braço da guitarra. |
| `Progresso.tsx` | `Progresso` | `TrendingUp` | Progresso | Seus BPMs ao longo do tempo, streak e recordes. |

> ⚠️ Nomes de arquivo e de função **sem acento** (`Metronomo`, não `Metrônomo`). Acento só dentro de textos entre aspas.

---

## Parte 3 — Rotas: cada endereço mostra uma página

### O conceito

No ASP.NET, `[Route("api/health")]` liga um **endereço** a um **controller**. No React, o **React Router** faz o mesmo no navegador:

| Endereço | Página |
|---|---|
| `/` | Hoje |
| `/agenda` | Agenda |
| `/metronomo` | Metrônomo |
| `/biblioteca` | Biblioteca |
| `/progresso` | Progresso |

A diferença: **não há recarregamento de página**. O React troca só o conteúdo, na hora. Isso é o que chamam de **SPA** (*Single Page Application*).

### Passo 3.1 — Configurar as rotas no `main.tsx`

Substitua **todo** o conteúdo de `web/src/main.tsx` por:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import { Hoje } from './pages/Hoje'
import { Agenda } from './pages/Agenda'
import { Metronomo } from './pages/Metronomo'
import { Biblioteca } from './pages/Biblioteca'
import { Progresso } from './pages/Progresso'

const router = createBrowserRouter([
  { path: '/', element: <Hoje /> },
  { path: '/agenda', element: <Agenda /> },
  { path: '/metronomo', element: <Metronomo /> },
  { path: '/biblioteca', element: <Biblioteca /> },
  { path: '/progresso', element: <Progresso /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

- `createBrowserRouter([...])` recebe uma **lista** (os `[ ]`) de **objetos** (os `{ }`). Cada objeto liga um `path` (endereço) a um `element` (o que desenhar).
- `<RouterProvider router={router} />` coloca o roteador para funcionar. Ele olha o endereço atual e desenha a página certa.

**✅ Teste:** digite na barra do navegador `localhost:5173/agenda`, depois `/biblioteca` e `/progresso`. Cada endereço mostra uma página. Mas ainda falta um **menu** para navegar sem digitar.

---

## Parte 4 — O Layout: menu lateral + conteúdo

O **Layout** é a "moldura" que fica fixa em todas as páginas (o menu), com um **buraco** no meio onde a página atual aparece.

```
┌─────────────┬──────────────────────────┐
│ GuitarTrek  │                          │
│             │                          │
│ ▸ Hoje      │      <Outlet />          │
│   Agenda    │   (a página atual        │
│   Metrônomo │    aparece aqui)         │
│   ...       │                          │
└─────────────┴──────────────────────────┘
```

### Conceito novo: listas e `.map()`

O menu tem 5 itens iguais na forma, diferentes no conteúdo. Guardamos os dados numa **lista** e geramos o HTML com `.map()`:

```tsx
const menu = [
  { para: '/', rotulo: 'Hoje' },
  { para: '/agenda', rotulo: 'Agenda' },
]

menu.map((item) => <a>{item.rotulo}</a>)
```

| TypeScript | C# |
|---|---|
| `const menu = [ {...}, {...} ]` | `var menu = new[] { new {...}, new {...} };` |
| `menu.map((item) => ...)` | `menu.Select(item => ...)` |

Quando você gera uma lista no JSX, o React exige um `key` em cada item: uma identidade única (como uma chave primária). Ele usa isso para saber quem é quem quando a lista muda.

### Passo 4.1 — Crie `web/src/components/Layout.tsx` (só o menu lateral)

```tsx
import { NavLink, Outlet } from 'react-router'
import { CalendarDays, Guitar, Library, Metronome, TrendingUp } from 'lucide-react'
import { APP_NAME } from '@/lib/config'

const menu = [
  { para: '/', rotulo: 'Hoje', icone: Guitar },
  { para: '/agenda', rotulo: 'Agenda', icone: CalendarDays },
  { para: '/metronomo', rotulo: 'Metrônomo', icone: Metronome },
  { para: '/biblioteca', rotulo: 'Biblioteca', icone: Library },
  { para: '/progresso', rotulo: 'Progresso', icone: TrendingUp },
]

export function Layout() {
  return (
    <div className="min-h-screen md:flex">
      {/* Menu lateral: escondido no celular, aparece em telas médias (md:) */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:gap-8 md:border-r md:p-6">
        <span className="font-heading text-3xl font-black text-primary">{APP_NAME}</span>
        <nav className="flex flex-col gap-1">
          {menu.map((item) => (
            <NavLink
              key={item.para}
              to={item.para}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 font-medium ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`
              }
            >
              <item.icone className="size-5" />
              {item.rotulo}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Conteúdo da página atual */}
      <main className="flex-1 p-5 pb-28 md:p-10">
        <Outlet />
      </main>
    </div>
  )
}
```

### Linha a linha (as partes novas)

| Código | O que significa |
|---|---|
| `{/* ... */}` | Comentário **dentro** do JSX. Fora do JSX, use `//` normal. |
| `<aside>` | Tag HTML para "conteúdo lateral". |
| `hidden md:flex` | **Responsivo!** `hidden` esconde o elemento. `md:flex` diz: "a partir de telas médias (768px ou mais), mostre como flex". Tudo que tem `md:` na frente **só vale no computador/tablet**. |
| `md:w-60` | No computador, largura de 240px. |
| `md:border-r` | Borda só à direita (*r = right*). |
| `<NavLink to="/agenda">` | Um link do React Router: troca de página **sem recarregar**. Ele também sabe se é a página atual. |
| `end` | "Só considere ativo se o endereço for **exatamente** este". Sem isso, o `/` (Hoje) ficaria ativo em todas as páginas, porque todo endereço começa com `/`. |
| `className={({ isActive }) => ...}` | Aqui o `className` é uma **função**. O NavLink chama essa função passando `isActive` (verdadeiro se for a página atual) e usa o texto que ela devolve. |
| `` `texto ${...} texto` `` | **Template string** (crases + `${}`). É o `$"texto {variavel}"` do C#. |
| `isActive ? 'bg-primary ...' : 'text-muted-foreground ...'` | O item ativo fica com fundo âmbar, e os outros ficam apagados (e clareiam quando você passa o mouse, com `hover:`). |
| `<item.icone className="size-5" />` | Desenha o ícone que está guardado na lista. |
| `<Outlet />` | O **buraco** onde a página atual é desenhada. |
| `pb-28` | Espaço extra embaixo (*padding-bottom*), reservado para a barra do celular que vem na Parte 5. |

### Passo 4.2 — Encaixe o Layout nas rotas

No `main.tsx`, adicione o import:
```tsx
import { Layout } from './components/Layout'
```
e troque o `createBrowserRouter` por esta versão com **rotas filhas**:

```tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Hoje /> },
      { path: 'agenda', element: <Agenda /> },
      { path: 'metronomo', element: <Metronomo /> },
      { path: 'biblioteca', element: <Biblioteca /> },
      { path: 'progresso', element: <Progresso /> },
    ],
  },
])
```

- `children` são as rotas **filhas**: elas aparecem **dentro** do `<Outlet />` do Layout.
- `index: true` = "a página padrão quando o endereço é só `/`".
- Os filhos usam `'agenda'` **sem** a barra, porque já estão "dentro" do `/`.

**✅ O que você deve ver** (com a janela do navegador larga): o menu à esquerda, com "GuitarTrek" em âmbar e 5 itens. Clique em cada um: a página troca na hora e o item clicado fica com fundo âmbar. 🎉

---

## Parte 5 — A barra do celular

No celular não cabe um menu lateral. Lá usamos uma barra de botões **fixa embaixo**, como no Instagram.

### Passo 5.1 — Adicione a barra no `Layout.tsx`

Logo **depois** do `</main>` e **antes** do último `</div>`, adicione:

```tsx
      {/* Barra inferior: só no celular (md:hidden) */}
      <nav className="fixed inset-x-0 bottom-0 flex border-t bg-card md:hidden">
        {menu.map((item) => (
          <NavLink
            key={item.para}
            to={item.para}
            end
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            <item.icone className="size-6" />
            {item.rotulo}
          </NavLink>
        ))}
      </nav>
```

| Código | O que significa |
|---|---|
| `fixed` | Fica **grudado na tela**, mesmo quando você rola a página. |
| `inset-x-0 bottom-0` | Encostado na esquerda, na direita e embaixo. |
| `md:hidden` | O contrário do menu lateral: **some** no computador. |
| `flex-1` | Cada botão ocupa uma parte igual da largura. |
| `flex-col` | Ícone **em cima**, texto **embaixo**. |

Repare que **reaproveitamos a mesma lista `menu`**. Para adicionar uma página, você só precisa mexer num lugar.

**✅ Como testar o visual de celular:** no navegador, aperte **F12**, depois **`Ctrl+Shift+M`** (modo dispositivo) e escolha um celular, como "iPhone 12". O menu lateral some e a barra aparece embaixo.

---

## Parte 6 — Animação ao trocar de página

O app precisa ser **dinâmico**. Vamos fazer cada página entrar suavemente, subindo um pouquinho.

### Passo 6.1 — No `Layout.tsx`

1. Mude o import do router para incluir o `useLocation`:
   ```tsx
   import { NavLink, Outlet, useLocation } from 'react-router'
   ```
2. Adicione o import do Motion:
   ```tsx
   import { motion } from 'motion/react'
   ```
3. Na primeira linha **dentro** da função `Layout`, antes do `return`:
   ```tsx
   const location = useLocation()
   ```
4. Troque o `<Outlet />` dentro do `<main>` por:
   ```tsx
   <motion.div
     key={location.pathname}
     initial={{ opacity: 0, y: 12 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.25 }}
   >
     <Outlet />
   </motion.div>
   ```

| Código | O que significa |
|---|---|
| `useLocation()` | Um **hook** (lembra do `useState`?) que diz em qual endereço estamos. |
| `motion.div` | Uma `div` que sabe se animar. |
| `initial={{ opacity: 0, y: 12 }}` | Começa **invisível** (opacidade 0) e **12px mais para baixo**. |
| `animate={{ opacity: 1, y: 0 }}` | Termina visível e no lugar certo. |
| `transition={{ duration: 0.25 }}` | Leva 0,25 segundo. |
| `key={location.pathname}` | O truque: quando o endereço muda, o `key` muda, e o React entende que é uma `div` **nova**, então a animação roda de novo. |
| `{{ }}` (chaves duplas) | A de fora significa "aqui entra código", e a de dentro é um **objeto**. |

### Passo 6.2 — Respeitar quem não gosta de animação

Algumas pessoas ativam no sistema a opção "reduzir movimento" (enjoo, tontura). No `main.tsx`:

1. Adicione o import:
   ```tsx
   import { MotionConfig } from 'motion/react'
   ```
2. Envolva o `RouterProvider`:
   ```tsx
   <StrictMode>
     <MotionConfig reducedMotion="user">
       <RouterProvider router={router} />
     </MotionConfig>
   </StrictMode>,
   ```

**✅ O que você deve ver:** ao clicar no menu, cada página "desliza" para cima ao aparecer.

### Passo 6.3 — Faxina

O `web/src/App.tsx` (o card da aula 01) não é mais usado. **Apague o arquivo.** Não se preocupe, ele fica guardado no histórico do git.

---

## 🏋️ Exercícios

### Exercício 1 — Troque o tema 🎨
No `web/index.html`, troque `data-theme="amp"` por `data-theme="treino"` e salve. O que acontece? Depois volte para `amp`.

<details><summary>O que deve acontecer</summary>

O app inteiro fica **claro, com destaque roxo**: é a direção C. Você não mexeu em nenhum componente, porque todos usam só os nomes dos tokens. É assim que a troca de tema vai funcionar no futuro (com um botão nas configurações).

</details>

### Exercício 2 — Uma 6ª página: Afinador 🎸
Crie a página **Afinador** (endereço `/afinador`, ícone `AudioWaveform`) e coloque no menu.

<details><summary>Dica</summary>

São 3 lugares: (1) um arquivo novo em `pages/`, (2) uma rota nova em `children` no `main.tsx`, (3) um item novo na lista `menu` do `Layout.tsx`.

</details>

<details><summary>Resposta</summary>

`web/src/pages/Afinador.tsx`:
```tsx
import { AudioWaveform } from 'lucide-react'
import { PaginaEmBreve } from '@/components/PaginaEmBreve'

export function Afinador() {
  return (
    <PaginaEmBreve
      titulo="Afinador"
      descricao="Afine pelo microfone. Chega no módulo 12."
      icone={AudioWaveform}
    />
  )
}
```
No `main.tsx`: `import { Afinador } from './pages/Afinador'` e, dentro de `children`: `{ path: 'afinador', element: <Afinador /> },`.

No `Layout.tsx`: adicione `AudioWaveform` no import da lucide e, na lista: `{ para: '/afinador', rotulo: 'Afinador', icone: AudioWaveform },`.

Repare que ele aparece **nos dois menus** sozinho, graças ao `.map()`. (Com 6 itens, a barra do celular fica apertada. Depois a gente decide se o Afinador fica no menu ou vira um botão no Metrônomo.)

</details>

### Exercício 3 — Caça à regra 🔍
Você quer que o item ativo da barra do celular tenha também um **fundo** (`bg-accent`), não só o texto âmbar. Onde você mexe?

<details><summary>Resposta</summary>

No `Layout.tsx`, na barra inferior, troque `isActive ? 'text-primary' : ...` por `isActive ? 'bg-accent text-primary' : ...`.

</details>

### Exercício 4 — Pergunta rápida 🤔
Por que no `Layout` usamos `bg-primary` e não `bg-amber-400`, se o resultado na tela é quase igual?

<details><summary>Resposta</summary>

Porque `bg-amber-400` é uma **cor fixa**: no tema "treino" ela continuaria âmbar e ficaria errada. `bg-primary` é um **token**: ele vira âmbar no tema amp e roxo no tema treino, automaticamente.

</details>

---

## 📖 Glossário novo

| Termo | Significado |
|---|---|
| **Token / variável CSS** | Nome para um valor (`--primary: #f2a541`). Muda num lugar, muda no app todo. |
| **Tema** | Um conjunto de valores para os tokens (amp, treino...). |
| **export / import** | Compartilhar código entre arquivos (`public` + `using`). |
| **`.map()`** | Transforma cada item de uma lista (o `Select` do LINQ). |
| **`key`** | Identidade única de cada item numa lista do JSX. |
| **Rota** | Ligação entre um endereço (URL) e uma página. |
| **SPA** | App que troca de página sem recarregar o navegador. |
| **Layout / Outlet** | A moldura fixa / o buraco onde a página atual aparece. |
| **Responsivo** | Visual que se adapta ao tamanho da tela. Prefixo `md:` = "a partir de tela média". |
| **Template string** | Texto com crases e `${}` (o `$""` do C#). |

---

✅ **Terminou?** Me avise. O próximo passo da #2 é decidir o visual final das peças (botões, cards, o "pedal") e depois partimos para a #3: o **metrônomo**, a primeira ferramenta que você vai usar de verdade no treino.
