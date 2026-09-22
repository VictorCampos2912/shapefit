import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PerfilIcon } from '@/components/ui/icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Perfil } from '@/types/perfil';

type PerfilListItemProps = {
  perfil: Perfil;
  ativo?: boolean;
  onPress: () => void;
};

export function PerfilListItem({ perfil, ativo = false, onPress }: PerfilListItemProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress}>
      <ThemedView type={ativo ? 'backgroundSelected' : 'backgroundElement'} style={styles.container}>
        <View style={styles.linhaNome}>
          <PerfilIcon size={16} color={theme.text} />
          <ThemedText type="smallBold">{perfil.nome}</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {perfil.objetivo}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linhaNome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  container: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.half,
  },
});
