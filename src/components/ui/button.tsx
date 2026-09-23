import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'outline' | 'success';

type ButtonProps = {
  children: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({ children, onPress, variant = 'primary', disabled = false, icon, style }: ButtonProps) {
  const theme = useTheme();

  const preenchida: ButtonVariant[] = ['primary', 'success'];
  const corDeFundo: ThemeColor = variant === 'success' ? 'success' : 'accent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        preenchida.includes(variant)
          ? { backgroundColor: disabled ? theme.textSecondary : theme[corDeFundo] }
          : { borderWidth: 2, borderColor: disabled ? theme.textSecondary : theme.accent },
        disabled && styles.disabled,
        style,
      ]}>
      {icon}
      <ThemedText type="smallBold" themeColor={preenchida.includes(variant) ? 'background' : 'accent'}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  disabled: {
    opacity: 0.6,
  },
});
