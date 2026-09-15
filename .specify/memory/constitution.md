<!--
Sync Impact Report
==================
Version change: [TEMPLATE] → 1.0.0 (initial ratification)
Modified principles: N/A (initial adoption)
Added sections:
  - Core Principles: I. TypeScript Obrigatório, II. Simplicidade no MVP,
    III. Validação em Dois Dispositivos, IV. Controle de Dependências,
    V. Isolamento de Dados por Perfil (NON-NEGOTIABLE)
  - Technology & Platform Constraints
  - Development Workflow & Quality Gates
  - Governance
Removed sections: N/A
Follow-up TODOs:
  - TODO(GUIDANCE_FILE): nenhum arquivo de guidance de runtime separado ainda;
    AGENTS.md/CLAUDE.md cumprem esse papel hoje.
-->

# ShapeFit Constitution

## Core Principles

### I. TypeScript Obrigatório
Todo o código do projeto (app, componentes, hooks, utilitários, scripts de build) MUST ser
escrito em TypeScript, sem uso de `any` implícito e sem arquivos `.js`/`.jsx` novos. Tipos
de dados de domínio (perfil, treino, sessão, histórico) MUST ser explicitamente definidos e
compartilhados entre as camadas que os consomem.
Rationale: consistência de tipos reduz bugs de integração entre telas, storage local e lógica
de negócio, especialmente em um app com múltiplos perfis e dados sensíveis a contexto.

### II. Simplicidade sobre Funcionalidades Avançadas no MVP
No MVP, a equipe MUST preferir a solução mais simples que atenda ao requisito, evitando
abstrações, camadas de configuração ou funcionalidades especulativas não solicitadas no PRD.
Funcionalidades avançadas (sincronização em nuvem, analytics, gamificação, etc.) MUST ser
adiadas para fases posteriores, a menos que explicitamente incluídas no escopo do MVP.
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

### V. Isolamento de Dados por Perfil (NON-NEGOTIABLE)
Todo dado de treino, sessão e histórico MUST ser segregado pelo `perfil_id` do perfil local
ativo. Nenhuma consulta, tela ou operação de escrita MUST expor, agregar ou vazar dados entre
perfis diferentes no mesmo aparelho. Qualquer nova tabela, chave de armazenamento local ou
estrutura de estado que armazene dados de treino MUST incluir `perfil_id` como parte da sua
chave de identidade ou de filtro obrigatório.
Rationale: o app suporta múltiplos perfis locais sem login; a única barreira de privacidade
entre usuários do mesmo aparelho é a segregação correta por perfil — uma falha aqui é uma
falha de privacidade, não apenas um bug funcional.

## Technology & Platform Constraints

Stack: React Native + Expo (ver `AGENTS.md` para a versão do Expo em uso e a exigência de
consultar a documentação versionada antes de escrever código). Perfis são locais ao
dispositivo, sem autenticação remota ou backend de login. Qualquer mudança de stack (ex.:
adoção de um backend, banco remoto, ou biblioteca de autenticação) é uma mudança de escopo
que MUST passar por atualização desta constituição antes da implementação.

## Development Workflow & Quality Gates

Toda etapa de desenvolvimento (feature, correção, refatoração) MUST passar pelos seguintes
gates antes de ser marcada como concluída:
1. Código em TypeScript, sem erros de type-check.
2. Verificação de que nenhuma consulta ou escrita de dado de treino/sessão/histórico ocorre
   sem filtro por `perfil_id`.
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
plano de migração para o código/processo já existente que dependa do princípio anterior.

Versionamento segue semântica MAJOR.MINOR.PATCH:
- MAJOR: remoção ou redefinição incompatível de um princípio existente.
- MINOR: adição de novo princípio ou expansão material de uma seção existente.
- PATCH: esclarecimentos, correções de texto ou ajustes não semânticos.

Toda revisão de código (PR review) MUST verificar aderência aos princípios acima,
especialmente ao Princípio V (isolamento por perfil). Complexidade adicional ou desvio de
qualquer princípio MUST ser justificado explicitamente na descrição do PR ou da spec.

**Version**: 1.0.0 | **Ratified**: 2026-09-14 | **Last Amended**: 2026-09-14
