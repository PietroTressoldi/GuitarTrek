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
- `PlanItem`: PlanId, Date, Order, ExerciseId?/SongId?/BackingTrackId?, Minutes, TargetBpm, IsQuickVersion, Status (pendente/feito/pulado), Locked
- `BackingTrack`: UserId, Name, Style, Key, Bpm, Bars (jsonb: acorde em grau por compasso), IsPreset
- `Song`: Title, Artist, Level, Techniques[], Status, CurrentBpm, TargetBpm, YoutubeUrl, Sections (jsonb, loops A-B). **Guarda só metadados.**
- `Assessment`: Date, Results (jsonb)
- `Challenge` / `UserChallenge`, `Achievement` / `UserAchievement`, `SkillNode` / `UserSkillNode`, e XP e nível no usuário

## Trilha de tasks — por ordem de prioridade

> **Ordem atual (out/2026): improviso puxado para frente.** Depois do 3, a sequência é **5 → 5.5 → 12 (afinador, que traz o microfone) → 17 (Laboratório de improviso)**, e então volta para 4, 6, 7… A numeração abaixo continua a mesma, para bater com as issues.
>
> **Rumo ao produto:** quando o núcleo estiver pronto, o **15 (Contas) vem antes do 9 (Deploy)**, para abrir um **beta fechado** com amigos músicos (contas por convite). Depois do feedback, vira assinatura com plano grátis. Detalhes em "Produto: beta e assinatura", no fim.

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
Hook `useMetronome` com lookahead scheduler: BPM, compasso, acento, tap tempo, subdivisões e speed trainer. Drone de tônica ou acorde para treinar escalas. **Som do clique configurável:** timbre (eletrônico, madeira, cowbell, chimbal), altura (frequência) do acento e dos outros tempos, volume e acento liga/desliga. Começa com oscilador (tipo de onda + frequência + duração) e ganha samples reais junto com as backing tracks (5.5). A UI é bem visual: pulso animado e knob de BPM. Já é útil sozinho, mesmo sem backend.
*Você aprende:* custom hooks, `useRef`, efeitos com limpeza, Web Audio e Motion.

### 4. Biblioteca de exercícios
CRUD com EF Core, migrations e seed com cerca de 30 exercícios originais. Front: grid de cards com filtros, página de detalhe e cadastro manual.
*Você aprende:* formulários (react-hook-form + zod, padrão do shadcn), listas e props.

### 5. Braço da guitarra: escalas e acordes
`theory/` com notas, intervalos, escalas e modos, acordes e posições, testado no Vitest. `<Fretboard>` em SVG com notas coloridas por grau e transições animadas. Páginas **Escalas** (CAGED/3NPS) e **Dicionário de acordes**. O diagrama também aparece no detalhe do exercício.
*Você aprende:* TypeScript a fundo, SVG e testes.

### 5.5 Backing tracks: montador 🎶
Uma base para treinar junto, como o drone, mas com **bateria, baixo e acordes**. É o metrônomo evoluído: o mesmo agendador do `useMetronome`, agendando 16 passos por compasso em vez de 1 clique por tempo.
- **Estilo** = um padrão de 1 compasso escrito em TypeScript (bumbo/caixa/chimbal como `'x...x...'`, baixo e acordes por grau, swing). Para começar: rock, blues shuffle, funk, pop, balada e bossa.
- **Progressão** = acordes por compasso em graus (`I7 IV7 V7`), valendo para qualquer tom: blues de 12, I–V–vi–IV, ii–V–I, I–vi–IV–V, andaluza e vamp modal.
- **Montador:** uma grade de compassos. Você clica, escolhe o acorde pelo grau e salva (API `BackingTrack`). Estilos e progressões prontas ficam no front.
- **Ao tocar:** o compasso atual fica aceso, o acorde aparece grande e a escala sugerida aparece no `<Fretboard>`. Tem um mixer com volume e mute por instrumento.
- **Som:** samples via `smplr` (bateria, baixo, piano/órgão), que aceita o horário exato de cada nota no relógio do áudio.
- Os blocos de improviso do montador de treino (módulo 7) podem apontar para uma backing track.

*Você aprende:* dados como "partitura", sequenciador, mais Web Audio, grade interativa e CRUD reaproveitado.

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
Deploy com HTTPS, custo zero no beta: front no **Cloudflare Pages**; API + Postgres + worker do separador numa VM **Oracle Cloud Always Free** (ARM, 24 GB) com o `docker compose` que já existe, e backup diário do banco. Plano B: GitHub Student Pack (crédito DigitalOcean + domínio). E-mail de convite/senha pelo Resend (grátis). Botão "Enviar feedback" no app (tabela `Feedback`). PWA instalável com cache offline. Lembrete inteligente via Web Push + `BackgroundService`: chega no horário em que você costuma treinar, com textos variados e o streak em jogo. A partir daqui você treina pelo celular.

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
Microfone + detecção de pitch por autocorrelação, com ponteiro animado e cents. Suporta afinação padrão e alternativas. Vem antes do 17: o hook `usePitch` criado aqui é o "ouvido" do Laboratório de improviso.

### 13. Harmonia + quiz
- Campo harmônico, círculo de quintas clicável e "qual escala sobre este acorde".
- **Quiz de notas no braço** com tempo e recorde.
- (A roleta de improviso foi para o módulo 17.)

### 14. Retrospectiva mensal
Um resumo estilo "Wrapped" (horas, BPMs ganhos, streak, recordes, evolução do radar), com animações e um card compartilhável em imagem.

### 15. Contas e autenticação
ASP.NET Core Identity + JWT, login. **Vem antes do 9.** No beta, sem cadastro aberto: contas **por convite**. O usuário já nasce com `Plano` (Gratis/Pro) + `ExpiraEm`, para a assinatura entrar sem migração grande; no beta todos são Pro.

### 16. IA
Planos e sugestões de músicas via Claude API (`claude-sonnet-5-5`), com saída JSON validada pelo mesmo código do gerador.

### 17. Laboratório de improviso 🎸
Para a improvisação, que é a habilidade mais importante: exercícios em tempo real sobre backing tracks, com o app **ouvindo pelo microfone**. Fica numa rota nova `/improviso`, com um pedal de cor própria (token `cat-improviso`). Depende de 5, 5.5 e 12.
- **17a — Palco (guiado):** você escolhe tom, escala e progressão, e toca a backing track ou o drone. No `<Fretboard>` ao vivo, a escala fica apagada e as **notas do acorde atual** acendem a cada compasso, com filtro por shape CAGED. Também tem:
  - **Cartas de restrição** com timer: só 3 notas, uma corda, só colcheias, pergunta e resposta, silêncio, motivo e variação, terminar na 3ª.
  - **Roleta e desafio do dia:** sorteia tom, escala, estilo, BPM e carta. O desafio do dia é sempre o mesmo para a mesma data.
- **17b — O app te ouve:** a nota detectada pelo `usePitch` pulsa no braço. Medidores em tempo real mostram a **% de notas na escala** e as **notas-alvo**: na troca de acorde, você tem uma janela de cerca de 1 tempo para cair na tônica, na 3ª ou na 7ª. As cartas são checadas automaticamente quando dá. Só detecta uma nota por vez (monofônico).
- **17c — Ouvido, call-and-response:** o `theory/` gera uma frase curta na escala e o app toca. Você repete, e o mic compara a sequência de notas, tolerando 1 erro. A dificuldade sobe aos poucos. No modo "resposta", você improvisa livre e só precisa terminar numa nota-alvo.
- **17d — Trilha e gamificação:** a trilha "Improviso" é feita de fases (penta em 1 shape → 5 shapes → notas-alvo no blues → maior/menor → dórico/mixolídio → ii–V–I). Cada fase dá de 1 a 3 estrelas e desbloqueia a próxima. Completam o módulo:
  - entidade `ImprovSession` com a API `/api/improviso/sessoes`;
  - streak do desafio do dia;
  - tela de resumo com confete quando bater recorde;
  - o XP liga ao XP geral quando o 6 chegar.

*Você aprende:* microfone e análise de áudio em tempo real, sincronizar eventos com o relógio do áudio, máquina de estados de um jogo e dados de jogo (fases e desafios) em TypeScript.

### 20. Separador de faixas (estilo Moises) 🎚️
Você envia uma música (**só upload de arquivo**: link do YouTube viola os termos do YouTube) e o app devolve a faixa **sem guitarra** e a **só guitarra**, para treinar o solo com a banda.
- **Modelo:** Demucs `htdemucs_6s` (MIT), que separa bateria, baixo, voz, piano, guitarra e outros. A guitarra sai boa, não perfeita.
- **Back (o dev implementa, roteiro curto):** `StemJob` (UserId, arquivo, status, expira em 7 dias, caminhos das faixas); `POST/GET /api/stems`, stream das faixas; `BackgroundService` que apaga os vencidos. Upload até ~20 MB, mp3/wav/m4a.
- **Worker Python (Claude):** container com Demucs que pega o próximo job no Postgres. `MODO=cpu` no beta (na VM Oracle, 3–10 min por música) e `MODO=modal` para vender (GPU por uso, ~US$ 0,01–0,05 por música). Arquivos no Cloudflare R2 quando sair da VM.
- **Front (aula):** upload com progresso, status por polling, player multi-faixa com mute/solo, loop A-B e velocidade. A faixa vira base para o Laboratório de improviso.
- Grátis: 2 músicas/mês. Pro: ilimitado.

*Você aprende:* upload de arquivo, fila de jobs, polling, player multi-faixa sincronizado.

### Futuro
Player de tablatura estilo Songsterr com alphaTab, usando arquivos Guitar Pro que você tiver. Também: detecção de tempo pelo microfone e gravação de sessões. E, por ordem de valor ÷ esforço:
- **"Envie a música, receba a aula":** detectar BPM, tom e acordes da música separada → progressão no montador, escala no braço e exercício de improviso em cima da música real.
- **Solo no braço:** `usePitch` na faixa só guitarra, mostrando o solo no `<Fretboard>` em câmera lenta (monofônico).
- **Modo canhoto, afinações alternativas e modo baixo** (4 cordas): pouco código, o `theory/` e o `<Fretboard>` já são genéricos.
- **Plano para professores:** o professor monta treinos para os alunos e acompanha o progresso; paga por aluno.
- **Indicação** (os dois ganham 1 mês Pro), plano anual, preço de estudante.
- **Duelo de improviso:** dois amigos gravam 30 s sobre a base do desafio do dia e os outros votam.

## Produto: beta e assinatura
**Fase A — beta fechado (≈ R$ 0/mês):** núcleo pronto (metrônomo, braço, backing, improviso, progresso) → 15 → 9 → convites para amigos músicos, todos Pro. Feedback pelo botão do app + grupo de WhatsApp. Mínimo de LGPD: termos de uso, política de privacidade, apagar conta sob pedido; no separador, o usuário é responsável pelo arquivo e tudo some em 7 dias. Opcional: PostHog (grátis) para ver o que é usado. Landing page com lista de espera.

**Fase B — assinatura (freemium):** o grátis tem que ser útil sozinho; o Pro destrava o que organiza e faz evoluir.

| Grátis | Pro |
|---|---|
| Metrônomo, drone, afinador | Montador de treino e Agenda / Treino de hoje |
| Braço (escalas, acordes, CAGED) | Laboratório de improviso completo |
| Backing tracks prontas | Montador de backing tracks salvas |
| Biblioteca, progresso básico | Gamificação completa, retrospectiva, IA |
| Improviso: 1ª fase + desafio do dia | Separador ilimitado (grátis: 2/mês) |

- Back: policy `[Authorize(Policy = "Pro")]` nos endpoints Pro. Front: componente `<Trancado>` mostra a tela com cadeado e selo **Pro** (a pessoa vê o que está perdendo).
- Pagamento: Stripe (Pix e cartão, ~4%) ou Mercado Pago; webhook no .NET liga/desliga o `Plano`.
- Empresa: MEI (≈ R$ 80/mês, exige 18 anos).
- Custo fixo estimado ao vender: ≈ R$ 100–150/mês + variável (GPU por música, taxa de pagamento). A R$ 15–20/mês, ~10 assinantes pagam o fixo.
- No fim do beta, perguntar aos amigos o que pagariam e o que tirariam do grátis.

## Como vamos trabalhar
1. **ClickUp:** depois que você autorizar o conector, eu crio uma lista "GuitarTrek" com uma task por módulo (1–16), subtasks com os passos e a prioridade na ordem acima.
2. Em cada módulo, eu explico os conceitos novos e você escreve as partes didáticas (componentes e hooks) com a minha orientação. Eu cuido do boilerplate e do backend se você quiser.
3. Um commit por módulo e um README atualizado.

## Verificação
- Back: `dotnet test` (gerador, XP, desafios) + Swagger.
- Front: `npm run test` (Vitest no `theory/`) + `npm run dev` e uso manual no desktop e no modo mobile.
- Metrônomo: comparar com um metrônomo de referência por cerca de 2 minutos, para conferir se ele não atrasa (drift). Afinador: comparar com um afinador de referência nas 6 cordas.
- Deploy: instalar o PWA no celular e receber um lembrete de teste.

