import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Treino } from '@/types/treino';

type TreinoListItemProps = {
  treino: Treino;
  nomeDuplicado?: boolean;
  onPress: () => void;
};

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function TreinoListItem({ treino, nomeDuplicado = false, onPress }: TreinoListItemProps) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView type="backgroundElement" style={styles.container}>
        <ThemedText type="smallBold">{treino.nome}</ThemedText>
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
});
