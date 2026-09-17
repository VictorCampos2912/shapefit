import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ExercicioPlanejado } from '@/types/treino';

export type EstadoVisualExercicio = 'naoIniciado' | 'pausado' | 'concluido';

type ExercicioListItemProps = {
  exercicio: ExercicioPlanejado;
  estado: EstadoVisualExercicio;
  onPress: () => void;
};

export function ExercicioListItem({ exercicio, estado, onPress }: ExercicioListItemProps) {
  const theme = useTheme();

  const tipoFundo: ThemeColor =
    estado === 'concluido' ? 'successBackground' : estado === 'pausado' ? 'warningBackground' : 'backgroundElement';

  return (
    <Pressable onPress={onPress}>
      <ThemedView
        type={tipoFundo}
        style={[
          styles.container,
          estado === 'pausado' && { borderWidth: 2, borderColor: theme.warning },
          estado === 'concluido' && { borderWidth: 2, borderColor: theme.success },
        ]}
      >
        <ThemedText type="smallBold">{exercicio.nome}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {exercicio.series}x {exercicio.repsAlvo} · {exercicio.cargaSugeridaKg}kg · {exercicio.descansoSeg}s descanso
        </ThemedText>
        {estado === 'pausado' && (
          <ThemedText type="smallBold" themeColor="warning">
            ⏸ Em andamento (pausado)
          </ThemedText>
        )}
        {estado === 'concluido' && (
          <ThemedText type="smallBold" themeColor="success">
            Concluído ✓
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
