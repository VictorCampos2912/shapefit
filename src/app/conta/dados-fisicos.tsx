import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PerfilForm } from '@/components/perfil/perfil-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useContaAutenticada } from '@/hooks/use-conta-autenticada';
import { salvarDadosFisicos } from '@/services/conta-storage';

export default function DadosFisicosScreen() {
  const { uid, contaAutenticada, confirmarDadosFisicosSalvos, sairDaConta } = useContaAutenticada();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(dados: Parameters<typeof salvarDadosFisicos>[1]) {
    if (!uid) return;
    setSubmitting(true);
    try {
      await salvarDadosFisicos(uid, dados);
      // Atualização otimista do gate (research.md Decisão 8) — salvarDadosFisicos
      // não espera a confirmação do servidor, então nada mais avisaria o
      // RootNavigator de que os dados já foram salvos.
      confirmarDadosFisicosSalvos();
      router.replace('/');
    } finally {
      setSubmitting(false);
    }
  }

  // Sem navegação manual aqui de propósito (mesmo padrão de acoes.tsx):
  // signOut() dispara onAuthStateChanged, e o gate em _layout.tsx já
  // redireciona pra /login sozinho. Sem este escape, logar com a conta
  // errada do Google neste ponto deixava a pessoa presa nesta tela — fechar
  // o app não ajuda (a sessão do Firebase persiste).
  async function handleSairDaConta() {
    await sairDaConta();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Pressable onPress={handleSairDaConta} style={styles.sairDaConta}>
              <ThemedText type="link">
                Entrou com a conta errada? Sair da conta ({contaAutenticada?.email ?? '—'})
              </ThemedText>
            </Pressable>
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
  sairDaConta: {
    marginBottom: Spacing.three,
  },
});
