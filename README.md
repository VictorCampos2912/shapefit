# ShapeFit

App mobile pessoal/familiar de acompanhamento de treino de academia — importar um
plano de treino, executar registrando carga e reps série a série, cronometrar o
descanso automaticamente, e acompanhar a evolução ao longo do tempo. Multiplataforma
(Android e iOS), 100% offline (sem backend, sem login remoto), com suporte a múltiplos
perfis locais no mesmo aparelho.

## Status

**MVP (RF01–RF10) completo e validado** em Android (Redmi Note 12) e iOS
(iPhone 16 Plus). **Quatro melhorias pós-MVP (RF11–RF14)** implementadas e em fase de
validação nos aparelhos-alvo. Ver `docs/criterios-aceite.md` para o detalhe de cada
requisito, marcado ou não como validado.

| Requisito | O que faz |
|---|---|
| RF01–RF10 | Importar treino, executar série a série, cronômetro de descanso, notificação, histórico de evolução, perfis locais |
| RF11 | Importar múltiplos treinos de um único arquivo |
| RF12 | Conclusão explícita de sessão de treino (lista fica concluída até o usuário decidir começar de novo) |
| RF13 | Vibração diferenciada ao fim do descanso |
| RF14 | Tela separada para trocar perfil e importar treino |

## Stack técnica

- **React Native + Expo SDK 57**, TypeScript estrito
- **Expo Router** (roteamento por arquivos, `src/app/`)
- **AsyncStorage** como única persistência — sem backend, tudo local ao aparelho
- `react-native-svg` (identidade visual, ícones), `expo-notifications` (aviso de fim
  de descanso), `@expo-google-fonts/big-shoulders-display` (tipografia)
- Ver `docs/PRD-app-treino.md`, seção 9, para a lista completa e a justificativa de
  cada dependência

## Rodando o projeto

```bash
npm install
npx expo start
```

No terminal, escolha abrir via development build, emulador Android, simulador iOS, ou
Expo Go — note que **o Expo Go puro trava no Android** por causa do
`expo-notifications` (ver `docs/PRD-app-treino.md`, seção 9); no Android, use sempre
um development build. No iOS, Expo Go funciona normalmente.

Para testar fora da rede local (ex.: em outro lugar sem estar perto do computador),
use `npx expo start --tunnel`.

### Gerar um build standalone (sem depender do Metro/PC)

```bash
npx eas-cli@latest build --profile preview --platform android
```

Gera um `.apk` com o JavaScript já empacotado, instalável direto no aparelho, sem
depender do computador depois de instalado. Ver `eas.json` para os perfis disponíveis
(`development`, `preview`, `production`). iOS exige conta paga do Apple Developer
Program para builds internos — sem ela, a alternativa é Expo Go (rede local ou
túnel).

## Metodologia

Este projeto usa **Spec-Driven Development** (SDD) via
[GitHub Spec Kit](https://github.com/github/spec-kit): cada funcionalidade nasce como
uma spec em `specs/NNN-nome-da-feature/` (`spec.md` → `plan.md` → `tasks.md`), segue
os princípios registrados em `.specify/memory/constitution.md`, e só é considerada
pronta depois de validada manualmente em Android e iOS.

- `docs/PRD-app-treino.md` — visão geral do produto, requisitos, stack, decisões
- `docs/criterios-aceite.md` — critério de aceite de cada requisito (RF01–RF14),
  usado como checklist de validação manual
- `specs/` — spec, plano e tarefas de cada requisito, individualmente
- `.specify/memory/constitution.md` — princípios não-negociáveis do projeto
  (TypeScript estrito, simplicidade, validação em dois aparelhos, controle de
  dependências, isolamento de dados por perfil)

## Estrutura do código

```text
src/
├── app/                  # Telas (Expo Router — roteamento por arquivo)
├── components/           # Componentes de UI reutilizáveis
├── services/              # Acesso a dados (AsyncStorage) e regras de negócio
├── types/                 # Tipos de domínio compartilhados
└── utils/                 # Funções puras auxiliares
docs/                      # PRD, critérios de aceite, exemplos de arquivo de treino
specs/                     # Specs de cada requisito (SDD)
```
