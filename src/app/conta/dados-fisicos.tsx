import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PerfilForm } from '@/components/perfil/perfil-form';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useContaAutenticada } from '@/hooks/use-conta-autenticada';
import { salvarDadosFisicos } from '@/services/conta-storage';

export default function DadosFisicosScreen() {
  const { uid } = useContaAutenticada();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(dados: Parameters<typeof salvarDadosFisicos>[1]) {
    if (!uid) return;
    setSubmitting(true);
    try {
      await salvarDadosFisicos(uid, dados);
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
