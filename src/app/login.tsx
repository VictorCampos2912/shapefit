import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useContaAutenticada } from '@/hooks/use-conta-autenticada';

export default function LoginScreen() {
  const { entrarComGoogle } = useContaAutenticada();
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleEntrarComGoogle() {
    setErro(null);
    setEntrando(true);
    try {
      const resultado = await entrarComGoogle();
      if (!resultado.ok) {
        setErro(resultado.motivo);
      }
    } finally {
      setEntrando(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">ShapeFit</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Entre com sua Conta Google para continuar.
        </ThemedText>

        <Button onPress={handleEntrarComGoogle} disabled={entrando}>
          {entrando ? 'Entrando…' : 'Entrar com o Google'}
        </Button>

        {erro && (
          <ThemedText type="small" themeColor="textSecondary">
            {erro}
          </ThemedText>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
});
