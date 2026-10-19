# Contract: `src/app/treino/[treinoId].tsx` (alterado)

**Feature**: `026-arquivamento-treinos-ciclo`

Ganha o bloqueio de execução de um treino arquivado (FR-003), nos dois
pontos reais de entrada identificados em `research.md` (Decisão 6): o
carregamento inicial da tela, e o retorno do segundo plano (que é o
caminho real da notificação de fim de descanso, já que não existe
navegação programática por notificação hoje — ver mesma Decisão). Ganha
também o link "Arquivar treino" (FR-001).

## Novo state: `treinoArquivado`

```ts
const [treinoArquivado, setTreinoArquivado] = useState(false);
```

## `useEffect` de carregamento inicial (alterado)

```ts
useEffect(() => {
  if (!uid) return;
  let ativo = true;
  (async () => {
    setCarregando(true);
    const treinos = await listarTreinos(uid); // SEM filtrarTreinosAtivos — precisa ver mesmo se arquivado
    const encontrado = treinos.find((item) => item.id === treinoId) ?? null;
    if (!ativo) return;

    setTreino(encontrado);

    if (encontrado?.arquivadoEm !== null && encontrado !== null) {
      // NOVO: treino existe mas está arquivado — não busca sessões, não
      // monta estado de execução, só sinaliza o bloqueio.
      setTreinoArquivado(true);
      setCarregando(false);
      return;
    }
    setTreinoArquivado(false);

    if (encontrado) {
      // ... resto inalterado (busca sessões, monta estado de execução) ...
    }

    if (ativo) {
      setCarregando(false);
    }
  })();
  return () => {
    ativo = false;
  };
}, [uid, treinoId]);
```

- **`encontrado === null`** (id não existe de verdade) continua caindo no
  branch "Treino não encontrado" já existente, inalterado — distinto de
  "treino arquivado" (mensagem nova, abaixo).

## `useEffect` do `AppState` (alterado) — ponto de checagem do retorno do segundo plano

```ts
useEffect(() => {
  const subscription = AppState.addEventListener('change', (novoEstado) => {
    if (novoEstado === 'active') {
      voltouDeSegundoPlanoRef.current = true;
      setTick((atual) => atual + 1);

      // NOVO: se a tela já tinha um treino carregado, reconfirma que ele
      // continua ativo — cobre o caso de ter sido arquivado por outro
      // aparelho/sessão da mesma conta enquanto esta tela ficou aberta em
      // segundo plano (research.md, Decisão 6). Leitura leve (só
      // listarTreinos, não listarSessoes) e só neste momento, não contínua.
      if (uid && treino && treino.arquivadoEm === null) {
        listarTreinos(uid)
          .then((treinos) => {
            const atualizado = treinos.find((item) => item.id === treinoId);
            if (atualizado?.arquivadoEm !== null && atualizado !== undefined) {
              setTreinoArquivado(true);
            }
          })
          .catch((erro) => {
            // NOVO: nunca deixar uma rejeição não tratada aqui — leitura
            // "melhor esforço", sem UI de erro (nada muda visualmente se
            // falhar, a tela continua como estava).
            console.error('[treinoId] Falha ao reconferir arquivamento no retorno do segundo plano:', erro);
          });
      }
    }
  });
  return () => {
    subscription.remove();
  };
}, [uid, treino, treinoId]);
```

- Sem `await`, sem bloquear a UI — mesmo espírito de leitura "melhor
  esforço" que o resto do app (se a leitura falhar offline, nada muda
  visualmente, a tela continua como estava; não há `try/catch`
  silenciando nada de crítico aqui porque não há escrita envolvida).

## `useFocusEffect` — reforço ao ganhar foco (investigação de navegação)

**Investigado**: `src/app/treino/[treinoId].tsx` não tem `_layout.tsx`
próprio — é uma tela de pilha comum dentro do único
`<Stack screenOptions={{ headerShown: false }} />` declarado em
`src/app/_layout.tsx` (sem `unmountOnBlur` customizado, sem
`presentation` especial). O comportamento padrão do native-stack usado
pelo Expo Router é **desmontar a tela ao sair da pilha** (voltar) — não
existe hoje nenhum caminho de navegação no app que deixe `[treinoId]`
"viva, mas escondida" atrás de outra tela depois do usuário sair dela (não
é uma tab, que o React Navigation manteria montada por padrão; é uma tela
empilhada comum). Isso significa que, na prática, o ponto de checagem 2
(`AppState`) já cobre o único cenário real conhecido (app inteiro em
segundo plano, com a tela ainda sendo a mesma instância em primeiro
plano).

**Mesmo assim, adicionado por segurança** (pedido explícito, custo
baixíssimo, mesma checagem leve reaproveitada) — `useFocusEffect`
(`expo-router`, já usado em `index.tsx`) cobre qualquer caminho de
navegação futuro que preserve a tela montada sem este código precisar
mudar:

```ts
import { useFocusEffect } from 'expo-router';

useFocusEffect(
  useCallback(() => {
    if (!uid || !treino || treino.arquivadoEm !== null) return;
    listarTreinos(uid)
      .then((treinos) => {
        const atualizado = treinos.find((item) => item.id === treinoId);
        if (atualizado?.arquivadoEm !== null && atualizado !== undefined) {
          setTreinoArquivado(true);
        }
      })
      .catch((erro) => {
        console.error('[treinoId] Falha ao reconferir arquivamento ao ganhar foco:', erro);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mesma checagem leve do efeito de AppState, intencionalmente redundante
  }, [uid, treino, treinoId]),
);
```

- **Redundante com o `useEffect` de carregamento inicial** na primeira
  vez que a tela ganha foco (ambos rodam) — inofensivo, mesma leitura
  idempotente, sem efeito colateral de escrita.

## Renderização condicional nova

```tsx
if (treinoArquivado) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={handleVoltarParaLista} style={styles.linhaComIcone}>
          <VoltarIcon size={16} color={theme.accent} />
          <ThemedText type="link">Voltar para a lista</ThemedText>
        </Pressable>
        <ThemedText type="smallBold">Este treino foi arquivado.</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}
```

Mesmo padrão visual já usado pelo branch "Treino não encontrado"
existente — reaproveita `ThemedText type="smallBold"`, nenhum estilo novo.
`handleVoltarParaLista` aqui significa `router.back()`/navegar para "Meus
treinos" (mesmo destino do botão "Voltar" já usado em outros pontos da
tela — não há "lista de exercícios" para voltar quando o treino está
arquivado).

## Link "Arquivar treino" (FR-001) — novo, ao lado do cabeçalho do treino

Na área onde hoje aparece `{treino.nome}` / "Importado em ..." (branch
"nenhum exercício selecionado"), um novo `Pressable` com o mesmo padrão
visual de "Voltar para exercícios" (ícone + `ThemedText type="link"`),
chamando `handleArquivarTreino`:

```ts
function handleArquivarTreino() {
  if (!uid || !treino) return;
  Alert.alert(
    'Arquivar treino',
    sessaoAtualId !== null
      ? 'Este treino tem uma sessão em andamento. Arquivar também vai finalizá-la, mantendo as séries já registradas. Continuar?'
      : 'O treino sai de "Meus treinos", mas todo o histórico já registrado continua disponível. Continuar?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Arquivar',
        style: 'destructive',
        onPress: () => {
          // NOVO: mesma limpeza que "Finalizar treino" já faz hoje
          // (handleFinalizarTreino chama isto primeiro) — cancela o
          // cronômetro de descanso em tela e a notificação agendada
          // (expo-notifications), sem a vibração do RF13 (deveVibrar=false).
          // Sem isso, arquivar com um descanso ativo deixaria a
          // notificação de fim de descanso agendada para um treino que
          // não existe mais nas telas do usuário.
          handleDescansoConcluido(false);
          // router.back() leva de volta para "Meus treinos", que já tem
          // useFocusEffect chamando recarregarTreinos() ao ganhar foco de
          // novo (spec 024) — não precisa de atualização otimista própria
          // aqui, a lista recarrega de verdade e já reflete o treino
          // arquivado (cache local já atualizado pelo writeBatch).
          router.back();
          // sessaoAtualId já é o id da sessão em andamento desta tela (ou
          // null) — arquivarTreino não lê nada, não precisa de .catch no
          // call site (já trata o próprio erro internamente, research.md
          // Decisão 4 revisada).
          arquivarTreino(uid, treino.id, sessaoAtualId);
        },
      },
    ],
  );
}
```

- **`handleDescansoConcluido(false)` reaproveitado**: já existe no
  arquivo (chamado por `handleFinalizarTreino`) — cancela
  `notificacaoAgendada` via `cancelarNotificacaoDescanso` e zera
  `descansoAtivo`, mesma função, nenhum código novo de limpeza.
- **`arquivarTreino` agora é síncrona, sem leitura** (`research.md`,
  Decisão 4 revisada): nenhuma `Promise` no caminho — `router.back()` roda
  imediatamente, e a lista de destino recarrega de verdade ao ganhar foco
  (`useFocusEffect` já existente em `index.tsx`), sem precisar de
  atualização otimista própria
  nesse caminho (ver comentário no código acima); `.catch` só registra
  falha, não bloqueia nem desfaz a navegação.
- **Caso aceito, documentado, sem tratamento** (arquivamento feito pela
  **lista**, não por esta tela): se o treino arquivado tiver uma
  notificação de fim de descanso agendada de uma sessão anterior (deixada
  pendente, app fechado antes do descanso terminar), arquivar pela lista
  não cancela essa notificação — `treino-storage.ts` não tem acesso ao
  identificador da notificação, que só existe como state local desta tela
  (`notificacaoAgendada`), nunca persistido. A notificação pode disparar
  depois, mas é inofensiva: tocar nela só foreground o app para esta
  tela, que então mostra a mensagem de bloqueio (FR-003) por já estar
  arquivado — nenhuma ação incorreta é possível. Não vale a complexidade
  de persistir/cancelar notificações de outros treinos a partir de
  `index.tsx` para fechar essa janela rara (Princípio II).
- **Texto condicional** depende de `sessaoAtualId !== null` (state já
  existente na tela — reflete se há uma sessão em andamento carregada),
  não de uma leitura nova.
- 1 toque (o link "Arquivar treino") + 1 toque de confirmação — dentro do
  limite de SC-001.
