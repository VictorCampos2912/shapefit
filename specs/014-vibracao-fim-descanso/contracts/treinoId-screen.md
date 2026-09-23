# Contract: `src/app/treino/[treinoId].tsx`

**Feature**: `014-vibracao-fim-descanso`

Contrato interno (uma função de uma tela — não há API HTTP nesta feature).

## Constante compartilhada: `src/constants/vibracao.ts` (movida em 2026-09-23)

```ts
export const PADRAO_VIBRACAO_FIM_DESCANSO = [0, 500, 200, 500, 200, 500];
```

Formato do array (padrão da API `Vibration.vibrate` do React Native, e também do
`vibrationPattern` do Android): alternância de `[espera, vibra, espera, vibra, ...]`
em milissegundos, a partir do momento da chamada. Originalmente definida só em
`[treinoId].tsx`; movida para uma constante compartilhada (`research.md`, Decisão 6)
porque agora também é usada pelo canal de notificação
(`src/services/notificacao-descanso.ts`) — ver `notificacao-descanso.md` neste mesmo
diretório de contracts.

## `handleDescansoConcluido` (existente, ajustado — assinatura mudou na correção de 2026-09-23)

```ts
function handleDescansoConcluido(deveVibrar: boolean = true) {
  setDescansoAtivo(null);
  if (deveVibrar) {
    Vibration.vibrate(PADRAO_VIBRACAO_FIM_DESCANSO);
  }
  if (notificacaoAgendada) {
    cancelarNotificacaoDescanso(notificacaoAgendada.identificador);
    setNotificacaoAgendada(null);
  }
}
```

- **Pós-condição**: dispositivo vibra com `PADRAO_VIBRACAO_FIM_DESCANSO` **só quando
  `deveVibrar` é `true`** (padrão), além do comportamento já existente (parar o
  cronômetro, cancelar a notificação agendada).
- **Chamadores**:
  - Efeito de `segundosRestantes === 0` — chama com `!voltouDeSegundoPlanoRef.current`
    (ver abaixo); vibra só quando o zero foi detectado com o app já em primeiro plano
    contínuo, não ao retomar de segundo plano.
  - `handleAjustarDescanso` (ajuste manual que leva o tempo restante a zero ou
    negativo) — continua chamando sem argumento (`deveVibrar = true` por padrão);
    é sempre uma ação explícita em primeiro plano.
  - `handleFinalizarTreino` (encerramento manual do treino) — chama com
    `deveVibrar = false` explícito (`research.md`, Decisão 5): limpa um cronômetro
    ativo, se houver, mas isso não é "o descanso terminou".
- **Import novo**: `Vibration` de `react-native` (já uma dependência do projeto, sem
  nada novo a instalar).

## Novo `useRef`: `voltouDeSegundoPlanoRef` (correção de 2026-09-23)

```ts
const voltouDeSegundoPlanoRef = useRef(false);

// dentro do listener de AppState:
if (novoEstado === 'active') {
  voltouDeSegundoPlanoRef.current = true;
  setTick((atual) => atual + 1);
}

// dentro do efeito que observa segundosRestantes:
const vinhaDeSegundoPlano = voltouDeSegundoPlanoRef.current;
voltouDeSegundoPlanoRef.current = false;
if (descansoAtivo && segundosRestantes === 0) {
  handleDescansoConcluido(!vinhaDeSegundoPlano);
}
```

- Consumido (lido e resetado) a cada execução do efeito, independente de o descanso
  ter chegado a zero naquele momento — evita que o flag fique "preso" em `true` e
  suprima indevidamente uma vibração legítima num tick futuro (`research.md`,
  Decisão 5).
