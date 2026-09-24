# PRD — App de Acompanhamento de Treino e Nutrição

**Versão:** 1.1 (MVP)
**Autor:** Victor Campos
**Data:** 2026-09-14
**Status:** Rascunho para desenvolvimento via SDD

---

## 1. Visão geral

Aplicativo mobile pessoal/familiar para acompanhar desempenho na academia: registrar
cargas, repetições e descanso durante o treino, com evolução futura para periodização
baseada em boas práticas de treinamento físico e integração nutricional. Suporta múltiplos
perfis locais (sem login/senha) para uso por mais de uma pessoa da família no mesmo
aparelho. Uso multiplataforma (Android e iOS).

## 2. Problema a resolver

Hoje o acompanhamento de treino é feito de forma manual/dispersa (papel, planilha, apps
genéricos que não se encaixam no fluxo real de treino). Falta uma ferramenta que:
- Permita importar um treino pré-planejado e executá-lo guiado
- Registre carga e repetições por série, de forma rápida, durante o treino
- Cronometre o descanso automaticamente
- Mostre evolução de carga ao longo do tempo
- Diferencie quem está treinando, quando mais de uma pessoa usa o mesmo aparelho
- (Futuro) Integre nutrição e periodização de forma inteligente, usando dados básicos do
  perfil (peso, altura, idade, objetivo)

## 3. Usuário-alvo

O próprio desenvolvedor/solicitante e até 1-2 familiares, praticantes de musculação,
compartilhando os mesmos aparelhos:
- Redmi Note 12 (Android)
- iPhone 16 Plus (iOS)

Cada pessoa tem um **perfil local** próprio (sem senha/autenticação) para manter treinos
e histórico separados. Perfis não são sincronizados entre aparelhos diferentes nesta fase.

## 4. Objetivos do MVP

- **O1:** Permitir importar um treino estruturado (JSON) e visualizá-lo por dia/sessão
- **O2:** Executar o treino registrando carga e reps por série, com poucos toques
- **O3:** Cronometrar o descanso automaticamente entre séries
- **O4:** Consultar histórico simples de evolução de carga por exercício
- **O5:** Funcionar de forma estável nos dois aparelhos-alvo via Expo Go
- **O6:** Permitir que mais de uma pessoa use o app no mesmo aparelho, cada uma com seu
  próprio perfil, treinos e histórico separados

## 5. Não-objetivos (explicitamente fora do MVP)

- Vídeos ou imagens ilustrativas de execução dos exercícios
- Periodização automática (linear, ondulatória, blocos)
- Módulo de nutrição
- Login, senha ou autenticação real — perfis são apenas selecionados localmente, sem
  proteção de acesso
- Sincronização de perfis/dados entre aparelhos diferentes (ex: o perfil criado no Redmi
  Note 12 não aparece automaticamente no iPhone 16 Plus)
- Publicação nas lojas (App Store / Play Store) — uso via Expo Go é suficiente por ora

> **Nota:** os dois últimos itens (login/sync e publicação nas lojas) estavam implícitos
> na versão anterior do PRD e foram removidos na edição recebida. Estou mantendo-os aqui
> como não-objetivos explícitos, já que nada do que foi conversado hoje indica que
> autenticação real ou publicação nas lojas entraram no escopo — avise se isso não for o
> caso.

## 6. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF01 | Importar arquivo JSON com estrutura de treino, associado ao perfil ativo | Alta |
| RF02 | Listar treinos importados/salvos do perfil ativo | Alta |
| RF03 | Tela de execução: exibir exercício atual, série atual, campos para carga (kg) e reps | Alta |
| RF04 | Avançar entre séries e exercícios (navegação não estritamente sequencial) | Alta |
| RF05 | Iniciar cronômetro de descanso automaticamente ao concluir uma série | Alta |
| RF06 | Notificar (som/vibração) ao fim do descanso | Média |
| RF07 | Salvar sessão de treino (completa ou finalizada manualmente), associada ao perfil ativo | Alta |
| RF08 | Tela de histórico: evolução de carga por exercício ao longo do tempo, filtrada pelo perfil ativo | Média |
| RF09a | Editar/corrigir um registro de série já feito, da sessão **atual em andamento** (adiantado, implementado logo após o RF04 — ver `docs/criterios-aceite.md`) | Baixa |
| RF09b | Editar/corrigir um registro de série já feito, de uma sessão **já finalizada** no passado (depende do RF07/RF08) | Baixa |
| RF10 | Criar e selecionar perfil local (nome, dados físicos, objetivo) | Alta |

**Pós-MVP (não fazem parte do RF01–RF10 original — pedidos pelo usuário depois do MVP completo e validado, ver seção 13):**

| ID | Requisito | Prioridade | Spec |
|----|-----------|------------|------|
| RF11 | Importar múltiplos treinos de um único arquivo (estende o RF01) | Alta | `specs/012-importar-multiplos-treinos/` |
| RF12 | Conclusão explícita de sessão de treino — lista permanece concluída até o usuário iniciar uma nova sessão (estende o RF07) | Alta | `specs/013-nova-sessao-treino/` |
| RF13 | Vibração diferenciada ao fim do descanso, mais intensa que a da notificação (estende o RF06) | Média | `specs/014-vibracao-fim-descanso/` |
| RF14 | Tela separada para trocar perfil e importar treino, acessada por ícone em cada aba (estende o RF02/RF10) | Média | `specs/015-menu-de-acoes/` |
| RF15 | Progresso de um ciclo de 40 sessões (8 semanas) ao importar múltiplos treinos: criado automaticamente, cota distribuída por treino, indicador visual por treino em "Meus Treinos", bloqueio de nova importação enquanto o ciclo estiver em andamento e aviso ao atingir 40 sessões (estende o RF11) | Média | `specs/018-progresso-ciclo/` |

## 7. Requisitos não funcionais

- **RNF01:** Rodar via Expo Go em Android 12+ (Redmi Note 12) e iOS 17+ (iPhone 16 Plus)
- **RNF02:** Funcionar offline (dados salvos localmente, sem dependência de internet)
- **RNF03:** Interações principais (registrar série) devem levar no máximo 2 toques
- **RNF04:** Código em TypeScript, organizado para permitir evolução incremental (v2, v3...)
- **RNF05:** Perfis são armazenados localmente, sem senha ou autenticação — a seleção de
  perfil é apenas para segregar dados, não para proteger acesso

## 8. Modelo de dados

### Perfil (novo — RF10)

> **Nota:** o exemplo abaixo é ilustrativo do conteúdo. Na implementação, os campos internos
> do app usam `camelCase` (ex: `pesoKg`, `alturaCm`), diferente do `snake_case` usado nos
> arquivos JSON de treino importados (que são um formato de arquivo externo). Ver
> `data-model.md` da feature RF10 para o schema técnico exato.

```json
{
  "id": "perfil-joao",
  "nome": "João",
  "pesoKg": 78.5,
  "alturaCm": 178,
  "idade": 32,
  "sexo": "Masculino",
  "objetivo": "Hipertrofia",
  "criadoEm": "2026-09-14T21:48:00.000Z"
}
```

### Treino importado (entrada) — agora vinculado a um perfil
```json
{
  "perfil_id": "perfil-joao",
  "nome": "Treino A - Peito/Tríceps",
  "exercicios": [
    {
      "id": "supino-reto",
      "nome": "Supino reto",
      "series": 4,
      "reps_alvo": "8-10",
      "carga_sugerida_kg": 40,
      "descanso_seg": 90
    }
  ]
}
```

### Sessão executada (saída, persistida localmente) — agora vinculada a um perfil
```json
{
  "perfil_id": "perfil-joao",
  "data": "2026-08-14",
  "treino_nome": "Treino A - Peito/Tríceps",
  "execucoes": [
    {
      "exercicio_id": "supino-reto",
      "series_realizadas": [
        {"serie": 1, "reps": 10, "carga_kg": 40},
        {"serie": 2, "reps": 9, "carga_kg": 40}
      ]
    }
  ]
}
```

**Nota de implementação:** com AsyncStorage, o `perfil_id` deve compor a chave de
armazenamento (ex: `treinos:perfil-joao`, `sessoes:perfil-joao`) para manter a separação
de dados entre perfis sem precisar filtrar listas grandes em memória.

**Contrato definido pelo RF10 para o RF07 (a considerar na spec do RF07):** a estrutura de
sessão persistida MUST incluir um campo `finalizadaEm` (string ISO 8601 ou `null`) — nulo
enquanto a sessão está em andamento, preenchido no momento em que é finalizada. O RF10 usa
esse campo para decidir se a troca de perfil ativo deve ser bloqueada (bloqueada quando
existe ao menos uma sessão do perfil ativo com `finalizadaEm === null`).

**Nota do RF03 a reconferir quando o RF04 existir:** a tela de execução (RF03) assume que
não pode haver troca de perfil ativo "debaixo dela" porque o RF10 bloqueia essa troca
durante sessão em andamento. Isso só se torna uma garantia real quando algo passar a
persistir sessões com `finalizadaEm: null` (hoje, sem isso, `existeSessaoEmAndamento`
sempre retorna `false`, então o bloqueio nunca é de fato acionado). **Correção:** é o
**RF04** — não o RF07 — que passa a criar/atualizar essa estrutura de sessão (decisão
registrada na spec do RF04), então o bloqueio do RF10 se torna funcional assim que o RF04
for implementado. Ao testar o RF04, incluir explicitamente o cenário de tentar trocar de
perfil com uma sessão em andamento, para validar que o bloqueio realmente dispara na
prática, não só na teoria do contrato.

## 9. Stack técnica

- React Native + Expo (SDK gerenciado)
- TypeScript
- Armazenamento local: `AsyncStorage` no MVP (migrar para `expo-sqlite` quando o volume
  de dados justificar)
- Navegação: **Expo Router** (roteamento baseado em arquivos, dentro de `src/app/`) — usa
  React Navigation internamente, mas sem configuração manual de `NavigationContainer` ou
  `Stack.Navigator`
- Notificações locais: **`expo-notifications`** (adicionado no RF06) — agendamento de
  avisos do sistema operacional para o fim do descanso, necessário porque o JS do app é
  suspenso em segundo plano
- Gráficos vetoriais: **`react-native-svg`** (adicionado em 2026-09-21, identidade
  visual) — biblioteca padrão do ecossistema Expo para desenho vetorial (mantida pela
  Software Mansion/Expo); necessária porque o app não tinha nenhuma forma de desenhar
  vetores dinâmicos (anel de progresso, conjunto de ícones de interface customizados) —
  `expo-symbols`, já em uso, só cobre ícones estáticos do sistema (SF Symbols/Material),
  sem parametrização por progresso nem controle de traço/forma customizada
- Tipografia: **`@expo-google-fonts/big-shoulders-display`** (adicionado em 2026-09-21,
  melhorias de layout) — fonte de exibição (títulos/subtítulos) com personalidade visual,
  alinhada à identidade de marca já definida (ícone/logo); pacote só de assets/JS sobre o
  `expo-font` (já presente no projeto), sem código nativo novo — não exige novo build de
  desenvolvimento
- Testes em dispositivo real via Expo Go (sem build nativo) até o RF05, inclusive.
  **A partir do RF06** (notificações), o projeto migrou para um **development build no
  Android** — `expo-notifications` quebrava o carregamento do app no Expo Go puro
  nesse aparelho especificamente. **No iOS, o Expo Go puro continuou funcionando
  normalmente** mesmo após o RF06 (confirmado em teste real) — o crash de import é uma
  limitação específica do Expo Go no Android, não da biblioteca em si. Resumindo:
  Android usa development build a partir do RF06; iOS pode continuar em Expo Go puro
  em toda a linha do tempo do projeto. Reflita essa distinção por plataforma nos
  `quickstart.md` de features futuras, sem precisar de nova confirmação a cada vez.

## 10. Telas do MVP

1. **Seleção/criação de perfil** (novo — primeira tela ao abrir o app)
2. Importar/selecionar treino (do perfil ativo)
3. Execução do treino (exercício + série + registro de carga/reps)
4. Cronômetro de descanso
5. Histórico de evolução por exercício (do perfil ativo)

**Pós-MVP (RF14, 2026-09-22):** trocar de perfil e importar treino saíram da tela de
lista de treinos e viraram uma 6ª tela própria ("Ações"), acessada por um ícone
presente em todas as abas — ver `specs/015-menu-de-acoes/`.

## 11. Métricas de sucesso do MVP

- O usuário consegue importar um treino e completar uma sessão inteira sem travar ou
  perder dados
- O app é usado em pelo menos 3 sessões de treino reais consecutivas
- Tempo de registro por série não atrapalha o ritmo do treino
- Dois perfis diferentes no mesmo aparelho não veem dados um do outro em nenhuma tela

## 12. Roadmap pós-MVP

- **v2:** imagens/GIFs ilustrativos por exercício (base aberta — ver opções pesquisadas na
  conversa de desenvolvimento)
- **v3:** periodização (regras de negócio definidas antes da implementação; poderá usar
  dados físicos do perfil, como idade e objetivo)
- **v4:** módulo de nutrição (integração com base de alimentos existente, ex: Open Food
  Facts; poderá usar peso/altura do perfil para cálculos)
- **v5:** sincronização de perfis entre aparelhos (nuvem)

## 13. Riscos e restrições conhecidos

- Sem conta Apple Developer paga, distribuição fica limitada ao Expo Go / builds internos
  (não há publicação na App Store nesta fase)
- Cronômetro em background pode ter comportamento diferente entre Android e iOS —
  validar cedo nos dois aparelhos
- Escopo de periodização é o maior risco de complexidade do produto; mantido fora do MVP
  de propósito
- **Novo:** a segregação de dados por perfil atravessa quase todos os requisitos (RF01,
  RF02, RF07, RF08) — isso aumenta o escopo do MVP em relação à v1.0 do PRD. Vale reavaliar
  se RF10 (perfil) deve ser implementado **antes** dos demais requisitos, já que os outros
  dependem dele para funcionar corretamente
- **Dívida técnica acumulada — RESOLVIDA (atualizada em 2026-09-21):** RF01, RF02, RF03,
  RF04, RF09a, RF05, RF06, RF07, RF08 e RF09b foram todos implementados e validados nos
  dois aparelhos-alvo (Redmi Note 12/Android e iPhone 16 Plus/iOS). RF10 já validado
  desde sua implementação original. Não há dívida de validação pendente no MVP original
  (RF01–RF10).
- **Pendência atual (2026-09-22):** RF11–RF14 (pós-MVP, ver seção 6) estão com código
  implementado e validados via web (Expo web + Playwright), mas **ainda não validados
  nos dois aparelhos-alvo** — RF13 (vibração) em particular só é verificável em
  aparelho físico. Critérios de aceite detalhados em `docs/criterios-aceite.md`.

## 14. Abordagem de identidade visual

**Decisão original (2026-09-15), já superada:** a identidade visual seria trabalhada
de forma incremental, tela a tela, a partir de quando cada uma se tornasse definitiva.

**Status atual (atualizado em 2026-09-22):** identidade visual completa e aplicada em
todas as telas do app, não mais incremental:

- Ícone do app (halter, gradiente laranja) e conjunto de 10 ícones de interface
  (`src/components/ui/icons.tsx`), em `react-native-svg`
- Cor de marca laranja (`#FF6529` claro / `#FF7A45` escuro) aplicada em botões, links
  e estados selecionados em todas as telas
- Componente `Button` reutilizável (`src/components/ui/button.tsx`, variantes
  primary/outline/success), substituindo os botões ad-hoc duplicados que existiam
  antes
- Tipografia de exibição custom (`@expo-google-fonts/big-shoulders-display`) em
  títulos e subtítulos
- Anel de progresso (`src/components/ui/progress-ring.tsx`) para estados de
  carregamento
- Boilerplate padrão do Expo ("Welcome to Expo") não existe mais em nenhuma tela —
  todas as telas do fluxo principal (perfil, treinos, execução, histórico, ações)
  são definitivas e têm identidade visual própria

Feedback do usuário após aplicar essas mudanças: "gostei muito do layout, bote manter
este nível" — esse é o padrão esperado para qualquer tela nova adicionada ao projeto
(reaproveitar os tokens de tema, o componente `Button`, a tipografia já configurada
em `ThemedText`, em vez de introduzir estilos ad-hoc novos).
