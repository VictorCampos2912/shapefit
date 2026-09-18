import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CANAL_DESCANSO = 'descanso';

export function configurarNotificacoesDescanso(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CANAL_DESCANSO, {
      name: 'Fim do descanso',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

export async function agendarNotificacaoDescanso(fimEm: number): Promise<string | null> {
  const permissoes = await Notifications.getPermissionsAsync();
  if (permissoes.status !== 'granted') {
    const solicitadas = await Notifications.requestPermissionsAsync();
    if (solicitadas.status !== 'granted') {
      return null;
    }
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Descanso concluído',
      body: 'Hora de continuar o treino',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(fimEm),
      channelId: CANAL_DESCANSO,
    },
  });
}

export async function cancelarNotificacaoDescanso(identificador: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identificador);
}
