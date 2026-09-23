import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, FlatList, Pressable, StyleSheet, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CronometroDescanso } from '@/components/treino/cronometro-descanso';
import { ExercicioExecucao } from '@/components/treino/exercicio-execucao';
import { ExercicioListItem, type EstadoVisualExercicio } from '@/components/treino/exercicio-list-item';
import { Button } from '@/components/ui/button';
import { FinalizarIcon, VoltarIcon } from '@/components/ui/icons';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePerfilAtivo } from '@/hooks/use-perfil-ativo';
import {
  atualizarSerieRealizada,
  finalizarSessao,
  marcarExercicioConcluido,
  obterSessao,
  registrarSerieConcluida,
} from '@/services/sessao-treino-storage';
import {
  agendarNotificacaoDescanso,
  cancelarNotificacaoDescanso,
} from '@/services/notificacao-descanso';
import { listarTreinos } from '@/services/treino-storage';
import {
  criarEstadoExecucaoInicial,
  type DescansoAtivo,
  type EstadoExecucaoExercicio,
  type SerieRealizada,
  type SessaoTreino,
} from '@/types/execucao-treino';
import type { Treino } from '@/types/treino';
import { ajustarFimEm, calcularSegundosRestantes } from '@/utils/cronometro-descanso';

const PADRAO_VIBRACAO_FIM_DESCANSO = [0, 500, 200, 500, 200, 500];

function estadoVisualDoExercicio(
  exercicioId: string,
  estadosPorExercicio: Record<string, EstadoExecucaoExercicio>,
): EstadoVisualExercicio {
  const estado = estadosPorExercicio[exercicioId];
  if (estado?.concluido) {
    return 'concluido';
  }
  return estado?.iniciado ? 'pausado' : 'naoIniciado';
}

function estadosPorExercicioDaSessao(
  sessao: SessaoTreino | null,
  exercicios: Treino['exercicios'],
): Record<string, EstadoExecucaoExercicio> {
  if (!sessao) {
    return {};
  }

  const resultado: Record<string, EstadoExecucaoExercicio> = {};

  for (const execucao of sessao.execucoes) {
    const exercicio = exercicios.find((item) => item.id === execucao.exercicioId);
    if (!exercicio) continue;

    const concluido = execucao.status === 'concluido';
    const ultimaSerie = execucao.seriesRealizadas[execucao.seriesRealizadas.length - 1];

    resultado[execucao.exercicioId] = {
      exercicioId: execucao.exercicioId,
      iniciado: true,
      serieAtual: concluido ? exercicio.series : execucao.seriesRealizadas.length + 1,
      cargaKg: concluido ? '' : ultimaSerie ? String(ultimaSerie.cargaKg) : String(exercicio.cargaSugeridaKg),
      repsFeitas: '',
      seriesConcluidas: execucao.seriesRealizadas,
      concluido,
    };
  }

  return resultado;
}

export default function ExecucaoTreinoScreen() {
  const { treinoId } = useLocalSearchParams<{ treinoId: string }>();
  const { perfilAtivo } = usePerfilAtivo();
  const theme = useTheme();

  const [treino, setTreino] = useState<Treino | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [exercicioSelecionadoId, setExercicioSelecionadoId] = useState<string | null>(null);
  const [estadosPorExercicio, setEstadosPorExercicio] = useState<Record<string, EstadoExecucaoExercicio>>({});
  const [sessaoAtualId, setSessaoAtualId] = useState<string | null>(null);
  const [sessaoFinalizadaAutomaticamente, setSessaoFinalizadaAutomaticamente] = useState(false);
  const [reaberturaJaConcluida, setReaberturaJaConcluida] = useState(false);
  const [descansoAtivo, setDescansoAtivo] = useState<DescansoAtivo>(null);
  const [notificacaoAgendada, setNotificacaoAgendada] = useState<{
    identificador: string;
    fimEm: number;
  } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!perfilAtivo) return;
    let ativo = true;
    (async () => {
      setCarregando(true);
      const treinos = await listarTreinos(perfilAtivo.id);
      const encontrado = treinos.find((item) => item.id === treinoId) ?? null;
      if (!ativo) return;

      setTreino(encontrado);

      if (encontrado) {
        const sessao = await obterSessao(perfilAtivo.id, encontrado.id);
        if (ativo) {
          setEstadosPorExercicio(estadosPorExercicioDaSessao(sessao, encontrado.exercicios));
          setSessaoAtualId(sessao?.id ?? null);
        }
      }

      if (ativo) {
        setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [perfilAtivo, treinoId]);

  useEffect(() => {
    if (!descansoAtivo) return;
    const intervalId = setInterval(() => {
      setTick((atual) => atual + 1);
    }, 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, [descansoAtivo]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (novoEstado) => {
      if (novoEstado === 'active') {
        setTick((atual) => atual + 1);
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const segundosRestantes = descansoAtivo ? calcularSegundosRestantes(descansoAtivo.fimEm) : 0;

  useEffect(() => {
    if (descansoAtivo && segundosRestantes === 0) {
      handleDescansoConcluido();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descansoAtivo, tick]);

  function handleSelecionarExercicio(exercicioId: string) {
    setExercicioSelecionadoId(exercicioId);
    setReaberturaJaConcluida(estadosPorExercicio[exercicioId]?.concluido ?? false);
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

  async function handleConcluirSerie(exercicioId: string, serie: SerieRealizada) {
    if (!perfilAtivo || !treino) return;
    const exercicio = treino.exercicios.find((item) => item.id === exercicioId);
    if (!exercicio) return;

    const sessao = await registrarSerieConcluida({
      perfilId: perfilAtivo.id,
      treinoId: treino.id,
      exercicioId,
      serie,
      totalSeriesDoExercicio: exercicio.series,
    });
    const execucao = sessao.execucoes.find((item) => item.exercicioId === exercicioId);
    if (!execucao) return;

    setSessaoAtualId(sessao.id);

    setEstadosPorExercicio((atual) => {
      const estadoAtual = atual[exercicioId] ?? criarEstadoExecucaoInicial(exercicioId);
      const concluido = execucao.status === 'concluido';
      return {
        ...atual,
        [exercicioId]: {
          ...estadoAtual,
          seriesConcluidas: execucao.seriesRealizadas,
          concluido,
          serieAtual: concluido ? estadoAtual.serieAtual : estadoAtual.serieAtual + 1,
          cargaKg: concluido ? estadoAtual.cargaKg : String(serie.cargaKg),
          repsFeitas: '',
        },
      };
    });
  }

  async function handleEditarSerie(exercicioId: string, serieEditada: SerieRealizada) {
    if (!perfilAtivo || !treino) return;

    const sessao = await atualizarSerieRealizada({
      perfilId: perfilAtivo.id,
      treinoId: treino.id,
      exercicioId,
      serie: serieEditada.serie,
      novaCargaKg: serieEditada.cargaKg,
      novosReps: serieEditada.reps,
    });
    const execucao = sessao.execucoes.find((item) => item.exercicioId === exercicioId);
    if (!execucao) return;

    setEstadosPorExercicio((atual) => {
      const estadoAtual = atual[exercicioId] ?? criarEstadoExecucaoInicial(exercicioId);
      return {
        ...atual,
        [exercicioId]: {
          ...estadoAtual,
          seriesConcluidas: execucao.seriesRealizadas,
        },
      };
    });
  }

  async function handleConcluirExercicio(exercicioId: string) {
    if (!perfilAtivo || !sessaoAtualId) return;
    await marcarExercicioConcluido({ perfilId: perfilAtivo.id, sessaoId: sessaoAtualId, exercicioId });
    setExercicioSelecionadoId(null);
  }

  function handleAtualizarEstadoExercicio(novoEstado: EstadoExecucaoExercicio) {
    setEstadosPorExercicio((atual) => ({ ...atual, [novoEstado.exercicioId]: novoEstado }));
  }

  function handleDescansoConcluido() {
    setDescansoAtivo(null);
    Vibration.vibrate(PADRAO_VIBRACAO_FIM_DESCANSO);
    if (notificacaoAgendada) {
      cancelarNotificacaoDescanso(notificacaoAgendada.identificador);
      setNotificacaoAgendada(null);
    }
  }

  async function handleIniciarDescanso({
    exercicioId,
    descansoSeg,
  }: {
    exercicioId: string;
    descansoSeg: number;
  }) {
    if (notificacaoAgendada) {
      cancelarNotificacaoDescanso(notificacaoAgendada.identificador);
      setNotificacaoAgendada(null);
    }

    if (!descansoSeg || !Number.isFinite(descansoSeg) || descansoSeg <= 0) {
      setDescansoAtivo(null);
      return;
    }

    const fimEm = Date.now() + descansoSeg * 1000;
    setDescansoAtivo({ exercicioId, fimEm });

    const identificador = await agendarNotificacaoDescanso(fimEm);
    if (identificador) {
      setNotificacaoAgendada({ identificador, fimEm });
    }
  }

  async function handleAjustarDescanso(deltaSegundos: number) {
    if (!descansoAtivo) return;

    const novoFimEm = ajustarFimEm(descansoAtivo.fimEm, deltaSegundos);
    if (calcularSegundosRestantes(novoFimEm) <= 0) {
      handleDescansoConcluido();
      return;
    }

    if (notificacaoAgendada) {
      cancelarNotificacaoDescanso(notificacaoAgendada.identificador);
      setNotificacaoAgendada(null);
    }

    setDescansoAtivo({ ...descansoAtivo, fimEm: novoFimEm });

    const identificador = await agendarNotificacaoDescanso(novoFimEm);
    if (identificador) {
      setNotificacaoAgendada({ identificador, fimEm: novoFimEm });
    }
  }

  async function handleFinalizarTreino() {
    if (!perfilAtivo || !sessaoAtualId) return;

    handleDescansoConcluido();
    await finalizarSessao(perfilAtivo.id, sessaoAtualId);

    setSessaoAtualId(null);
    setEstadosPorExercicio({});
    setExercicioSelecionadoId(null);
    setSessaoFinalizadaAutomaticamente(false);
  }

  function handleNovaSessaoDeTreino() {
    setSessaoAtualId(null);
    setEstadosPorExercicio({});
    setExercicioSelecionadoId(null);
    setSessaoFinalizadaAutomaticamente(false);
  }

  const todosConcluidos =
    treino?.exercicios.every((item) => estadosPorExercicio[item.id]?.concluido) ?? false;

  useEffect(() => {
    if (todosConcluidos && sessaoAtualId !== null && !sessaoFinalizadaAutomaticamente && perfilAtivo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessaoFinalizadaAutomaticamente(true);
      finalizarSessao(perfilAtivo.id, sessaoAtualId);
    }
  }, [todosConcluidos, sessaoAtualId, sessaoFinalizadaAutomaticamente, perfilAtivo]);

  if (carregando) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.estadoCarregando]}>
          <ProgressRing />
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
            <Pressable onPress={handleVoltarParaLista} style={styles.linhaComIcone}>
              <VoltarIcon size={16} color={theme.accent} />
              <ThemedText type="link">Voltar para exercícios</ThemedText>
            </Pressable>
            <ExercicioExecucao
              exercicio={exercicioSelecionado}
              estado={
                estadosPorExercicio[exercicioSelecionado.id] ??
                criarEstadoExecucaoInicial(exercicioSelecionado.id)
              }
              onAtualizarEstado={handleAtualizarEstadoExercicio}
              onConcluirSerie={(serie) => handleConcluirSerie(exercicioSelecionado.id, serie)}
              onConcluirExercicio={() => handleConcluirExercicio(exercicioSelecionado.id)}
              onEditarSerie={(serie) => handleEditarSerie(exercicioSelecionado.id, serie)}
              onIniciarDescanso={handleIniciarDescanso}
              emDescanso={descansoAtivo?.exercicioId === exercicioSelecionado.id}
              jaEstavaConcluidoAoAbrir={reaberturaJaConcluida}
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
            {todosConcluidos && (
              <ThemedView type="successBackground" style={styles.parabens}>
                <ThemedText type="smallBold" themeColor="success" style={styles.textoCentralizado}>
                  🎉 Parabéns pelo treino de hoje!
                </ThemedText>
              </ThemedView>
            )}
            {sessaoAtualId && !todosConcluidos && (
              <Pressable onPress={handleFinalizarTreino}>
                <ThemedView type="warningBackground" style={[styles.botaoFinalizarTreino, styles.linhaComIconeCentralizada]}>
                  <FinalizarIcon size={18} color={theme.warning} />
                  <ThemedText type="smallBold" themeColor="warning" style={styles.textoCentralizado}>
                    Finalizar treino
                  </ThemedText>
                </ThemedView>
              </Pressable>
            )}
            {sessaoAtualId && todosConcluidos && (
              <Button onPress={handleNovaSessaoDeTreino}>Nova sessão de Treino</Button>
            )}
          </>
        )}
        {descansoAtivo && (
          <CronometroDescanso
            segundosRestantes={segundosRestantes}
            onMais15={() => handleAjustarDescanso(15)}
            onMenos15={() => handleAjustarDescanso(-15)}
          />
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
  estadoCarregando: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  parabens: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  botaoFinalizarTreino: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  textoCentralizado: {
    textAlign: 'center',
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
