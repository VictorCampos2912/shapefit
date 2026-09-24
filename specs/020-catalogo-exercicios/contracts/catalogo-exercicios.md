# Contract: `src/services/catalogo-exercicios.ts` (novo)

**Feature**: `020-catalogo-exercicios`

Contrato interno (leitura de dado estático — não há API HTTP consumida pelo app;
a API do wger é só ferramenta de curadoria, fora do runtime — `research.md`,
Decisão 2).

## `listarCatalogo`

```ts
import catalogoJson from '@/assets/catalogo/exercicios.json';
import type { ExercicioCatalogo } from '@/types/catalogo-exercicios';

const CATALOGO: ExercicioCatalogo[] = catalogoJson as ExercicioCatalogo[];

export function listarCatalogo(): ExercicioCatalogo[] {
  return CATALOGO;
}
```

- **Síncrona, não `async`** — dado já embutido no bundle, sem I/O (diferente de
  toda leitura de `AsyncStorage` já existente no projeto, que é sempre `async`).
- **Pós-condição**: retorna todos os itens de `exercicios.json`, sem filtro — quem
  consome decide o que fazer com a lista (ex.: buscar por nome normalizado, spec
  021).
- **Sem parâmetros** — catálogo não é filtrado por perfil (FR-005: dado
  compartilhado, não segregado por `perfil_id`).
- **Consumida por**: nenhum consumidor concreto nesta feature (a spec 021, ainda a
  implementar, será a primeira a chamar esta função) — a função existe para o
  catálogo já ter uma forma de leitura pronta, mesmo sem UI própria ainda (FR-006).

## Verificação de integridade dos dados (dev-time, não runtime)

Recomendado (não obrigatório pela spec, mas mitiga risco de dado malformado
silencioso): um teste/script simples, rodado durante o desenvolvimento, que
verifica que `exercicios.json` satisfaz as invariantes de `data-model.md` (`id`
único, `fonteAtribuicao` nunca vazio, todo `midia.arquivo` correspondendo a um
arquivo real em `src/assets/catalogo/imagens/`) — evita que um erro de curadoria
(ex.: caminho de imagem quebrado) só seja percebido em runtime, numa tela real.
