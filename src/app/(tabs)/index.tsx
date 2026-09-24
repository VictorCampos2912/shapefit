import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BotaoAcoes } from '@/components/ui/botao-acoes';
import { ProgressRing } from '@/components/ui/progress-ring';
import { TreinoListItem } from '@/components/treino/treino-list-item';
import { Spacing } from '@/constants/theme';
import { usePerfilAtivo } from '@/hooks/use-perfil-ativo';
import { calcularProgressoCiclo, cotaComoFracao, obterCicloAtual } from '@/services/ciclo-treino-storage';
import { contarSessoesFinalizadas, obterDataUltimaSessaoFinalizada } from '@/services/sessao-treino-storage';
import { listarTreinos } from '@/services/treino-storage';
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
  const { perfilAtivo } = usePerfilAtivo();
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [contagensPorTreino, setContagensPorTreino] = useState<Record<string, number>>({});
  const [dataFinalizacaoPorTreino, setDataFinalizacaoPorTreino] = useState<Record<string, string | null>>({});
  const [cicloAtual, setCicloAtual] = useState<CicloTreino | null>(null);
  const [progressoCiclo, setProgressoCiclo] = useState<{
    totalFinalizado: number;
    porTreino: Record<string, number>;
  } | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarContagens(perfilId: string, lista: Treino[]) {
    const entradas = await Promise.all(
      lista.map(async (treino) => [treino.id, await contarSessoesFinalizadas(perfilId, treino.id)] as const),
    );
    setContagensPorTreino(Object.fromEntries(entradas));
  }

  async function carregarDatasFinalizacao(perfilId: string, lista: Treino[]) {
    const entradas = await Promise.all(
      lista.map(
        async (treino) => [treino.id, await obterDataUltimaSessaoFinalizada(perfilId, treino.id)] as const,
      ),
    );
    setDataFinalizacaoPorTreino(Object.fromEntries(entradas));
  }

  async function carregarCicloAtual(perfilId: string) {
    const ciclo = await obterCicloAtual(perfilId);
    setCicloAtual(ciclo);
    setProgressoCiclo(ciclo ? await calcularProgressoCiclo(perfilId, ciclo) : null);
  }

  async function recarregarTreinos() {
    if (!perfilAtivo) return;
    const lista = await listarTreinos(perfilAtivo.id);
    setTreinos(lista);
    await Promise.all([
      carregarContagens(perfilAtivo.id, lista),
      carregarDatasFinalizacao(perfilAtivo.id, lista),
      carregarCicloAtual(perfilAtivo.id),
    ]);
  }

  useEffect(() => {
    if (!perfilAtivo) return;
    let ativo = true;
    (async () => {
      setCarregando(true);
      const lista = await listarTreinos(perfilAtivo.id);
      if (ativo) {
        setTreinos(lista);
        setCarregando(false);
      }
      await Promise.all([
        carregarContagens(perfilAtivo.id, lista),
        carregarDatasFinalizacao(perfilAtivo.id, lista),
        carregarCicloAtual(perfilAtivo.id),
      ]);
    })();
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload deve depender só do id do perfil ativo (research.md, Decisão 2), não do objeto perfilAtivo inteiro
  }, [perfilAtivo?.id]);

  useFocusEffect(
    useCallback(() => {
      recarregarTreinos();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- recarrega ao ganhar foco (ex.: voltar de uma sessão finalizada), sem precisar de mais dependências
    }, [perfilAtivo?.id]),
  );

  function handleSelecionarTreino(treino: Treino) {
    router.push({ pathname: '/treino/[treinoId]', params: { treinoId: treino.id } });
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
              progressoCiclo={
                cicloAtual?.treinoIds.includes(item.id)
                  ? cotaComoFracao(progressoCiclo?.porTreino[item.id] ?? 0, cicloAtual.cotaPorTreinoId[item.id])
                  : null
              }
              onPress={() => handleSelecionarTreino(item)}
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
