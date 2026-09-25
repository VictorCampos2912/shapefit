# Phase 0 Research: Catálogo Interno de Exercícios

**Feature**: `020-catalogo-exercicios` | **Date**: 2026-09-23

## Decisão 1: fonte dos dados/mídia do catálogo — licença pesquisada de verdade

**Decision**: usar o **wger project** (`wger.de`, API pública
`https://wger.de/api/v2/`), licenciado **CC-BY-SA 3.0** para seus dados de
exercício (nome, categoria/grupo muscular, imagens) — não o free-exercise-db citado
como exemplo no pedido original.

**Pesquisa realizada** (não presumida — via busca e leitura direta das fontes):

1. **free-exercise-db** (`github.com/yuhonas/free-exercise-db`): o repositório
   declara licença **Unlicense** (domínio público) via `LICENSE.md`, texto
   confirmado lendo o arquivo diretamente — aplicado de forma genérica a "o
   software", sem distinguir dados de texto e imagens.
   - **Achado que muda a decisão**: existem **3 issues abertas no próprio
     repositório**, nunca respondidas pelo mantenedor, questionando especificamente
     a origem/os direitos das **imagens** — não dos dados de texto:
     - [Issue #2](https://github.com/yuhonas/free-exercise-db/issues/2) (13/06/2023): "I'm not sure if the images are royalty free".
     - [Issue #12](https://github.com/yuhonas/free-exercise-db/issues/12) (2024): pergunta direta se as imagens podem ser usadas "in a commercial app without any issues".
     - Issue #13 (08/2024): "images has copyright?".
   - As três foram fechadas sem nenhuma resposta visível do mantenedor
     esclarecendo a origem real das imagens. O README do próprio projeto relata que
     o autor "encontrou" (stumbled upon) a base de exercícios já pronta ao montar
     seu próprio app — não descreve produção própria das imagens.
   - **Conclusão**: a declaração de Unlicense é genuína e aplicada pelo mantenedor,
     mas existe dúvida real e não resolvida, levantada por múltiplos usuários ao
     longo de mais de um ano, sobre se o mantenedor de fato detinha os direitos das
     imagens para poder liberá-las como domínio público. Não é um caso de "licença
     incompatível confirmada", mas também não é "licença confirmada sem
     ressalvas" — é precisamente o tipo de presunção que não deveria ser feita sem
     checar, como pedido.

2. **wger project** (`github.com/wger-project/wger`, `wger.de`): aplicativo
   AGPL-3+; dados de exercício (nome, categoria, grupo muscular, imagens)
   licenciados separadamente sob **CC-BY-SA 3.0**, com atribuição rastreável por
   exercício/imagem via a própria API (cada registro inclui metadado de licença e
   fonte). Projeto ativo, mantido por uma organização com processo formal de
   contribuição de conteúdo (diferente de um dataset "encontrado pronto").

**Rationale da troca**: CC-BY-SA 3.0 com atribuição rastreável por item é uma base
muito mais sólida para embutir no app do que Unlicense com proveniência
questionada por usuários há mais de um ano sem resposta — mesmo o Unlicense sendo,
em tese, "mais permissivo" no papel, o risco real está na dúvida sobre se ele se
aplica legitimamente às imagens. O custo do CC-BY-SA (atribuição obrigatória,
FR-007) é pequeno e resolvido com uma tela de créditos.

**Trade-off aceito**: CC-BY-SA exige atribuição visível no app (FR-007, novo) e,
tecnicamente, que a mídia redistribuída sob a mesma licença permaneça acessível sob
os mesmos termos (compatível com só embutir os arquivos de imagem com crédito — não
exige liberar o código do app sob CC-BY-SA, essa cláusula "share-alike" se aplica
ao conteúdo de mídia em si, não ao software que o exibe).

**Alternatives considered**:
- Usar o free-exercise-db mesmo assim, aceitando o risco documentado — rejeitado
  nesta rodada: o próprio pedido do usuário pediu para não presumir compatibilidade
  sem checar, e o achado (dúvida recorrente, nunca respondida, especificamente
  sobre imagens) é exatamente o tipo de sinal que justifica não prosseguir sem
  decisão explícita do usuário — ver nota ao final desta seção.
- Produzir mídia própria (fotos/desenhos originais) — rejeitado por escopo: exige
  produção de conteúdo fora do alcance de uma spec de engenharia, provavelmente uma
  decisão de produto/design separada.

**Nota para o usuário**: esta troca de fonte (free-exercise-db → wger) é uma
decisão de risco legal, não puramente técnica — tomada aqui com a melhor evidência
disponível via pesquisa, mas vale uma confirmação explícita do usuário antes da
implementação, já que envolve conteúdo redistribuído publicamente num app.

## Decisão 2: processo de curadoria é offline/dev-time, nunca em runtime

**Decision**: o consumo da API do wger acontece **uma única vez, durante o
desenvolvimento** (um script/processo manual de extração, documentado mas não
incluído no app), gerando os arquivos estáticos finais
(`assets/catalogo/exercicios.json` + `assets/catalogo/imagens/*`) que são
commitados no repositório e embutidos no bundle — o app em produção nunca faz uma
requisição HTTP para `wger.de`.

**Rationale**: preserva RNF02 e a decisão já tomada na spec (subconjunto curado
embutido, não download sob demanda) — usar a API do wger como **ferramenta de
curadoria** é diferente de usá-la como **dependência de runtime**; só a segunda
violaria RNF02/Constitution.

**Alternatives considered**: nenhuma — é a única forma de obter os dados do wger
respeitando a decisão de arquitetura já tomada na spec (sem dependência de rede em
runtime).

## Decisão 3: schema do catálogo embutido

**Decision**:

```ts
// src/types/catalogo-exercicios.ts
export type GrupoMuscular =
  | 'peito' | 'costas' | 'pernas' | 'ombros' | 'braços' | 'core';

export type ExercicioCatalogo = {
  id: string;           // slug estável (ex.: "supino-reto-barra")
  nome: string;
  grupoMuscular: GrupoMuscular;
  midia: {
    tipo: 'imagem' | 'gif';
    arquivo: string;    // caminho relativo dentro de assets/catalogo/imagens/
  };
  fonteAtribuicao: string; // texto de crédito específico deste item (wger, CC-BY-SA 3.0)
};
```

**Rationale**: `fonteAtribuicao` por item (não só um texto genérico de créditos na
tela) segue a prática recomendada de atribuição CC-BY-SA por obra — a tela de
créditos (FR-007) pode agregar/resumir, mas o dado por exercício já carrega a
referência exata, evitando ter que re-derivar isso depois.

**Alternatives considered**: só um texto de créditos genérico, sem
`fonteAtribuicao` por item — rejeitado: mais simples, mas mais frágil legalmente
(atribuição por obra é a prática mais segura para CC-BY-SA, especialmente se o
catálogo crescer/for editado no futuro e for preciso saber a origem exata de cada
item).

## Decisão 4: leitura do catálogo — função pura, sem estado

**Decision**:

```ts
// src/services/catalogo-exercicios.ts
import catalogoJson from '@/assets/catalogo/exercicios.json';
import type { ExercicioCatalogo } from '@/types/catalogo-exercicios';

const CATALOGO: ExercicioCatalogo[] = catalogoJson as ExercicioCatalogo[];

export function listarCatalogo(): ExercicioCatalogo[] {
  return CATALOGO;
}
```

**Rationale**: dado estático, sem I/O — não precisa ser `async` nem passar por
`AsyncStorage`; import direto do JSON (mesmo padrão já usado por
`treino-exemplo.json` em `treino-storage.ts`).

**Alternatives considered**: carregar via `require`/`fetch` de um asset separado
em vez de `import` estático — rejeitado, `import` direto de JSON já é o padrão
estabelecido no projeto e resolve em tempo de build (Metro), sem I/O em runtime.

## Resumo das entidades técnicas afetadas

- `src/types/catalogo-exercicios.ts` (novo): `GrupoMuscular`, `ExercicioCatalogo`.
- `assets/catalogo/exercicios.json` (novo, dado curado — gerado pelo processo
  de curadoria da Decisão 2, não gerado por código do app).
- `assets/catalogo/imagens/*` (novo, mídia curada).
- `src/services/catalogo-exercicios.ts` (novo): `listarCatalogo`.
- `src/app/acoes.tsx`: novo item de créditos/atribuição (FR-007,
  `tela-creditos.md`).
