# GuitarTrek — Plano (nome piloto)

## Contexto
Você é guitarrista intermediário e quer uma "central de treino" inspirada na rotina de estudos que usava (agenda diária e tabela de progresso). A ideia é juntar num só lugar: biblioteca, diagramas, metrônomo, afinador, progresso, agenda, gerador de treino personalizado, repertório e gamificação. Tudo **bonito, visual e divertido**. O projeto também serve para você aprender front-end, então é entregue **por módulo e em ordem de prioridade**, e cada módulo deixa algo usável. As tasks vão para o ClickUp depois de você autorizar o conector.

Decisões já tomadas:
- O gerador usa regras primeiro e ganha IA (Claude API) depois.
- Por enquanto o app tem um usuário só, preparado para multiusuário e assinatura.
- Funciona no PC e no celular, como PWA.
- O front-end é feito em TypeScript.
- A biblioteca é gerada e também aceita cadastro manual. Não copiamos material com direitos autorais.
- O metrônomo vem completo.
- Os diagramas mostram o braço em SVG.
- A interface usa Tailwind + shadcn/ui + Motion.
- A direção visual sai de mockups feitos primeiro.
- O banco é Postgres.

## Princípio nº 1: prender e não deixar desistir
O engajamento não é um módulo separado. Ele entra **em todo módulo, desde o primeiro**. As regras de produto abaixo se inspiram em Duolingo, apps de fitness e pesquisa sobre formação de hábito:

| Regra | Como aparece no app |
|---|---|
| **Vitória rápida** | O onboarding leva cerca de 2 minutos: nível, objetivo e tempo. O primeiro treino de 10 minutos começa na hora, e a primeira conquista sai no fim dele. |
| **Barra baixa nos dias ruins** | "Modo dia corrido": 5 minutos valem para manter o streak. É melhor treinar pouco do que quebrar a corrente. |
| **Streak sem punição** | Congelamento de streak (ganho com XP). Quem volta depois de dias parado recebe "Bem-vindo de volta" com um treino leve de retomada, sem tela de culpa. |
| **Feedback imediato** | Cada ação tem resposta visual e sonora: pulso do metrônomo, +XP flutuando, confete ao bater recorde, som de "level up". |
| **Progresso sempre visível** | Barra do dia, anel semanal (estilo Apple Watch), "você está 12 BPM mais rápido que há 30 dias". |
| **Dificuldade no ponto certo** | O gerador ajusta o BPM alvo pelo desempenho: se você falhar, ele baixa um pouco; se acertar fácil, ele sobe. Fica difícil o bastante para desafiar, sem frustrar. |
| **Variedade e surpresa** | Desafio do dia, recompensas surpresa, roleta de improviso, e exercícios em rodízio para não repetir o mesmo todo dia. |
| **Metas semanais > diárias** | A meta principal é "X dias por semana", que é mais flexível e gera menos culpa do que exigir todo dia. |
| **Sessão com começo, meio e fim** | Ao terminar o treino, uma tela de resumo mostra tempo, BPMs, XP e o que vem amanhã. Isso cria um gancho para voltar. |
| **Lembrete inteligente** | Chega no horário que você costuma treinar, com texto variado ("Seu streak de 6 dias te espera 🔥"). |

Para a interface ficar dinâmica: tudo usa transições de página e microinterações (Motion), sons curtos e opcionais, celebrações, e estados vazios convidativos, nunca uma tela em branco.

## Stack
| Camada | Escolha |
|---|---|
| Front | React + TypeScript + Vite, React Router, TanStack Query (a partir do Progresso) |
| UI | Tailwind CSS + shadcn/ui + Motion (animações), ícones Lucide |
| Back | ASP.NET Core Web API (.NET 10 LTS), controllers, um projeto só |
| Banco | **PostgreSQL** via Docker Compose (local) → Postgres gerenciado no deploy, EF Core + Npgsql |
| Áudio | Web Audio API nativa (metrônomo, drone, afinador) |
| Gráficos | Recharts (linha de BPM, heatmap, radar) |
| YouTube | YouTube IFrame Player API (loop A-B, `setPlaybackRate`) |
| PWA | vite-plugin-pwa + Web Push (pacote `WebPush` no .NET) |

Por que Postgres: o banco do PC é o mesmo da nuvem, o JSONB nativo atende os campos flexíveis, e multiusuário e assinatura funcionam sem troca. O custo é só um `docker compose up`.

Preparo para multiusuário: as tabelas do usuário têm `UserId`, e um único usuário é criado no seed até a autenticação entrar.

## Estrutura
```
GuitarTrek/
  docker-compose.yml   # postgres
  api/                 # GuitarTrek.Api
  web/                 # React + Vite; teoria musical em web/src/theory (funções puras, offline)
```

## Modelo de dados (núcleo)
- `Exercise`: Name, Category, Level 1-3, Description, Instructions, DefaultBpm, Fretboard (jsonb), Tags, Skill (velocidade/ritmo/teoria/ouvido/repertório), IsCustom
- `PracticeLog`: UserId, ExerciseId?/SongId?, Date, Bpm, DurationMin, Rating, Notes
- `TrainingPlan`: Goals[] (com ordem), Level, Weeks, StartDate, Availability (jsonb: minutos por dia da semana), Source (Regras/Trilha/IA/Manual)
- `PlanItem`: PlanId, Date, Order, ExerciseId?/SongId?, Minutes, TargetBpm, IsQuickVersion, Status (pendente/feito/pulado), Locked
- `Song`: Title, Artist, Level, Techniques[], Status, CurrentBpm, TargetBpm, YoutubeUrl, Sections (jsonb, loops A-B). **Guarda só metadados.**
- `Assessment`: Date, Results (jsonb)
- `Challenge` / `UserChallenge`, `Achievement` / `UserAchievement`, `SkillNode` / `UserSkillNode`, e XP e nível no usuário

## Trilha de tasks — por ordem de prioridade

### 1. Setup full stack
Docker Compose com Postgres, `dotnet new webapi` + EF Core/Npgsql, `/api/health`, Vite react-ts + Tailwind + shadcn/ui, e a chamada `/api/health` aparecendo na tela.
*Você aprende:* estrutura do Vite, JSX, componente, `useState`/`useEffect`, `fetch` e o básico de Docker.

### 2. Mockups + design system + casca do app
Primeiro, 2 ou 3 protótipos visuais da tela "Hoje" e do metrônomo em direções diferentes (por exemplo palco/amplificador, pedalboard colorido e minimalista), para você escolher. Depois disso:
- Tokens de cor e fonte no Tailwind e tema claro/escuro.
- Layout com sidebar no desktop e bottom-nav no celular.
- Rotas vazias de cada módulo.

*Você aprende:* Tailwind, componentes shadcn, layout responsivo e React Router.

### 3. Metrônomo + drone
Hook `useMetronome` com lookahead scheduler: BPM, compasso, acento, tap tempo, subdivisões e speed trainer. Drone de tônica ou acorde para treinar escalas. A UI é bem visual: pulso animado e knob de BPM. Já é útil sozinho, mesmo sem backend.
*Você aprende:* custom hooks, `useRef`, efeitos com limpeza, Web Audio e Motion.

### 4. Biblioteca de exercícios
CRUD com EF Core, migrations e seed com cerca de 30 exercícios originais. Front: grid de cards com filtros, página de detalhe e cadastro manual.
*Você aprende:* formulários (react-hook-form + zod, padrão do shadcn), listas e props.

### 5. Braço da guitarra: escalas e acordes
`theory/` com notas, intervalos, escalas e modos, acordes e posições, testado no Vitest. `<Fretboard>` em SVG com notas coloridas por grau e transições animadas. Páginas **Escalas** (CAGED/3NPS) e **Dicionário de acordes**. O diagrama também aparece no detalhe do exercício.
*Você aprende:* TypeScript a fundo, SVG e testes.

### 6. Progresso + streak + XP básico
- `PracticeLog`, gráfico de BPM por exercício e tabela no estilo da planilha antiga.
- **Streak com congelamento**, heatmap anual e anel de meta semanal.
- **XP e nível**, com +XP animado em cada registro.
- Celebração com confete ao bater recorde de BPM.
- Também migra o acesso a dados para TanStack Query.

*Você aprende:* estado de servidor, mutations, gráficos e animações.

### 7. Montador de treino (gerador por regras) ⭐
O usuário responde um **wizard animado de 4 passos**:
1. **Objetivos**: escolhe até 3 entre Velocidade, Precisão/limpeza, Improviso, Ritmo, Legato, Bends/Vibrato, Teoria/braço e Repertório, e coloca em ordem de importância.
2. **Nível**: iniciante+, intermediário ou avançado. Pode vir do teste rápido de BPM.
3. **Tempo**: duração do plano (4, 8 ou 12 semanas), dias da semana (por exemplo seg/qua/sex/sáb) e minutos por dia, que podem **variar por dia** (por exemplo, 30 minutos na semana e 90 no sábado).
4. **Pré-visualização**: a semana 1 aparece montada. Dá para trocar um exercício, travar outro e regerar antes de salvar.

O `PlanGenerator` em C#, com testes em xUnit, segue estas regras:
- Todo dia abre com 10–15% do tempo de aquecimento. O resto é dividido pelos **pesos dos objetivos**: 50%, 30% e 20% conforme a ordem, com no mínimo 10% de ritmo.
- Cada bloco tem entre 5 e 15 minutos. Os exercícios de cada categoria entram em **rodízio** para variar ao longo da semana.
- A **progressão** sobe o BPM alvo cerca de 5% por semana, a partir do seu último log ou do `DefaultBpm`.
- Há uma **semana mais leve (deload)** a cada 4.
- Também gera uma **versão de 5 minutos** de cada dia, que alimenta o "modo dia corrido".

Fora o wizard:
- **Trilhas** prontas ("Velocidade em 8 semanas", "Improviso blues"...) são apenas presets de entrada do wizard.
- **Avaliação mensal** com exercícios padrão. O BPM máximo limpo ajusta os planos seguintes.
- **Editar o plano depois**: mover itens entre dias, trocar exercícios e mudar as horas disponíveis, que **remonta só as semanas futuras**.

*Você aprende:* formulários de várias etapas, drag-and-drop simples (dnd-kit) e consumo de uma API mais complexa.

### 8. Agenda + "Treino de hoje" + onboarding ⭐
**Agenda:**
- Visões de **semana** (padrão) e **mês**. Cada dia mostra os blocos do treino (categoria em cor, minutos, BPM alvo), o tempo total e o status (✅ feito, 🟡 parcial, ❌ perdido, 🔵 futuro).
- Ao clicar num dia, abre o treino detalhado. Dá para arrastar um treino perdido para outro dia ("reagendar").
- Uma **faixa do plano** mostra "Semana 3 de 8 — Velocidade", com barra de progresso e a próxima avaliação.

**Treino de hoje:** é a tela inicial do app.
- O treino aparece como uma "playlist" de blocos, com um botão grande **Começar**.
- No **modo foco**, aparece um bloco por vez: diagrama no braço, instruções, metrônomo já no BPM alvo, timer com aviso de fim do bloco e um botão para pular. Ao terminar, "Qual BPM você atingiu limpo?" grava um `PracticeLog`.
- Ao fim do treino, a **tela de resumo** mostra tempo, BPMs, XP e conquistas, além de uma prévia de amanhã.
- Inclui o **modo dia corrido** (5 minutos) e o fluxo **"Bem-vindo de volta"**.

**Onboarding:** leva cerca de 2 minutos. É o wizard do montador numa versão curta, e o primeiro treino começa na hora.

É o **coração do app**.
*Você aprende:* telas compostas, Context e componentes de calendário.

### 9. Deploy + PWA + lembretes
Deploy com HTTPS: API + Postgres gerenciado num serviço com free tier, e o front estático. PWA instalável com cache offline. Lembrete inteligente via Web Push + `BackgroundService`: chega no horário em que você costuma treinar, com textos variados e o streak em jogo. A partir daqui você treina pelo celular.

### 10. Gamificação completa
- Conquistas com medalhas e recompensas surpresa.
- **Desafios diários e semanais**. A avaliação mensal funciona como "chefão".
- **Árvore de habilidades** visual (trilhas viram nós desbloqueáveis).
- **Radar** com velocidade, ritmo, teoria, ouvido e repertório, calculado a partir dos logs.
- **Dificuldade adaptativa** no gerador, que ajusta o BPM alvo pelo resultado de cada sessão.
- As regras de XP ficam num serviço C# testado.

### 11. Repertório + loop do YouTube + sugestões
- Lista de músicas com status e BPM.
- Player do YouTube com loop A-B e velocidade de 50–100%, com as seções salvas.
- Seed com cerca de 50 músicas conhecidas (só metadados), sugeridas conforme os objetivos e técnicas do seu plano.
- Músicas também podem entrar no plano.

### 12. Afinador
Microfone + detecção de pitch por autocorrelação, com ponteiro animado e cents. Suporta afinação padrão e alternativas.

### 13. Harmonia + quiz + roleta de improviso
- Campo harmônico, círculo de quintas clicável e "qual escala sobre este acorde".
- **Quiz de notas no braço** com tempo e recorde.
- **Roleta de improviso**: sorteia tom, escala e BPM, liga o drone e o metrônomo e roda um timer de 3 minutos.

### 14. Retrospectiva mensal
Um resumo estilo "Wrapped" (horas, BPMs ganhos, streak, recordes, evolução do radar), com animações e um card compartilhável em imagem.

### 15. Contas e autenticação
ASP.NET Core Identity + JWT, login e cadastro. A assinatura (Stripe) fica para quando virar produto.

### 16. IA
Planos e sugestões de músicas via Claude API (`claude-sonnet-5-5`), com saída JSON validada pelo mesmo código do gerador.

### Futuro
Player de tablatura estilo Songsterr com alphaTab, usando arquivos Guitar Pro que você tiver. Também: detecção de tempo pelo microfone e gravação de sessões.

## Como vamos trabalhar
1. **ClickUp:** depois que você autorizar o conector, eu crio uma lista "GuitarTrek" com uma task por módulo (1–16), subtasks com os passos e a prioridade na ordem acima.
2. Em cada módulo, eu explico os conceitos novos e você escreve as partes didáticas (componentes e hooks) com a minha orientação. Eu cuido do boilerplate e do backend se você quiser.
3. Um commit por módulo e um README atualizado.

## Verificação
- Back: `dotnet test` (gerador, XP, desafios) + Swagger.
- Front: `npm run test` (Vitest no `theory/`) + `npm run dev` e uso manual no desktop e no modo mobile.
- Metrônomo: comparar com um metrônomo de referência por cerca de 2 minutos, para conferir se ele não atrasa (drift). Afinador: comparar com um afinador de referência nas 6 cordas.
- Deploy: instalar o PWA no celular e receber um lembrete de teste.

