import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { AcoesIcon } from '@/components/ui/icons';
import { useTheme } from '@/hooks/use-theme';

export function BotaoAcoes() {
  const theme = useTheme();

  return (
    <Pressable onPress={() => router.push('/acoes')} hitSlop={8} accessibilityLabel="Ações" accessibilityRole="button">
      <AcoesIcon size={22} color={theme.text} />
    </Pressable>
  );
}
