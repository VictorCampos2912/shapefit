import { listarSessoesFinalizadas } from '@/services/sessao-treino-storage';
import { listarTreinos } from '@/services/treino-storage';
import type { EvolucaoExercicio, HistoricoPerfil, RegistroHistorico } from '@/types/historico';
import type { Treino } from '@/types/treino';
import { normalizarNomeExercicio } from '@/utils/normalizar-nome-exercicio';

type ItemDeTrabalho = RegistroHistorico & { nomeOriginal: string };

export async function obterHistoricoPorPerfil(perfilId: string): Promise<HistoricoPerfil> {
  const [treinos, sessoesFinalizadas] = await Promise.all([
    listarTreinos(perfilId),
    listarSessoesFinalizadas(perfilId),
  ]);

  if (sessoesFinalizadas.length === 0) {
    return { temSessoesFinalizadas: false };
  }

  const treinosPorId = new Map<string, Treino>(treinos.map((treino) => [treino.id, treino]));
  const gruposPorChave = new Map<string, { nomeFallback: string; itens: ItemDeTrabalho[] }>();

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

  for (const sessao of sessoesFinalizadas) {
    const treino = treinosPorId.get(sessao.treinoId);
    if (!treino) {
      console.warn(
        `[historico-evolucao] Treino não encontrado ao montar histórico — perfilId=${perfilId} treinoId=${sessao.treinoId} sessaoId=${sessao.id}`,
      );
      continue;
    }

    for (const execucao of sessao.execucoes) {
      const exercicio = treino.exercicios.find((item) => item.id === execucao.exercicioId);
      if (!exercicio) {
        console.warn(
          `[historico-evolucao] Exercício não encontrado ao montar histórico — perfilId=${perfilId} treinoId=${sessao.treinoId} exercicioId=${execucao.exercicioId} sessaoId=${sessao.id}`,
        );
        continue;
      }

      const chave = normalizarNomeExercicio(exercicio.nome);
      // O grupo sempre existe: foi semeado a partir dos exercícios deste mesmo treino, acima.
      const grupo = gruposPorChave.get(chave)!;
      for (const serie of execucao.seriesRealizadas) {
        grupo.itens.push({
          data: sessao.finalizadaEm as string,
          cargaKg: serie.cargaKg,
          reps: serie.reps,
          nomeOriginal: exercicio.nome,
        });
      }
    }
  }

  const evolucoes: EvolucaoExercicio[] = Array.from(gruposPorChave.values()).map(
    ({ nomeFallback, itens }) => {
      if (itens.length === 0) {
        return { nomeExibido: nomeFallback, registros: [] };
      }
      const itensOrdenados = [...itens].sort((a, b) => b.data.localeCompare(a.data));
      const nomeExibido = itensOrdenados[0].nomeOriginal;
      const registros: RegistroHistorico[] = itensOrdenados.map(({ data, cargaKg, reps }) => ({
        data,
        cargaKg,
        reps,
      }));
      return { nomeExibido, registros };
    },
  );

  evolucoes.sort((a, b) => a.nomeExibido.localeCompare(b.nomeExibido, 'pt-BR'));

  return { temSessoesFinalizadas: true, evolucoes };
}
