<!--
Sync Impact Report
==================
Version change: 1.0.0 → 2.0.0 (MAJOR — redefinição incompatível do Princípio V)

Modified principles:
  - V. Isolamento de Dados por Perfil (NON-NEGOTIABLE)
    → V. Autenticação Obrigatória e Isolamento por Conta (NON-NEGOTIABLE)

Modified sections:
  - Technology & Platform Constraints: modelo de perfis locais sem autenticação
    (AsyncStorage como fonte de verdade) substituído por Firebase Authentication
    (Google/Apple Sign-In) + Firestore como fonte de verdade, com persistência
    offline nativa; exceção de conectividade explicitada (login/logout).
  - Development Workflow & Quality Gates: item 2 trocado de filtro por
    `perfil_id` para filtro/isolamento por `uid` da conta autenticada.
  - Governance: referência ao Princípio V atualizada; nota de migração da
    Emenda v2.0.0 adicionada (dados locais existentes NÃO migrados).
  - Correção editorial (mesma emenda v2.0.0, ainda não commitada quando esta
    correção foi feita): Princípio II ("Simplicidade sobre Funcionalidades
    Avançadas no MVP") teve "sincronização em nuvem" removida da lista de
    exemplos de funcionalidades a adiar — deixou de ser "avançada demais para
    o MVP" e passou a ser parte do Princípio V. Sem bump de versão: é uma
    correção ao rascunho da própria v2.0.0, que nunca chegou a ser commitado
    com o texto antigo.

Added sections: N/A
Removed sections: N/A

Follow-up TODOs / itens fora do escopo deste comando (não alterados aqui):
  - docs/PRD-app-treino.md RNF02 (offline) precisa registrar a exceção de
    login/logout exigindo rede — pedido explicitamente pelo usuário, mas edição
    de PRD está fora do escopo do /speckit.constitution.
  - docs/PRD-app-treino.md RNF05 ("Perfis são armazenados localmente, sem senha
    ou autenticação") e a seção 5 (Não-objetivos: "Login, senha ou autenticação
    real", "Sincronização de perfis/dados entre aparelhos") agora contradizem
    esta emenda — precisam de atualização formal no PRD.
  - Risco prático não resolvido por esta emenda de governança: o PRD (seção de
    riscos) registra que o projeto não tem conta paga do Apple Developer
    Program hoje — Sign in with Apple normalmente exige essa conta para
    configurar a capability em build de produção.
  - Nenhum código/spec existente foi migrado por este comando (fora de escopo);
    todo o app implementado até aqui (RF01-RF20) ainda opera sob o modelo de
    `perfil_id`/AsyncStorage e ficará desalinhado até specs de migração rodarem.
-->

# ShapeFit Constitution

## Core Principles

### I. TypeScript Obrigatório
Todo o código do projeto (app, componentes, hooks, utilitários, scripts de build) MUST ser
escrito em TypeScript, sem uso de `any` implícito e sem arquivos `.js`/`.jsx` novos. Tipos
de dados de domínio (conta, treino, sessão, histórico) MUST ser explicitamente definidos e
compartilhados entre as camadas que os consomem.
Rationale: consistência de tipos reduz bugs de integração entre telas, Firestore e lógica
de negócio, especialmente em um app com dados sensíveis a contexto de conta.

### II. Simplicidade sobre Funcionalidades Avançadas no MVP
No MVP, a equipe MUST preferir a solução mais simples que atenda ao requisito, evitando
abstrações, camadas de configuração ou funcionalidades especulativas não solicitadas no PRD.
Funcionalidades avançadas (analytics, gamificação, etc.) MUST ser adiadas para fases
posteriores, a menos que explicitamente incluídas no escopo do MVP.
Rationale: o público-alvo inicial e o cronograma do MVP exigem previsibilidade e baixo risco
técnico; complexidade prematura compromete ambos.

### III. Validação em Dois Dispositivos-Alvo
Nenhuma etapa, feature ou correção MUST ser considerada concluída sem validação manual em
pelo menos um dispositivo Android e um dispositivo iOS (físico ou emulador/simulador
equivalente). Divergências de comportamento entre plataformas MUST ser documentadas e
resolvidas antes do fechamento da etapa.
Rationale: React Native + Expo introduzem diferenças sutis de comportamento entre
plataformas; validar apenas uma plataforma esconde regressões que só aparecem em produção.

### IV. Controle de Dependências
Novas dependências de terceiros MUST estar listadas no PRD do projeto. A introdução de
qualquer dependência não listada MUST vir acompanhada de justificativa explícita registrada
(no PR, na spec ou no plano da feature) explicando por que as dependências já aprovadas não
resolvem o problema.
Rationale: cada dependência adicional aumenta superfície de manutenção, risco de
compatibilidade com o Expo SDK e tempo de build; o controle evita inchaço não planejado.

### V. Autenticação Obrigatória e Isolamento por Conta (NON-NEGOTIABLE)
Todo acesso ao app MUST exigir autenticação via Google Sign-In ou Apple Sign-In (Firebase
Authentication) — não há uso do app sem conta autenticada. Todo dado de treino, sessão e
histórico MUST ser segregado pelo `uid` da conta autenticada ativa no Firestore, substituindo
`perfil_id` como chave de isolamento. Nenhuma consulta, tela, regra de segurança do Firestore
ou operação de escrita MUST expor, agregar ou vazar dados entre contas diferentes. Qualquer
nova coleção do Firestore, hook de leitura/escrita ou estrutura de estado que armazene dados
de treino MUST incluir o `uid` como parte da chave do documento/coleção e das regras de
segurança do Firestore (não apenas como filtro no cliente).
Rationale: substitui o modelo de múltiplos perfis locais sem login por contas reais — a
barreira de privacidade deixa de ser a segregação local por `perfil_id` e passa a ser a
autenticação somada às regras de segurança do Firestore por `uid`; uma falha aqui expõe
dados entre contas de usuários diferentes, um risco mais sério do que a exposição entre
perfis no mesmo aparelho que este princípio substitui.

**Nota de migração (Emenda v2.0.0, 2026-09-29)**: dados locais já existentes sob o modelo de
perfil (perfis de teste no AsyncStorage) NÃO são migrados para o Firestore — são descartados
nesta transição, por decisão explícita do usuário. Specs que implementem esta emenda MUST
assumir estado inicial vazio no Firestore, sem processo de importação de dados legados do
AsyncStorage.

## Technology & Platform Constraints

Stack: React Native + Expo (ver `AGENTS.md` para a versão do Expo em uso e a exigência de
consultar a documentação versionada antes de escrever código). Autenticação MUST usar Firebase
Authentication com os provedores Google Sign-In e Apple Sign-In (Princípio V) — Firebase
Authentication e Firestore são dependências aprovadas por esta emenda (Princípio IV). Firestore
é a fonte de verdade para dados de treino, sessão e histórico, substituindo o AsyncStorage local
usado como fonte de verdade até a v1.x desta constituição (AsyncStorage pode seguir em uso
apenas para estado não sensível de UI, nunca como fonte de verdade de dados de treino/sessão/
histórico). Leitura e escrita durante uso offline MUST usar a persistência offline nativa do
Firestore, sincronizando automaticamente ao reconectar — a única exceção à operação offline
(RNF02 do PRD) é o fluxo de login/logout, que exige conectividade de rede; todo o restante do
app MUST continuar funcionando offline. Qualquer mudança adicional de stack (ex.: outro
provedor de autenticação, outro banco remoto) é uma mudança de escopo que MUST passar por
atualização desta constituição antes da implementação.

## Development Workflow & Quality Gates

Toda etapa de desenvolvimento (feature, correção, refatoração) MUST passar pelos seguintes
gates antes de ser marcada como concluída:
1. Código em TypeScript, sem erros de type-check.
2. Verificação de que nenhuma consulta, escrita ou regra de segurança do Firestore relativa a
   dado de treino/sessão/histórico ocorre sem isolamento pelo `uid` da conta autenticada.
3. Teste manual (ou automatizado, quando disponível) em Android e iOS.
4. Confirmação de que nenhuma dependência nova foi introduzida sem estar no PRD ou sem
   justificativa registrada.

## Governance

Esta constituição tem precedência sobre convenções de código, preferências pessoais e
práticas ad-hoc dentro deste repositório. Qualquer conflito entre esta constituição e outras
instruções do projeto (ex.: `AGENTS.md`, `CLAUDE.md`) MUST ser resolvido a favor desta
constituição, exceto quando o outro documento for mais específico e não a contradiga.

Emendas a esta constituição MUST ser propostas por escrito (PR ou registro equivalente),
descrever o motivo da mudança e, quando alterarem ou removerem um princípio, incluir um
plano de migração para o código/processo já existente que dependa do princípio anterior (ver
nota de migração da Emenda v2.0.0 no Princípio V).

Versionamento segue semântica MAJOR.MINOR.PATCH:
- MAJOR: remoção ou redefinição incompatível de um princípio existente.
- MINOR: adição de novo princípio ou expansão material de uma seção existente.
- PATCH: esclarecimentos, correções de texto ou ajustes não semânticos.

Toda revisão de código (PR review) MUST verificar aderência aos princípios acima,
especialmente ao Princípio V (autenticação obrigatória e isolamento por conta/`uid`).
Complexidade adicional ou desvio de qualquer princípio MUST ser justificado explicitamente
na descrição do PR ou da spec.

**Version**: 2.0.0 | **Ratified**: 2026-09-14 | **Last Amended**: 2026-09-29
