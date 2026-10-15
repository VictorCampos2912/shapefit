# Quickstart: Indicador de Sessão em Andamento na Lista de Treinos e Remoção do Treino de Exemplo

**Feature**: `024-indicador-andamento-e-menu-acoes`

Validação manual em Android (Princípio III) — iOS permanece pendente por falta de
conta Apple Developer paga (mesma situação herdada das specs 022/023).

## Pré-requisitos

- Conta autenticada (spec 022) com pelo menos dois treinos já importados (ex.:
  "Treino A", "Treino B").
- Nenhuma mudança de dados é necessária em `docs/exemplos/` para este quickstart —
  os treinos de teste podem ser quaisquer já existentes na conta.
- **Capturas de referência (baseline), feitas em Android antes de qualquer
  alteração de código desta feature**: (1) a lista "Meus treinos" sem nenhum treino
  com sessão em andamento; (2) o menu de Ações como está hoje, com "Importar treino
  de exemplo" ainda presente. Usadas como comparação visual nos Cenários 1 e 5
  (mesmo princípio já usado pela spec 023, `tasks.md` T000) — guardadas fora do
  repositório.
- Uma segunda conta autenticada (Conta B) disponível para o Cenário 7 (isolamento
  entre contas) — qualquer conta Google de teste distinta da Conta A, sem nenhum
  treino homônimo ao da Conta A (para não confundir a leitura do cenário).

## Cenário 1 — Treino em andamento aparece destacado ao voltar para a lista (US1)

1. Na lista "Meus treinos", abrir o "Treino A" e registrar ao menos uma série de um
   exercício, sem finalizar a sessão.
2. Voltar para a lista pelo gesto/botão nativo de voltar (não existe outro caminho
   de saída dessa tela — `research.md`, Decisão 3).
3. **Esperado**: o item "Treino A" aparece com o destaque de cor/borda de aviso
   (mesmo usado hoje para "exercício em andamento" na execução) e o texto "Em
   andamento" (`contracts/lista-treinos.md`, FR-001).
4. Fechar o app completamente e reabrir.
5. **Esperado**: o destaque continua aparecendo no "Treino A" já na primeira
   exibição da lista.
6. Conferir o "Treino B" (sem sessão em andamento): **esperado** — aparece
   exatamente como antes desta feature, sem nenhum destaque (FR-002).
7. Repetir a observação do passo 3 com o tema do sistema em claro e depois em
   escuro (Configurações do Android → Tema). **Esperado**: em ambos os temas, o
   destaque de cor/borda e o texto "Em andamento" permanecem legíveis e com
   contraste adequado — mesmas cores de aviso (`theme.warning`/
   `warningBackground`) já usadas e validadas hoje por `ExercicioListItem` em
   cada tema, sem nenhuma combinação nova de cor introduzida por esta feature.
8. Comparar a lista do passo 6 (treino sem destaque) com a captura de referência
   do pré-requisito (lista antes de qualquer alteração de código). **Esperado**:
   nenhuma diferença visual perceptível — confirma que esta feature não altera a
   aparência de um item sem sessão em andamento (FR-002, SC-002).

## Cenário 2 — Múltiplos treinos em andamento ao mesmo tempo (US2)

1. Com o "Treino A" ainda em andamento (Cenário 1), abrir o "Treino B" e registrar
   ao menos uma série, sem finalizar.
2. Voltar para a lista.
3. **Esperado**: "Treino A" e "Treino B" aparecem destacados ao mesmo tempo
   (FR-003).
4. Finalizar a sessão do "Treino A" (botão "Finalizar treino" dentro da tela de
   execução) e voltar para a lista.
5. **Esperado**: só o "Treino B" continua destacado; "Treino A" voltou ao estado
   sem destaque.

## Cenário 3 — Destaque some ao finalizar, volta ao iniciar nova sessão (US3)

1. Com o "Treino B" ainda em andamento, abrir o treino e tocar em "Finalizar
   treino".
2. Voltar para a lista.
3. **Esperado**: "Treino B" não aparece mais destacado (FR-004) — e o texto
   "Finalizado em `<data/hora>`" (RF16) atualiza para a finalização recém-feita,
   confirmando que o mesmo ciclo de atualização por foco cobre as duas coisas.
4. Abrir o "Treino B" de novo e registrar uma nova série (nova sessão, RF12).
5. Voltar para a lista.
6. **Esperado**: o destaque volta a aparecer no "Treino B".

## Cenário 4 — Coexistência com anel de progresso de ciclo (edge case, FR-006)

Só aplicável se houver um ciclo de múltiplos treinos em andamento (RF15) no
momento do teste — senão, pular este cenário.

1. Iniciar uma sessão de um treino que faz parte de um ciclo com anel de
   progresso visível na lista, sem finalizar.
2. Voltar para a lista.
3. **Esperado**: o anel de progresso (RF15) e o destaque de "em andamento" (esta
   feature) aparecem juntos no mesmo item, sem um esconder o outro.

## Cenário 5 — Menu de Ações sem "Importar treino de exemplo" (US4)

1. Abrir o menu de Ações (ícone de três pontos, em qualquer uma das duas abas).
2. **Esperado**: aparecem exatamente três ações — "Sair da conta (`<email>`)",
   "Importar treino" e "Créditos do catálogo de exercícios" — sem nenhum traço de
   "Importar treino de exemplo" (FR-008, `contracts/menu-acoes.md`).
3. Tocar em "Importar treino" e importar um arquivo `.json` qualquer (ex.: um dos
   fixtures de `docs/exemplos/`, sem necessidade de criar um arquivo novo).
4. **Esperado**: o fluxo de importação funciona exatamente como antes (FR-009) —
   o treino aparece na lista normalmente.
5. Tocar em "Sair da conta" e, depois de logar de novo, confirmar que o fluxo de
   logout/login (spec 022) não mudou.
6. Tocar em "Créditos do catálogo de exercícios" e confirmar que o alerta de
   créditos (RF19/RF20) aparece sem alteração.
7. Comparar a tela do passo 2 com a captura de referência do pré-requisito (menu
   de Ações antes de qualquer alteração de código, com "Importar treino de
   exemplo" ainda presente). **Esperado**: a única diferença entre as duas é a
   ausência dessa ação — posição, espaçamento e estilo das três ações restantes
   permanecem idênticos aos da captura de referência (FR-009).

## Cenário 6 — Nenhum arquivo de `docs/exemplos/` foi tocado (verificação de código, FR-011, SC-006)

Não é um teste de UI — é uma verificação do diff desta feature antes de
considerá-la concluída:

1. Inspecionar as mudanças de arquivo desta feature (ex.: `git status`/`git diff`).
2. **Esperado**: nenhum arquivo dentro de `docs/exemplos/` aparece como alterado,
   adicionado ou removido. Só `assets/exemplos/treino-exemplo.json` (fora de
   `docs/`) é removido.

## Cenário 7 — Isolamento entre contas (Constitution, Princípio V)

Cobre o requisito NON-NEGOTIABLE de isolamento por conta — esta feature só lê dados
já segregados por `uid` (`research.md`, Decisão 2), mas vale confirmar que nenhum
destaque "vaza" entre contas diferentes no mesmo aparelho.

1. Logado na Conta A, iniciar uma sessão de um treino (sem finalizar) e confirmar
   que ele aparece destacado na lista (mesmo resultado do Cenário 1).
2. Tocar em "Sair da conta" (menu de Ações) e entrar com a Conta B.
3. **Esperado**: nenhum treino da Conta B aparece destacado — a Conta B não tem
   nenhuma sessão em andamento própria, e a sessão em andamento da Conta A (gravada
   sob a chave `sessoes:<uid da Conta A>`) não é lida nem exibida para a Conta B,
   mesmo que a Conta B tenha um treino com `treino.id` coincidente (não deveria
   acontecer na prática, já que ids são gerados por conta, mas o teste confirma que
   a leitura é sempre por `uid` da conta ativa, nunca "global").
4. Sair da Conta B e entrar de novo com a Conta A.
5. **Esperado**: o destaque do treino iniciado no passo 1 continua aparecendo,
   exatamente como antes de trocar de conta — a sessão em andamento da Conta A não
   foi afetada pela troca.

## Cenário 8 — Treinos homônimos, só um com sessão em andamento (FR-007)

1. Importar dois treinos com o mesmo `nome` (ex.: duas importações separadas de um
   arquivo chamado "Treino X", ou qualquer forma já usada pelo RF02/RF16 para criar
   homônimos — ver `docs/exemplos/treino-exemplo-duplicado.json` como ponto de
   partida, se aplicável).
2. Iniciar uma sessão em só um dos dois "Treino X" (sem finalizar) e voltar para a
   lista.
3. **Esperado**: só o item correspondente ao treino em que a sessão foi iniciada
   aparece destacado — o outro "Treino X" (mesmo nome, `treino.id` diferente)
   permanece sem destaque, confirmando que a identificação usa o identificador
   interno do treino, não o nome (FR-007). Se os dois exibirem "Finalizado em"/
   "Nunca treinado" idênticos, a data de importação como desempate (RF02/RF16)
   continua funcionando normalmente, sem interferência do destaque novo.

## Referências

- Contratos: [`contracts/lista-treinos.md`](./contracts/lista-treinos.md),
  [`contracts/menu-acoes.md`](./contracts/menu-acoes.md)
- Modelo de dados: [`data-model.md`](./data-model.md)
- Decisões técnicas: [`research.md`](./research.md)
- Critérios de aceite formais: `spec.md` (Acceptance Scenarios de cada User Story)
