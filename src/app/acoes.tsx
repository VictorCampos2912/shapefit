import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ArquivarIcon, EncerrarCicloIcon, ImportarIcon, InfoIcon, PerfilIcon, VoltarIcon } from '@/components/ui/icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useContaAutenticada } from '@/hooks/use-conta-autenticada';
import { encerrarCiclo, obterCicloAtual } from '@/services/ciclo-treino-storage';
import { importarTreino } from '@/services/treino-storage';
import type { CicloTreino } from '@/types/ciclo-treino';
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

function handleAbrirCreditos() {
  Alert.alert(
    'Créditos',
    'Dados e imagens de exercícios: wger project (wger.de), licenciados sob ' +
      'Creative Commons Attribution-ShareAlike (CC-BY-SA).',
  );
}

export default function AcoesScreen() {
  const { uid, contaAutenticada, sairDaConta } = useContaAutenticada();
  const theme = useTheme();
  const [importando, setImportando] = useState(false);
  const [cicloAtual, setCicloAtual] = useState<CicloTreino | null>(null);

  useEffect(() => {
    if (!uid) return;
    let ativo = true;
    obterCicloAtual(uid)
      .then((ciclo) => {
        if (ativo) {
          setCicloAtual(ciclo);
        }
      })
      .catch((erro) => {
        // Falha ao checar o ciclo nunca trava esta tela nem impede o
        // resto das ações — trata como "sem ciclo ativo" (link "Encerrar
        // ciclo" simplesmente não aparece), mesmo espírito do resto do app.
        console.error('[acoes] Falha ao carregar ciclo atual:', erro);
        if (ativo) {
          setCicloAtual(null);
        }
      });
    return () => {
      ativo = false;
    };
  }, [uid]);

  function handleEncerrarCiclo() {
    if (!uid || !cicloAtual) return;
    const cicloId = cicloAtual.id; // captura antes do onPress, já que setCicloAtual(null) roda primeiro
    Alert.alert(
      'Encerrar ciclo',
      'O ciclo de progresso atual será encerrado — os anéis de progresso somem e a importação de um novo lote de treinos volta a funcionar. Nenhuma sessão é apagada. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: () => {
            // Atualização otimista — esconde a ação e já reflete "sem
            // ciclo ativo" no mesmo toque de confirmação, sem esperar
            // nada (encerrarCiclo não lê nada antes de escrever).
            setCicloAtual(null);
            encerrarCiclo(uid, cicloId);
          },
        },
      ],
    );
  }

  // Sem navegação manual aqui de propósito: signOut() dispara
  // onAuthStateChanged, que atualiza contaAutenticada=null no contexto — o
  // gate em _layout.tsx já redireciona pra /login sozinho quando isso
  // acontece (mesmo padrão que já resolve o caso de login/logout).
  async function handleSairDaConta() {
    await sairDaConta();
  }

  async function handleImportarTreino() {
    if (!uid) return;
    setImportando(true);
    try {
      const resultado = await importarTreino(uid);
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
          <Pressable onPress={handleSairDaConta} style={styles.linhaComIcone}>
            <PerfilIcon size={16} color={theme.accent} />
            <ThemedText type="link">Sair da conta ({contaAutenticada?.email ?? '—'})</ThemedText>
          </Pressable>

          <Pressable onPress={handleImportarTreino} disabled={importando} style={styles.linhaComIcone}>
            <ImportarIcon size={16} color={theme.accent} />
            <ThemedText type="link">Importar treino</ThemedText>
          </Pressable>

          <Pressable onPress={() => router.push('/treinos-arquivados')} style={styles.linhaComIcone}>
            <ArquivarIcon size={16} color={theme.accent} />
            <ThemedText type="link">Treinos arquivados</ThemedText>
          </Pressable>

          {cicloAtual && (
            <Pressable onPress={handleEncerrarCiclo} style={styles.linhaComIcone}>
              <EncerrarCicloIcon size={16} color={theme.accent} />
              <ThemedText type="link">Encerrar ciclo</ThemedText>
            </Pressable>
          )}

          <Pressable onPress={handleAbrirCreditos} style={styles.linhaComIcone}>
            <InfoIcon size={16} color={theme.accent} />
            <ThemedText type="link">Créditos do catálogo de exercícios</ThemedText>
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
