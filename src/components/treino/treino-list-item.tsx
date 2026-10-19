import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AcoesIcon } from '@/components/ui/icons';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Treino } from '@/types/treino';

type TreinoListItemProps = {
  treino: Treino;
  dataFinalizacao: string | null;
  exibirDataImportacao?: boolean;
  qtdSessoesFinalizadas?: number;
  progressoCiclo?: number | null;
  emAndamento?: boolean;
  onPress: () => void;
  /** Abre o menu "mais opções" (arquivar / finalizar sessão abandonada, spec 026) — omitido = sem botão. */
  onAbrirMenu?: () => void;
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
  emAndamento = false,
  onPress,
  onAbrirMenu,
}: TreinoListItemProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress}>
      <ThemedView
        type={emAndamento ? 'warningBackground' : 'backgroundElement'}
        style={[styles.container, emAndamento && { borderWidth: 2, borderColor: theme.warning }]}
      >
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
          {onAbrirMenu && (
            <Pressable onPress={onAbrirMenu} hitSlop={8} accessibilityLabel="Mais opções" accessibilityRole="button">
              <AcoesIcon size={18} color={theme.textSecondary} />
            </Pressable>
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
        {emAndamento && (
          <ThemedText type="smallBold" themeColor="warning">
            Em andamento
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
