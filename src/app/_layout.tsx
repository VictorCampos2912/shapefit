import {
  BigShouldersDisplay_700Bold,
  BigShouldersDisplay_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/big-shoulders-display';
import { DarkTheme, DefaultTheme, Redirect, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { ContaAutenticadaProvider, useContaAutenticada } from '@/hooks/use-conta-autenticada';
// Mantido só por formalidade (spec 022): todos os 7 consumidores originais
// de usePerfilAtivo() (levantamento exaustivo do plan.md) já foram migrados
// ou removidos (T017-T022) — nenhum código em src/ chama mais usePerfilAtivo().
// Falta só a T023 (Polish) remover este Provider, use-perfil-ativo.tsx e
// perfil-storage.ts de vez.
import { PerfilAtivoProvider } from '@/hooks/use-perfil-ativo';
import { configurarNotificacoesDescanso } from '@/services/notificacao-descanso';

SplashScreen.preventAutoHideAsync();

// Tela de erro do gate — mostrada quando checar se a conta tem dados físicos
// falha (ex.: rede caiu) e não resolve sozinha. Sem isso, o app ficaria numa
// tela em branco indefinidamente (carregando=false, temDadosFisicos=null,
// sem nenhum jeito de sair dali).
function ErroChecagemDadosFisicos({
  onTentarNovamente,
  onSairDaConta,
}: {
  onTentarNovamente: () => void;
  onSairDaConta: () => void;
}) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeAreaErro}>
        <ThemedText type="subtitle">Não foi possível conectar</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Não conseguimos verificar os dados da sua conta. Confira sua conexão e tente de novo.
        </ThemedText>
        <Button onPress={onTentarNovamente}>Tentar novamente</Button>
        <Button variant="outline" onPress={onSairDaConta}>
          Sair da conta
        </Button>
      </SafeAreaView>
    </ThemedView>
  );
}

function RootNavigator() {
  const {
    contaAutenticada,
    carregando,
    temDadosFisicos,
    erroAoChecarDadosFisicos,
    tentarNovamenteChecarDadosFisicos,
    sairDaConta,
  } = useContaAutenticada();

  // Enquanto não sabemos se há conta, ou já sabemos que há mas ainda estamos
  // checando se tem dados físicos, não renderiza nada (mesmo padrão do gate
  // antigo baseado em usePerfilAtivo).
  if (carregando || (contaAutenticada && temDadosFisicos === null && !erroAoChecarDadosFisicos)) {
    return null;
  }

  if (contaAutenticada && erroAoChecarDadosFisicos) {
    return (
      <ErroChecagemDadosFisicos
        onTentarNovamente={tentarNovamenteChecarDadosFisicos}
        onSairDaConta={sairDaConta}
      />
    );
  }

  // O <Stack> MUST sempre ser renderizado junto com qualquer <Redirect> (nunca
  // sozinho) — sem isso não existe Navigator montado no momento do redirect,
  // o que causa um loop de remontagem do RootNavigator inteiro (achado em
  // teste real no Android, 2026-10-05; o gate antigo já evitava isso
  // renderizando <Stack> dentro do mesmo Fragment que os <Redirect>s).
  return (
    <>
      {!contaAutenticada && <Redirect href="/login" />}
      {contaAutenticada && temDadosFisicos === false && <Redirect href="/conta/dados-fisicos" />}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    BigShouldersDisplay_700Bold,
    BigShouldersDisplay_800ExtraBold,
  });

  useEffect(() => {
    configurarNotificacoesDescanso();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ContaAutenticadaProvider>
        <PerfilAtivoProvider>
          <AnimatedSplashOverlay />
          <RootNavigator />
        </PerfilAtivoProvider>
      </ContaAutenticadaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeAreaErro: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
});
