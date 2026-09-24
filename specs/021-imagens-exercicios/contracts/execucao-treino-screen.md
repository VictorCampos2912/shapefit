# Contract: `src/components/treino/exercicio-execucao.tsx` (alterado)

**Feature**: `021-imagens-exercicios`

Contrato interno (props/comportamento de componente — não há API HTTP nesta
feature).

## Novo cálculo local (sem mudança de props)

```ts
import { buscarNoCatalogo } from '@/services/catalogo-exercicios'; // spec 020 + 021
import { IMAGENS_CATALOGO } from '@/assets/catalogo/imagens-index'; // NOVO, research.md Decisão 2

// dentro de ExercicioExecucao:
const correspondencia = useMemo(
  () => buscarNoCatalogo(exercicio.nome),
  [exercicio.nome],
);
```

- **`ExercicioExecucaoProps` não muda** — nenhum prop novo; `exercicio.nome` já é
  suficiente como entrada.

## Renderização condicional (FR-004/FR-005)

Logo após a linha de resumo do exercício (`"{series}x {repsAlvo} · sugestão
{cargaSugeridaKg}kg · {descansoSeg}s descanso"`), antes do botão "Iniciar
exercício":

```tsx
{correspondencia && (
  <Image
    source={IMAGENS_CATALOGO[correspondencia.midia.arquivo]}
    style={styles.imagemExercicio}
    accessibilityLabel={`Demonstração do exercício ${correspondencia.nome}`}
  />
)}
```

- **Quando `correspondencia` é `null`**: nenhum elemento é renderizado nesse
  ponto — sem espaço reservado vazio, sem placeholder, sem mensagem (FR-005) —
  exatamente o mesmo layout de antes desta feature.
- **Quando `correspondencia` existe**: imagem exibida acima do fluxo de registro
  de série — não bloqueia nem atrasa os campos de carga/reps/botão "Concluir
  série" (SC-003), que continuam funcionando exatamente como antes, só com a
  imagem visível acima.
- **`accessibilityLabel`**: usa `correspondencia.nome` (nome do catálogo, spec
  020), não `exercicio.nome` (nome do treino importado) — podem diferir em
  espaçamento/capitalização (a correspondência é por igualdade após
  normalização, não por igualdade literal); usar o nome do catálogo aqui é
  arbitrário mas consistente (mesma fonte da imagem sendo descrita).
- **Sem novo estado de componente** — `correspondencia` é derivado via `useMemo`,
  não `useState`; não há loading (dado já está no bundle, sem I/O).
