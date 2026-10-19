import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BotaoAcoes } from '@/components/ui/botao-acoes';
import { ProgressRing } from '@/components/ui/progress-ring';
import { TreinoListItem } from '@/components/treino/treino-list-item';
import { Spacing } from '@/constants/theme';
import { useContaAutenticada } from '@/hooks/use-conta-autenticada';
import { calcularProgressoCiclo, cotaComoFracao, obterCicloAtual } from '@/services/ciclo-treino-storage';
import { finalizarSessaoPorId, listarSessoes } from '@/services/sessao-treino-storage';
import { arquivarTreino, filtrarTreinosAtivos, listarTreinos } from '@/services/treino-storage';
import type { CicloTreino } from '@/types/ciclo-treino';
import type { Treino } from '@/types/treino';

function calcularNomesDuplicados(treinos: Treino[]): Set<string> {
  const contagem = new Map<string, number>();
  for (const treino of treinos) {
    contagem.set(treino.nome, (contagem.get(treino.nome) ?? 0) + 1);
  }
  const duplicados = new Set<string>();
  for (const [nome, quantidade] of contagem) {
    if (quantidade > 1) {
      duplicados.add(nome);
    }
  }
  return duplicados;
}

/**
 * Treinos que devem exibir a data de importação como desempate adicional: têm
 * nome duplicado E o texto "Finalizado em"/"Nunca treinado" também colidiria
 * entre eles (spec 016, FR-005).
 */
function calcularChavesColidindo(
  treinos: Treino[],
  dataFinalizacaoPorTreino: Record<string, string | null>,
): Set<string> {
  const nomesDuplicados = calcularNomesDuplicados(treinos);
  const grupos = new Map<string, string[]>();
  for (const treino of treinos) {
    if (!nomesDuplicados.has(treino.nome)) continue;
    const chave = `${treino.nome}|${dataFinalizacaoPorTreino[treino.id] ?? 'nunca'}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), treino.id]);
  }
  const colidindo = new Set<string>();
  for (const ids of grupos.values()) {
    if (ids.length > 1) {
      ids.forEach((id) => colidindo.add(id));
    }
  }
  return colidindo;
}

export default function TreinosScreen() {
  const { uid } = useContaAutenticada();
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [contagensPorTreino, setContagensPorTreino] = useState<Record<string, number>>({});
  const [dataFinalizacaoPorTreino, setDataFinalizacaoPorTreino] = useState<Record<string, string | null>>({});
  const [emAndamentoPorTreino, setEmAndamentoPorTreino] = useState<Record<string, boolean>>({});
  const [sessaoEmAndamentoIdPorTreino, setSessaoEmAndamentoIdPorTreino] = useState<Record<string, string>>({});
  const [cicloAtual, setCicloAtual] = useState<CicloTreino | null>(null);
  const [progressoCiclo, setProgressoCiclo] = useState<{
    totalFinalizado: number;
    porTreino: Record<string, number>;
  } | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarDadosDeSessao(uid: string, lista: Treino[]) {
    try {
      const sessoes = await listarSessoes(uid); // 1 leitura, não 1 por treino (spec 025, research.md Decisão 7)

      const contagens: Record<string, number> = {};
      const datas: Record<string, string | null> = {};
      const emAndamento: Record<string, boolean> = {};
      const sessaoEmAndamentoId: Record<string, string> = {};

      for (const treino of lista) {
        const doTreino = sessoes.filter((sessao) => sessao.treinoId === treino.id);
        const finalizadas = doTreino.filter((sessao) => sessao.finalizadaEm !== null);
        const emAndamentoDoTreino = doTreino.find((sessao) => sessao.finalizadaEm === null);

        contagens[treino.id] = finalizadas.length;
        datas[treino.id] =
          finalizadas.length > 0
            ? finalizadas.reduce((maisRecente, atual) =>
                atual.finalizadaEm! > maisRecente.finalizadaEm! ? atual : maisRecente,
              ).finalizadaEm
            : null;
        emAndamento[treino.id] = emAndamentoDoTreino !== undefined;
        if (emAndamentoDoTreino) {
          // Reaproveitado por handleArquivarTreino (spec 026, FR-010) — arquivarTreino
          // não lê nada antes de escrever, precisa receber esse id já pronto.
          sessaoEmAndamentoId[treino.id] = emAndamentoDoTreino.id;
        }
      }

      setContagensPorTreino(contagens);
      setDataFinalizacaoPorTreino(datas);
      setEmAndamentoPorTreino(emAndamento);
      setSessaoEmAndamentoIdPorTreino(sessaoEmAndamentoId);
    } catch (erro) {
      // Não deixa a leitura de sessão derrubar a tela nem a lista de treinos
      // (definida separadamente, antes desta chamada) — ex.: regras do
      // Firestore ainda não publicadas resultam em permission-denied aqui.
      console.error('[index] Falha ao carregar dados de sessão (contagens/datas/indicador):', erro);
      setContagensPorTreino({});
      setDataFinalizacaoPorTreino({});
      setEmAndamentoPorTreino({});
      setSessaoEmAndamentoIdPorTreino({});
    }
  }

  async function carregarCicloAtual(uid: string) {
    try {
      const ciclo = await obterCicloAtual(uid);
      setCicloAtual(ciclo);
      setProgressoCiclo(ciclo ? await calcularProgressoCiclo(uid, ciclo) : null);
    } catch (erro) {
      console.error('[index] Falha ao carregar ciclo de progresso:', erro);
      setCicloAtual(null);
      setProgressoCiclo(null);
    }
  }

  async function recarregarTreinos() {
    if (!uid) return;
    const lista = filtrarTreinosAtivos(await listarTreinos(uid));
    setTreinos(lista);
    await Promise.all([carregarDadosDeSessao(uid, lista), carregarCicloAtual(uid)]);
  }

  useEffect(() => {
    if (!uid) return;
    let ativo = true;
    (async () => {
      setCarregando(true);
      const lista = filtrarTreinosAtivos(await listarTreinos(uid));
      if (ativo) {
        setTreinos(lista);
        setCarregando(false);
      }
      await Promise.all([carregarDadosDeSessao(uid, lista), carregarCicloAtual(uid)]);
    })();
    return () => {
      ativo = false;
    };
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      recarregarTreinos();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- recarrega ao ganhar foco (ex.: voltar de uma sessão finalizada), sem precisar de mais dependências
    }, [uid]),
  );

  function handleSelecionarTreino(treino: Treino) {
    router.push({ pathname: '/treino/[treinoId]', params: { treinoId: treino.id } });
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
            // Atualização otimista — remove da lista local no mesmo toque de
            // confirmação, sem esperar nada (arquivarTreino não lê nada antes
            // de escrever, spec 026 research.md Decisão 4).
            setTreinos((atual) => atual.filter((item) => item.id !== treino.id));
            arquivarTreino(uid, treino.id, sessaoEmAndamentoId);
            recarregarTreinos().catch(console.error); // reconcilia contadores/ciclo em segundo plano
          },
        },
      ],
    );
  }

  function handleFinalizarSessaoAbandonada(treino: Treino) {
    if (!uid) return;
    // Captura o id ANTES de zerar o estado otimista abaixo — se não houver
    // sessão em andamento registrada para este treino, não faz nada.
    const sessaoId = sessaoEmAndamentoIdPorTreino[treino.id];
    if (!sessaoId) return;
    Alert.alert(
      'Finalizar sessão',
      'As séries já registradas serão mantidas — a sessão passa a contar como concluída nos contadores de sessões e no ciclo de progresso, igual a "Finalizar treino" manual. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: () => {
            // Atualização otimista — some com o destaque "Em andamento" e
            // remove o id da sessão no mesmo toque de confirmação, antes de
            // qualquer escrita.
            setEmAndamentoPorTreino((atual) => ({ ...atual, [treino.id]: false }));
            setSessaoEmAndamentoIdPorTreino((atual) => {
              const copia = { ...atual };
              delete copia[treino.id];
              return copia;
            });
            finalizarSessaoPorId(uid, sessaoId); // sem lote, sem .catch no call site — já trata o próprio erro
            recarregarTreinos().catch(console.error); // reconcilia contadores/ciclo em segundo plano
          },
        },
      ],
    );
  }

  // Android permite no máximo 3 botões num Alert.alert (positivo/negativo/
  // neutro do AlertDialog nativo) — "Cancelar" + "Arquivar" sempre, mais
  // "Finalizar sessão em andamento" só quando há uma sessão em andamento
  // para este treino (spec 026, FR-011).
  function handleAbrirMenuDoTreino(treino: Treino) {
    Alert.alert(treino.nome, undefined, [
      { text: 'Cancelar', style: 'cancel' },
      ...(emAndamentoPorTreino[treino.id]
        ? [{ text: 'Finalizar sessão em andamento', onPress: () => handleFinalizarSessaoAbandonada(treino) }]
        : []),
      { text: 'Arquivar', style: 'destructive', onPress: () => handleArquivarTreino(treino) },
    ]);
  }

  const colidindo = calcularChavesColidindo(treinos, dataFinalizacaoPorTreino);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.linhaTitulo}>
          <ThemedText type="subtitle">Meus treinos</ThemedText>
          <BotaoAcoes />
        </View>

        {carregando && (
          <ThemedView style={styles.estadoCarregando}>
            <ProgressRing />
          </ThemedView>
        )}

        {!carregando && treinos.length === 0 && (
          <ThemedView type="backgroundElement" style={styles.estadoVazio}>
            <ThemedText type="smallBold">Nenhum treino importado ainda</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Toque no ícone de ações (⋯) no topo para importar um treino.
            </ThemedText>
          </ThemedView>
        )}

        {cicloAtual && progressoCiclo && progressoCiclo.totalFinalizado >= 40 && (
          <ThemedView type="warningBackground" style={styles.avisoTrocarTreino}>
            <ThemedText type="smallBold" themeColor="warning">
              Hora de trocar o treino — {progressoCiclo.totalFinalizado} sessões já realizadas
            </ThemedText>
          </ThemedView>
        )}

        <FlatList
          data={treinos}
          keyExtractor={(treino) => treino.id}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <TreinoListItem
              treino={item}
              dataFinalizacao={dataFinalizacaoPorTreino[item.id] ?? null}
              exibirDataImportacao={colidindo.has(item.id)}
              qtdSessoesFinalizadas={contagensPorTreino[item.id] ?? 0}
              emAndamento={emAndamentoPorTreino[item.id] ?? false}
              progressoCiclo={
                cicloAtual?.treinoIds.includes(item.id)
                  ? cotaComoFracao(progressoCiclo?.porTreino[item.id] ?? 0, cicloAtual.cotaPorTreinoId[item.id])
                  : null
              }
              onPress={() => handleSelecionarTreino(item)}
              onAbrirMenu={() => handleAbrirMenuDoTreino(item)}
            />
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  linhaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  estadoCarregando: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  estadoVazio: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    gap: Spacing.one,
  },
  avisoTrocarTreino: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  lista: {
    gap: Spacing.two,
  },
});
