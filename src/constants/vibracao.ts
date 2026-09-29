/**
 * Padrão de vibração ao fim do descanso — compartilhado entre a vibração disparada
 * pelo app em primeiro plano (`Vibration.vibrate`, RF13) e o canal de notificação do
 * Android (`vibrationPattern`, RF06), para que a sensação seja igual independente de
 * o app estar aberto ou não.
 *
 * Formato (`Vibration.vibrate` / `vibrationPattern` do Android): alternância de
 * [espera, vibra, espera, vibra, ...] em milissegundos.
 *
 * Duração total reduzida de 1900ms para 1350ms em 2026-09-29 (3 pulsos de 350ms):
 * teste real em Android (Redmi Note 12) mostrou só 2 das 3 vibrações tocando quando
 * disparado pelo canal de notificação em segundo plano (mesma vibração em primeiro
 * plano tocava as 3 normalmente) — hipótese é o SO truncar o padrão de vibração de
 * notificação por volta de ~1200-1400ms. Ainda não confirmado em aparelho depois
 * deste ajuste (specs/014-vibracao-fim-descanso, docs/criterios-aceite.md RF13).
 */
export const PADRAO_VIBRACAO_FIM_DESCANSO = [0, 350, 150, 350, 150, 350];
