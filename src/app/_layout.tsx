import {
  BigShouldersDisplay_700Bold,
  BigShouldersDisplay_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/big-shoulders-display';
import { DarkTheme, DefaultTheme, Redirect, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ContaAutenticadaProvider, useContaAutenticada } from '@/hooks/use-conta-autenticada';
// Mantido temporariamente (spec 022, Fase US1+US2): 5 telas ainda não migradas
// (acoes.tsx, (tabs)/index.tsx, (tabs)/explore.tsx, treino/[treinoId].tsx,
// perfil/selecionar.tsx — tasks.md T017-T022) ainda chamam usePerfilAtivo() e
// quebrariam com "deve ser usado dentro de um PerfilAtivoProvider" sem este
// Provider continuar envolvendo a árvore. Remover só quando as 5 estiverem
// migradas e PerfilAtivoProvider for removido (tasks.md T023).
import { PerfilAtivoProvider } from '@/hooks/use-perfil-ativo';
import { configurarNotificacoesDescanso } from '@/services/notificacao-descanso';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { contaAutenticada, carregando, temDadosFisicos } = useContaAutenticada();

  // Enquanto não sabemos se há conta, ou já sabemos que há mas ainda estamos
  // checando se tem dados físicos, não renderiza nada (mesmo padrão do gate
  // antigo baseado em usePerfilAtivo).
  if (carregando || (contaAutenticada && temDadosFisicos === null)) {
    return null;
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
