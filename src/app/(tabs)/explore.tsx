import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { Spacing } from '@/constants/theme';
import { usePerfilAtivo } from '@/hooks/use-perfil-ativo';
import { obterHistoricoPorPerfil } from '@/services/historico-evolucao';
import type { EvolucaoExercicio, HistoricoPerfil } from '@/types/historico';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString();
}

function SecaoExercicio({ evolucao }: { evolucao: EvolucaoExercicio }) {
  return (
    <Collapsible title={evolucao.nomeExibido}>
      {evolucao.registros.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Nenhum registro para este exercício ainda.
        </ThemedText>
      ) : (
        <ThemedView style={styles.listaRegistros}>
          {evolucao.registros.map((registro, indice) => (
            <ThemedText key={`${registro.data}-${indice}`} type="small">
              {formatarData(registro.data)} · {registro.cargaKg}kg · {registro.reps} reps
            </ThemedText>
          ))}
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">Histórico de evolução</ThemedText>

        {historico === null && <ThemedText type="default">Carregando...</ThemedText>}

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
            renderItem={({ item }) => <SecaoExercicio evolucao={item} />}
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
});
