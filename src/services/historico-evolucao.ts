import { listarSessoesFinalizadas } from '@/services/sessao-treino-storage';
import { filtrarTreinosAtivos, listarTreinos } from '@/services/treino-storage';
import type { SessaoTreino } from '@/types/execucao-treino';
import type {
  BlocoSessao,
  DiaHistorico,
  EvolucaoExercicio,
  HistoricoPerfil,
  HistoricoPorData,
  RegistroExercicioNoDia,
  RegistroHistorico,
} from '@/types/historico';
import type { CategoriaExercicio } from '@/types/treino';
import { normalizarNomeExercicio } from '@/utils/normalizar-nome-exercicio';

type RegistroBruto = {
  data: string; // finalizadaEm da sessão (ISO 8601)
  sessaoId: string;
  treinoId: string;
  treinoNome: string;
  exercicioId: string;
  exercicioNome: string;
  serie: number;
  cargaKg: number;
  reps: number;
  categoria: CategoriaExercicio;
};

/**
 * Monta os registros brutos a partir do snapshot da própria sessão (spec 025,
 * FR-010) — nome do treino e nome/categoria de cada exercício não dependem
 * mais de cruzar com o `Treino` de origem, que pode ter sido alterado ou
 * arquivado depois (spec 025, US6). Compartilhado por `obterHistoricoPorPerfil`
 * (agrupa por exercício, RF08) e `obterHistoricoPorData` (agrupa por
 * dia+sessão) — evita duplicar essa lógica, incluindo o tratamento defensivo
 * de dado inconsistente (RF08 FR-013/FR-014).
 */
function construirRegistrosBrutos(sessoesFinalizadas: SessaoTreino[]): RegistroBruto[] {
  const registros: RegistroBruto[] = [];

  for (const sessao of sessoesFinalizadas) {
    for (const execucao of sessao.execucoes) {
      const exercicio = sessao.exerciciosSnapshot.find((item) => item.id === execucao.exercicioId);
      if (!exercicio) {
        console.warn(
          `[historico-evolucao] Exercício não encontrado no snapshot da sessão — treinoId=${sessao.treinoId} exercicioId=${execucao.exercicioId} sessaoId=${sessao.id}`,
        );
        continue;
      }

      for (const serie of execucao.seriesRealizadas) {
        registros.push({
          data: sessao.finalizadaEm as string,
          sessaoId: sessao.id,
          treinoId: sessao.treinoId,
          treinoNome: sessao.treinoNomeSnapshot,
          exercicioId: execucao.exercicioId,
          exercicioNome: exercicio.nome,
          serie: serie.serie,
          cargaKg: serie.cargaKg,
          reps: serie.reps,
          categoria: exercicio.categoria,
        });
      }
    }
  }

  return registros;
}

export async function obterHistoricoPorPerfil(perfilId: string): Promise<HistoricoPerfil> {
  const [treinos, sessoesFinalizadas] = await Promise.all([
    listarTreinos(perfilId),
    listarSessoesFinalizadas(perfilId),
  ]);

  if (sessoesFinalizadas.length === 0) {
    return { temSessoesFinalizadas: false };
  }

  const gruposPorChave = new Map<string, { nomeFallback: string; itens: RegistroBruto[] }>();

  // Universo de exercícios: todos os exercícios de todos os treinos ATIVOS do
  // perfil (spec 026, FR-005 — treinos arquivados não entram mais aqui), mesmo
  // os que nunca foram registrados em nenhuma sessão (FR-009 original). Os
  // registros de sessões já feitas (abaixo) continuam vindo de TODOS os
  // treinos, ativos ou arquivados, via snapshot — não dependem deste filtro.
  const treinosAtivos = filtrarTreinosAtivos(treinos);
  for (const treino of treinosAtivos) {
    for (const exercicio of treino.exercicios) {
      const chave = normalizarNomeExercicio(exercicio.nome);
      if (!gruposPorChave.has(chave)) {
        gruposPorChave.set(chave, { nomeFallback: exercicio.nome, itens: [] });
      }
    }
  }

  const registrosBrutos = construirRegistrosBrutos(sessoesFinalizadas);
  for (const registro of registrosBrutos) {
    const chave = normalizarNomeExercicio(registro.exercicioNome);
    // O grupo pode não existir ainda: antes da spec 025, sempre existia (era
    // semeado a partir do mesmo treino vivo que também nomeava os
    // registros). Agora o registro usa o nome do snapshot da sessão
    // (FR-010), que pode ter ficado diferente do treino vivo (exercício
    // renomeado/removido depois da sessão, spec 025 US6) — nesse caso o
    // universo semeado acima não previu essa chave; cria o grupo na hora,
    // em vez de presumir que ele sempre existe.
    let grupo = gruposPorChave.get(chave);
    if (!grupo) {
      grupo = { nomeFallback: registro.exercicioNome, itens: [] };
      gruposPorChave.set(chave, grupo);
    }
    grupo.itens.push(registro);
  }

  const evolucoes: EvolucaoExercicio[] = Array.from(gruposPorChave.values()).map(
    ({ nomeFallback, itens }) => {
      if (itens.length === 0) {
        return { nomeExibido: nomeFallback, registros: [] };
      }
      const itensOrdenados = [...itens].sort((a, b) => b.data.localeCompare(a.data));
      const nomeExibido = itensOrdenados[0].exercicioNome;
      const registros: RegistroHistorico[] = itensOrdenados.map(
        ({ data, cargaKg, reps, sessaoId, exercicioId, serie, categoria }) => ({
          data,
          cargaKg,
          reps,
          sessaoId,
          exercicioId,
          serie,
          categoria,
        }),
      );
      return { nomeExibido, registros };
    },
  );

  evolucoes.sort((a, b) => a.nomeExibido.localeCompare(b.nomeExibido, 'pt-BR'));

  return { temSessoesFinalizadas: true, evolucoes };
}

function chaveDiaLocal(iso: string): string {
  const d = new Date(iso);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export async function obterHistoricoPorData(perfilId: string): Promise<HistoricoPorData> {
  // Diferente de obterHistoricoPorPerfil, esta função nunca precisou de
  // `listarTreinos` para nada além de nomear registros em
  // construirRegistrosBrutos — agora que essa função lê o snapshot da
  // própria sessão (spec 025, FR-010), a leitura de treinos aqui deixou de
  // ser necessária (não há "universo de exercícios nunca registrados" na
  // visão "Por data", RF18 — só sessões que de fato aconteceram).
  const sessoesFinalizadas = await listarSessoesFinalizadas(perfilId);

  if (sessoesFinalizadas.length === 0) {
    return { temSessoesFinalizadas: false };
  }

  const registrosBrutos = construirRegistrosBrutos(sessoesFinalizadas);

  // Agrupa por sessaoId -> BlocoSessao (exercícios por exercicioId, série ordenada).
  const blocosPorSessao = new Map<
    string,
    { treinoNome: string; dataReferencia: string; exerciciosPorId: Map<string, RegistroExercicioNoDia> }
  >();
  for (const registro of registrosBrutos) {
    if (!blocosPorSessao.has(registro.sessaoId)) {
      blocosPorSessao.set(registro.sessaoId, {
        treinoNome: registro.treinoNome,
        dataReferencia: registro.data,
        exerciciosPorId: new Map(),
      });
    }
    const bloco = blocosPorSessao.get(registro.sessaoId)!;
    if (!bloco.exerciciosPorId.has(registro.exercicioId)) {
      bloco.exerciciosPorId.set(registro.exercicioId, {
        exercicioNome: registro.exercicioNome,
        categoria: registro.categoria,
        registros: [],
      });
    }
    bloco.exerciciosPorId.get(registro.exercicioId)!.registros.push({
      serie: registro.serie,
      cargaKg: registro.cargaKg,
      reps: registro.reps,
    });
  }

  const blocos: BlocoSessao[] = Array.from(blocosPorSessao.entries()).map(([sessaoId, bloco]) => ({
    sessaoId,
    treinoNome: bloco.treinoNome,
    dataReferencia: bloco.dataReferencia,
    exercicios: Array.from(bloco.exerciciosPorId.values()).map((exercicio) => ({
      ...exercicio,
      registros: [...exercicio.registros].sort((a, b) => a.serie - b.serie),
    })),
  }));

  // Agrupa BlocoSessao por chaveDia (local), ordena dias e blocos dentro do dia.
  const diasPorChave = new Map<string, { dataReferencia: string; blocos: BlocoSessao[] }>();
  for (const bloco of blocos) {
    const chave = chaveDiaLocal(bloco.dataReferencia);
    if (!diasPorChave.has(chave)) {
      diasPorChave.set(chave, { dataReferencia: bloco.dataReferencia, blocos: [] });
    }
    diasPorChave.get(chave)!.blocos.push(bloco);
  }

  const dias: DiaHistorico[] = Array.from(diasPorChave.entries())
    .map(([chaveDia, { dataReferencia, blocos: blocosDoDia }]) => ({
      chaveDia,
      dataReferencia,
      blocos: [...blocosDoDia].sort((a, b) => b.dataReferencia.localeCompare(a.dataReferencia)),
    }))
    .sort((a, b) => b.chaveDia.localeCompare(a.chaveDia));

  return { temSessoesFinalizadas: true, dias };
}
