# Checklist — Ambiente de Desenvolvimento e Teste (v1)

Use este checklist antes de começar a etapa **Build** do RF01 com o Claude Code. O
objetivo é garantir que o ambiente funciona ponta a ponta (máquina → Expo Go → os dois
celulares) antes de escrever qualquer linha de lógica do app.

## 1. Máquina de desenvolvimento

- [ ] Node.js instalado (versão LTS) — confirmar com `node -v`
- [ ] `npm` ou `yarn` funcionando — confirmar com `npm -v`
- [ ] Git instalado (para versionar o projeto desde o início) — confirmar com `git --version`
- [ ] Editor de código configurado (se for usar Claude Code no VS Code, por exemplo)
- [ ] Conexão de internet estável na mesma rede Wi-Fi que os dois celulares (necessário
      para o Expo Go encontrar o servidor local)

## 2. GitHub Spec Kit (metodologia SDD)

- [ ] `uv` instalado (gerenciador de pacotes Python usado pelo Spec Kit) — confirmar com
      `uv --version`
- [ ] Spec Kit instalado com `uv tool install specify-cli`
- [ ] Instalação confirmada com `specify --help`
- [ ] Rodar `specify init . --integration claude` dentro da pasta do projeto Expo, para
      adicionar os comandos `/speckit.*` ao Claude Code
- [ ] Confirmar no Claude Code (VS Code) que os comandos `/speckit.constitution`,
      `/speckit.specify`, `/speckit.plan`, `/speckit.tasks` e `/speckit.implement` aparecem
      como opções de comando de barra

## 3. Criação do projeto

- [ ] Projeto criado com `npx create-expo-app@latest treino-app` (template TypeScript)
- [ ] Projeto versionado com Git (`git init`, primeiro commit)
- [ ] `npx expo start` executa sem erros e mostra o QR code no terminal
- [ ] Estrutura de pastas inicial revisada (ex: `/app` ou `/src`, conforme decisão da
      etapa Design)

## 4. Redmi Note 12 (Android)

- [ ] App **Expo Go** instalado via Play Store
- [ ] Celular conectado na mesma rede Wi-Fi da máquina de desenvolvimento
- [ ] QR code escaneado e o app placeholder do Expo abre corretamente
- [ ] Hot reload testado: alterar um texto simples no código e confirmar que atualiza no
      celular sem precisar escanear de novo
- [ ] Testar comportamento com a tela bloqueada/app em segundo plano (relevante mais
      adiante para o cronômetro de descanso — RF05/RF06)

## 5. iPhone 16 Plus (iOS)

- [ ] App **Expo Go** instalado via App Store
- [ ] Celular conectado na mesma rede Wi-Fi da máquina de desenvolvimento
- [ ] QR code escaneado (no iOS, via app Câmera nativo) e o app placeholder abre
      corretamente
- [ ] Hot reload testado, mesmo procedimento do Android
- [ ] Testar comportamento com a tela bloqueada/app em segundo plano — iOS costuma ser
      mais restritivo que Android para isso, vale confirmar cedo

## 6. Dependências previstas para o MVP (instalar conforme forem necessárias, não tudo de uma vez)

- [ ] `react-navigation` (e dependências como `react-native-screens`,
      `react-native-safe-area-context`) — necessário a partir da tela de execução
- [ ] `@react-native-async-storage/async-storage` — necessário a partir do RF07 (salvar
      sessão)
- [ ] Biblioteca de seleção de arquivo (ex: `expo-document-picker`) — necessário para o
      RF01, decidir na etapa Brainstorm/Define
- [ ] Biblioteca de notificação local/vibração (ex: `expo-notifications` ou
      `expo-haptics`) — necessário para o RF06

## 7. Validação final antes de começar o RF01

- [ ] App placeholder roda sem erros nos dois celulares simultaneamente
- [ ] Commit inicial do projeto vazio/placeholder feito no Git
- [ ] PRD e prompt inicial SDD disponíveis no repositório do projeto (ex: pasta `/docs`)
- [ ] Confirmado que não há necessidade de conta paga (Apple Developer) para esta fase —
      Expo Go cobre o teste local

## Problemas comuns (referência rápida)

- **QR code não conecta:** confirmar que celular e computador estão na mesma rede; redes
  corporativas/com isolamento de cliente costumam bloquear — usar hotspot do celular como
  alternativa de teste
- **App trava só no iOS:** geralmente relacionado a permissões (câmera, arquivos,
  notificações) que pedem tratamento explícito diferente do Android
- **Hot reload não atualiza:** reiniciar o `expo start` com a flag `-c` para limpar cache
