import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { EstadoExecucaoExercicio, SerieRealizada } from '@/types/execucao-treino';
import type { ExercicioPlanejado } from '@/types/treino';

type ExercicioExecucaoProps = {
  exercicio: ExercicioPlanejado;
  estado: EstadoExecucaoExercicio;
  onAtualizarEstado: (novoEstado: EstadoExecucaoExercicio) => void;
  onConcluirSerie: (serie: SerieRealizada) => void;
  onConcluirExercicio: () => void;
  onIniciarDescanso?: () => void;
  jaEstavaConcluidoAoAbrir?: boolean;
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

export function ExercicioExecucao({
  exercicio,
  estado,
  onAtualizarEstado,
  onConcluirSerie,
  onConcluirExercicio,
  onIniciarDescanso,
  jaEstavaConcluidoAoAbrir = false,
}: ExercicioExecucaoProps) {
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

  function handleConcluirSerie() {
    const cargaKg = Number(estado.cargaKg);
    const reps = Number(estado.repsFeitas);
    onConcluirSerie({ serie: estado.serieAtual, cargaKg, reps });
    onIniciarDescanso?.();
  }

  const podeConcluirSerie = estado.cargaKg.trim().length > 0 && estado.repsFeitas.trim().length > 0;

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

      {estado.iniciado && !estado.concluido && (
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

          <Pressable
            onPress={handleConcluirSerie}
            disabled={!podeConcluirSerie}
            style={[
              styles.botaoIniciar,
              { backgroundColor: podeConcluirSerie ? theme.text : theme.textSecondary },
            ]}
          >
            <ThemedText type="smallBold" themeColor="background">
              Concluir série
            </ThemedText>
          </Pressable>
        </ThemedView>
      )}

      {estado.concluido && jaEstavaConcluidoAoAbrir && (
        <ThemedView type="successBackground" style={[styles.areaConcluido, { borderColor: theme.success }]}>
          <ThemedText type="title" themeColor="success" style={styles.iconeConcluido}>
            ✓
          </ThemedText>
          <ThemedText type="subtitle" themeColor="success" style={styles.textoCentralizado}>
            Este já foi feito, volte no próximo treino
          </ThemedText>
        </ThemedView>
      )}

      {estado.concluido && !jaEstavaConcluidoAoAbrir && (
        <ThemedView type="successBackground" style={[styles.areaConcluido, { borderColor: theme.success }]}>
          <ThemedText type="title" themeColor="success" style={styles.iconeConcluido}>
            ✓
          </ThemedText>
          <ThemedText type="subtitle" themeColor="success" style={styles.textoCentralizado}>
            Todas as séries concluídas!
          </ThemedText>
          <Pressable
            onPress={onConcluirExercicio}
            style={[styles.botaoConcluirExercicio, { backgroundColor: theme.success }]}
          >
            <ThemedText type="smallBold" themeColor="background">
              Concluir exercício
            </ThemedText>
          </Pressable>
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
  areaConcluido: {
    borderWidth: 2,
    borderRadius: Spacing.two,
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: 'center',
  },
  iconeConcluido: {
    fontSize: 48,
  },
  textoCentralizado: {
    textAlign: 'center',
  },
  botaoConcluirExercicio: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
});
