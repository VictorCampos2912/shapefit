import { collection, doc, getDocs, getFirestore, setDoc, writeBatch } from '@react-native-firebase/firestore';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';

import treinoExemplo from '@/assets/exemplos/treino-exemplo.json';
import { calcularProgressoCiclo, criarCiclo, obterCicloAtual } from '@/services/ciclo-treino-storage';
import type {
  CategoriaExercicio,
  ExercicioIgnorado,
  ExercicioPlanejado,
  ResultadoImportacao,
  ResultadoImportacaoMultipla,
  Treino,
  TreinoImportadoComPendencias,
} from '@/types/treino';

const CATEGORIAS_VALIDAS: CategoriaExercicio[] = ['peso', 'tempo', 'distancia', 'repeticoes'];

function treinosCollection(uid: string) {
  return collection(getFirestore(), 'users', uid, 'treinos');
}

async function setDocTreino(uid: string, treino: Treino): Promise<void> {
  await setDoc(doc(treinosCollection(uid), treino.id), treino);
}

export async function listarTreinos(uid: string): Promise<Treino[]> {
  const snapshot = await getDocs(treinosCollection(uid));
  // Treinos importados antes da RF17 (categorias) não têm `categoria` persistida —
  // normaliza para o mesmo default já aplicado na importação ('peso'), sem exigir
  // migração de dados nem reescrever o storage.
  return snapshot.docs.map((documento) => {
    const treino = documento.data() as Treino;
    return {
      ...treino,
      exercicios: treino.exercicios.map((exercicio) => ({
        ...exercicio,
        categoria: exercicio.categoria ?? 'peso',
      })),
    };
  });
}

function validarExercicio(
  bruto: unknown,
  indice: number,
): { ok: true; exercicio: ExercicioPlanejado } | { ok: false; motivo: string } {
  if (typeof bruto !== 'object' || bruto === null) {
    return { ok: false, motivo: `Exercício ${indice}: formato inválido` };
  }

  const item = bruto as Record<string, unknown>;

  if (typeof item.id !== 'string' || item.id.trim().length === 0) {
    return { ok: false, motivo: `Exercício ${indice}: campo "id" ausente ou inválido` };
  }
  if (typeof item.nome !== 'string' || item.nome.trim().length === 0) {
    return { ok: false, motivo: `Exercício ${indice}: campo "nome" ausente ou inválido` };
  }
  if (typeof item.series !== 'number') {
    return { ok: false, motivo: `Exercício ${indice}: campo "series" deve ser numérico` };
  }
  if (typeof item.reps_alvo !== 'string' || item.reps_alvo.trim().length === 0) {
    return { ok: false, motivo: `Exercício ${indice}: campo "reps_alvo" ausente ou inválido` };
  }
  if (typeof item.carga_sugerida_kg !== 'number') {
    return { ok: false, motivo: `Exercício ${indice}: campo "carga_sugerida_kg" deve ser numérico` };
  }
  if (typeof item.descanso_seg !== 'number') {
    return { ok: false, motivo: `Exercício ${indice}: campo "descanso_seg" deve ser numérico` };
  }
  if (item.categoria !== undefined) {
    if (typeof item.categoria !== 'string' || !CATEGORIAS_VALIDAS.includes(item.categoria as CategoriaExercicio)) {
      return { ok: false, motivo: `Exercício ${indice}: campo "categoria" inválido` };
    }
  }

  return {
    ok: true,
    exercicio: {
      id: item.id,
      nome: item.nome,
      series: item.series,
      repsAlvo: item.reps_alvo,
      cargaSugeridaKg: item.carga_sugerida_kg,
      descansoSeg: item.descanso_seg,
      categoria: (item.categoria as CategoriaExercicio | undefined) ?? 'peso',
    },
  };
}

function validarEstruturaTreino(
  bruto: unknown,
): { ok: true; nome: string; exerciciosBrutos: unknown[] } | { ok: false; motivo: string } {
  if (typeof bruto !== 'object' || bruto === null) {
    return { ok: false, motivo: 'O arquivo não contém um treino reconhecível.' };
  }

  const raiz = bruto as Record<string, unknown>;

  if (typeof raiz.nome !== 'string' || raiz.nome.trim().length === 0) {
    return { ok: false, motivo: 'O treino não tem um nome válido.' };
  }
  if (!Array.isArray(raiz.exercicios) || raiz.exercicios.length === 0) {
    return { ok: false, motivo: 'O treino não contém nenhum exercício.' };
  }

  return { ok: true, nome: raiz.nome.trim(), exerciciosBrutos: raiz.exercicios };
}

type ResultadoMontagemTreino =
  | { ok: true; treino: Treino; exerciciosIgnorados: ExercicioIgnorado[] }
  | { ok: false; nome: string | null; motivo: string };

/**
 * Valida e monta um único treino a partir de um valor bruto (um elemento do array,
 * ou o objeto único na raiz do arquivo) — função pura, não lê nem escreve
 * AsyncStorage. Reaproveitada tanto pelo caminho de treino único quanto pelo de
 * múltiplos treinos (specs/012-importar-multiplos-treinos).
 */
function montarTreinoValido(bruto: unknown): ResultadoMontagemTreino {
  const estrutura = validarEstruturaTreino(bruto);
  if (!estrutura.ok) {
    return { ok: false, nome: null, motivo: estrutura.motivo };
  }

  const exerciciosIgnorados: ExercicioIgnorado[] = [];
  const exercicios: ExercicioPlanejado[] = [];

  estrutura.exerciciosBrutos.forEach((exercicioBruto, indice) => {
    const resultado = validarExercicio(exercicioBruto, indice);
    if (resultado.ok) {
      exercicios.push(resultado.exercicio);
    } else {
      exerciciosIgnorados.push({ indice, motivo: resultado.motivo });
    }
  });

  if (exercicios.length === 0) {
    return {
      ok: false,
      nome: estrutura.nome,
      motivo: 'Nenhum exercício válido foi encontrado no arquivo.',
    };
  }

  const treino: Treino = {
    id: Crypto.randomUUID(),
    nome: estrutura.nome,
    exercicios,
    importadoEm: new Date().toISOString(),
  };

  return { ok: true, treino, exerciciosIgnorados };
}

async function processarConteudoObjeto(bruto: unknown, uid: string): Promise<ResultadoImportacao> {
  const resultado = montarTreinoValido(bruto);
  if (!resultado.ok) {
    return { treino: null, exerciciosIgnorados: [], erro: resultado.motivo };
  }

  await setDocTreino(uid, resultado.treino);

  return { treino: resultado.treino, exerciciosIgnorados: resultado.exerciciosIgnorados, erro: null };
}

async function processarConteudoArray(bruto: unknown[], uid: string): Promise<ResultadoImportacaoMultipla> {
  if (bruto.length === 0) {
    return { treinos: [], treinosIgnorados: [], erro: 'O arquivo não contém nenhum treino.' };
  }

  // Bloqueio por ciclo em andamento (RF17, FR-007) — checagem por tamanho bruto do
  // array, antes de qualquer validação, para falhar rápido e não persistir nada
  // (tudo ou nada) enquanto o ciclo atual da conta ainda não atingiu 40 sessões.
  // Ciclo de progresso (RF15) continua em AsyncStorage, chaveado por uid (FR-012).
  if (bruto.length >= 2) {
    const cicloAtual = await obterCicloAtual(uid);
    if (cicloAtual) {
      const { totalFinalizado } = await calcularProgressoCiclo(uid, cicloAtual);
      if (totalFinalizado < 40) {
        return {
          treinos: [],
          treinosIgnorados: [],
          erro:
            'Já existe um ciclo de treinos em andamento. Finalize as 40 sessões esperadas antes de importar um novo lote de múltiplos treinos.',
        };
      }
    }
  }

  const treinos: TreinoImportadoComPendencias[] = [];
  const treinosIgnorados: ResultadoImportacaoMultipla['treinosIgnorados'] = [];

  for (const item of bruto) {
    const resultado = montarTreinoValido(item);
    if (resultado.ok) {
      treinos.push({ treino: resultado.treino, exerciciosIgnorados: resultado.exerciciosIgnorados });
    } else {
      treinosIgnorados.push({ nome: resultado.nome, motivo: resultado.motivo });
    }
  }

  if (treinos.length > 0) {
    // Escrita em lote (tudo ou nada) — equivalente Firestore do antigo
    // setTreinosState único em AsyncStorage.
    const lote = writeBatch(getFirestore());
    treinos.forEach((item) => {
      lote.set(doc(treinosCollection(uid), item.treino.id), item.treino);
    });
    await lote.commit();

    // Cria o ciclo de progresso (RF17, FR-001) só quando 2+ treinos de fato
    // validaram — um array com só 1 treino válido não é um lote de múltiplos.
    if (treinos.length >= 2) {
      await criarCiclo(uid, treinos.map((item) => item.treino.id));
    }
  }

  return { treinos, treinosIgnorados, erro: null };
}

async function processarConteudo(
  conteudo: string,
  uid: string,
): Promise<ResultadoImportacao | ResultadoImportacaoMultipla> {
  let bruto: unknown;
  try {
    bruto = JSON.parse(conteudo);
  } catch {
    return { treino: null, exerciciosIgnorados: [], erro: 'O arquivo selecionado não é um JSON válido.' };
  }

  if (Array.isArray(bruto)) {
    return processarConteudoArray(bruto, uid);
  }

  return processarConteudoObjeto(bruto, uid);
}

export async function importarTreino(
  uid: string,
): Promise<ResultadoImportacao | ResultadoImportacaoMultipla | null> {
  const resultado = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (resultado.canceled || resultado.assets.length === 0) {
    return null;
  }

  const conteudo = await (await fetch(resultado.assets[0].uri)).text();
  return processarConteudo(conteudo, uid);
}

export async function importarTreinoExemplo(
  uid: string,
): Promise<ResultadoImportacao | ResultadoImportacaoMultipla> {
  const conteudo = JSON.stringify(treinoExemplo);
  return processarConteudo(conteudo, uid);
}
