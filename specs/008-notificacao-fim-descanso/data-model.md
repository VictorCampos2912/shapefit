# Data Model: Notificação de Fim do Descanso

Esta feature não introduz nenhuma nova entidade de domínio (perfil, treino, sessão,
histórico) nem qualquer nova chave de armazenamento persistente. O único estado novo
é transitório, em memória, e vive ao lado do `descansoAtivo` já estabelecido pelo
RF05, na rota `src/app/treino/[treinoId].tsx`.

## Entidade conceitual: Aviso de fim de descanso agendado

Já descrita na spec (seção "Key Entities"). Modelada tecnicamente como:

```ts
type NotificacaoDescansoAgendada = {
  identificador: string; // retornado por Notifications.scheduleNotificationAsync
  fimEm: number;         // o mesmo timestamp (epoch ms) usado para agendar — para
                         // referência/depuração, não recalculado a partir daqui
} | null;
```

### Ciclo de vida (espelha exatamente o ciclo de `descansoAtivo` do RF05)

| Estado de `descansoAtivo` (RF05) | Estado de `NotificacaoDescansoAgendada` (RF06) |
|---|---|
| `null` → `{ exercicioId, fimEm }` (novo cronômetro) | `null` → `{ identificador, fimEm }` (novo agendamento criado) |
| `{ ..., fimEm }` → `{ ..., fimEm: fimEm + 15000 }` (ajuste +15s) | Agendamento anterior cancelado; novo criado com o `fimEm` ajustado |
| `{ ..., fimEm }` → `{ ..., fimEm: fimEm - 15000 }` (ajuste -15s, resultado > 0) | Agendamento anterior cancelado; novo criado com o `fimEm` ajustado |
| `{ ..., fimEm }` → `{ ..., fimEm: fimEm - 15000 }` (ajuste -15s, resultado ≤ 0) | Agendamento anterior cancelado; aviso disparado imediatamente (sem criar novo agendamento futuro) |
| `{ exercicioId, fimEm }` → `{ novoExercicioId, novoFimEm }` (substituição por nova série concluída, RF05 FR-011) | Agendamento anterior cancelado; novo criado com o `novoFimEm` |
| `{ ..., fimEm }` → `null` (descanso concluído, RF05 FR-009) | Agendamento correspondente já disparou (ou, se ainda pendente por algum motivo, é cancelado sem novo ser criado) |

### Invariantes

- Nunca existe mais de um `NotificacaoDescansoAgendada` não-nulo por vez — mesma
  garantia de unicidade já aplicada a `descansoAtivo` pelo RF05.
- `NotificacaoDescansoAgendada` só existe quando `descansoAtivo` também existe — não
  há agendamento "órfão" sem um cronômetro correspondente ativo na UI.
- Este estado não é persistido em `AsyncStorage` nem sobrevive ao fechamento
  completo do app — mesmo limite de escopo já assumido pelo `descansoAtivo` do RF05.

## Relação com entidades existentes

Nenhuma. Esta feature não lê nem escreve `Perfil`, `Treino`, `SessaoTreino`,
`ExecucaoExercicio` ou `SerieRealizada` — opera inteiramente sobre o `fimEm` já
calculado pelo RF05, como um observador desse valor.
