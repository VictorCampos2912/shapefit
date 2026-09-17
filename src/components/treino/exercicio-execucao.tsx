import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';

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
  onEditarSerie: (serieEditada: SerieRealizada) => Promise<void>;
  onIniciarDescanso?: () => void;
  jaEstavaConcluidoAoAbrir?: boolean;
};

type EdicaoSerieEmAndamento = {
  serie: number;
  cargaKg: string;
  reps: string;
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
  onEditarSerie,
  onIniciarDescanso,
  jaEstavaConcluidoAoAbrir = false,
}: ExercicioExecucaoProps) {
  const theme = useTheme();
  const [edicaoSerie, setEdicaoSerie] = useState<EdicaoSerieEmAndamento | null>(null);

  function handleIniciarEdicaoSerie(serieRealizada: SerieRealizada) {
    setEdicaoSerie({
      serie: serieRealizada.serie,
      cargaKg: String(serieRealizada.cargaKg),
      reps: String(serieRealizada.reps),
    });
  }

  function handleCancelarEdicaoSerie() {
    setEdicaoSerie(null);
  }

  function handleAlterarCargaEdicao(valor: string) {
    setEdicaoSerie((atual) => (atual ? { ...atual, cargaKg: sanitizarCarga(valor) } : atual));
  }

  function handleAlterarRepsEdicao(valor: string) {
    setEdicaoSerie((atual) => (atual ? { ...atual, reps: sanitizarReps(valor) } : atual));
  }

  function handleSalvarEdicaoSerie() {
    if (!edicaoSerie) return;
    const { serie, cargaKg, reps } = edicaoSerie;

    Alert.alert('Confirmar alteração', `Confirma a alteração da série ${serie}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salvar',
        onPress: async () => {
          await onEditarSerie({ serie, cargaKg: Number(cargaKg), reps: Number(reps) });
          setEdicaoSerie(null);
        },
      },
    ]);
  }

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
  const podeSalvarEdicao =
    !!edicaoSerie && edicaoSerie.cargaKg.trim().length > 0 && edicaoSerie.reps.trim().length > 0;

  function renderSeriesConcluidas() {
    if (estado.seriesConcluidas.length === 0) {
      return null;
    }

    return (
      <ThemedView style={styles.listaSeriesConcluidas}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Séries concluídas
        </ThemedText>
        {estado.seriesConcluidas.map((serieRealizada) => {
          const emEdicao = edicaoSerie?.serie === serieRealizada.serie;
          return (
            <ThemedView key={serieRealizada.serie} style={styles.itemSerieConcluida}>
              {emEdicao ? (
                <ThemedView style={styles.edicaoSerie}>
                  <ThemedText type="smallBold" themeColor="text">
                    Série {serieRealizada.serie}
                  </ThemedText>
                  <ThemedView style={styles.campo}>
                    <ThemedText type="smallBold" themeColor="text">
                      Carga (kg)
                    </ThemedText>
                    <TextInput
                      value={edicaoSerie?.cargaKg}
                      onChangeText={handleAlterarCargaEdicao}
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
                      value={edicaoSerie?.reps}
                      onChangeText={handleAlterarRepsEdicao}
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
                  <ThemedView style={styles.botoesEdicao}>
                    <Pressable onPress={handleCancelarEdicaoSerie} style={styles.botaoCancelarEdicao}>
                      <ThemedText type="smallBold" themeColor="text">
                        Cancelar
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={handleSalvarEdicaoSerie}
                      disabled={!podeSalvarEdicao}
                      style={[
                        styles.botaoSalvarEdicao,
                        { backgroundColor: podeSalvarEdicao ? theme.text : theme.textSecondary },
                      ]}
                    >
                      <ThemedText type="smallBold" themeColor="background">
                        Salvar edição
                      </ThemedText>
                    </Pressable>
                  </ThemedView>
                </ThemedView>
              ) : (
                <Pressable
                  onPress={() => handleIniciarEdicaoSerie(serieRealizada)}
                  style={styles.linhaSerieConcluida}
                >
                  <ThemedText type="default">
                    Série {serieRealizada.serie}: {serieRealizada.cargaKg}kg ×{' '}
                    {serieRealizada.reps} reps
                  </ThemedText>
                  <ThemedText type="link">Editar</ThemedText>
                </Pressable>
              )}
            </ThemedView>
          );
        })}
      </ThemedView>
    );
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

          {renderSeriesConcluidas()}
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

          {renderSeriesConcluidas()}
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

          {renderSeriesConcluidas()}
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
  listaSeriesConcluidas: {
    gap: Spacing.two,
  },
  itemSerieConcluida: {
    gap: Spacing.one,
  },
  linhaSerieConcluida: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  edicaoSerie: {
    gap: Spacing.two,
  },
  botoesEdicao: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  botaoCancelarEdicao: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  botaoSalvarEdicao: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
});
