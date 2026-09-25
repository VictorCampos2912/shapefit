import { listarSessoesFinalizadas } from '@/services/sessao-treino-storage';
import { listarTreinos } from '@/services/treino-storage';
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
import type { CategoriaExercicio, Treino } from '@/types/treino';
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
 * Cruzamento sessão→treino→exercício, compartilhado por `obterHistoricoPorPerfil`
 * (agrupa por exercício, RF08) e `obterHistoricoPorData` (agrupa por dia+sessão) —
 * evita duplicar essa lógica, incluindo o tratamento defensivo de dado
 * inconsistente (RF08 FR-013/FR-014).
 */
function construirRegistrosBrutos(treinos: Treino[], sessoesFinalizadas: SessaoTreino[]): RegistroBruto[] {
  const treinosPorId = new Map<string, Treino>(treinos.map((treino) => [treino.id, treino]));
  const registros: RegistroBruto[] = [];

  for (const sessao of sessoesFinalizadas) {
    const treino = treinosPorId.get(sessao.treinoId);
    if (!treino) {
      console.warn(
        `[historico-evolucao] Treino não encontrado ao montar histórico — treinoId=${sessao.treinoId} sessaoId=${sessao.id}`,
      );
      continue;
    }

    for (const execucao of sessao.execucoes) {
      const exercicio = treino.exercicios.find((item) => item.id === execucao.exercicioId);
      if (!exercicio) {
        console.warn(
          `[historico-evolucao] Exercício não encontrado ao montar histórico — treinoId=${sessao.treinoId} exercicioId=${execucao.exercicioId} sessaoId=${sessao.id}`,
        );
        continue;
      }

      for (const serie of execucao.seriesRealizadas) {
        registros.push({
          data: sessao.finalizadaEm as string,
          sessaoId: sessao.id,
          treinoId: sessao.treinoId,
          treinoNome: treino.nome,
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

  // Universo de exercícios: todos os exercícios de todos os treinos do perfil,
  // mesmo os que nunca foram registrados em nenhuma sessão (FR-009).
  for (const treino of treinos) {
    for (const exercicio of treino.exercicios) {
      const chave = normalizarNomeExercicio(exercicio.nome);
      if (!gruposPorChave.has(chave)) {
        gruposPorChave.set(chave, { nomeFallback: exercicio.nome, itens: [] });
      }
    }
  }

  const registrosBrutos = construirRegistrosBrutos(treinos, sessoesFinalizadas);
  for (const registro of registrosBrutos) {
    const chave = normalizarNomeExercicio(registro.exercicioNome);
    // O grupo sempre existe: foi semeado a partir dos exercícios deste mesmo treino, acima.
    const grupo = gruposPorChave.get(chave)!;
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
  const [treinos, sessoesFinalizadas] = await Promise.all([
    listarTreinos(perfilId),
    listarSessoesFinalizadas(perfilId),
  ]);

  if (sessoesFinalizadas.length === 0) {
    return { temSessoesFinalizadas: false };
  }

  const registrosBrutos = construirRegistrosBrutos(treinos, sessoesFinalizadas);

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
