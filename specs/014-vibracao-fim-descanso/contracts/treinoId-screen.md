# Contract: `src/app/treino/[treinoId].tsx`

**Feature**: `014-vibracao-fim-descanso`

Contrato interno (uma função de uma tela — não há API HTTP nesta feature).

## Nova constante de módulo

```ts
const PADRAO_VIBRACAO_FIM_DESCANSO = [0, 500, 200, 500, 200, 500];
```

Formato do array (padrão da API `Vibration.vibrate` do React Native): alternância de
`[espera, vibra, espera, vibra, ...]` em milissegundos, a partir do momento da
chamada. Perceptivelmente mais longo que o padrão já usado pela notificação
(`[0, 250, 250, 250]`, em `src/services/notificacao-descanso.ts`, inalterado por esta
feature).

## `handleDescansoConcluido` (existente, ajustado)

```ts
function handleDescansoConcluido() {
  setDescansoAtivo(null);
  Vibration.vibrate(PADRAO_VIBRACAO_FIM_DESCANSO); // linha nova
  if (notificacaoAgendada) {
    cancelarNotificacaoDescanso(notificacaoAgendada.identificador);
    setNotificacaoAgendada(null);
  }
}
```

- **Pré-condição**: chamada só acontece com o app em primeiro plano (`research.md`,
  Decisão 4 — garantido pela arquitetura existente, sem checagem extra).
- **Pós-condição**: dispositivo vibra com `PADRAO_VIBRACAO_FIM_DESCANSO`, além do
  comportamento já existente (parar o cronômetro, cancelar a notificação agendada).
- **Chamadores inalterados**: o efeito de `segundosRestantes === 0` (contagem normal
  chegando a zero) e `handleAjustarDescanso` (ajuste manual que leva o tempo restante
  a zero ou negativo) — ambos continuam chamando esta mesma função, sem mudança de
  assinatura.
- **Import novo**: `Vibration` de `react-native` (já uma dependência do projeto, sem
  nada novo a instalar).
