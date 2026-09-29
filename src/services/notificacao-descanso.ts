import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { PADRAO_VIBRACAO_FIM_DESCANSO } from '@/constants/vibracao';

// v5: encurta o padrão de vibração pra caber no limite de duração que o Android
// parece truncar em canais de notificação (~1200-1400ms) — canais são efetivamente
// imutáveis depois de criados num aparelho, então mudar só o vibrationPattern não
// bastaria sem também mudar o id do canal.
const CANAL_DESCANSO = 'descanso-v5';

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
      vibrationPattern: PADRAO_VIBRACAO_FIM_DESCANSO,
      enableVibrate: true,
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
