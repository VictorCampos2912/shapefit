/**
 * Padrão de vibração ao fim do descanso — compartilhado entre a vibração disparada
 * pelo app em primeiro plano (`Vibration.vibrate`, RF13) e o canal de notificação do
 * Android (`vibrationPattern`, RF06), para que a sensação seja igual independente de
 * o app estar aberto ou não.
 *
 * Formato (`Vibration.vibrate` / `vibrationPattern` do Android): alternância de
 * [espera, vibra, espera, vibra, ...] em milissegundos.
 */
export const PADRAO_VIBRACAO_FIM_DESCANSO = [0, 500, 200, 500, 200, 500];
