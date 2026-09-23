# Contract: Navegação e Componentes da Tela de Ações

**Feature**: `015-menu-de-acoes`

Contrato interno (rotas e componentes — não há API HTTP nesta feature).

## Rota nova: `src/app/acoes.tsx`

- **Path**: `/acoes` (fora do grupo `(tabs)/`, tela empilhada no `Stack` raiz).
- **Navegação de entrada**: `router.push('/acoes')`, chamada pelo componente
  `BotaoAcoes` (ver abaixo), presente em `(tabs)/index.tsx` e `(tabs)/explore.tsx`.
- **Navegação de saída**: link "Voltar" próprio (`VoltarIcon` + `ThemedText
  type="link"`), chamando `router.back()` — mesmo padrão de
  `src/app/treino/[treinoId].tsx`.
- **Conteúdo**: três ações, cada uma preservando o comportamento exato que tinha em
  `(tabs)/index.tsx` antes desta feature:
  1. "Perfil ativo: {nome} (trocar)" → `router.push('/perfil/selecionar')`.
  2. "Importar treino" → `importarTreino(perfilAtivo.id)` + `exibirResultadoImportacao`.
  3. "Importar treino de exemplo" → `importarTreinoExemplo(perfilAtivo.id)` +
     `exibirResultadoImportacao`.

## Componente novo: `src/components/ui/botao-acoes.tsx`

```ts
export function BotaoAcoes(): JSX.Element
```

- Sem props — sempre navega para `/acoes` ao ser pressionado.
- Usa `AcoesIcon` (novo, `icons.tsx`), cor `theme.text` (ícone de navegação neutro,
  não uma ação de destaque — diferente dos ícones de ação em laranja já usados no
  resto do app).
- Renderizado no canto superior direito da linha de título de `(tabs)/index.tsx` e
  `(tabs)/explore.tsx`, ao lado de `ThemedText type="subtitle"`.

## `(tabs)/index.tsx` — mudanças de contrato

- Remove: `ehResultadoMultiplo`, `exibirResultadoImportacaoMultipla`,
  `exibirResultadoImportacao`, `importouAlgumTreino`, `handleImportarTreino`,
  `handleImportarTreinoExemplo`, o estado `importando`, e os imports que só existiam
  para isso (`ImportarIcon`, `PerfilIcon`, `Alert`, `importarTreino`,
  `importarTreinoExemplo`, os tipos `ResultadoImportacao`/`ResultadoImportacaoMultipla`).
- Mantém: `recarregarTreinos`, `useFocusEffect` (continua recarregando a lista ao
  ganhar foco — é o mecanismo que reflete uma importação feita em `/acoes`).
- Mensagem de estado vazio (FR-005): passa a apontar para o ícone de ações em vez de
  "acima".

## `(tabs)/explore.tsx` — mudança de contrato

- Adiciona `BotaoAcoes` na linha de título ("Histórico de evolução"), sem nenhuma
  outra alteração de comportamento.
