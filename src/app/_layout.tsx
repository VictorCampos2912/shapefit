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
// Mantido só por formalidade (spec 022): todos os 7 consumidores originais
// de usePerfilAtivo() (levantamento exaustivo do plan.md) já foram migrados
// ou removidos (T017-T022) — nenhum código em src/ chama mais usePerfilAtivo().
// Falta só a T023 (Polish) remover este Provider, use-perfil-ativo.tsx e
// perfil-storage.ts de vez.
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
