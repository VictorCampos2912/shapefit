import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { EditarIcon } from '@/components/ui/icons';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePerfilAtivo } from '@/hooks/use-perfil-ativo';
import { atualizarSerieDeSessaoFinalizada } from '@/services/sessao-treino-storage';
import { obterHistoricoPorPerfil } from '@/services/historico-evolucao';
import type { EvolucaoExercicio, HistoricoPerfil, RegistroHistorico } from '@/types/historico';
import { sanitizarCarga, sanitizarReps } from '@/utils/sanitizar-serie';

type EdicaoRegistroEmAndamento = {
  sessaoId: string;
  exercicioId: string;
  serie: number;
  cargaKg: string;
  reps: string;
};

type ParamsEditarRegistro = {
  sessaoId: string;
  exercicioId: string;
  serie: number;
  cargaKg: number;
  reps: number;
};

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString();
}

function chaveRegistro(registro: Pick<RegistroHistorico, 'sessaoId' | 'exercicioId' | 'serie'>): string {
  return `${registro.sessaoId}:${registro.exercicioId}:${registro.serie}`;
}

function SecaoExercicio({
  evolucao,
  onEditarRegistro,
}: {
  evolucao: EvolucaoExercicio;
  onEditarRegistro: (params: ParamsEditarRegistro) => Promise<void>;
}) {
  const theme = useTheme();
  const [edicaoAtiva, setEdicaoAtiva] = useState<EdicaoRegistroEmAndamento | null>(null);

  function handleIniciarEdicao(registro: RegistroHistorico) {
    setEdicaoAtiva({
      sessaoId: registro.sessaoId,
      exercicioId: registro.exercicioId,
      serie: registro.serie,
      cargaKg: String(registro.cargaKg),
      reps: String(registro.reps),
    });
  }

  function handleCancelarEdicao() {
    setEdicaoAtiva(null);
  }

  function handleAlterarCarga(valor: string) {
    setEdicaoAtiva((atual) => (atual ? { ...atual, cargaKg: sanitizarCarga(valor) } : atual));
  }

  function handleAlterarReps(valor: string) {
    setEdicaoAtiva((atual) => (atual ? { ...atual, reps: sanitizarReps(valor) } : atual));
  }

  function handleSalvarEdicao() {
    if (!edicaoAtiva) return;
    const { sessaoId, exercicioId, serie, cargaKg, reps } = edicaoAtiva;

    Alert.alert('Confirmar alteração', `Confirma a alteração da série ${serie}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salvar',
        onPress: async () => {
          try {
            await onEditarRegistro({
              sessaoId,
              exercicioId,
              serie,
              cargaKg: Number(cargaKg),
              reps: Number(reps),
            });
            setEdicaoAtiva(null);
          } catch {
            // edicaoAtiva permanece preenchido (não é zerado) para o usuário não perder
            // os valores digitados e poder tentar salvar de novo ou cancelar manualmente.
            Alert.alert(
              'Não foi possível salvar',
              'Ocorreu um erro ao salvar a alteração. Tente novamente.',
            );
          }
        },
      },
    ]);
  }

  const podeSalvarEdicao =
    !!edicaoAtiva &&
    edicaoAtiva.cargaKg.trim().length > 0 &&
    edicaoAtiva.reps.trim().length > 0 &&
    Number.isFinite(Number(edicaoAtiva.cargaKg)) &&
    Number.isFinite(Number(edicaoAtiva.reps));

  return (
    <Collapsible title={evolucao.nomeExibido}>
      {evolucao.registros.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Nenhum registro para este exercício ainda.
        </ThemedText>
      ) : (
        <ThemedView style={styles.listaRegistros}>
          {evolucao.registros.map((registro) => {
            const emEdicao = edicaoAtiva && chaveRegistro(edicaoAtiva) === chaveRegistro(registro);
            return (
              <ThemedView key={chaveRegistro(registro)} style={styles.itemRegistro}>
                {emEdicao ? (
                  <ThemedView style={styles.edicaoRegistro}>
                    <ThemedView style={styles.campo}>
                      <ThemedText type="smallBold" themeColor="text">
                        Carga (kg)
                      </ThemedText>
                      <TextInput
                        value={edicaoAtiva?.cargaKg}
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
                        Repetições
                      </ThemedText>
                      <TextInput
                        value={edicaoAtiva?.reps}
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
                    <ThemedView style={styles.botoesEdicao}>
                      <Pressable onPress={handleCancelarEdicao} style={styles.botaoCancelarEdicao}>
                        <ThemedText type="smallBold" themeColor="text">
                          Cancelar
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={handleSalvarEdicao}
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
                  <Pressable onPress={() => handleIniciarEdicao(registro)} style={styles.linhaRegistro}>
                    <ThemedText type="small">
                      {formatarData(registro.data)} · {registro.cargaKg}kg · {registro.reps} reps
                    </ThemedText>
                    <ThemedView style={styles.linhaComIconeEditar}>
                      <EditarIcon size={14} color={theme.text} />
                      <ThemedText type="link">Editar</ThemedText>
                    </ThemedView>
                  </Pressable>
                )}
              </ThemedView>
            );
          })}
        </ThemedView>
      )}
    </Collapsible>
  );
}

export default function HistoricoScreen() {
  const { perfilAtivo } = usePerfilAtivo();
  const [historico, setHistorico] = useState<HistoricoPerfil | null>(null);

  async function recarregarHistorico() {
    if (!perfilAtivo) return;
    setHistorico(await obterHistoricoPorPerfil(perfilAtivo.id));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mesmo padrão de supressão já usado no RF07 ([treinoId].tsx) para este mesmo lint; recarregarHistorico() só dispara setState de forma assíncrona (após o await), não sincronamente dentro do corpo do efeito
    recarregarHistorico();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recarrega só por id do perfil ativo, mesmo padrão do RF02 (index.tsx)
  }, [perfilAtivo?.id]);

  useFocusEffect(
    useCallback(() => {
      recarregarHistorico();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- mesmo padrão do RF02/RF07 (index.tsx): recarrega ao ganhar foco (ex.: voltar de finalizar um treino, trocar de perfil)
    }, [perfilAtivo?.id]),
  );

  async function handleEditarRegistro(params: ParamsEditarRegistro) {
    if (!perfilAtivo) return;

    const sessao = await atualizarSerieDeSessaoFinalizada({
      perfilId: perfilAtivo.id,
      sessaoId: params.sessaoId,
      exercicioId: params.exercicioId,
      serie: params.serie,
      novaCargaKg: params.cargaKg,
      novosReps: params.reps,
    });
    const execucao = sessao.execucoes.find((item) => item.exercicioId === params.exercicioId);
    const serieAtualizada = execucao?.seriesRealizadas.find((item) => item.serie === params.serie);
    if (!serieAtualizada) return;

    // Patch pontual do registro editado — nenhuma mudança de agrupamento/ordenação/
    // nomeExibido é necessária, já que a edição nunca altera data ou nome do exercício
    // (research.md, Decisão 6).
    setHistorico((atual) => {
      if (!atual || !atual.temSessoesFinalizadas) return atual;
      return {
        ...atual,
        evolucoes: atual.evolucoes.map((evolucao) => ({
          ...evolucao,
          registros: evolucao.registros.map((registro) =>
            registro.sessaoId === params.sessaoId &&
            registro.exercicioId === params.exercicioId &&
            registro.serie === params.serie
              ? { ...registro, cargaKg: serieAtualizada.cargaKg, reps: serieAtualizada.reps }
              : registro,
          ),
        })),
      };
    });
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">Histórico de evolução</ThemedText>

        {historico === null && (
          <ThemedView style={styles.estadoCarregando}>
            <ProgressRing />
          </ThemedView>
        )}

        {historico !== null && !historico.temSessoesFinalizadas && (
          <ThemedView type="backgroundElement" style={styles.estadoVazio}>
            <ThemedText type="smallBold">Nenhum registro de treino finalizado ainda</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Assim que você finalizar uma sessão de treino, a evolução de cada exercício aparece
              aqui.
            </ThemedText>
          </ThemedView>
        )}

        {historico !== null && historico.temSessoesFinalizadas && (
          <FlatList
            data={historico.evolucoes}
            keyExtractor={(evolucao) => evolucao.nomeExibido}
            contentContainerStyle={styles.lista}
            renderItem={({ item }) => (
              <SecaoExercicio evolucao={item} onEditarRegistro={handleEditarRegistro} />
            )}
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
  lista: {
    gap: Spacing.two,
  },
  listaRegistros: {
    gap: Spacing.one,
  },
  itemRegistro: {
    gap: Spacing.one,
  },
  linhaRegistro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linhaComIconeEditar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  edicaoRegistro: {
    gap: Spacing.two,
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
