import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatarTempo } from '@/utils/cronometro-descanso';

type CronometroDescansoProps = {
  segundosRestantes: number;
  onMais15: () => void;
  onMenos15: () => void;
};

export function CronometroDescanso({ segundosRestantes, onMais15, onMenos15 }: CronometroDescansoProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundSelected" style={[styles.container, { borderColor: theme.text }]}>
      <ThemedText type="small" themeColor="textSecondary">
        Descanso
      </ThemedText>
      <ThemedText type="title">{formatarTempo(segundosRestantes)}</ThemedText>
      <ThemedView style={styles.botoes}>
        <Pressable onPress={onMenos15} style={[styles.botao, { borderColor: theme.text }]}>
          <ThemedText type="smallBold" themeColor="text">
            -15s
          </ThemedText>
        </Pressable>
        <Pressable onPress={onMais15} style={[styles.botao, { borderColor: theme.text }]}>
          <ThemedText type="smallBold" themeColor="text">
            +15s
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.two,
    borderWidth: 2,
    padding: Spacing.three,
    gap: Spacing.two,
    alignItems: 'center',
  },
  botoes: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  botao: {
    borderWidth: 2,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
});
