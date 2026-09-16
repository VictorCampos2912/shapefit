# Quickstart: Validação de "Listar Treinos Importados/Salvos" (RF02)

**Feature**: 003-listar-treinos | **Date**: 2026-09-15

Guia para validar manualmente o comportamento descrito na spec, nos dois aparelhos-alvo
(Redmi Note 12/Android e iPhone 16 Plus/iOS), via Expo Go, conforme Princípio III da
Constituição. Mesma abordagem usada na validação do RF10 e do RF01.

## Pré-requisitos

- RF10 (perfil local) e RF01 (importar treino) implementados e funcionando — esta feature
  depende de um perfil ativo existir e da camada de importação já validada
- Dependências instaladas: `npm install` (nenhuma dependência nova é introduzida por esta
  feature — ver research.md)
- Expo Go instalado no aparelho de teste
- Os arquivos de exemplo já usados na validação do RF01 disponíveis no aparelho de teste:
  - `docs/exemplos/treino-exemplo.json`
  - Um segundo arquivo com o mesmo campo `"nome"` do exemplo acima, para testar a User
    Story 3 (diferenciação por nomes duplicados) — pode ser uma cópia renomeada do mesmo
    arquivo

## Como rodar

```bash
npm run start
# ou, direcionado à plataforma:
npm run android
npm run ios
```

Escanear o QR code com o Expo Go (Android) ou a câmera (iOS). Certificar-se de que um perfil
já está ativo antes de iniciar os cenários abaixo.

## Cenários de validação (mapeados às User Stories da spec)

### 1. Consultar a lista de treinos do perfil ativo (User Story 1)

1. Com o perfil ativo sem nenhum treino importado ainda, abrir a tela de treinos (aba
   inicial).
   **Esperado**: indicação clara de que não há treinos, com a ação de importar visível.
2. Importar `treino-exemplo.json` a partir da tela de treinos.
   **Esperado**: o treino aparece na lista, identificado pelo nome.
3. Fechar e reabrir o app.
   **Esperado**: o mesmo treino continua na lista, sem perda de dados.

### 2. Lista filtrada e atualizada por perfil ativo (User Story 2)

1. Com o Perfil A ativo (com ao menos um treino importado), abrir a tela de treinos.
   **Esperado**: apenas os treinos do Perfil A aparecem.
2. Trocar para o Perfil B (sem treinos importados ainda), via RF10.
   **Esperado**: a lista atualiza imediatamente para o estado de "nenhum treino ainda",
   sem exibir nenhum treino do Perfil A.
3. Trocar de volta para o Perfil A.
   **Esperado**: os treinos do Perfil A voltam a aparecer, intactos.

### 3. Diferenciar treinos com o mesmo nome (User Story 3)

1. Com um perfil que já tem `treino-exemplo.json` importado, importar um segundo arquivo com
   o mesmo campo `"nome"` (em um momento diferente).
   **Esperado**: ambos os treinos aparecem na lista como itens distintos, cada um exibindo a
   data/hora de importação junto ao nome.

### 4. Importar um novo treino a partir da tela de treinos (User Story 4)

1. Na tela de treinos, acionar a ação de importar treino.
   **Esperado**: o fluxo de seleção de arquivo do RF01 é executado normalmente (mesmo
   comportamento de sucesso/parcial/erro já validado no RF01).
2. Navegar pelo restante do app (ex.: tela de perfil).
   **Esperado**: a ação de importar treino não está disponível em nenhuma tela além da lista
   de treinos.

### 5. Preparar a navegação para executar um treino (User Story 5)

1. Na lista de treinos, tocar em um item específico.
   **Esperado**: alguma reação visível e inequívoca ao toque (o app reconhece qual treino foi
   selecionado), mesmo que nenhuma tela nova seja aberta nesta feature (RF03 ainda não existe).

## Critérios de aceite de referência

Ver [docs/criterios-aceite.md](../../docs/criterios-aceite.md), seção "RF02 — Listar treinos
importados/salvos", para a lista completa de checkboxes originais usados como base desta
spec.
