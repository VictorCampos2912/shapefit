# Specification Quality Checklist: Avançar Entre Séries e Exercícios

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-15
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Todos os itens passaram na primeira validação (revalidado após incorporar 3 decisões de produto/arquitetura levantadas antes do planejamento — ver abaixo).
- Escopo delimitado explicitamente: o disparo do cronômetro de descanso é apenas um evento/estado iniciado por esta feature (RF05/RF06 definem a experiência do cronômetro em si); a finalização completa da sessão de treino e sua exibição no histórico permanecem no RF07 — ver seção Assumptions.
- FR-011 a FR-013 introduzem persistência (sobrevive ao fechamento do app), o que é uma mudança de escopo em relação ao RF03 (que era só memória local); isso é intencional e decorre diretamente do pedido do usuário e do critério de aceite original do RF04 no `criterios-aceite.md`, que remete à estrutura de sessão do RF07 sem exigir sua implementação completa aqui.
- **Decisões confirmadas com o usuário antes do plano**:
  1. Reabrir o app com sessão em andamento navega para a lista de exercícios (não direto para o exercício em andamento) — formalizado em FR-014 e no Edge Case correspondente.
  2. Séries concluídas não são editáveis na tela de execução — apenas via RF09 (ainda não especificado) — formalizado em FR-015.
  3. Contrato de persistência da sessão formalizado nesta spec ("Contrato de Persistência da Sessão", em Key Entities) para evitar retrabalho/migração quando o RF07 for especificado — inclui a estrutura de campos (`perfilId`, `treinoId`, `iniciadaEm`, `finalizadaEm`, `execucoes`). Este contrato é de dados/negócio (equivalente ao já usado na seção 8 do PRD para outras entidades), não uma escolha de tecnologia de armazenamento — a chave/mecanismo exato de storage fica para o plano.
- **Decisão confirmada durante o planejamento**: um perfil pode ter múltiplas sessões de treino em andamento simultaneamente (um treino distinto por sessão), sem bloqueio nem limite — formalizado em **FR-016** e no Edge Case correspondente. Isso revisou a decisão 3 acima, que originalmente previa "no máximo uma sessão em andamento por perfil"; a seção "Contrato de Persistência da Sessão" e o novo FR-016 já refletem a versão final (múltiplas sessões permitidas).
- Descoberta durante o plano: a chave `sessoes:<perfilId>` **já existe e já é lida** pelo RF10 (`existeSessaoEmAndamento` em `perfil-storage.ts`), esperando um array de `{ perfilId, finalizadaEm }`. O plano trata isso como restrição obrigatória (não apenas suposição), garantida em tempo de compilação via `SessaoTreino extends SessaoRegistro` — ver plan.md, research.md (Decisão 1) e data-model.md.
