import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ImportarIcon, PerfilIcon, VoltarIcon } from '@/components/ui/icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePerfilAtivo } from '@/hooks/use-perfil-ativo';
import { importarTreino, importarTreinoExemplo } from '@/services/treino-storage';
import type { ResultadoImportacao, ResultadoImportacaoMultipla } from '@/types/treino';

function ehResultadoMultiplo(
  resultado: ResultadoImportacao | ResultadoImportacaoMultipla,
): resultado is ResultadoImportacaoMultipla {
  return 'treinos' in resultado;
}

function exibirResultadoImportacaoMultipla(resultado: ResultadoImportacaoMultipla) {
  if (resultado.erro) {
    Alert.alert('Não foi possível importar os treinos', resultado.erro);
    return;
  }

  const linhas: string[] = [
    resultado.treinos.length === 1
      ? '1 treino importado com sucesso.'
      : `${resultado.treinos.length} treinos importados com sucesso.`,
  ];

  if (resultado.treinosIgnorados.length > 0) {
    linhas.push('', 'Treinos ignorados:');
    resultado.treinosIgnorados.forEach((item) => {
      linhas.push(`• ${item.nome ?? 'sem nome'}: ${item.motivo}`);
    });
  }

  const treinosComExerciciosIgnorados = resultado.treinos.filter(
    (item) => item.exerciciosIgnorados.length > 0,
  );
  if (treinosComExerciciosIgnorados.length > 0) {
    linhas.push('', 'Exercícios ignorados:');
    treinosComExerciciosIgnorados.forEach((item) => {
      item.exerciciosIgnorados.forEach((exercicio) => {
        linhas.push(`• ${item.treino.nome}: ${exercicio.motivo}`);
      });
    });
  }

  Alert.alert('Treinos importados', linhas.join('\n'));
}

function exibirResultadoImportacao(resultado: ResultadoImportacao | ResultadoImportacaoMultipla | null) {
  if (resultado === null) {
    return;
  }

  if (ehResultadoMultiplo(resultado)) {
    exibirResultadoImportacaoMultipla(resultado);
    return;
  }

  if (resultado.erro) {
    Alert.alert('Não foi possível importar o treino', resultado.erro);
    return;
  }

  if (resultado.exerciciosIgnorados.length > 0) {
    const motivos = resultado.exerciciosIgnorados.map((item) => `• ${item.motivo}`).join('\n');
    Alert.alert(
      'Treino importado de forma incompleta',
      `O treino "${resultado.treino?.nome}" foi importado, mas os seguintes exercícios foram ignorados:\n\n${motivos}`,
    );
    return;
  }

  Alert.alert('Treino importado', `O treino "${resultado.treino?.nome}" foi importado com sucesso.`);
}

export default function AcoesScreen() {
  const { perfilAtivo } = usePerfilAtivo();
  const theme = useTheme();
  const [importando, setImportando] = useState(false);

  async function handleImportarTreino() {
    if (!perfilAtivo) return;
    setImportando(true);
    try {
      const resultado = await importarTreino(perfilAtivo.id);
      exibirResultadoImportacao(resultado);
    } finally {
      setImportando(false);
    }
  }

  async function handleImportarTreinoExemplo() {
    if (!perfilAtivo) return;
    setImportando(true);
    try {
      const resultado = await importarTreinoExemplo(perfilAtivo.id);
      exibirResultadoImportacao(resultado);
    } finally {
      setImportando(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} style={styles.linhaComIcone}>
          <VoltarIcon size={16} color={theme.accent} />
          <ThemedText type="link">Voltar</ThemedText>
        </Pressable>

        <ThemedText type="subtitle">Ações</ThemedText>

        <ThemedView style={styles.acoes}>
          <Pressable onPress={() => router.push('/perfil/selecionar')} style={styles.linhaComIcone}>
            <PerfilIcon size={16} color={theme.accent} />
            <ThemedText type="link">
              Perfil ativo: {perfilAtivo?.nome ?? '—'} (trocar)
            </ThemedText>
          </Pressable>

          <Pressable onPress={handleImportarTreino} disabled={importando} style={styles.linhaComIcone}>
            <ImportarIcon size={16} color={theme.accent} />
            <ThemedText type="link">Importar treino</ThemedText>
          </Pressable>

          <Pressable onPress={handleImportarTreinoExemplo} disabled={importando} style={styles.linhaComIcone}>
            <ImportarIcon size={16} color={theme.accent} />
            <ThemedText type="link">Importar treino de exemplo</ThemedText>
          </Pressable>
        </ThemedView>
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
  acoes: {
    gap: Spacing.three,
  },
});
