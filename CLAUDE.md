# GuitarTrek — instruções para o Claude

Projeto de estudo + produto: central de treino para guitarristas. Plano em `docs/PLANO.md`, tasks em GitHub Issues/Projects (issue #N = módulo N).

## Quem é o dev
- Sabe C# / .NET bem. **Não sabe NADA de front-end**: zero HTML, CSS, JavaScript, TypeScript, React, Tailwind.
- Fala português. Responda em português.

## Como ensinar (obrigatório)
- Cada módulo começa com uma **aula** em `docs/aulas/NN-titulo.md` (abrir no VS Code com `Ctrl+Shift+V`) antes de qualquer código de front.
- Explique **todo conceito novo na primeira vez que aparece**, sem pressupor nada. Compare com C# sempre que ajudar.
- Passos pequenos: um conceito → um trecho de código → "o que você deve ver na tela". Nunca blocos grandes sem explicação linha a linha.
- Diga **onde** colar/digitar (arquivo e posição) e **o resultado esperado**.
- Termine com exercícios curtos com gabarito escondido em `<details>`.
- **Backend C# o dev implementa** (quer conhecer o sistema), mas sem aula aprofundada: o Claude dá só um roteiro curto (entidades, endpoints, ordem dos passos, pegadinhas) e revisa. Infra/boilerplate de front (instalar pacote, config) o Claude pode fazer direto; componentes e hooks React o dev digita.

## Design
- Direção visual escolhida: **H (amp + pedais + treino)**, ver `docs/mockups/index.html`. Fonte: Archivo (variável). Títulos em largura expandida (`font-stretch: 125%`, peso semibold), estilo gravação de painel de amp; item ativo marcado por "luz piloto" âmbar, não por fundo âmbar cheio. Visual sóbrio/premium, nada de pôster.
- Cores **só** via tokens de `web/src/index.css` (`bg-primary`, `bg-card`, `text-muted-foreground`, `bg-cat-*`...). Nunca cor fixa (`bg-amber-400`, `#hex`) em componente: o tema é trocável via `<html data-theme="amp|treino">`.
- Categorias de exercício têm cor de "pedal": aquecimento, tecnica, escalas, ritmo, teoria.

## Ambiente
- API: `dotnet run --project api/GuitarTrek.Api --launch-profile http` → http://localhost:5280 (a 5146 é do NTKDaemon da Native Instruments).
- Banco: `docker compose up -d` → Postgres na porta 5433 (a 5432 é um Postgres nativo do Windows).
- Front: `npm run dev --prefix web` → http://localhost:5173 (proxy `/api` → 5280).
- Disco C: quase cheio: instalar/baixar coisas no D: sempre que possível.

## Commits
- Mensagens em português, convencionais (`feat:`, `fix:`, `docs:`), com `Refs #N` / `closes #N`.
