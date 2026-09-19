import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Treino } from '@/types/treino';

type TreinoListItemProps = {
  treino: Treino;
  nomeDuplicado?: boolean;
  qtdSessoesFinalizadas?: number;
  onPress: () => void;
};

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function TreinoListItem({
  treino,
  nomeDuplicado = false,
  qtdSessoesFinalizadas = 0,
  onPress,
}: TreinoListItemProps) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView type="backgroundElement" style={styles.container}>
        <View style={styles.linhaTitulo}>
          <ThemedText type="smallBold" style={styles.titulo}>
            {treino.nome}
          </ThemedText>
          {qtdSessoesFinalizadas > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              {qtdSessoesFinalizadas}
            </ThemedText>
          )}
        </View>
        {nomeDuplicado && (
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
});
