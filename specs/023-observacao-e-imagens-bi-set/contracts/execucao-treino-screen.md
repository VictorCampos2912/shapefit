# Contract: `exercicio-execucao.tsx` (alterado) e `[treinoId].tsx` (alterado)

**Feature**: `023-observacao-e-imagens-bi-set`

Contrato interno (props/comportamento de componente e de tela — não há API
HTTP nesta feature).

## 1. `src/components/treino/exercicio-execucao.tsx` — observação (FR-004/FR-005/FR-006/FR-007)

### Novo cálculo local (sem mudança de props)

`ExercicioExecucaoProps` não muda — `exercicio.observacao` já vem disponível
via `exercicio: ExercicioPlanejado` (data-model.md). Nenhum novo prop.

### Renderização (ponto único, `research.md` Decisão 2)

Logo após a imagem de nome inteiro (FR-004 da spec 021) e antes do bloco
`{!estado.iniciado && <Button>Iniciar exercício</Button>}` — **fora** de
qualquer bloco condicional de estado, para ficar visível em todos os momentos
em que o exercício está aberto (antes de iniciar, durante o registro de
série, durante o descanso):

```tsx
{!!exercicio.observacao && (
  <ThemedText type="small" themeColor="textSecondary">
    {exercicio.observacao}
  </ThemedText>
)}
```

- **`!!exercicio.observacao`, nunca `exercicio.observacao && (...)` direto**:
  `exercicio.observacao` é `string | undefined` — usar o valor cru como
  condição de um `&&` em JSX é o conhecido problema do React de renderizar o
  próprio valor quando ele é falsy mas não `boolean`/`null`/`undefined` (ex.:
  `0 && <Text>` renderiza o texto `"0"` na tela). Hoje isso nunca se manifesta
  na prática, porque `observacao` só chega até aqui como `undefined` ou uma
  `string` não vazia (FR-002 garante que uma string vazia nunca sobrevive à
  validação em `treino-storage.ts`) — mas `!!exercicio.observacao` remove
  essa dependência implícita de uma garantia de outra camada, tornando a
  renderização correta por si só, independentemente de qualquer mudança
  futura nessa validação.
- **Destaque secundário (FR-004)**: reaproveita `type="small"
  themeColor="textSecondary"`, o mesmo estilo já usado na linha de resumo do
  exercício (`"{series}x {repsAlvo} · sugestão..."`, linha ~228) — nenhum
  estilo novo.
- **Quando `exercicio.observacao` é `undefined` (FR-005)**: `!!undefined` é
  `false`, então a expressão não renderiza nada — sem espaço reservado, sem
  placeholder, exatamente como o padrão já usado pela imagem de catálogo
  (`{correspondencia && (...)}`, spec 021 — ali `correspondencia` já é
  `ExercicioCatalogo | null`, não sujeito ao mesmo problema, por isso não
  precisa do mesmo tratamento).
- **FR-006 (nunca na lista de exercícios nem no histórico)**: nenhuma mudança
  em `src/app/treino/[treinoId].tsx` (branch sem exercício selecionado, lista
  de exercícios do treino) nem em `historico-evolucao.ts`/tela de histórico —
  `observacao` não é lido em nenhum desses dois lugares.

## 2. `src/components/treino/exercicio-execucao.tsx` — imagens de bi-set (FR-010-014)

### Novo cálculo local

```ts
const correspondencia = useMemo(() => buscarNoCatalogo(exercicio.nome), [exercicio.nome]);
const partesComposto = useMemo(
  () => (correspondencia ? [] : buscarPartesCompostoNoCatalogo(exercicio.nome)),
  [exercicio.nome, correspondencia],
);
```

- `buscarPartesCompostoNoCatalogo` só é chamada quando `correspondencia` é
  `null` (FR-010 — tenta o nome inteiro primeiro) — evita trabalho
  desnecessário quando o nome inteiro já bateu.

### Renderização (substitui o bloco `{correspondencia && (<Image .../>)}` da spec 021 por um bloco que cobre os dois casos)

```tsx
{correspondencia && (
  <Image
    source={IMAGENS_CATALOGO[correspondencia.midia.arquivo] as ImageSourcePropType}
    style={styles.imagemExercicio}
    resizeMode="contain"
    accessibilityLabel={`Demonstração do exercício ${correspondencia.nome}`}
  />
)}

{!correspondencia && partesComposto.length > 0 && (
  <View style={styles.linhaImagensComposto}>
    {partesComposto.map((item, indice) => (
      <View key={`${item.id}-${indice}`} style={styles.imagemCompostaItem}>
        <Image
          source={IMAGENS_CATALOGO[item.midia.arquivo] as ImageSourcePropType}
          style={styles.imagemExercicioComposto}
          resizeMode="contain"
          accessibilityLabel={`Demonstração do exercício ${item.nome}`}
        />
        <ThemedText type="small" themeColor="textSecondary" style={styles.textoCentralizado}>
          {item.nome}
        </ThemedText>
      </View>
    ))}
  </View>
)}
```

- **FR-011 (legenda)**: `item.nome` — campo do catálogo (`ExercicioCatalogo`,
  spec 020), não o texto normalizado nem o texto literal da parte extraída do
  nome do treino (`research.md`, Decisão 6).
- **FR-011 (no máximo duas)**: `partesComposto` já vem limitado a 2 pelo
  contrato de `buscarPartesCompostoNoCatalogo` — o componente não precisa
  truncar de novo.
- **FR-012**: uma parte sem correspondência simplesmente não existe em
  `partesComposto` — nada é renderizado no lugar dela (sem placeholder por
  parte).
- **FR-013**: `partesComposto.length === 0` (nome sem `" + "`, ou nenhuma
  parte encontrada) e `correspondencia` nulo → nenhum dos dois blocos
  renderiza nada — tela idêntica à versão anterior a esta feature (mesmo
  comportamento de "sem correspondência" da spec 021).
- **`key={`${item.id}-${indice}`}`**: usa o `id` do `ExercicioCatalogo` (spec
  020) combinado com o índice da posição em `partesComposto`. Necessário
  porque, quando duas partes diferentes do nome composto casam com o mesmo
  item do catálogo (edge case de duplicata, `spec.md`), `partesComposto`
  contém o mesmo objeto (mesmo `id`) duas vezes — usar só `item.id` como key
  produziria duas chaves idênticas entre irmãos de array, que o React trata
  como erro de chave duplicada. O índice resolve isso sem precisar de
  deduplicação (que a spec explicitamente não pede).

### Estilos novos (ilustrativos — valores finais definidos na implementação)

```ts
linhaImagensComposto: {
  flexDirection: 'row',
  gap: Spacing.two,
},
imagemCompostaItem: {
  flex: 1,
  gap: Spacing.one,
},
imagemExercicioComposto: {
  width: '100%',
  height: 140, // menor que imagemExercicio (180) por dividir o espaço em duas colunas
  borderRadius: Spacing.two,
},
```

## 3. `src/app/treino/[treinoId].tsx` — rolagem (FR-007, `research.md` Decisão 3)

Branch com `exercicioSelecionado` truthy (linhas ~386-406) passa a envolver o
conteúdo em `ScrollView`, mesmo padrão de
`src/app/conta/dados-fisicos.tsx:44-55`:

```tsx
{exercicioSelecionado ? (
  <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      alwaysBounceVertical={false}
    >
      <Pressable onPress={handleVoltarParaLista} style={styles.linhaComIcone}>
        <VoltarIcon size={16} color={theme.accent} />
        <ThemedText type="link">Voltar para exercícios</ThemedText>
      </Pressable>
      <ExercicioExecucao {...propsInalteradas} />
    </ScrollView>
  </KeyboardAvoidingView>
) : (
  /* ... branch da lista de exercícios, sem alteração ... */
)}
```

```ts
flex: {
  flex: 1,
},
scrollContent: {
  gap: Spacing.three, // substitui o `gap` de `safeArea`, que só se aplicava
                        //   entre filhos diretos — "Voltar" e ExercicioExecucao
                        //   deixam de ser filhos diretos de SafeAreaView
},
```

- **`ExercicioExecucaoProps` não muda** — o `ScrollView` envolve o componente
  por fora, na tela pai; nenhuma prop nova é passada a `ExercicioExecucao`
  por causa da rolagem.
- **`alwaysBounceVertical={false}`**: evita o efeito de "elástico" (rubber-band)
  do iOS quando o conteúdo cabe inteiro na tela e não há nada para rolar —
  sem essa prop, o iOS deixa a tela "balançar" em resposta a qualquer gesto
  vertical mesmo sem conteúdo extra, o que pareceria uma régua de rolagem
  "fantasma" numa tela que, visualmente, não deveria ter nenhuma (mesmo
  requisito de "tela idêntica à anterior" quando não há observação longa,
  FR-005/SC-002). Sem efeito no Android (prop específica de iOS).
- **`contentContainerStyle` precisa do `gap: Spacing.three`, não apenas
  herdar do `safeArea`**: hoje, o espaçamento entre o link "Voltar para
  exercícios" e `ExercicioExecucao` vem do `gap: Spacing.three` de
  `styles.safeArea` (`[treinoId].tsx:466`), porque os dois são filhos diretos
  de `SafeAreaView` (dentro de um Fragment, que é transparente para layout).
  Ao envolvê-los em `KeyboardAvoidingView`/`ScrollView`, eles deixam de ser
  filhos diretos de `SafeAreaView` — sem repetir o `gap` em
  `contentContainerStyle`, o espaçamento entre os dois desapareceria
  (regressão visual não pedida por nenhum FR, mas que violaria o espírito de
  "nenhuma outra mudança de tela" implícito no FR-007).
- **`scrollContent` NÃO precisa de `flexGrow: 1`**: investigação do estilo
  raiz de `ExercicioExecucao` (`exercicio-execucao.tsx`, `styles.container:
  { gap: Spacing.three }`) e de todos os seus blocos condicionais
  (`areaSerieAtual`, `areaConcluido`, etc.) confirma que nenhum depende de
  `flex: 1` nem de margem automática (`marginTop: 'auto'`/
  `justifyContent: 'space-between'` para empurrar algo para o fim da tela) —
  é só um empilhamento top-down com `gap`. Diferente de
  `dados-fisicos.tsx` (que usa `flexGrow: 1` em `scrollContent`, provavelmente
  por depender de comportamento de `PerfilForm` não investigado aqui, fora do
  escopo desta feature), aqui `flexGrow: 1` não teria efeito visível — o
  conteúdo já é naturalmente top-aligned com o espaço restante em branco
  abaixo, exatamente como hoje sem `ScrollView` — então foi omitido para não
  adicionar um estilo sem propósito claro (Princípio II).
- **`keyboardShouldPersistTaps="handled"` é obrigatório, não opcional**: sem
  essa prop, o primeiro toque em "Concluir série" (ou em qualquer outro botão
  dentro do `ScrollView`) enquanto o teclado numérico está aberto só fecha o
  teclado — exigiria um segundo toque para de fato acionar o botão. Isso
  violaria o fluxo de "poucos toques" já estabelecido pelo RNF03 do PRD.
  Mesma prop, pelo mesmo motivo, já usada em `dados-fisicos.tsx:47`.
- **Confirmação de que não há container rolável aninhado**: `FlatList`
  (`[treinoId].tsx:413`, lista de exercícios do treino) vive estritamente no
  branch `else` do mesmo `exercicioSelecionado ? (...) : (...)`, nunca
  renderizado ao mesmo tempo que o `ScrollView` novo — são mutuamente
  exclusivos, não há aninhamento de duas listas/scrolls roláveis. O
  `CronometroDescanso` (`[treinoId].tsx:447-453`) é renderizado como irmão
  *fora* de todo o `{exercicioSelecionado ? (...) : (...)}`, direto dentro do
  `SafeAreaView` — ou seja, continua **fora** do novo `ScrollView`,
  permanecendo fixo na tela independentemente da posição de rolagem do
  conteúdo do exercício (não fica "escondido" ao rolar). Nenhum outro
  `ScrollView`/`FlatList`/`SectionList` existe entre a raiz da tela e este
  ponto.
- **Branch da lista de exercícios (sem exercício selecionado)**: sem alteração
  — o risco de layout do FR-007 é específico da tela de execução de **um**
  exercício (onde o texto de observação pode aparecer), não da lista.
