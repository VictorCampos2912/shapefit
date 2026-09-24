# Contract: `src/app/acoes.tsx` (novo item de créditos — FR-007)

**Feature**: `020-catalogo-exercicios`

Contrato interno (UI — não há API HTTP nesta feature).

## Novo item na lista de ações

```tsx
<Pressable onPress={handleAbrirCreditos} style={styles.linhaComIcone}>
  <InfoIcon size={16} color={theme.accent} />
  <ThemedText type="link">Créditos do catálogo de exercícios</ThemedText>
</Pressable>
```

```tsx
function handleAbrirCreditos() {
  Alert.alert(
    'Créditos',
    'Dados e imagens de exercícios: wger project (wger.de), licenciados sob ' +
      'Creative Commons Attribution-ShareAlike 3.0 (CC-BY-SA 3.0).',
  );
}
```

- **Posição**: novo item dentro do bloco `acoes` já existente em `acoes.tsx`, ao
  lado de "Importar treino"/"Importar treino de exemplo" — mesmo padrão visual
  (`Pressable` + ícone + `ThemedText type="link"`) já usado pelos itens
  existentes.
- **Conteúdo mínimo exigido pela licença (FR-007)**: nome da fonte (wger project),
  nome/versão da licença (CC-BY-SA 3.0). Implementação exata (modal `Alert` simples
  vs. uma tela própria de créditos) fica a cargo de `/speckit.tasks` — o contrato
  aqui é que a informação exista e seja alcançável a partir da tela "Ações", não o
  componente visual exato.
- **Sem novo ícone obrigatório**: pode reaproveitar um ícone já existente em
  `src/components/ui/icons.tsx` (ex.: um genérico de "informação"), ou introduzir
  um novo seguindo o mesmo padrão de `AcoesIcon`/`ImportarIcon` já existentes — não
  é uma decisão de produto desta spec.
- **Independente de a spec 021 (imagens na execução) já existir ou não** — os
  créditos são exigidos pela existência do catálogo em si (esta feature), não pelo
  seu uso visual em outra tela.
