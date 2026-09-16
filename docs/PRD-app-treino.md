# PRD — App de Acompanhamento de Treino e Nutrição

**Versão:** 1.1 (MVP)
**Autor:** [seu nome]
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
| RF09 | Editar/corrigir um registro de série já feito (sessão atual ou passada) | Baixa |
| RF10 | Criar e selecionar perfil local (nome, dados físicos, objetivo) | Alta |

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

## 9. Stack técnica

- React Native + Expo (SDK gerenciado)
- TypeScript
- Armazenamento local: `AsyncStorage` no MVP (migrar para `expo-sqlite` quando o volume
  de dados justificar)
- Navegação: **Expo Router** (roteamento baseado em arquivos, dentro de `src/app/`) — usa
  React Navigation internamente, mas sem configuração manual de `NavigationContainer` ou
  `Stack.Navigator`
- Testes em dispositivo real via Expo Go (sem build nativo nesta fase)

## 10. Telas do MVP

1. **Seleção/criação de perfil** (novo — primeira tela ao abrir o app)
2. Importar/selecionar treino (do perfil ativo)
3. Execução do treino (exercício + série + registro de carga/reps)
4. Cronômetro de descanso
5. Histórico de evolução por exercício (do perfil ativo)

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

## 14. Abordagem de identidade visual

Decisão registrada em 2026-09-15: a identidade visual (cores, tipografia, estilo, "cara"
do app) será trabalhada **de forma incremental, requisito a requisito**, a partir do
momento em que cada tela se tornar definitiva — não de uma vez só ao final do MVP, nem
investida em telas explicitamente temporárias (ex: o ponto de entrada provisório do RF01
em `(tabs)/index.tsx`, que será substituído no RF02). O template padrão do Expo
("Welcome to Expo", boilerplate de exemplo) permanece como está por enquanto, sem
prioridade de limpeza, enquanto o foco continua em funcionalidade. A primeira tela
candidata a receber atenção visual de verdade é a lista de treinos (RF02), por ser a
primeira tela permanente do fluxo principal do app.
