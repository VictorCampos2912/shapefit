# Quickstart: Catálogo Interno de Exercícios

**Feature**: `020-catalogo-exercicios`

Sem UI própria de navegação (FR-006) — validação é majoritariamente de dados e da
tela de créditos, nos dois bundlers (Android/iOS via Expo). Confirmação manual em
Android e iOS (Princípio III).

## Pré-requisitos

- Catálogo curado já gerado (`src/assets/catalogo/exercicios.json` +
  `src/assets/catalogo/imagens/*`) — processo de curadoria (`research.md`, Decisão
  2), fora do escopo de execução deste quickstart (é um passo de preparo de dados,
  não uma ação do usuário no app).

## Cenário 1 — Catálogo carrega sem erro, offline

1. Colocar o aparelho/emulador em modo avião.
2. Abrir o app (qualquer tela).
3. **Esperado**: nenhum crash, nenhum erro relacionado ao catálogo — o app
   funciona normalmente mesmo sem rede (RNF02, SC-002), já que `listarCatalogo()`
   não faz nenhuma chamada de rede.

## Cenário 2 — Integridade dos dados do catálogo (dev-time)

1. Rodar o script/teste de verificação de integridade (`contracts/catalogo-exercicios.md`).
2. **Esperado**: todo item de `exercicios.json` tem `id` único, `nome`,
   `grupoMuscular` (um dos 6 valores válidos), `midia.arquivo` apontando para um
   arquivo real em `src/assets/catalogo/imagens/`, e `fonteAtribuicao` não vazio
   (SC-001).

## Cenário 3 — RF01 (importação de treino) não é afetado

1. Importar um treino via JSON (RF01) cujo(s) exercício(s) não existem no
   catálogo curado.
2. **Esperado**: importação funciona normalmente, sem nenhum erro, aviso ou
   comportamento diferente relacionado ao catálogo (SC-003, FR-004).

## Cenário 4 — Créditos acessíveis (FR-007)

1. Abrir a tela "Ações" (RF14).
2. **Esperado**: um novo item "Créditos do catálogo de exercícios" (ou nome
   equivalente) está visível.
3. Tocar nesse item.
4. **Esperado**: aparece o texto de atribuição — menção ao wger project e à
   licença CC-BY-SA 3.0.

## Referências

- Contratos: [`contracts/catalogo-exercicios.md`](./contracts/catalogo-exercicios.md),
  [`contracts/tela-creditos.md`](./contracts/tela-creditos.md)
- Modelo de dados: [`data-model.md`](./data-model.md)
- Pesquisa de licença: [`research.md`](./research.md), Decisão 1
- Critérios de aceite formais: `spec.md` (Acceptance Scenarios de cada User Story)
