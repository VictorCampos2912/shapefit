import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { PADRAO_VIBRACAO_FIM_DESCANSO } from '@/constants/vibracao';

// v4: alinha o padrão de vibração do canal ao mesmo usado pelo app em primeiro
// plano (RF13) — canais do Android são efetivamente imutáveis depois de criados
// num aparelho, então mudar só o vibrationPattern abaixo não bastaria sem também
// mudar o id do canal.
const CANAL_DESCANSO = 'descanso-v4';

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
