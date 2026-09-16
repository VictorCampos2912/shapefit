import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { EstadoExecucaoExercicio } from '@/types/execucao-treino';
import type { ExercicioPlanejado } from '@/types/treino';

type ExercicioExecucaoProps = {
  exercicio: ExercicioPlanejado;
  estado: EstadoExecucaoExercicio;
  onAtualizarEstado: (novoEstado: EstadoExecucaoExercicio) => void;
};

function sanitizarCarga(valor: string): string {
  const normalizado = valor.replace(',', '.').replace(/[^0-9.]/g, '');
  const primeiroPonto = normalizado.indexOf('.');
  if (primeiroPonto === -1) {
    return normalizado;
  }
  return (
    normalizado.slice(0, primeiroPonto + 1) +
    normalizado.slice(primeiroPonto + 1).replace(/\./g, '')
  );
}

function sanitizarReps(valor: string): string {
  return valor.replace(/[^0-9]/g, '');
}

export function ExercicioExecucao({ exercicio, estado, onAtualizarEstado }: ExercicioExecucaoProps) {
  const theme = useTheme();

  function handleIniciarExercicio() {
    onAtualizarEstado({
      ...estado,
      iniciado: true,
      serieAtual: 1,
      cargaKg: String(exercicio.cargaSugeridaKg),
      repsFeitas: '',
    });
  }

  function handleAlterarCarga(valor: string) {
    onAtualizarEstado({ ...estado, cargaKg: sanitizarCarga(valor) });
  }

  function handleAlterarReps(valor: string) {
    onAtualizarEstado({ ...estado, repsFeitas: sanitizarReps(valor) });
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">{exercicio.nome}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {exercicio.series}x {exercicio.repsAlvo} · sugestão {exercicio.cargaSugeridaKg}kg ·{' '}
        {exercicio.descansoSeg}s descanso
      </ThemedText>

      {!estado.iniciado && (
        <Pressable
          onPress={handleIniciarExercicio}
          style={[styles.botaoIniciar, { backgroundColor: theme.text }]}
        >
          <ThemedText type="smallBold" themeColor="background">
            Iniciar exercício
          </ThemedText>
        </Pressable>
      )}

      {estado.iniciado && (
        <ThemedView
          type="backgroundSelected"
          style={[styles.areaSerieAtual, { borderWidth: 2, borderColor: theme.text }]}
        >
          <ThemedText type="subtitle">
            Série {estado.serieAtual} de {exercicio.series}
          </ThemedText>

          <ThemedView style={styles.campo}>
            <ThemedText type="smallBold" themeColor="text">
              Carga (kg)
            </ThemedText>
            <TextInput
              value={estado.cargaKg}
              onChangeText={handleAlterarCarga}
              keyboardType="decimal-pad"
              inputMode="decimal"
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.text, backgroundColor: theme.background },
              ]}
              placeholder="0.0"
              placeholderTextColor={theme.textSecondary}
            />
          </ThemedView>

          <ThemedView style={styles.campo}>
            <ThemedText type="smallBold" themeColor="text">
              Repetições feitas
            </ThemedText>
            <TextInput
              value={estado.repsFeitas}
              onChangeText={handleAlterarReps}
              keyboardType="number-pad"
              inputMode="numeric"
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.text, backgroundColor: theme.background },
              ]}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
            />
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  botaoIniciar: {
    alignSelf: 'flex-start',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  areaSerieAtual: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  campo: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 2,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 16,
    fontWeight: '600',
  },
});
