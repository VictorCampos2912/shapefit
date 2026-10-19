# Contract: `src/app/acoes.tsx` (alterado) — "Treinos arquivados" e "Encerrar ciclo"

**Feature**: `026-arquivamento-treinos-ciclo`

Duas novas linhas no menu de Ações, mesmo padrão visual das 3 linhas já
existentes ("Sair da conta", "Importar treino", "Créditos do catálogo") —
`Pressable` com ícone + `ThemedText type="link"`.

## "Treinos arquivados" (FR-006) — navegação simples

```tsx
<Pressable onPress={() => router.push('/treinos-arquivados')} style={styles.linhaComIcone}>
  <ArquivarIcon size={16} color={theme.accent} />
  <ThemedText type="link">Treinos arquivados</ThemedText>
</Pressable>
```

Sempre visível (a tela de destino mostra "Nenhum treino arquivado" quando
vazia, mesmo padrão do estado vazio de "Meus treinos" em `index.tsx`).

## "Encerrar ciclo" (FR-007) — só aparece/habilitado com ciclo ativo

```tsx
const [cicloAtual, setCicloAtual] = useState<CicloTreino | null>(null);

useEffect(() => {
  if (!uid) return;
  obterCicloAtual(uid).then(setCicloAtual);
}, [uid]);

function handleEncerrarCiclo() {
  if (!uid || !cicloAtual) return;
  const cicloId = cicloAtual.id; // captura antes do onPress, já que setCicloAtual(null) roda primeiro
  Alert.alert(
    'Encerrar ciclo',
    'O ciclo de progresso atual será encerrado — os anéis de progresso somem e a importação de um novo lote de treinos volta a funcionar. Nenhuma sessão é apagada. Continuar?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Encerrar',
        style: 'destructive',
        onPress: () => {
          // NOVO: atualização otimista — esconde a ação e já reflete "sem
          // ciclo ativo" no estado local, sem esperar nada (encerrarCiclo
          // não lê nada antes de escrever — research.md, Decisão 4 revisada).
          setCicloAtual(null);
          encerrarCiclo(uid, cicloId); // src/services/ciclo-treino-storage.ts — sem leitura, sem await, sem .catch no call site
        },
      },
    ],
  );
}

// Renderização condicional — FR-007: a ação só existe quando há ciclo ativo
{cicloAtual && (
  <Pressable onPress={handleEncerrarCiclo} style={styles.linhaComIcone}>
    <EncerrarCicloIcon size={16} color={theme.accent} />
    <ThemedText type="link">Encerrar ciclo</ThemedText>
  </Pressable>
)}
```

- **1 leitura própria desta tela** (`obterCicloAtual`, mesma função já
  usada por `index.tsx` e pelo bloqueio de importação) — não aumenta
  leituras de `index.tsx` (item 8 do plano), e é a mesma leitura que
  qualquer forma de checar "há ciclo ativo?" exigiria de qualquer forma.
- 1 toque (o link, já condicionalmente visível) + 1 toque de confirmação
  — dentro do limite de SC-001 (que fala de arquivar, mas o mesmo
  princípio de "poucos toques + confirmação clara" se aplica).

## Dois ícones novos — `src/components/ui/icons.tsx`

`ArquivarIcon` e `EncerrarCicloIcon`, mesmo padrão dos ícones existentes
(`Svg`/`Path` de `react-native-svg`, traço 2px, sem preenchimento,
`size`/`color`/`strokeWidth` configuráveis via props) — nenhuma
dependência nova, só dois componentes SVG novos no mesmo arquivo.
