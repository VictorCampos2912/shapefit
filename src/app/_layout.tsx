import { DarkTheme, DefaultTheme, Redirect, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { PerfilAtivoProvider, usePerfilAtivo } from '@/hooks/use-perfil-ativo';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { perfis, sessaoConfirmada, carregando } = usePerfilAtivo();

  if (carregando) {
    return null;
  }

  return (
    <>
      {!sessaoConfirmada && perfis.length === 0 && <Redirect href="/perfil/criar" />}
      {!sessaoConfirmada && perfis.length > 0 && <Redirect href="/perfil/selecionar" />}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PerfilAtivoProvider>
        <AnimatedSplashOverlay />
        <RootNavigator />
      </PerfilAtivoProvider>
    </ThemeProvider>
  );
}
