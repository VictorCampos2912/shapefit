import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Perfil } from '@/types/perfil';

type PerfilListItemProps = {
  perfil: Perfil;
  ativo?: boolean;
  onPress: () => void;
};

export function PerfilListItem({ perfil, ativo = false, onPress }: PerfilListItemProps) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView type={ativo ? 'backgroundSelected' : 'backgroundElement'} style={styles.container}>
        <ThemedText type="smallBold">{perfil.nome}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {perfil.objetivo}
        </ThemedText>
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
