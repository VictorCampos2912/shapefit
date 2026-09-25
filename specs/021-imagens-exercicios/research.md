# Phase 0 Research: Imagem/GIF do Exercício na Execução

**Feature**: `021-imagens-exercicios` | **Date**: 2026-09-23

Sem `[NEEDS CLARIFICATION]` pendente — a spec já resolveu as decisões de produto.
Esta fase cobre decisões técnicas de implementação, incluindo um requisito técnico
real que a spec 020 ainda não precisava resolver (sem consumidor de UI até agora).

## Decisão 1: `buscarNoCatalogo` — nova função, no mesmo serviço já criado pela spec 020

**Decision**: adicionar `buscarNoCatalogo(nomeExercicio: string):
ExercicioCatalogo | null` a `src/services/catalogo-exercicios.ts` — o mesmo
arquivo já criado pela spec 020 (que hoje só exporta `listarCatalogo`), não um
arquivo/serviço novo e separado.

```ts
import { normalizarNomeExercicio } from '@/utils/normalizar-nome-exercicio';

export function buscarNoCatalogo(nomeExercicio: string): ExercicioCatalogo | null {
  const chave = normalizarNomeExercicio(nomeExercicio);
  const encontrado = listarCatalogo().find(
    (item) => normalizarNomeExercicio(item.nome) === chave,
  );
  return encontrado ?? null;
}
```

**Rationale**: instrução explícita do usuário — reaproveitar a estrutura de dados e
a função de consulta da spec 020 **exatamente como definidas**, sem redefinir nem
assumir uma interface própria. `ExercicioCatalogo` e `listarCatalogo` permanecem
intocados; `buscarNoCatalogo` é construída inteiramente em cima deles (chama
`listarCatalogo()`, nunca acessa o JSON do catálogo diretamente). A normalização
reaproveita `normalizarNomeExercicio` (RF08, já existente) — mesma regra exigida
pela spec (FR-002), não uma comparação nova.

**Alternatives considered**: criar um novo serviço `catalogo-busca.ts` separado —
rejeitado, sem necessidade: é uma única função pequena, adicioná-la ao arquivo já
existente da spec 020 é mais simples e mantém tudo relacionado ao catálogo em um só
lugar (Princípio II).

## Decisão 2: resolução de imagem local — limitação real do Metro (bundler)

**Decision**: gerar, junto com `exercicios.json` (spec 020, mesmo processo de
curadoria), um arquivo adicional `assets/catalogo/imagens-index.ts` — um mapa
estático de nome de arquivo para o resultado de `require(...)`, com uma entrada
`require()` **literal** por imagem:

```ts
// GERADO pelo mesmo processo de curadoria da spec 020 — não escrito à mão
export const IMAGENS_CATALOGO: Record<string, ReturnType<typeof require>> = {
  'supino-reto-barra.gif': require('./imagens/supino-reto-barra.gif'),
  'agachamento-livre.gif': require('./imagens/agachamento-livre.gif'),
  // ... uma linha por item do catálogo
};
```

A tela de execução resolve a imagem via
`IMAGENS_CATALOGO[correspondencia.midia.arquivo]`, nunca via
`require(variavel)`.

**Rationale — achado técnico real, não uma preferência**: o Metro (bundler do
React Native/Expo) resolve `require()`/`import` de assets **estaticamente, em
tempo de build** — ele precisa literalmente "ver" o caminho do arquivo no código-
fonte para empacotá-lo. Uma chamada como `require(caminhoDinamico)`, onde
`caminhoDinamico` vem de uma variável (ex.: `midia.arquivo` lido do JSON em
runtime), **não funciona** — o Metro não consegue determinar em build-time quais
arquivos incluir no bundle. Isso não é uma limitação inventada para esta spec: é
uma restrição conhecida e documentada do Metro, que só descobrimos precisar
resolver agora porque a spec 020 (sem consumidor de UI) nunca chegou a carregar
uma imagem de fato — só guardar o nome do arquivo como string.

**Consequência para a spec 020**: nenhuma mudança em `ExercicioCatalogo` nem em
`listarCatalogo` (ambos continuam exatamente como definidos lá — instrução
explícita do usuário). O processo de curadoria da spec 020 (`research.md` daquela
spec, Decisão 2) ganha **mais um artefato de saída** (`imagens-index.ts`, além de
`exercicios.json`) — um complemento ao que já estava planejado, não uma
redefinição. Uma nota equivalente foi adicionada ao `plan.md` da spec 020 para
quem for implementá-la já saber que esse arquivo também precisa ser gerado.

**Alternatives considered**:
- `require(\`./imagens/${arquivo}\`)` (template string) — rejeitado: mesma
  limitação: mesmo com o nome da variável "parecendo" estático, o Metro exige um
  literal completo, não uma interpolação, mesmo que o valor final seja previsível.
- `expo-asset` com carregamento assíncrono por URI — rejeitado por complexidade
  desnecessária (Princípio II): exigiria um estado de loading para cada imagem
  exibida, quando um mapa estático resolve tudo em tempo de build, sem I/O nenhum
  em runtime — mais simples e mais alinhado com RNF02 (nada acontece em runtime
  além de um lookup em objeto).
- Nomear os arquivos de imagem com o próprio `id` do exercício e tentar
  `require` indexado por convenção — mesma limitação do Metro se aplica; um mapa
  explícito gerado continua sendo necessário de qualquer forma.

## Decisão 3: onde e quando calcular a correspondência (FR-001)

**Decision**: dentro de `ExercicioExecucao` (`exercicio-execucao.tsx`), via
`useMemo(() => buscarNoCatalogo(exercicio.nome), [exercicio.nome])` — não uma prop
nova vinda da tela pai (`[treinoId].tsx`).

**Rationale**: `buscarNoCatalogo` é uma função pura e barata (lista pequena,
comparação de string) — computar localmente no componente que já recebe
`exercicio` evita alterar a assinatura de `ExercicioExecucaoProps` e evita
threading de um dado derivado através da tela pai sem necessidade (Princípio II).

**Alternatives considered**: calcular em `[treinoId].tsx` e passar como prop —
rejeitado, adicionaria um prop novo e um cálculo por exercício da lista inteira
toda vez que a tela renderiza, quando só o exercício aberto no momento precisa do
resultado.

## Resumo das entidades técnicas afetadas

- `src/services/catalogo-exercicios.ts` (já existe, spec 020): ganha
  `buscarNoCatalogo` (Decisão 1) — `ExercicioCatalogo`/`listarCatalogo`
  inalterados.
- `assets/catalogo/imagens-index.ts` (novo): `IMAGENS_CATALOGO` (Decisão 2).
- `src/components/treino/exercicio-execucao.tsx`: `useMemo` com
  `buscarNoCatalogo`; renderização condicional de `<Image source={IMAGENS_CATALOGO[...]}>`.
