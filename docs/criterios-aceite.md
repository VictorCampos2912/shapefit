# Critérios de Aceite por Requisito

Este documento complementa o PRD. Cada requisito só é considerado "pronto" quando todos
os critérios abaixo forem validados manualmente nos dois aparelhos (Redmi Note 12 e
iPhone 16 Plus), via Expo Go.

> **Ordem de implementação (atualizada na v1.1 do PRD):** o RF10 (perfil) passou a ser
> pré-requisito funcional do RF01, RF02, RF07 e RF08, que agora operam "por perfil ativo".
> Recomenda-se implementar o **RF10 primeiro**, antes do RF01.

---

## RF10 — Criar e selecionar perfil local

**Decisões:**
- Perfis são locais, sem senha ou autenticação (apenas seleção)
- Campos do perfil: nome, peso (kg), altura (cm), idade, sexo, objetivo de treino —
  **todos obrigatórios** na criação
- Campo "sexo": opções fixas **Masculino / Feminino**
- Campo "objetivo de treino": opções fixas **Hipertrofia / Emagrecimento /
  Condicionamento / Manutenção**
- Suporta múltiplos perfis no mesmo aparelho (ex: você + 1-2 familiares)
- Troca de perfil ativo é **bloqueada** enquanto houver uma sessão de treino em andamento

**Critérios de aceite:**
- [ ] Ao abrir o app pela primeira vez (nenhum perfil criado ainda), a tela de criação de
      perfil é exibida antes de qualquer outra tela
- [ ] O formulário de criação exige o preenchimento de todos os campos (nome, peso,
      altura, idade, sexo, objetivo) antes de permitir salvar o perfil
- [ ] Se algum campo obrigatório não for preenchido, o app impede o salvamento e indica
      quais campos faltam
- [ ] Após criar o perfil, ele passa a ser o perfil ativo e o app navega para a lista de
      treinos (RF02) desse perfil
- [ ] Se já existem perfis salvos, o app exibe uma lista de perfis para seleção ao abrir,
      em vez do formulário de criação
- [ ] A partir da lista de perfis, há uma opção clara para "Criar novo perfil"
- [ ] O usuário consegue trocar de perfil ativo a qualquer momento **sem** uma sessão de
      treino em andamento, sem precisar reinstalar o app
- [ ] Se houver uma sessão de treino em andamento (RF07) para o perfil ativo, a opção de
      trocar de perfil fica desabilitada ou exibe um aviso explicando que é preciso
      finalizar a sessão atual primeiro
- [ ] Ao trocar de perfil ativo, todas as telas que dependem do perfil (treinos, execução,
      histórico) atualizam imediatamente para refletir apenas os dados do novo perfil ativo
- [ ] Não existe campo de senha, PIN ou qualquer mecanismo de autenticação — qualquer
      pessoa com acesso ao aparelho pode trocar de perfil livremente (fora da restrição de
      sessão em andamento)

---

## RF01 — Importar arquivo JSON com estrutura de treino

**Decisões:**
- Importação via seleção de arquivo do sistema (`expo-document-picker`)
- App inclui um arquivo de exemplo pré-carregado para testes
- Em caso de erro parcial, o app importa o que for válido e avisa o usuário sobre o que
  falhou, sem bloquear a importação inteira
- **Novo (v1.1):** o treino importado é vinculado ao perfil ativo no momento da importação

**Critérios de aceite:**
- [ ] O treino importado é salvo associado ao `perfil_id` do perfil ativo (RF10)
- [ ] Um treino importado por um perfil não aparece para nenhum outro perfil
- [ ] O usuário consegue abrir o seletor de arquivos do sistema a partir do app e escolher
      um `.json`
- [ ] Um arquivo JSON válido (seguindo o schema da seção 8 do PRD) é importado com sucesso
      e o treino aparece na lista de treinos salvos
- [ ] Se um exercício do JSON tiver campo obrigatório faltando ou com tipo errado (ex:
      `series` como texto em vez de número), esse exercício específico é ignorado, mas o
      restante do treino é importado normalmente
- [ ] Quando há erro parcial, o app exibe uma mensagem informando que o treino foi
      importado incompleto e, se possível, qual(is) exercício(s) foram ignorados
- [ ] Se o arquivo selecionado não for um JSON válido (erro de sintaxe, arquivo
      corrompido), o app exibe mensagem de erro clara e não importa nada
- [ ] O arquivo de exemplo pré-carregado no app importa sem erros, servindo como
      referência de teste
- [ ] Se o campo `nome` do treino (nível raiz) estiver ausente, ou a lista `exercicios`
      estiver ausente/vazia, o arquivo é tratado como inválido (mesmo tratamento de um
      JSON malformado) — a importação inteira é rejeitada, sem criar treino algum
- [ ] Se, após a validação individual de cada exercício, nenhum exercício válido restar,
      o app não cria um treino vazio — trata como falha de importação e informa que
      nenhum exercício válido foi encontrado
- [ ] Se o usuário cancelar a seleção de arquivo no seletor do sistema, nenhuma ação
      ocorre — sem mensagem de erro, sem alteração na lista de treinos

---

## RF02 — Listar treinos importados/salvos

**Decisões:**
- Múltiplos treinos podem ficar salvos ao mesmo tempo (ex: Treino A, B, C de uma rotina)
- O usuário escolhe qual treino executar a cada sessão
- **Novo (v1.1):** a lista exibida é sempre filtrada pelo perfil ativo
- **Nota da especificação do RF01:** como o RF01 foi implementado antes do RF02, foi
  criado um botão provisório "Importar treino" na tela inicial (`(tabs)/index.tsx`) só
  para tornar a importação testável. Ao especificar o RF02, revisar/remover esse ponto de
  entrada temporário e integrá-lo à tela de lista de treinos definitiva

**Critérios de aceite:**
- [ ] A lista exibida contém apenas os treinos vinculados ao perfil ativo no momento
- [ ] Trocar de perfil ativo (RF10) atualiza esta lista imediatamente, sem precisar
      reabrir o app
- [ ] Todos os treinos importados aparecem em uma lista, identificados pelo campo `nome`
      do JSON
- [ ] Importar um novo treino não substitui nem apaga os treinos já salvos
- [ ] O usuário consegue tocar em um treino da lista para abri-lo (preparando a transição
      para o RF03 — execução)
- [ ] Se dois treinos importados tiverem o mesmo `nome`, ambos aparecem na lista, exibindo
      a data/hora de importação junto ao nome para diferenciá-los
- [ ] A lista persiste entre sessões do app (fechar e reabrir o app não apaga os treinos
      importados)
- [ ] Se o perfil ativo ainda não importou nenhum treino, a tela exibe uma indicação clara
      disso (não uma lista vazia sem explicação), com a ação de importar visível e
      acessível a partir desse estado
- [ ] A ação de importar treino fica disponível **somente** a partir desta tela — não
      existe mais em nenhuma outra tela do app (substitui o ponto de entrada provisório
      criado no RF01)

---

## RF03 — Tela de execução: exibir exercício, série, campos de carga e reps

**Decisões:**
- Carga registrada em kg, com casas decimais (ex: 42.5)
- A navegação entre exercícios não é estritamente sequencial: o usuário escolhe qual
  exercício fazer a seguir, útil quando o equipamento do próximo exercício planejado não
  está disponível

**Critérios de aceite:**
- [ ] Ao abrir um treino (vindo da lista do RF02), o app exibe a lista de exercícios do
      treino com seus dados planejados (séries, reps_alvo, carga_sugerida_kg, descanso_seg)
- [ ] O usuário consegue selecionar qualquer exercício da lista para iniciar, não apenas o
      primeiro
- [ ] Ao abrir um exercício, o app exibe um botão "Iniciar exercício"
- [ ] Durante a execução, há campos para registrar **carga (kg, com decimal)** e
      **repetições feitas** para a série atual
- [ ] O campo de carga aceita valores decimais (ex: 42.5) e rejeita entrada não numérica
- [ ] O campo de carga é pré-preenchido com o valor de `carga_sugerida_kg` do JSON, editável
      pelo usuário
- [ ] O app indica visualmente qual série está em andamento (ex: "Série 2 de 4")
- [ ] O campo de repetições feitas aceita apenas números inteiros não negativos (diferente
      do campo de carga, que aceita decimal)
- [ ] Se `carga_sugerida_kg` estiver ausente ou zero no JSON do exercício, o campo de
      carga é exibido vazio (não trava a tela), permanecendo editável normalmente
- [ ] O campo de repetições feitas não é restringido ao intervalo de `reps_alvo` — aceita
      qualquer valor informado pelo usuário, já que `reps_alvo` é apenas uma meta
      planejada, não um limite de validação

---

## RF04 — Avançar entre séries e exercícios

**Decisões:**
- Fluxo por série: preencher carga/reps → "Concluir série" → inicia descanso automaticamente
  (ver RF05)
- Ao concluir a última série planejada de um exercício, habilita "Concluir exercício"
- Após concluir um exercício, o usuário escolhe livremente qual exercício fazer a seguir
  (sugestão padrão: o próximo da lista, mas não obrigatório)

**Critérios de aceite:**
- [ ] O botão "Concluir série" só fica habilitado quando os campos de carga e reps estão
      preenchidos
- [ ] Ao tocar em "Concluir série", os dados são registrados e o cronômetro de descanso
      inicia automaticamente (ver RF05)
- [ ] Após concluir todas as séries planejadas de um exercício, o botão "Concluir
      exercício" fica habilitado
- [ ] Ao concluir um exercício, o app volta para a lista de exercícios do treino, com o
      exercício concluído marcado visualmente (ex: check ✓)
- [ ] O usuário consegue selecionar qualquer exercício ainda não concluído para ser o
      próximo, não apenas o seguinte na ordem do JSON
- [ ] Se o usuário sair da tela de execução e voltar (ou fechar e reabrir o app) antes de
      concluir o treino, o progresso das séries já registradas é mantido — retomando
      exatamente de onde parou (isso implica persistência de sessão **em andamento**, não
      só ao final — ver RF07)

---

## RF05 — Cronômetro de descanso

**Decisões:**
- Inicia automaticamente ao concluir uma série (ver RF04)
- Duração padrão vem do `descanso_seg` do JSON, mas o usuário pode ajustar durante a
  contagem em incrementos de 15s (+/-)

**Critérios de aceite:**
- [ ] Ao tocar em "Concluir série", o cronômetro de descanso inicia automaticamente, sem
      ação extra do usuário
- [ ] O tempo inicial exibido corresponde ao `descanso_seg` do exercício no JSON
- [ ] O usuário consegue adicionar ou remover 15 segundos do tempo restante a qualquer
      momento durante a contagem, quantas vezes quiser
- [ ] O cronômetro continua contando corretamente mesmo se o usuário navegar para outra
      tela do app durante o descanso (ex: consultar histórico)
- [ ] Se o app for minimizado (segundo plano) durante o descanso, o tempo restante ao
      voltar para o app reflete o tempo real decorrido, não pausa artificialmente
- [ ] Ao chegar a zero, o cronômetro para e aciona o aviso (ver RF06)

---

## RF06 — Notificação de fim do descanso

**Decisões:**
- Aviso por som **e** vibração juntos

**Critérios de aceite:**
- [ ] Ao término do descanso, o app emite um som e uma vibração simultaneamente
- [ ] O aviso funciona mesmo se o celular estiver com a tela bloqueada, desde que o app
      não tenha sido fechado (apenas minimizado)
- [ ] O aviso sonoro respeita o volume de notificação do sistema (não devia tocar em modo
      silencioso, exceto pela vibração)
- [ ] Após o aviso, o app exibe claramente que o descanso terminou e libera o próximo
      registro de série

---

## RF07 — Salvar sessão de treino (completa e em andamento)

**Decisões:**
- Sessão é marcada como concluída automaticamente ao concluir o último exercício, **ou**
  manualmente a qualquer momento via botão "Finalizar treino"
- Progresso em andamento persiste entre fechamentos do app (herdado do RF04/RF05)
- **Novo (v1.1):** a sessão é vinculada ao perfil que estava ativo quando o treino foi
  iniciado

**Critérios de aceite:**
- [ ] A sessão salva (em andamento ou finalizada) é vinculada ao `perfil_id` ativo no
      momento em que a execução do treino foi iniciada
- [ ] A sessão é marcada como concluída automaticamente quando todos os exercícios do
      treino são concluídos
- [ ] Existe um botão "Finalizar treino" acessível a qualquer momento durante a execução,
      permitindo encerrar a sessão mesmo com exercícios pendentes
- [ ] Ao finalizar manualmente com exercícios pendentes, apenas as séries já registradas
      são salvas — exercícios não iniciados não geram registro vazio no histórico
- [ ] Uma sessão em andamento (não finalizada) persiste ao fechar e reabrir o app,
      retomando de onde parou
- [ ] Uma sessão finalizada é salva permanentemente e passa a aparecer no histórico (RF08)
- [ ] Depois de finalizar uma sessão, o usuário consegue iniciar uma nova sessão
      (do mesmo treino ou de outro) sem qualquer resquício da sessão anterior

---

## RF08 — Histórico de evolução por exercício

**Decisões:**
- Exibição em lista simples com valores por data (sem gráfico no MVP)
- **Novo (v1.1):** o histórico exibido é sempre filtrado pelo perfil ativo

**Critérios de aceite:**
- [ ] O histórico exibido contém apenas registros de sessões do perfil ativo
- [ ] Trocar de perfil ativo (RF10) atualiza o histórico exibido imediatamente
- [ ] O usuário consegue consultar, por exercício, uma lista dos registros anteriores
      (data, carga em kg, reps)
- [ ] A lista é ordenada da mais recente para a mais antiga
- [ ] Apenas sessões **finalizadas** aparecem no histórico (sessões em andamento não
      contam)
- [ ] Se um exercício nunca foi registrado antes, a tela de histórico indica isso de forma
      clara (em vez de aparecer vazia sem explicação)

---

## RF09 — Editar registro de série já feito

**Decisões:**
- Edição vale tanto para a sessão atual (em andamento) quanto para sessões já finalizadas
  no passado

**Critérios de aceite:**
- [ ] O usuário consegue editar carga e/ou reps de qualquer série já registrada, seja da
      sessão em andamento ou de uma sessão finalizada no histórico
- [ ] A edição de uma série em uma sessão já finalizada não reabre a sessão como "em
      andamento" — ela continua finalizada, apenas com o valor daquela série atualizado
- [ ] Após editar, o novo valor é refletido imediatamente na tela de histórico (RF08)
- [ ] O app pede confirmação antes de salvar uma edição, para evitar alteração acidental
      de dados de treinos passados

---

## Resumo — todos os requisitos com critérios definidos

RF01 a RF10 concluídos. Este documento, junto com o PRD v1.1, está pronto para ser usado
como contexto no `/speckit.specify` de cada requisito.

**Ordem recomendada de implementação:** RF10 → RF01 → RF02 → RF03 → RF04 → RF05 → RF06 →
RF07 → RF08 → RF09.
