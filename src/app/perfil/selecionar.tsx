import { router } from 'expo-router';
import { Alert, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PerfilListItem } from '@/components/perfil/perfil-list-item';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { usePerfilAtivo } from '@/hooks/use-perfil-ativo';

export default function SelecionarPerfilScreen() {
  const { perfis, perfilAtivo, selecionarPerfil } = usePerfilAtivo();

  async function handleSelecionar(perfilId: string) {
    if (perfilId === perfilAtivo?.id) {
      router.replace('/');
      return;
    }

    const resultado = await selecionarPerfil(perfilId);
    if (resultado.ok) {
      router.replace('/');
      return;
    }

    Alert.alert(
      'Não é possível trocar de perfil',
      'Finalize a sessão de treino em andamento antes de trocar de perfil.',
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">Selecionar perfil</ThemedText>

        <FlatList
          data={perfis}
          keyExtractor={(perfil) => perfil.id}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <PerfilListItem
              perfil={item}
              ativo={item.id === perfilAtivo?.id}
              onPress={() => handleSelecionar(item.id)}
            />
          )}
        />

        <Button variant="outline" onPress={() => router.push('/perfil/criar')}>
          Criar novo perfil
        </Button>
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
    gap: Spacing.three,
  },
  lista: {
    gap: Spacing.two,
  },
});
