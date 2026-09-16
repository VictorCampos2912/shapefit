import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ExercicioExecucao } from '@/components/treino/exercicio-execucao';
import { ExercicioListItem, type EstadoVisualExercicio } from '@/components/treino/exercicio-list-item';
import { Spacing } from '@/constants/theme';
import { usePerfilAtivo } from '@/hooks/use-perfil-ativo';
import { listarTreinos } from '@/services/treino-storage';
import { criarEstadoExecucaoInicial, type EstadoExecucaoExercicio } from '@/types/execucao-treino';
import type { Treino } from '@/types/treino';

function estadoVisualDoExercicio(
  exercicioId: string,
  estadosPorExercicio: Record<string, EstadoExecucaoExercicio>,
): EstadoVisualExercicio {
  const estado = estadosPorExercicio[exercicioId];
  return estado?.iniciado ? 'pausado' : 'naoIniciado';
}

export default function ExecucaoTreinoScreen() {
  const { treinoId } = useLocalSearchParams<{ treinoId: string }>();
  const { perfilAtivo } = usePerfilAtivo();

  const [treino, setTreino] = useState<Treino | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [exercicioSelecionadoId, setExercicioSelecionadoId] = useState<string | null>(null);
  const [estadosPorExercicio, setEstadosPorExercicio] = useState<Record<string, EstadoExecucaoExercicio>>({});

  useEffect(() => {
    if (!perfilAtivo) return;
    let ativo = true;
    (async () => {
      setCarregando(true);
      const treinos = await listarTreinos(perfilAtivo.id);
      const encontrado = treinos.find((item) => item.id === treinoId) ?? null;
      if (ativo) {
        setTreino(encontrado);
        setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [perfilAtivo, treinoId]);

  function handleSelecionarExercicio(exercicioId: string) {
    setExercicioSelecionadoId(exercicioId);
    setEstadosPorExercicio((atual) => {
      if (atual[exercicioId]) {
        return atual;
      }
      return { ...atual, [exercicioId]: criarEstadoExecucaoInicial(exercicioId) };
    });
  }

  function handleVoltarParaLista() {
    setExercicioSelecionadoId(null);
  }

  function handleAtualizarEstadoExercicio(novoEstado: EstadoExecucaoExercicio) {
    setEstadosPorExercicio((atual) => ({ ...atual, [novoEstado.exercicioId]: novoEstado }));
  }

  if (carregando) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="default">Carregando treino...</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!treino) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="smallBold">Treino não encontrado</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const exercicioSelecionado = treino.exercicios.find((item) => item.id === exercicioSelecionadoId) ?? null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {exercicioSelecionado ? (
          <>
            <Pressable onPress={handleVoltarParaLista}>
              <ThemedText type="link">← Voltar para exercícios</ThemedText>
            </Pressable>
            <ExercicioExecucao
              exercicio={exercicioSelecionado}
              estado={
                estadosPorExercicio[exercicioSelecionado.id] ??
                criarEstadoExecucaoInicial(exercicioSelecionado.id)
              }
              onAtualizarEstado={handleAtualizarEstadoExercicio}
            />
          </>
        ) : (
          <>
            <ThemedText type="subtitle">{treino.nome}</ThemedText>
            <FlatList
              data={treino.exercicios}
              keyExtractor={(exercicio) => exercicio.id}
              contentContainerStyle={styles.lista}
              renderItem={({ item }) => (
                <ExercicioListItem
                  exercicio={item}
                  estado={estadoVisualDoExercicio(item.id, estadosPorExercicio)}
                  onPress={() => handleSelecionarExercicio(item.id)}
                />
              )}
            />
          </>
        )}
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
  lista: {
    gap: Spacing.two,
  },
});
