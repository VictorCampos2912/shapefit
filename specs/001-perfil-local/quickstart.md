# Quickstart: Validação de "Criar e Selecionar Perfil Local" (RF10)

**Feature**: 001-perfil-local | **Date**: 2026-09-14

Guia para validar manualmente o comportamento descrito na spec, nos dois aparelhos-alvo
(Redmi Note 12/Android e iPhone 16 Plus/iOS), via Expo Go, conforme Princípio III da
Constituição.

## Pré-requisitos

- Dependências instaladas: `npm install` (inclui `@react-native-async-storage/async-storage`
  após adicionada — ver [research.md](./research.md), Decisão 2)
- Expo Go instalado no aparelho de teste
- Nenhum dado de perfil previamente salvo no aparelho de teste (para validar o cenário de
  primeira abertura) — se necessário, limpar o storage do app via configurações do sistema
  ou reinstalar o Expo Go/limpar cache do projeto

## Como rodar

```bash
npm run start
# ou, direcionado à plataforma:
npm run android
npm run ios
```

Escanear o QR code com o Expo Go (Android) ou a câmera (iOS).

## Cenários de validação (mapeados às User Stories da spec)

### 1. Primeiro acesso — criação de perfil (User Story 1)

1. Abrir o app pela primeira vez (sem perfis salvos).
2. **Esperado**: a tela de criação de perfil é exibida antes de qualquer outra tela.
3. Tentar salvar sem preencher todos os campos.
   **Esperado**: salvamento bloqueado; campos faltantes indicados.
4. Preencher nome, peso, altura, idade, sexo (Masculino/Feminino) e objetivo
   (Hipertrofia/Emagrecimento/Condicionamento/Manutenção); salvar.
   **Esperado**: navega para a lista de treinos; o perfil criado é o ativo.

### 2. Múltiplos perfis — seleção e criação adicional (User Story 2)

1. Com ao menos um perfil já criado, fechar e reabrir o app.
   **Esperado**: lista de seleção de perfis é exibida (não o formulário de criação).
2. Tocar em "Criar novo perfil" a partir da lista.
   **Esperado**: formulário de criação é exibido; ao salvar, o novo perfil passa a ser o
   ativo.
3. Tocar em um perfil existente na lista.
   **Esperado**: esse perfil passa a ser o ativo; navega para a lista de treinos dele.

### 3. Bloqueio de troca durante sessão em andamento (User Story 3)

> Nota: esta feature (RF10) define o contrato de leitura (`existeSessaoEmAndamento`); a
> escrita real de sessões é do RF07. Para validar este cenário de ponta a ponta, é
> necessário RF07 implementado. Nesta fase, validar ao menos:

1. Sem sessão em andamento, acionar a troca de perfil ativo.
   **Esperado**: troca ocorre livremente, sem exigir reinstalar o app.
2. (Quando RF07 estiver disponível) Com uma sessão de treino em andamento no perfil ativo,
   tentar trocar de perfil.
   **Esperado**: opção desabilitada ou aviso explicando que é preciso finalizar a sessão
   atual antes de trocar.
3. Após trocar de perfil com sucesso, verificar que as telas dependentes de perfil
   (treinos, execução, histórico) refletem imediatamente os dados do novo perfil ativo, sem
   fechar/reabrir o app.

## Critérios de aceite de referência

Ver [docs/criterios-aceite.md](../../docs/criterios-aceite.md), seção "RF10 — Criar e
selecionar perfil local", para a lista completa de checkboxes originais usados como base
desta spec.
