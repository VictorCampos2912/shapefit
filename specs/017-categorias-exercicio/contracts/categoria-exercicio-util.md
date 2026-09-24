# Contract: `src/utils/categoria-exercicio.ts` (novo)

**Feature**: `017-categorias-exercicio`

Contrato interno (utilitário puro, sem estado — não há API HTTP nesta feature).

```ts
import type { CategoriaExercicio } from '@/types/treino';

export const ROTULO_CAMPO_PRINCIPAL: Record<CategoriaExercicio, string | null> = {
  peso: 'Carga (kg)',
  tempo: 'Tempo (min)',
  distancia: 'Distância (km)',
  repeticoes: null,
};

export const SUFIXO_VALOR: Record<CategoriaExercicio, string> = {
  peso: 'kg',
  tempo: 'min',
  distancia: 'km',
  repeticoes: '',
};

export function exibeCampoPrincipal(categoria: CategoriaExercicio): boolean {
  return categoria !== 'repeticoes';
}
```

- **`ROTULO_CAMPO_PRINCIPAL[categoria]`**: texto do rótulo acima do campo de
  entrada nas telas de execução/edição (ex.: `"Carga (kg)"`); `null` para
  `'repeticoes'` — chamador não renderiza nenhum campo/rótulo principal nesse caso
  (usar `exibeCampoPrincipal` para a checagem, não `=== null` diretamente, para
  manter a intenção explícita no código consumidor).
- **`SUFIXO_VALOR[categoria]`**: sufixo usado ao exibir um valor já registrado (ex.:
  `${serieRealizada.cargaKg}${SUFIXO_VALOR[categoria]}` → `"40kg"`, `"12min"`,
  `"5km"`, ou `""` para repetições — nesse último caso, o valor de `cargaKg` não é
  exibido de forma alguma, não só sem sufixo).
- **`exibeCampoPrincipal(categoria)`**: `false` somente para `'repeticoes'` — usado
  para: (a) mostrar/ocultar o campo de entrada principal nas telas de
  execução/edição; (b) incluir/excluir esse campo da condição de habilitar os
  botões "Concluir série"/"Salvar edição" (`research.md`, Decisão 7).
- **Consumido por**: `exercicio-execucao.tsx` (RF03/04, RF09a) e `explore.tsx`
  (RF08, RF09b) — único lugar que conhece o mapeamento categoria → rótulo/unidade;
  nenhum dos dois arquivos reimplementa esta tabela.
- **Sem estado, sem I/O** — função e constantes puras, testáveis isoladamente.
