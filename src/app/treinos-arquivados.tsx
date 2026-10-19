import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { VoltarIcon } from '@/components/ui/icons';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useContaAutenticada } from '@/hooks/use-conta-autenticada';
import { filtrarTreinosArquivados, listarTreinos, restaurarTreino } from '@/services/treino-storage';
import type { Treino } from '@/types/treino';

// Mesmo formatador já usado em treino-list-item.tsx e [treinoId].tsx (duplicado
// localmente nos dois, nunca extraído para um utilitário compartilhado) —
// reaproveita a mesma lógica aqui, não inventa um formato novo.
function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function TreinosArquivadosScreen() {
  const { uid } = useContaAutenticada();
  const theme = useTheme();
  const [arquivados, setArquivados] = useState<Treino[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!uid) return;
    let ativo = true;
    (async () => {
      setCarregando(true);
      try {
        const lista = filtrarTreinosArquivados(await listarTreinos(uid));
        // Ordenação determinística (FR-014): arquivadoEm mais recente
        // primeiro, com id como desempate (mesmo critério de desempate já
        // usado por listarTreinos/listarSessoes/listarCiclos).
        lista.sort((a, b) => {
          if (a.arquivadoEm !== b.arquivadoEm) {
            return a.arquivadoEm! < b.arquivadoEm! ? 1 : -1;
          }
          return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
        });
        if (ativo) {
          setArquivados(lista);
        }
      } catch (erro) {
        // Nunca deixa a tela presa nem uma rejeição não tratada — a leitura
        // pode falhar ou demorar offline, mesmo espírito do resto do app.
        console.error('[treinos-arquivados] Falha ao carregar treinos arquivados:', erro);
        if (ativo) {
          setArquivados([]);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    })();
    return () => {
      ativo = false;
    };
  }, [uid]);

  function handleRestaurarTreino(treino: Treino) {
    if (!uid) return;
    // Atualização otimista — remove da lista local antes de chamar
    // restaurarTreino, que não lê nada antes de escrever (research.md,
    // Decisão 4). Sem confirmação: restaurar não tem efeito colateral.
    setArquivados((atual) => atual.filter((item) => item.id !== treino.id));
    restaurarTreino(uid, treino.id);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} style={styles.linhaComIcone}>
          <VoltarIcon size={16} color={theme.accent} />
          <ThemedText type="link">Voltar</ThemedText>
        </Pressable>

        <ThemedText type="subtitle">Treinos arquivados</ThemedText>

        {carregando && (
          <ThemedView style={styles.estadoCarregando}>
            <ProgressRing />
          </ThemedView>
        )}

        {!carregando && arquivados.length === 0 && (
          <ThemedView type="backgroundElement" style={styles.estadoVazio}>
            <ThemedText type="smallBold">Nenhum treino arquivado</ThemedText>
          </ThemedView>
        )}

        <FlatList
          data={arquivados}
          keyExtractor={(treino) => treino.id}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.item}>
              <ThemedText type="smallBold">{item.nome}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Arquivado em {formatarDataHora(item.arquivadoEm!)}
              </ThemedText>
              <Button variant="outline" onPress={() => handleRestaurarTreino(item)} style={styles.botaoRestaurar}>
                Restaurar
              </Button>
            </ThemedView>
          )}
        />
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
  linhaComIcone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  estadoCarregando: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  estadoVazio: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    gap: Spacing.one,
  },
  lista: {
    gap: Spacing.two,
  },
  item: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.half,
  },
  botaoRestaurar: {
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
  },
});
