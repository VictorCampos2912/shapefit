import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PerfilForm } from '@/components/perfil/perfil-form';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePerfilAtivo } from '@/hooks/use-perfil-ativo';

export default function CriarPerfilScreen() {
  const { criarPerfil } = usePerfilAtivo();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(dados: Parameters<typeof criarPerfil>[0]) {
    setSubmitting(true);
    try {
      await criarPerfil(dados);
      router.replace('/');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <PerfilForm onSubmit={handleSubmit} submitting={submitting} />
          </ScrollView>
        </KeyboardAvoidingView>
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
    padding: Spacing.four,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
