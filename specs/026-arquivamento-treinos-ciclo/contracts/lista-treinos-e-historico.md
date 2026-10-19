# Contract: Lista de treinos (`index.tsx`) e histórico (`historico-evolucao.ts`) — alterados

**Feature**: `026-arquivamento-treinos-ciclo`

## `src/app/(tabs)/index.tsx` (alterado) — FR-003/FR-005/FR-011

### Filtrar treinos ativos (FR-003) — zero leitura nova

```ts
import { filtrarTreinosAtivos, listarTreinos } from '@/services/treino-storage';

// useEffect inicial e recarregarTreinos, mesmas 2 chamadas de hoje:
const lista = filtrarTreinosAtivos(await listarTreinos(uid));
```

### `carregarDadosDeSessao` ganha `sessaoEmAndamentoIdPorTreino` (introduzido pela US1, reaproveitado pela FR-011) — reaproveita o `sessoes` já lido

**Por que já na US1, não só na US4**: desde que `arquivarTreino` passou a
exigir o id da sessão em andamento como argumento, em vez de descobri-lo
sozinho (`research.md`, Decisão 4 revisada), `handleArquivarTreino`
precisa desse id **mesmo sem a User Story 4 existir** — por isso este
state é introduzido aqui, na US1, e só reaproveitado (não reintroduzido)
pela ação de "finalizar sessão em andamento" da US4.

```ts
const [sessaoEmAndamentoIdPorTreino, setSessaoEmAndamentoIdPorTreino] = useState<Record<string, string>>({});

async function carregarDadosDeSessao(uid: string, lista: Treino[]) {
  try {
    const sessoes = await listarSessoes(uid); // mesma 1 leitura de hoje

    const contagens: Record<string, number> = {};
    const datas: Record<string, string | null> = {};
    const emAndamento: Record<string, boolean> = {};
    const sessaoEmAndamentoId: Record<string, string> = {}; // NOVO

    for (const treino of lista) {
      const doTreino = sessoes.filter((sessao) => sessao.treinoId === treino.id);
      const finalizadas = doTreino.filter((sessao) => sessao.finalizadaEm !== null);
      const emAndamentoDoTreino = doTreino.find((sessao) => sessao.finalizadaEm === null);

      contagens[treino.id] = finalizadas.length;
      datas[treino.id] = /* inalterado */;
      emAndamento[treino.id] = emAndamentoDoTreino !== undefined;
      if (emAndamentoDoTreino) {
        sessaoEmAndamentoId[treino.id] = emAndamentoDoTreino.id; // NOVO
      }
    }

    setContagensPorTreino(contagens);
    setDataFinalizacaoPorTreino(datas);
    setEmAndamentoPorTreino(emAndamento);
    setSessaoEmAndamentoIdPorTreino(sessaoEmAndamentoId); // NOVO
  } catch (erro) {
    // inalterado, + setSessaoEmAndamentoIdPorTreino({}) no catch
  }
}
```

- **Zero leitura nova** — `sessoes` já era buscado para popular
  `emAndamentoPorTreino`; só passa a também capturar o `id` da sessão
  encontrada, no mesmo laço (item 8 do plano).

### Menu "mais opções" por item (FR-001/FR-011) — novo, via `Alert.alert`

```ts
async function handleAbrirMenuDoTreino(treino: Treino) {
  const opcoes: AlertButton[] = [{ text: 'Cancelar', style: 'cancel' }];
  if (emAndamentoPorTreino[treino.id]) {
    opcoes.push({ text: 'Finalizar sessão em andamento', onPress: () => handleFinalizarSessaoAbandonada(treino) });
  }
  opcoes.push({ text: 'Arquivar', style: 'destructive', onPress: () => handleArquivarTreino(treino) });
  Alert.alert(treino.nome, undefined, opcoes);
}

function handleFinalizarSessaoAbandonada(treino: Treino) {
  const sessaoId = sessaoEmAndamentoIdPorTreino[treino.id];
  if (!uid || !sessaoId) return;
  Alert.alert('Finalizar sessão', 'As séries já registradas serão mantidas. Continuar?', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Finalizar',
      onPress: () => {
        // NOVO: atualização otimista — some com o destaque "Em andamento"
        // no mesmo toque de confirmação, sem esperar nada.
        setEmAndamentoPorTreino((atual) => ({ ...atual, [treino.id]: false }));
        finalizarSessaoPorId(uid, sessaoId); // src/services/sessao-treino-storage.ts — sem leitura, sem await
        recarregarTreinos(); // reconcilia contadores/ciclo em segundo plano
      },
    },
  ]);
}

function handleArquivarTreino(treino: Treino) {
  if (!uid) return;
  const sessaoEmAndamentoId = sessaoEmAndamentoIdPorTreino[treino.id] ?? null;
  Alert.alert(
    'Arquivar treino',
    sessaoEmAndamentoId !== null
      ? 'Este treino tem uma sessão em andamento. Arquivar também vai finalizá-la, mantendo as séries já registradas. Continuar?'
      : 'O treino sai de "Meus treinos", mas todo o histórico já registrado continua disponível. Continuar?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Arquivar',
        style: 'destructive',
        onPress: () => {
          // NOVO: atualização otimista — remove da lista local já no toque
          // de confirmação, sem esperar nada (arquivarTreino não lê mais
          // nada antes de escrever — research.md, Decisão 4 revisada).
          setTreinos((atual) => atual.filter((item) => item.id !== treino.id));
          arquivarTreino(uid, treino.id, sessaoEmAndamentoId); // src/services/treino-storage.ts — sem leitura, sem await, sem .catch no call site
          recarregarTreinos(); // reconcilia contadores/ciclo em segundo plano
        },
      },
    ],
  );
}
```

- **Atualização otimista, não leitura otimista**: `setTreinos` muda o
  estado local imediatamente, de forma síncrona, no mesmo tick do toque
  de confirmação — o item desaparece da tela antes mesmo de
  `arquivarTreino` ser chamada (que agora também é síncrona e não lê
  nada, `research.md` Decisão 4 revisada). `recarregarTreinos()` roda
  logo em seguida, em segundo plano, só para reconciliar contadores/ciclo
  que podem ter mudado (ex.: sessão finalizada automaticamente, FR-010).
- **Sem `.catch` no call site**: `arquivarTreino`/`finalizarSessaoPorId`
  já tratam o próprio erro internamente (log, nunca rejeitam para quem
  chamou) — mesmo padrão de `setDocTreino`/`setDocSessao`/`setDocCiclo`
  no resto do app.
- **`sessaoEmAndamentoId` decide o texto da confirmação E é passado
  direto para `arquivarTreino`** — uma única fonte de verdade local
  (`sessaoEmAndamentoIdPorTreino`), sem precisar que a função de escrita
  devolva nada de volta.

- **`TreinoListItem` ganha um botão "mais opções"** (reaproveita
  `AcoesIcon`, menor, canto do item) que chama `handleAbrirMenuDoTreino` —
  único ajuste visual no componente, sem mudar `onPress` (continua
  abrindo a execução do treino).
- 1 toque (abrir o menu) + 1 toque (escolher "Arquivar") + 1 toque de
  confirmação = dentro do limite de SC-001. "Finalizar sessão em
  andamento" é 1 toque + 1 confirmação, nem precisa do segundo (só
  aparece quando já existe sessão em andamento).

### `useFocusEffect` — inalterado

Continua chamando só `recarregarTreinos()`, mesmo mecanismo de
atualização por foco.

## `src/services/historico-evolucao.ts` (alterado) — FR-005

```ts
import { filtrarTreinosAtivos, listarTreinos } from '@/services/treino-storage';

export async function obterHistoricoPorPerfil(perfilId: string): Promise<HistoricoPerfil> {
  const [treinos, sessoesFinalizadas] = await Promise.all([
    listarTreinos(perfilId),
    listarSessoesFinalizadas(perfilId),
  ]);

  // ... (inalterado até aqui) ...

  const treinosAtivos = filtrarTreinosAtivos(treinos); // NOVO
  for (const treino of treinosAtivos) { // antes: for (const treino of treinos)
    for (const exercicio of treino.exercicios) {
      // ... inalterado — semeia gruposPorChave ...
    }
  }

  // ... resto inalterado — registros de sessões (via snapshot) continuam
  //     vindo de TODOS os treinos, ativos ou arquivados, porque não
  //     dependem de listarTreinos para nada além do universo semeado acima ...
}
```

- **`obterHistoricoPorData`**: não chama `listarTreinos` (já era assim
  desde a spec 025) — nenhuma mudança, sessões de treinos arquivados
  continuam aparecendo normalmente, sem nenhum universo a filtrar.
- **`src/app/(tabs)/explore.tsx`**: sem mudança — único consumidor de
  `obterHistoricoPorPerfil`/`obterHistoricoPorData`/
  `atualizarSerieDeSessaoFinalizada`, nenhuma das três muda de
  assinatura.

## Nova tela: `src/app/treinos-arquivados.tsx` — FR-006

Rota top-level nova (mesmo padrão de `/acoes`, fora das tabs), acessível
pelo menu de Ações (`contracts/acoes-e-sessao-abandonada.md`). Lista
`filtrarTreinosArquivados(await listarTreinos(uid))` — 1 leitura própria,
fora do caminho de `index.tsx`. Cada item mostra nome + data de
arquivamento + um botão "Restaurar" — sem `onPress` de navegação/execução
(treino arquivado não é executável, mesmo a partir desta tela).

### Restaurar — atualização otimista (mesmo princípio de `handleArquivarTreino`)

```ts
const [arquivados, setArquivados] = useState<Treino[]>([]);

function handleRestaurarTreino(treino: Treino) {
  if (!uid) return;
  // NOVO: remove da lista local de arquivados imediatamente, sem esperar
  // nada — restaurarTreino não lê nada antes de escrever (research.md,
  // Decisão 4 revisada).
  setArquivados((atual) => atual.filter((item) => item.id !== treino.id));
  restaurarTreino(uid, treino.id); // src/services/treino-storage.ts — sem leitura, sem await, sem .catch no call site
  // Sem recarregarTreinos() aqui — essa tela não mostra contadores/ciclo,
  // só a lista de arquivados; index.tsx recarrega sozinho ao ganhar foco
  // de novo (useFocusEffect já existente), mostrando o treino restaurado.
}
```

- **Sem confirmação adicional**: restaurar é a operação inversa de
  arquivar e não tem nenhum efeito colateral (nunca mexe em sessão
  nenhuma, `contracts/treino-storage.md`) — um toque no botão "Restaurar"
  já basta, sem `Alert.alert` de confirmação.
