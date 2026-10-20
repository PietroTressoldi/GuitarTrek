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

> **Ordem atual (out/2026): improviso puxado para frente.** Depois do 3, a sequência é **5 → 5.5 (18a, 18c, 18b, 18g, 18d, 18f YouTube, 18e) → 22 (multilíngua; a aula 22a já está escrita, adiada pelo dev em out/2026 para seguir nas funcionalidades) → 12 (afinador, que traz o microfone) → 17 (Laboratório de improviso)**, e então volta para 4, 6, 7… A numeração abaixo continua a mesma, para bater com as issues.
>
> **Em paralelo, desde já:** Instagram, TikTok e Shorts mostrando o app na prática (módulo 23). Não precisa esperar o app ficar pronto.
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
- Estilos e progressões prontas ficam no front.
- **18d — Monte a sua backing track:** o usuário cria a própria base.
  - Uma grade com quantos compassos quiser (4, 8, 12, 16...). Você clica num compasso e escolhe o acorde **por grau** (`IV7`) ou **por cifra** (`D7`).
  - **Seções** (A, B, refrão) com repetição, e um estilo por seção (verso em funk, refrão em rock).
  - Tom, BPM, estilo e mixer ficam salvos junto.
  - Dá para **começar de uma progressão pronta** e editar.
  - Salvar, duplicar e renomear pela API `BackingTrack` (o dev implementa; o `Bars` em jsonb ganha `Secoes`).
  - No grátis, as prontas mais 3 salvas; no Pro, ilimitadas.
- **Ao tocar:** o compasso atual fica aceso, o acorde aparece grande e a escala sugerida aparece no `<Fretboard>`. Tem um mixer com volume e mute por instrumento.
- **Tela (mockup aprovado em `docs/mockups/backing.html`):** transporte num painel só, "Agora" com grau, luzes dos tempos e próximo acorde, grade com cifra + grau, e o braço com a escala em volta da forma CAGED do acorde atual (`aoRedor`, aula 05e), escolhendo a forma mais perto da região atual e mostrando a próxima troca tracejada. O painel flutuante do metrônomo some nesta página.
- **Som:** samples via `smplr` (bateria, baixo, piano/órgão), que aceita o horário exato de cada nota no relógio do áudio.
- **18b — Timbres reais:** cada canal (bateria, baixo, teclado) com opções gravadas de instrumento de verdade: bateria acústica Pearl (GMRockKit do Hydrogen, **GPL**: trocar por banco CC0/CC-BY antes de vender) ou LM-2; baixo elétrico dedo/palheta/fretless ou contrabaixo (Smolken); piano de cauda (Splendid Grand), Wurlitzer ou órgão. Cada estilo sugere os seus timbres, com humanização (tempo e força) e reverb.
- **18g — Backing que soa como banda (pedido do dev em out/2026, depois da 18b):** a base da 18b ficou simples e artificial demais: um compasso repetido, acordes em bloco sempre na mesma posição e humanização no sorteio. Entra **antes da 18d**: sem isso, o montador só salva uma base que soa mal.
  - **Bateria tocada por gente:** grooves e viradas do **Groove MIDI Dataset** (Magenta/Google, **CC BY 4.0**, permite uso comercial com crédito). São bateristas reais gravados em MIDI, com o tempo e a força de cada batida. Converter para JSON, de 2 a 4 compassos por estilo, com variações. Substitui o `Math.random()` pelo "balanço" de verdade.
  - **Baixo que caminha:** nota de aproximação (cromática ou da escala) no tempo 4, indo para a raiz do próximo acorde; variações por compasso; notas fantasma no funk; walking bass no jazz/blues.
  - **Teclado com condução de vozes:** cada acorde na inversão mais perto do anterior, em vez de sempre empilhado da raiz; a nota de cima mais forte; tensões (9, 13) por estilo; pedal de sustain no piano; várias figuras de levada por estilo.
  - **Dinâmica e forma:** intro e final, verso mais baixo que o refrão, crescendo na virada para o refrão, e cada instrumento com o seu "pocket" fixo (o baixo um pouco atrás do tempo), em vez de ruído aleatório.
  - **Mixagem:** um `DynamicsCompressorNode` (nativo do Web Audio) no master e EQ simples por canal.
  - **Critério de pronto:** comparar de ouvido, lado a lado, com uma backing de YouTube do mesmo estilo.
- **Sem guitarra sintetizada (decisão de out/2026):** o dev testou uma guitarra base montada nota a nota com palhetada simulada e ficou artificial demais. Backing de guitarrista é sem guitarra: a guitarra é o usuário.
- **18e — Guitarra gravada ("RealTracks caseiro"):** o dev grava trechos de 1 compasso de guitarra base por estilo × tipo de acorde (maior, menor, 7, m7, 7M), em dois tons (um em Mi e outro em Lá, para mudar a altura pouco). O app escolhe o trecho do acorde da vez, muda a altura para o tom e estica para o BPM com a `signalsmith-stretch` (MIT, WASM). É o que o Band-in-a-Box faz com os RealTracks. Direitos do próprio dev, o que vira diferencial do produto. Começar com 2 estilos (rock e pop).
- **Faixas completas gravadas:** não há biblioteca gratuita que possa ser embutida no app (os loops "royalty free" proíbem redistribuir). O caminho é o usuário trazer a faixa dele: loop do YouTube (18f, depois o 11) e separador de faixas (20).
- **18f — Backing do YouTube:** na página Backing, uma aba **Gerada | YouTube**.
  - Salvar links com título, tom, escala, BPM e progressão (uma pronta ou uma montada no 18d). Back (o dev implementa): entidade `FaixaYoutube` (UserId, Url, Titulo, Tom, Escala, Bpm, Progressao em jsonb, InicioSeg) com CRUD.
  - Player pela **IFrame Player API** oficial: loop A–B e velocidade de 0,25× a 2×. É permitido pelos termos do YouTube (o vídeo toca pelo próprio YouTube, nada é baixado).
  - **Acordes sincronizados:** o usuário dá o play e aperta "1" no primeiro tempo; o app lê o `getCurrentTime()` e calcula o compasso por `(tempo − início) ÷ duração do compasso`. O braço segue os acordes com as cores dos papéis e os tracejados, como na backing gerada. Funciona porque backing track é gravada no metrônomo; em gravação ao vivo, o tempo escorrega.
  - **Limites:** o app não muda o tom nem ouve o áudio do YouTube, porque o navegador proíbe um site de mexer num iframe de outro site. Vídeos com incorporação bloqueada não tocam. Para mudar o tom, a faixa precisa ser um arquivo (20).
  - O player, o loop e a velocidade viram um componente reaproveitado no repertório (11) e no Estudo de trecho (21).
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
- Player do YouTube com loop A-B e velocidade de 50–100%, com as seções salvas. O player é o mesmo da 18f (backing do YouTube).
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
- **Mudar o tom:** como aqui o app tem o áudio de verdade, dá para transpor e mudar o andamento sem mudar a altura, com a `signalsmith-stretch` (MIT, WASM, a mesma da 18e). Soa melhor em mudanças pequenas (±3 semitons, 0,75× a 1,5×).
- **Detectar acordes, tom e BPM (como o Moises):** o worker Python analisa a música e devolve uma linha do tempo de acordes, que vira a progressão da faixa. Com isso o braço segue os acordes da música real, como na 18f. É uma **estimativa**: acerta bem em pop e rock com acordes simples e erra mais em jazz. Antes de escolher a biblioteca, conferir a licença: os modelos do `madmom` são CC BY-NC-SA (uso não comercial) e o Essentia é AGPL. O usuário pode corrigir os acordes errados no montador (18d).
- Grátis: 2 músicas/mês. Pro: ilimitado.

*Você aprende:* upload de arquivo, fila de jobs, polling, player multi-faixa sincronizado.

### 21. Tabs + Estudo de trecho 🎼
Para treinar **as músicas de que você gosta**: a tab tocando, o trecho difícil em loop, começando devagar e subindo a velocidade.

**Sem catálogo de tabs de terceiros.**
- No Songsterr e no Ultimate Guitar, as tabs são escritas pela comunidade.
- Para as editoras, tab de música dos outros sem licença é uso não autorizado. Os sites grandes resolvem pagando licença: o Ultimate Guitar tem acordo com Sony, EMI, Hal Leonard e outras.
- Aqui o modelo é **"traga a sua tab"**, igual ao separador (20): o arquivo fica **privado** na conta, e o usuário é responsável por ele.

**21a — Player:**
- **alphaTab** (gratuito, MPL-2.0) abre `.gp`, `.gp5`, `.gpx` e MusicXML.
- Cursor de tempo, contagem antes de começar, mute e solo por instrumento, som pelo próprio sintetizador do alphaTab.
- Entidade `Tab` (UserId, arquivo, título, artista, último trecho estudado), com upload privado (o dev implementa).

**21b — Estudo de trecho** ⭐ (o coração do módulo):
- Você marca os compassos de início e fim, começa em X% da velocidade e sobe Y% a cada N repetições limpas, até 100%.
- É o speed trainer do `useMetronome` generalizado num hook `useEstudoDeTrecho` (trecho, velocidade atual, regra de subida e contador de repetições).
- O mesmo hook serve para o loop do YouTube (11) e para o player de faixas separadas (20).
- Os trechos ficam salvos, o BPM alcançado vira `PracticeLog` (6), e um trecho pode entrar no plano de treino (7).

**21c — Tab no braço:** a nota que toca acende no `<Fretboard>`, com o grau dela sobre o acorde.

**Depois:**
- **21d — Editor de licks e riffs:** no formato de texto alphaTex. Os exercícios da Biblioteca (4) também passam a aparecer em tab.
- **21e — O app confere pelo microfone:** você toca e o `usePitch` (12) confere a nota (monofônico, estilo Yousician).

*Você aprende:* integrar uma biblioteca grande num componente React, sincronizar a UI com o tempo de um player, e um hook reaproveitado em 3 players diferentes.

### 22. Multilíngua 🌎 (PT-BR, EN, ES)
Para alcançar além do Brasil: inglês é o maior público, e espanhol cobre a América Latina, com fuso e realidade de preço parecidos com os do Brasil. **Entra logo depois da 18c**, enquanto ainda são poucas páginas; daí em diante, toda tela nova já nasce traduzível.
- **Dicionário tipado** em `web/src/i18n/`: o `pt.ts` é a referência (`type Textos = typeof pt`), `en.ts`/`es.ts` são `Textos`, e as telas leem `t.secao.chave` via Context (`useTextos()`). Aulas 22a (estrutura, menu, teoria, Backing) e 22b (Metrônomo, painel, resto do Braço, `Dó Ré Mi`). É o mesmo `Record` + `satisfies` dos rótulos, sem biblioteca nova: se faltar uma tradução, o TypeScript avisa. Se o volume de texto crescer muito, avaliar o `react-i18next`.
- **Cuidados de música:**
  - Nome das notas configurável entre `C D E` e `Dó Ré Mi` (no espanhol, `Do Re Mi` é o comum).
  - Os `ROTULOS_ESCALA` e `ROTULOS_ACORDE` passam a vir do dicionário.
  - As cifras (`A7`, `Dm7`) ficam iguais em todo idioma.
- **Idioma:** detectado pelo navegador e salvo no perfil.
- **Preço:** em BRL no Brasil e em USD fora (Stripe).
- A landing page (23) também sai nos 3 idiomas.
- Regra nova no `CLAUDE.md`: texto de interface só via `t()`.

*Você aprende:* Context, chaves tipadas e formatação por idioma (`Intl.NumberFormat`, `Intl.DateTimeFormat`).

### 23. Marca, redes e landing page 📣
**Redes (começam já, em paralelo com o app):**
- Instagram, TikTok e YouTube Shorts, com o mesmo vídeo vertical nos três. Gravação de tela no OBS + guitarra, editado no CapCut, tudo grátis. Ritmo de 2 ou 3 vídeos por semana.
- **Linhas de conteúdo:**
  - "a escala em volta do acorde": o braço acendendo enquanto a backing toca e você improvisa por cima;
  - o desafio de improviso do dia;
  - antes e depois de BPM;
  - bastidores de "construindo um app de guitarra" (build in public).

**Landing page:**
- **Estilo:** dark premium com a identidade H (tolex, cores de pedal das categorias, luz piloto âmbar, Archivo expandida), usando os mesmos tokens do `web/src/index.css`. Referências: pickupmusic.com e guitarpracticehub.com. Antes, um mockup em `docs/mockups/landing.html`.
- **Estrutura**, inspirada no pickupmusic.com:
  1. hero com vídeo do braço acendendo e o botão "Entrar na lista de espera";
  2. 3 pilares: Braço + CAGED, Backing + improviso, e o Treino que se monta sozinho;
  3. uma demonstração interativa curta;
  4. depoimentos do beta;
  5. preço (quando houver);
  6. FAQ e um botão final.
- **Técnica:** página estática em `site/` no Cloudflare Pages, separada do app, para carregar rápido e aparecer no Google.
- **Lista de espera:** começa num formulário grátis (Tally). Depois do deploy (9), passa a usar `POST /api/lista-espera` com a entidade `ListaEspera` (Email, Idioma, CriadoEm), que o dev implementa.

### Futuro
Também: detecção de tempo pelo microfone. E, por ordem de valor ÷ esforço:
- **Música + tab + trecho:** a faixa sem guitarra (20) e a tab dela (21) tocando juntas, com o Estudo de trecho por cima. É treinar a música que você gosta com a banda.
- **Batidas de violão brasileiras:** padrões de mão direita (↓↑) de pop, sertanejo, MPB e bossa, tocando junto da backing. Diferencial forte no Brasil.
- **Treino de ouvido:** reconhecer intervalos e acordes, reaproveitando o `theory/` e os samples do `smplr`.
- **Gravar o take** por cima da backing ou da tab e comparar com o da semana anterior.
- **"Envie a música, receba a aula":** com os acordes, o tom e o BPM detectados no 20 → progressão no montador, escala no braço e exercício de improviso em cima da música real.
- **Extensão do navegador (como a Transpose):** uma extensão roda dentro da página do youtube.com e pode passar o `<video>` pela Web Audio, para mudar o tom e ouvir o áudio direto no YouTube. É outro produto (só desktop, loja do Chrome, código separado), então fica para depois de o app estar no ar.
- **Solo no braço:** `usePitch` na faixa só guitarra, mostrando o solo no `<Fretboard>` em câmera lenta (monofônico).
- **Modo canhoto, afinações alternativas e modo baixo** (4 cordas): pouco código, o `theory/` e o `<Fretboard>` já são genéricos.
- **Plano para professores:** o professor monta treinos para os alunos e acompanha o progresso; paga por aluno. O guitarpracticehub.com tem área de professor, um sinal de que existe demanda.
- **Indicação** (os dois ganham 1 mês Pro), plano anual, preço de estudante.
- **Duelo de improviso:** dois amigos gravam 30 s sobre a base do desafio do dia e os outros votam.

## Produto: beta e assinatura
**Fase A — beta fechado (≈ R$ 0/mês):** núcleo pronto (metrônomo, braço, backing, improviso, progresso) → 15 → 9 → convites para amigos músicos, todos Pro. Feedback pelo botão do app + grupo de WhatsApp. Mínimo de LGPD: termos de uso, política de privacidade, apagar conta sob pedido; no separador, o usuário é responsável pelo arquivo e tudo some em 7 dias. Opcional: PostHog (grátis) para ver o que é usado. Landing page com lista de espera (módulo 23).

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

