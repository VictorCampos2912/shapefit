# Quickstart: Validação da "Notificação de Fim do Descanso" (RF06)

**Feature**: 008-notificacao-fim-descanso | **Date**: 2026-09-17

Guia para validar manualmente o comportamento descrito na spec, nos dois
aparelhos-alvo (Redmi Note 12/Android e iPhone 16 Plus/iOS), via Expo Go, conforme
Princípio III da Constituição.

## Pré-requisitos

- RF10, RF01, RF02, RF03, RF04, RF09a e RF05 implementados e funcionando — esta
  feature depende do estado `descansoAtivo`/`fimEm` já mantido pelo RF05
- Dependências instaladas: `npm install` (após adicionar `expo-notifications` ao
  `package.json` — ver plan.md, Complexity Tracking, para a justificativa da nova
  dependência)
- Expo Go instalado no aparelho de teste, com permissão de notificações concedida
  ao ser solicitada na primeira execução deste fluxo
- Um treino de teste com pelo menos um exercício com `descanso_seg` curto (ex.: 15s,
  para acelerar os testes)

## Como rodar

```bash
npm install
npm run start
# ou, direcionado à plataforma:
npm run android
npm run ios
```

## Cenários de validação (mapeados às User Stories da spec)

### 1. Aviso com o app em primeiro plano (User Story 1)

1. Conceder a permissão de notificações quando solicitada (primeira vez que uma
   série é concluída com descanso).
2. Concluir uma série com descanso curto (ex.: 15s) e manter o app aberto,
   observando o cronômetro contar até zero.
   **Esperado**: no exato momento em que o cronômetro chega a zero, o celular emite
   som e vibra simultaneamente — mesmo com o app em primeiro plano.
3. Observar a tela logo após o aviso.
   **Esperado**: a área de carga/repetições e o botão "Concluir série" da próxima
   série reaparecem (mesmo comportamento visual já garantido pelo RF05 ao zerar).

### 2. Aviso com o app minimizado (User Story 2)

1. Concluir uma série com descanso curto (ex.: 15s).
2. Imediatamente, minimizar o app (botão home / trocar de app) e aguardar sem
   tocar no celular até depois do tempo configurado.
   **Esperado**: o som e a vibração ocorrem no horário correto, mesmo com o app em
   segundo plano.
3. Reabrir o app (ou tocar na notificação recebida).
   **Esperado**: a tela de execução já reflete o descanso concluído (campos da
   próxima série visíveis), sem exigir nenhuma ação adicional.

### 3. Aviso com a tela bloqueada (User Story 2)

1. Concluir uma série com descanso curto (ex.: 15s).
2. Bloquear a tela do celular manualmente (ou aguardar o bloqueio automático) antes
   do tempo chegar a zero.
   **Esperado**: o som (se o volume do aparelho permitir) e a vibração ocorrem no
   horário correto, mesmo com a tela bloqueada.
3. Desbloquear o celular e tocar na notificação (se ainda visível) ou reabrir o
   app manualmente.
   **Esperado**: mesmo resultado do Cenário 2, passo 3.

### 4. Ajuste do cronômetro reagenda o aviso (User Story 2, edge case)

1. Concluir uma série com descanso de 30s.
2. Antes do cronômetro chegar a zero, tocar em "+15s" uma vez, depois minimizar o
   app.
3. Aguardar o tempo total ajustado (30s + 15s) decorrer, sem tocar no celular antes
   disso.
   **Esperado**: o aviso dispara no novo horário (após o ajuste), não no horário
   original de 30s — ou seja, não dispara "cedo demais".

### 5. Nova série conclui com aviso anterior ainda pendente (Edge Case)

1. Concluir uma série com descanso de 60s.
2. Antes de completar 60s, voltar e concluir outra série (do mesmo exercício ou de
   outro), reiniciando o cronômetro (comportamento já validado pelo RF05).
3. Aguardar o novo tempo de descanso decorrer.
   **Esperado**: apenas **um** aviso sonoro/vibração ocorre, no horário do novo
   cronômetro — o aviso do cronômetro anterior (60s) nunca dispara.

### 6. Respeito ao modo silencioso (User Story 3)

1. Colocar o celular em modo silencioso.
2. Concluir uma série com descanso curto (ex.: 15s) e aguardar o fim, com o app em
   qualquer estado (aberto, minimizado ou tela bloqueada).
   **Esperado**: nenhum som é ouvido, mas a vibração ocorre normalmente.
3. Retirar o modo silencioso, ajustar o volume de notificação para um nível
   específico (não mudo, não máximo) e repetir o teste.
   **Esperado**: o som toca nesse mesmo volume configurado no sistema — não em um
   volume fixo definido pelo app.

### 7. Ajuste que zera o tempo dispara aviso imediato (Edge Case)

1. Concluir uma série com descanso de 20s.
2. Aguardar até restarem poucos segundos (ex.: 8s) e tocar em "-15s".
   **Esperado**: o cronômetro vai a zero imediatamente (comportamento já do RF05) e
   o aviso sonoro/vibração ocorre nesse mesmo instante, sem atraso perceptível.

### 8. Permissão de notificação negada (Edge Case)

1. Negar a permissão de notificações quando solicitada pela primeira vez (ou
   revogá-la manualmente nas configurações do sistema antes do teste).
2. Concluir uma série com descanso configurado e aguardar o tempo passar (com o
   app em qualquer estado).
   **Esperado**: nenhum som/vibração de notificação ocorre (esperado, dada a
   permissão negada), mas o app não trava nem exibe erro — ao reabrir/observar a
   tela após o horário de término, o descanso aparece corretamente concluído
   (campos da próxima série liberados), pois essa constatação depende apenas do
   cálculo de tempo do RF05, não da notificação.

### 9. Precisão do disparo no Android — risco conhecido de Doze mode (ver plan.md, Riscos Conhecidos)

1. Concluir uma série com descanso de ~60s no Redmi Note 12.
2. Minimizar o app e deixar o aparelho completamente parado (sem tocar, sem outros
   apps em uso) por todo o período de descanso.
3. Medir, com um cronômetro externo, o atraso entre o horário esperado (`fimEm`) e
   o momento real em que o som/vibração ocorrem.
   **Esperado (melhor caso)**: atraso de poucos segundos, dentro da margem de
   SC-002. **Resultado aceitável mas não ideal**: atraso maior, de até alguns
   minutos, atribuível ao Android tratar o agendamento como alarme não-exato sob
   Doze mode (ver plan.md, "Riscos Conhecidos", Risco 1) — este resultado **não
   deve ser tratado como bug de implementação**, mas registrado como confirmação
   do risco já documentado. Repetir o mesmo teste no iPhone 16 Plus para comparar,
   já que esse risco é específico do Android.

## Critérios de aceite de referência

Ver [docs/criterios-aceite.md](../../docs/criterios-aceite.md), seção "RF06 —
Notificação de fim do descanso", para a lista completa de checkboxes originais
usados como base desta spec.
