# Contract: `src/components/treino/exercicio-execucao.tsx` (RF03/04, RF09a — alterado)

**Feature**: `017-categorias-exercicio`

Contrato interno (props/comportamento de componente — não há API HTTP nesta
feature). Usa `src/utils/categoria-exercicio.ts`
(`categoria-exercicio-util.md`) — nenhuma tabela de rótulo local.

## Pontos alterados (mesma assinatura de props — `ExercicioExecucaoProps` não muda)

1. **Linha de resumo do exercício** (hoje `"{series}x {repsAlvo} · sugestão
   {cargaSugeridaKg}kg · {descansoSeg}s descanso"`): o sufixo `"kg"` passa a ser
   `SUFIXO_VALOR[exercicio.categoria]`; quando `!exibeCampoPrincipal(exercicio.categoria)`
   (categoria `'repeticoes'`), o trecho `"sugestão {cargaSugeridaKg}{sufixo}"`
   inteiro é omitido dessa linha (não faz sentido mostrar um valor sem unidade).

2. **Campo principal da série atual** (hoje sempre renderizado, rótulo fixo
   `"Carga (kg)"`): renderizado condicionalmente —
   `exibeCampoPrincipal(exercicio.categoria)` controla se o bloco aparece;
   `ROTULO_CAMPO_PRINCIPAL[exercicio.categoria]` substitui o texto fixo
   `"Carga (kg)"`. Mesmo `TextInput`/`onChangeText={handleAlterarCarga}` já
   existente — só o rótulo e a visibilidade mudam, não o campo de estado
   (`estado.cargaKg`, sem renomear — `research.md`, Decisão 1).

3. **`podeConcluirSerie`**: passa de
   `estado.cargaKg.trim().length > 0 && estado.repsFeitas.trim().length > 0` para:
   ```ts
   const podeConcluirSerie =
     (!exibeCampoPrincipal(exercicio.categoria) || estado.cargaKg.trim().length > 0) &&
     estado.repsFeitas.trim().length > 0;
   ```

4. **Bloco de edição de série já concluída** (`renderSeriesConcluidas`, RF09a):
   mesmo tratamento dos itens 2 e 3 — rótulo dinâmico, campo principal condicional,
   `podeSalvarEdicao` ajustado da mesma forma que `podeConcluirSerie`.

5. **Exibição de série concluída** (hoje `"Série {n}: {cargaKg}kg × {reps} reps"`):
   quando `exibeCampoPrincipal`, usa `SUFIXO_VALOR[categoria]` no lugar de `"kg"`
   fixo (`"Série {n}: {cargaKg}{sufixo} × {reps} reps"`); quando não
   (`'repeticoes'`), o trecho `"{cargaKg}{sufixo} × "` é omitido — mostra só
   `"Série {n}: {reps} reps"`.

6. **`handleIniciarExercicio`**: sem mudança de lógica — continua fazendo
   `cargaKg: String(exercicio.cargaSugeridaKg)` mesmo para categorias onde esse
   campo não é exibido (`'repeticoes'`); inofensivo, já que o campo não aparece na
   UI e não é lido por `handleConcluirSerie`/`podeConcluirSerie` nesse caso.

7. **Edição de série concluída, categoria `'repeticoes'`** (RF09a): o formulário de
   edição (`EdicaoSerieEmAndamento`) não exibe o campo principal; ao salvar,
   `handleSalvarEdicaoSerie` envia `cargaKg: serieRealizada.cargaKg` (valor já
   existente daquela série, não editado) em vez de `Number(edicaoSerie.cargaKg)` —
   `research.md`, Decisão 6.

## Sem mudança de assinatura

`ExercicioExecucaoProps` não ganha nenhum prop novo — `exercicio: ExercicioPlanejado`
já passa a carregar `categoria` (spec 017, `data-model.md`), suficiente para todas
as adaptações acima.
