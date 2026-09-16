# Research: Listar Treinos Importados/Salvos

**Feature**: 003-listar-treinos | **Date**: 2026-09-15

Nenhum item do Technical Context ficou marcado como `NEEDS CLARIFICATION` — todas as
decisões técnicas já foram fornecidas explicitamente pelo usuário no comando `/speckit-plan`,
já resolvidas nos critérios de aceite do RF02, ou herdadas diretamente dos padrões
estabelecidos pelo RF10/RF01. Este documento registra as decisões e alternativas
consideradas.

## Decisão 1: Reaproveitar `treino-storage.ts` sem modificação

- **Decision**: Consumir `listarTreinos(perfilId)`, `importarTreino(perfilId)` e
  `importarTreinoExemplo(perfilId)` exatamente como já implementadas em
  `src/services/treino-storage.ts` (RF01), sem alterar nenhuma linha desse arquivo.
- **Rationale**: Instrução explícita do usuário. O contrato de `treino-storage.md` (RF01) já
  previa `listarTreinos` como consumido pelo RF02 ("RF02 (Listar treinos importados/salvos):
  chama `listarTreinos(perfilId)` com o `perfilId` do perfil ativo"), então não há nenhuma
  lacuna de funcionalidade a preencher na camada de serviço.
- **Alternatives considered**: Criar uma nova função "de leitura para UI" (ex.:
  `listarTreinosAgrupados`) — rejeitado por não haver necessidade: a lista de `Treino[]` já
  retornada por `listarTreinos` contém tudo que a UI precisa (`nome`, `importadoEm`), e
  qualquer lógica de agrupamento/diferenciação por nome duplicado é puramente de
  apresentação, não de dados (ver Decisão 3).

## Decisão 2: Reatividade a troca de perfil ativo

- **Decision**: A tela consome `usePerfilAtivo()` (RF10, sem modificação) para obter
  `perfilAtivo`, e usa esse valor como dependência de um efeito que recarrega a lista de
  treinos (`listarTreinos(perfilAtivo.id)`) sempre que `perfilAtivo?.id` mudar.
- **Rationale**: `usePerfilAtivo()` já é um Context compartilhado (decisão tomada no RF10)
  que propaga mudanças de perfil ativo para todas as telas que o consomem; a tela de treinos
  só precisa reagir a essa mudança re-executando a leitura, sem exigir nenhuma alteração no
  hook em si. Isso atende FR-003 e FR-004 diretamente.
- **Alternatives considered**: Fazer polling periódico da lista de treinos — rejeitado por
  ser desnecessariamente complexo e menos responsivo que reagir à mudança de
  `perfilAtivo.id` via efeito, que já é instantânea (Context re-renderiza os consumidores).

## Decisão 3: Diferenciação de treinos com nome duplicado

- **Decision**: A lógica de diferenciação (FR-007) é puramente de apresentação: ao renderizar
  a lista, se mais de um item tiver o mesmo `nome`, o componente de item exibe também a
  data/hora de `importadoEm` (formatada de forma legível) junto ao nome; quando o nome é
  único na lista, apenas o nome é exibido.
- **Rationale**: Os dados (`nome`, `importadoEm`) já existem no tipo `Treino` desde o RF01 —
  não há necessidade de calcular ou persistir nada novo. A verificação de duplicidade
  acontece no momento da renderização (contando ocorrências de cada `nome` na lista
  retornada), mantendo a lógica simples e sem estado adicional.
- **Alternatives considered**: Sempre exibir a data/hora, mesmo sem duplicidade — rejeitado
  por poluir visualmente a lista em usuários com poucos treinos e nomes únicos; a spec (FR-007)
  só exige a diferenciação quando há necessidade real (nomes duplicados).

## Decisão 4: Reaproveitar as ações de importação, movendo o ponto de entrada

- **Decision**: `importarTreino` e `importarTreinoExemplo` (RF01) são chamadas a partir da
  nova tela de lista de treinos, com a mesma lógica de tratamento de resultado (mensagens de
  sucesso, sucesso parcial e erro) já usada no ponto de entrada temporário do RF01. Esse
  código de UI (chamada + exibição de `Alert`) é movido de `(tabs)/index.tsx` (versão antiga)
  para a nova versão do mesmo arquivo — não duplicado em dois lugares.
- **Rationale**: Atende FR-008 e FR-009: a ação de importar passa a existir em um único lugar
  (a tela de treinos), e o comportamento de importação em si (validação, persistência, erros)
  não muda, pois vem inalterado de `treino-storage.ts`.
- **Alternatives considered**: Extrair a lógica de exibição de resultado
  (`exibirResultadoImportacao`) para um hook ou componente compartilhado — considerado
  desnecessário para o escopo desta feature (Princípio II), já que ela só é usada em um único
  lugar após a mudança; pode ser revisitado se um futuro requisito precisar do mesmo padrão
  em mais de uma tela.

## Decisão 5: Atenção visual mínima da tela

- **Decision**: A nova tela usa exclusivamente os componentes e constantes de tema já
  existentes no projeto (`ThemedView`, `ThemedText`, `Spacing`, `Colors`), organizados em um
  layout de lista com cabeçalho, ação de importar, e um estado vazio claro — sem introduzir
  nenhuma biblioteca de UI nova, paleta de cores nova, ou sistema de design formal.
- **Rationale**: Atende FR-012 e a decisão já registrada na seção 14 do PRD ("a primeira tela
  candidata a receber atenção visual de verdade é a lista de treinos (RF02)... layout
  organizado, tipografia e espaçamento adequados... não um design system completo").
- **Alternatives considered**: Adotar uma biblioteca de componentes de lista/UI de terceiros
  (ex.: uma lib de UI kit) — rejeitado por introduzir dependência não solicitada (Princípio
  IV) para um problema que os componentes já existentes no projeto resolvem.

## Decisão 6: Estratégia de teste

- **Decision**: Validação manual em dispositivo físico (Redmi Note 12 / Android e iPhone 16
  Plus / iOS) via Expo Go, mesma abordagem do RF10/RF01.
- **Rationale**: Mesmos motivos já registrados no research.md do RF01/RF10 (Princípio III da
  Constituição exige validação manual em dois dispositivos; ausência de framework de testes
  automatizados configurado no projeto; fora de escopo desta feature introduzir um).
- **Alternatives considered**: Nenhuma nova alternativa considerada além das já descartadas
  em features anteriores.

## Resumo

Todas as decisões técnicas estão resolvidas. Nenhum item permanece como
`NEEDS CLARIFICATION`. Pronto para Fase 1 (Design & Contracts).
