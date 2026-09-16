# Quickstart: Validação de "Importar Treino via Arquivo JSON" (RF01)

**Feature**: 002-importar-treino-json | **Date**: 2026-09-15

Guia para validar manualmente o comportamento descrito na spec, nos dois aparelhos-alvo
(Redmi Note 12/Android e iPhone 16 Plus/iOS), via Expo Go, conforme Princípio III da
Constituição. Mesma abordagem usada na validação do RF10.

## Pré-requisitos

- RF10 (perfil local) implementado e com ao menos um perfil criado e ativo — esta feature
  depende de um perfil ativo existir (ver Assumptions do spec)
- Dependências instaladas: `npm install` (inclui `expo-document-picker` — ver
  [research.md](./research.md), Decisão 1; a leitura do arquivo usa `fetch()`, já disponível
  globalmente, sem dependência adicional — ver Decisão 2)
- Expo Go instalado no aparelho de teste
- Os arquivos de exemplo do projeto disponíveis no aparelho de teste para seleção via
  seletor de arquivos do sistema:
  - `docs/exemplos/treino-exemplo.json` (válido — todos os exercícios corretos)
  - `docs/exemplos/treino-exemplo-com-erro.json` (um exercício com campo `series` como texto
    em vez de número — cenário de erro parcial)

  Transferir esses dois arquivos para o armazenamento do aparelho de teste (ex.: via cabo,
  e-mail para si mesmo, ou serviço de nuvem) antes de iniciar a validação.

## Como rodar

```bash
npm run start
# ou, direcionado à plataforma:
npm run android
npm run ios
```

Escanear o QR code com o Expo Go (Android) ou a câmera (iOS). Certificar-se de que um perfil
já está ativo antes de iniciar os cenários abaixo (criar um perfil via RF10, se necessário).

## Cenários de validação (mapeados às User Stories da spec)

### 1. Importação de um treino válido (User Story 1)

1. A partir da tela inicial, acionar a ação "Importar treino".
2. No seletor de arquivos do sistema, selecionar `treino-exemplo.json`.
   **Esperado**: a importação é concluída sem nenhuma mensagem de erro; nenhum exercício é
   reportado como ignorado.
3. Confirmar que o treino "Treino A - Peito/Tríceps" está associado ao perfil ativo (checagem
   indireta possível via inspeção do AsyncStorage em modo de desenvolvimento, ou aguardando o
   RF02 para visualização direta em lista).

### 2. Isolamento por perfil (User Story 2)

1. Com o Perfil A ativo, importar `treino-exemplo.json` (repetir Cenário 1, se ainda não
   feito).
2. Trocar o perfil ativo para o Perfil B (RF10).
   **Esperado**: nenhuma referência ao treino importado pelo Perfil A é acessível a partir do
   Perfil B (checagem possível inspecionando que a chave `treinos:<perfil_id>` do Perfil B não
   contém esse treino).
3. Trocar de volta para o Perfil A.
   **Esperado**: o treino importado continua presente e íntegro para o Perfil A.

### 3. Importação parcial com erro isolado (User Story 3)

1. A partir da tela inicial, acionar "Importar treino" novamente.
2. Selecionar `treino-exemplo-com-erro.json`.
   **Esperado**: uma mensagem indica que o treino foi importado de forma incompleta,
   apontando o exercício "puxada-frente" (ou índice correspondente) como ignorado (motivo:
   campo `series` com tipo inválido).
3. Confirmar que os demais exercícios do arquivo ("remada-curvada", "rosca-direta") foram
   importados normalmente, e que "puxada-frente" não está presente no treino resultante.

### 4. Arquivo inválido é rejeitado (User Story 4)

1. Preparar (ou usar) um arquivo com conteúdo que não seja JSON válido (ex.: um `.txt`
   renomeado para `.json`, ou um JSON com erro de sintaxe proposital).
2. A partir da tela inicial, acionar "Importar treino" e selecionar esse arquivo.
   **Esperado**: uma mensagem de erro clara é exibida; nenhum treino novo é adicionado.

### Cancelamento (Edge Case)

1. Acionar "Importar treino" e, no seletor de arquivos do sistema, cancelar/voltar sem
   selecionar nada.
   **Esperado**: o app retorna ao estado anterior sem exibir nenhuma mensagem de erro.

## Critérios de aceite de referência

Ver [docs/criterios-aceite.md](../../docs/criterios-aceite.md), seção "RF01 — Importar
arquivo JSON com estrutura de treino", para a lista completa de checkboxes originais usados
como base desta spec.
