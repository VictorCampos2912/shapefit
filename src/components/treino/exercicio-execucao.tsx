import { useMemo, useState } from 'react';
import { Alert, Image, Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { IMAGENS_CATALOGO } from '@/assets/catalogo/imagens-index';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ConcluirIcon, EditarIcon } from '@/components/ui/icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { buscarNoCatalogo } from '@/services/catalogo-exercicios';
import type { EstadoExecucaoExercicio, SerieRealizada } from '@/types/execucao-treino';
import type { ExercicioPlanejado } from '@/types/treino';
import { ROTULO_CAMPO_PRINCIPAL, SUFIXO_VALOR, exibeCampoPrincipal } from '@/utils/categoria-exercicio';
import { sanitizarCarga, sanitizarReps } from '@/utils/sanitizar-serie';

type ExercicioExecucaoProps = {
  exercicio: ExercicioPlanejado;
  estado: EstadoExecucaoExercicio;
  onAtualizarEstado: (novoEstado: EstadoExecucaoExercicio) => void;
  onConcluirSerie: (serie: SerieRealizada) => void;
  onConcluirExercicio: () => void;
  onEditarSerie: (serieEditada: SerieRealizada) => Promise<void>;
  onIniciarDescanso?: (info: { exercicioId: string; descansoSeg: number }) => void;
  emDescanso?: boolean;
  jaEstavaConcluidoAoAbrir?: boolean;
};

type EdicaoSerieEmAndamento = {
  serie: number;
  cargaKg: string;
  reps: string;
};

export function ExercicioExecucao({
  exercicio,
  estado,
  onAtualizarEstado,
  onConcluirSerie,
  onConcluirExercicio,
  onEditarSerie,
  onIniciarDescanso,
  emDescanso = false,
  jaEstavaConcluidoAoAbrir = false,
}: ExercicioExecucaoProps) {
  const theme = useTheme();
  const [edicaoSerie, setEdicaoSerie] = useState<EdicaoSerieEmAndamento | null>(null);
  const correspondencia = useMemo(() => buscarNoCatalogo(exercicio.nome), [exercicio.nome]);

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
    const serieOriginal = estado.seriesConcluidas.find((item) => item.serie === serie);

    Alert.alert('Confirmar alteração', `Confirma a alteração da série ${serie}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salvar',
        onPress: async () => {
          await onEditarSerie({
            serie,
            cargaKg: exibeCampoPrincipal(exercicio.categoria) ? Number(cargaKg) : serieOriginal?.cargaKg ?? 0,
            reps: Number(reps),
          });
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
    Keyboard.dismiss();
    const cargaKg = Number(estado.cargaKg);
    const reps = Number(estado.repsFeitas);
    onConcluirSerie({ serie: estado.serieAtual, cargaKg, reps });

    const eraUltimaSerie = estado.serieAtual >= exercicio.series;
    if (!eraUltimaSerie) {
      onIniciarDescanso?.({ exercicioId: exercicio.id, descansoSeg: exercicio.descansoSeg });
    }
  }

  const podeConcluirSerie =
    (!exibeCampoPrincipal(exercicio.categoria) || estado.cargaKg.trim().length > 0) &&
    estado.repsFeitas.trim().length > 0;
  const podeSalvarEdicao =
    !!edicaoSerie &&
    (!exibeCampoPrincipal(exercicio.categoria) || edicaoSerie.cargaKg.trim().length > 0) &&
    edicaoSerie.reps.trim().length > 0;

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
                  {exibeCampoPrincipal(exercicio.categoria) && (
                    <ThemedView style={styles.campo}>
                      <ThemedText type="smallBold" themeColor="text">
                        {ROTULO_CAMPO_PRINCIPAL[exercicio.categoria]}
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
                  )}
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
                    <Button
                      onPress={handleSalvarEdicaoSerie}
                      disabled={!podeSalvarEdicao}
                      style={styles.botaoSalvarEdicao}
                    >
                      Salvar edição
                    </Button>
                  </ThemedView>
                </ThemedView>
              ) : (
                <Pressable
                  onPress={() => handleIniciarEdicaoSerie(serieRealizada)}
                  style={styles.linhaSerieConcluida}
                >
                  <ThemedText type="default">
                    Série {serieRealizada.serie}:{' '}
                    {exibeCampoPrincipal(exercicio.categoria)
                      ? `${serieRealizada.cargaKg}${SUFIXO_VALOR[exercicio.categoria]} × `
                      : ''}
                    {serieRealizada.reps} reps
                  </ThemedText>
                  <View style={styles.linhaComIcone}>
                    <EditarIcon size={14} color={theme.accent} />
                    <ThemedText type="link">Editar</ThemedText>
                  </View>
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
        {exercicio.series}x {exercicio.repsAlvo}
        {exibeCampoPrincipal(exercicio.categoria) &&
          ` · sugestão ${exercicio.cargaSugeridaKg}${SUFIXO_VALOR[exercicio.categoria]}`}{' '}
        · {exercicio.descansoSeg}s descanso
      </ThemedText>

      {correspondencia && (
        <Image
          source={IMAGENS_CATALOGO[correspondencia.midia.arquivo] as ImageSourcePropType}
          style={styles.imagemExercicio}
          resizeMode="contain"
          accessibilityLabel={`Demonstração do exercício ${correspondencia.nome}`}
        />
      )}

      {!estado.iniciado && (
        <Button onPress={handleIniciarExercicio} style={styles.botaoIniciar}>
          Iniciar exercício
        </Button>
      )}

      {estado.iniciado && !estado.concluido && !emDescanso && (
        <ThemedView
          type="backgroundSelected"
          style={[styles.areaSerieAtual, { borderWidth: 2, borderColor: theme.text }]}
        >
          <ThemedText type="subtitle">
            Série {estado.serieAtual} de {exercicio.series}
          </ThemedText>

          {exibeCampoPrincipal(exercicio.categoria) && (
            <ThemedView style={styles.campo}>
              <ThemedText type="smallBold" themeColor="text">
                {ROTULO_CAMPO_PRINCIPAL[exercicio.categoria]}
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
          )}

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

          <Button
            onPress={handleConcluirSerie}
            disabled={!podeConcluirSerie}
            icon={<ConcluirIcon size={16} color={theme.background} />}
            style={styles.botaoIniciar}
          >
            Concluir série
          </Button>

          {renderSeriesConcluidas()}
        </ThemedView>
      )}

      {estado.iniciado && !estado.concluido && emDescanso && (
        <ThemedView
          type="backgroundSelected"
          style={[styles.areaSerieAtual, { borderWidth: 2, borderColor: theme.text }]}
        >
          <ThemedText type="small" themeColor="textSecondary">
            Próxima: série {estado.serieAtual} de {exercicio.series} — aguarde o fim do
            descanso
          </ThemedText>

          {renderSeriesConcluidas()}
        </ThemedView>
      )}

      {estado.concluido && jaEstavaConcluidoAoAbrir && (
        <ThemedView type="successBackground" style={[styles.areaConcluido, { borderColor: theme.success }]}>
          <ConcluirIcon size={44} color={theme.success} strokeWidth={2.5} />
          <ThemedText type="subtitle" themeColor="success" style={styles.textoCentralizado}>
            Este já foi feito, volte no próximo treino
          </ThemedText>

          {renderSeriesConcluidas()}
        </ThemedView>
      )}

      {estado.concluido && !jaEstavaConcluidoAoAbrir && (
        <ThemedView type="successBackground" style={[styles.areaConcluido, { borderColor: theme.success }]}>
          <ConcluirIcon size={44} color={theme.success} strokeWidth={2.5} />
          <ThemedText type="subtitle" themeColor="success" style={styles.textoCentralizado}>
            Todas as séries concluídas!
          </ThemedText>
          <Button
            variant="success"
            onPress={onConcluirExercicio}
            icon={<ConcluirIcon size={16} color={theme.background} />}
            style={styles.botaoConcluirExercicio}
          >
            Concluir exercício
          </Button>

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
  imagemExercicio: {
    width: '100%',
    height: 180,
    borderRadius: Spacing.two,
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
  linhaComIcone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  linhaComIconeCentralizada: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
});
