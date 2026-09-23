# Contract: `src/services/notificacao-descanso.ts`

**Feature**: `014-vibracao-fim-descanso` (alteração de 2026-09-23 — Decisão 6 do `research.md`)

Contrato interno (configuração de canal de notificação — não há API HTTP nesta
feature).

## Canal de notificação (id alterado)

```ts
const CANAL_DESCANSO = 'descanso-v4'; // era 'descanso-v3'

Notifications.setNotificationChannelAsync(CANAL_DESCANSO, {
  name: 'Fim do descanso',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: PADRAO_VIBRACAO_FIM_DESCANSO, // era [0, 250, 250, 250], inline
  enableVibrate: true,
  lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
});
```

- **Por que o id do canal muda**: canais de notificação do Android são efetivamente
  imutáveis depois de criados num aparelho — chamar
  `setNotificationChannelAsync` de novo com o mesmo id e um `vibrationPattern`
  diferente **não** atualiza o padrão num aparelho que já tinha esse canal criado
  (mesma razão pela qual o canal já estava em `v3` antes desta mudança). Um id novo
  força o Android a criar um canal novo, com a configuração nova.
- **Pós-condição**: em aparelhos onde o app já rodou antes desta mudança, dois canais
  ficam registrados no sistema (`descanso-v3` órfão, sem mais uso; `descanso-v4`
  ativo) — não há como remover o canal antigo programaticamente pelo Expo Notifications
  API; ele simplesmente para de ser usado (`agendarNotificacaoDescanso` sempre
  referencia `CANAL_DESCANSO`, a constante atual).
- **Import novo**: `PADRAO_VIBRACAO_FIM_DESCANSO` de `@/constants/vibracao`
  (`contracts/treinoId-screen.md`).
- **Sem mudança de assinatura** em nenhuma função exportada
  (`configurarNotificacoesDescanso`, `agendarNotificacaoDescanso`,
  `cancelarNotificacaoDescanso`) — só a configuração interna do canal muda.
