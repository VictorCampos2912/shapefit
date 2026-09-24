import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Spacing } from '@/constants/theme';
import type { Treino } from '@/types/treino';

type TreinoListItemProps = {
  treino: Treino;
  dataFinalizacao: string | null;
  exibirDataImportacao?: boolean;
  qtdSessoesFinalizadas?: number;
  progressoCiclo?: number | null;
  onPress: () => void;
};

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function TreinoListItem({
  treino,
  dataFinalizacao,
  exibirDataImportacao = false,
  qtdSessoesFinalizadas = 0,
  progressoCiclo = null,
  onPress,
}: TreinoListItemProps) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView type="backgroundElement" style={styles.container}>
        <View style={styles.linhaTitulo}>
          <ThemedText type="smallBold" style={styles.titulo}>
            {treino.nome}
          </ThemedText>
          {progressoCiclo != null ? (
            <ProgressRing progress={progressoCiclo} size={28} strokeWidth={3}>
              {qtdSessoesFinalizadas > 0 && (
                <ThemedText type="small" themeColor="textSecondary" style={styles.contadorNoAnel}>
                  {qtdSessoesFinalizadas}
                </ThemedText>
              )}
            </ProgressRing>
          ) : (
            qtdSessoesFinalizadas > 0 && (
              <ThemedText type="small" themeColor="textSecondary">
                {qtdSessoesFinalizadas}
              </ThemedText>
            )
          )}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {dataFinalizacao ? `Finalizado em ${formatarDataHora(dataFinalizacao)}` : 'Nunca treinado'}
        </ThemedText>
        {exibirDataImportacao && (
          <ThemedText type="small" themeColor="textSecondary">
            Importado em {formatarDataHora(treino.importadoEm)}
          </ThemedText>
        )}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.half,
  },
  linhaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  titulo: {
    flex: 1,
  },
  contadorNoAnel: {
    fontSize: 10,
    lineHeight: 12,
  },
});
