import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProgressRing } from '@/components/ui/progress-ring';
import { TreinoListItem } from '@/components/treino/treino-list-item';
import { Spacing } from '@/constants/theme';
import { usePerfilAtivo } from '@/hooks/use-perfil-ativo';
import { contarSessoesFinalizadas } from '@/services/sessao-treino-storage';
import { importarTreino, importarTreinoExemplo, listarTreinos } from '@/services/treino-storage';
import type { ResultadoImportacao, Treino } from '@/types/treino';

function calcularNomesDuplicados(treinos: Treino[]): Set<string> {
  const contagem = new Map<string, number>();
  for (const treino of treinos) {
    contagem.set(treino.nome, (contagem.get(treino.nome) ?? 0) + 1);
  }
  const duplicados = new Set<string>();
  for (const [nome, quantidade] of contagem) {
    if (quantidade > 1) {
      duplicados.add(nome);
    }
  }
  return duplicados;
}

function exibirResultadoImportacao(resultado: ResultadoImportacao | null) {
  if (resultado === null) {
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

export default function TreinosScreen() {
  const { perfilAtivo } = usePerfilAtivo();
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [contagensPorTreino, setContagensPorTreino] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [importando, setImportando] = useState(false);

  async function carregarContagens(perfilId: string, lista: Treino[]) {
    const entradas = await Promise.all(
      lista.map(async (treino) => [treino.id, await contarSessoesFinalizadas(perfilId, treino.id)] as const),
    );
    setContagensPorTreino(Object.fromEntries(entradas));
  }

  async function recarregarTreinos() {
    if (!perfilAtivo) return;
    const lista = await listarTreinos(perfilAtivo.id);
    setTreinos(lista);
    await carregarContagens(perfilAtivo.id, lista);
  }

  useEffect(() => {
    if (!perfilAtivo) return;
    let ativo = true;
    (async () => {
      setCarregando(true);
      const lista = await listarTreinos(perfilAtivo.id);
      if (ativo) {
        setTreinos(lista);
        setCarregando(false);
      }
      await carregarContagens(perfilAtivo.id, lista);
    })();
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload deve depender só do id do perfil ativo (research.md, Decisão 2), não do objeto perfilAtivo inteiro
  }, [perfilAtivo?.id]);

  useFocusEffect(
    useCallback(() => {
      recarregarTreinos();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- recarrega ao ganhar foco (ex.: voltar de uma sessão finalizada), sem precisar de mais dependências
    }, [perfilAtivo?.id]),
  );

  async function handleImportarTreino() {
    if (!perfilAtivo) return;
    setImportando(true);
    try {
      const resultado = await importarTreino(perfilAtivo.id);
      exibirResultadoImportacao(resultado);
      if (resultado?.treino) {
        await recarregarTreinos();
      }
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
      if (resultado.treino) {
        await recarregarTreinos();
      }
    } finally {
      setImportando(false);
    }
  }

  function handleSelecionarTreino(treino: Treino) {
    router.push({ pathname: '/treino/[treinoId]', params: { treinoId: treino.id } });
  }

  const nomesDuplicados = calcularNomesDuplicados(treinos);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">Meus treinos</ThemedText>

        <Pressable onPress={() => router.push('/perfil/selecionar')}>
          <ThemedText type="link">
            Perfil ativo: {perfilAtivo?.nome ?? '—'} (trocar)
          </ThemedText>
        </Pressable>

        <ThemedView style={styles.acoes}>
          <Pressable onPress={handleImportarTreino} disabled={importando}>
            <ThemedText type="link">Importar treino</ThemedText>
          </Pressable>

          <Pressable onPress={handleImportarTreinoExemplo} disabled={importando}>
            <ThemedText type="link">Importar treino de exemplo</ThemedText>
          </Pressable>
        </ThemedView>

        {carregando && (
          <ThemedView style={styles.estadoCarregando}>
            <ProgressRing />
          </ThemedView>
        )}

        {!carregando && treinos.length === 0 && (
          <ThemedView type="backgroundElement" style={styles.estadoVazio}>
            <ThemedText type="smallBold">Nenhum treino importado ainda</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Use a ação &ldquo;Importar treino&rdquo; acima para trazer um treino para este perfil.
            </ThemedText>
          </ThemedView>
        )}

        <FlatList
          data={treinos}
          keyExtractor={(treino) => treino.id}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <TreinoListItem
              treino={item}
              nomeDuplicado={nomesDuplicados.has(item.nome)}
              qtdSessoesFinalizadas={contagensPorTreino[item.id] ?? 0}
              onPress={() => handleSelecionarTreino(item)}
            />
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
  acoes: {
    gap: Spacing.two,
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
});
