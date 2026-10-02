// Convertido de app.json para app.config.js (spec 022-autenticacao-google-firestore-treinos)
// Motivo: google-services.json/GoogleService-Info.plist estão no .gitignore
// (não versionados — decisão do projeto). O EAS Build só sobe arquivos
// rastreados pelo git, então o builder remoto não os enxerga pelo caminho
// fixo. A solução oficial do EAS é expor esses arquivos como variáveis de
// ambiente do tipo "file" (GOOGLE_SERVICES_JSON / GOOGLE_SERVICE_INFO_PLIST,
// já criadas no ambiente "development" via `eas env:set`) — no build remoto,
// essas variáveis resolvem para o caminho onde o EAS baixou o arquivo; em
// build/desenvolvimento local, caem no caminho relativo normal.
module.exports = {
  expo: {
    name: 'shapefit',
    slug: 'shapefit',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'shapefit',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: 'com.shapefit.app',
      icon: './assets/expo.icon',
      googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.shapefit.app',
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
      permissions: ['SCHEDULE_EXACT_ALARM'],
      adaptiveIcon: {
        backgroundColor: '#FF6529',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#FF6529',
          image: './assets/images/splash-icon.png',
          imageWidth: 160,
        },
      ],
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      '@react-native-google-signin/google-signin',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '9a0502c3-3369-42bb-9927-f114dd2c6707',
      },
    },
  },
};
