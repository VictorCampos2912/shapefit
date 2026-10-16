import { collection, doc, getDocs, getFirestore, setDoc } from '@react-native-firebase/firestore';
import * as Crypto from 'expo-crypto';

import { listarSessoes } from '@/services/sessao-treino-storage';
import type { CicloTreino } from '@/types/ciclo-treino';

const TOTAL_ESPERADO_CICLO = 40;

function ciclosCollection(uid: string) {
  return collection(getFirestore(), 'users', uid, 'ciclos');
}

// Sem await de propósito (spec 025, FR-021) — mesmo padrão de setDocSessao em
// sessao-treino-storage.ts.
function setDocCiclo(uid: string, ciclo: CicloTreino): void {
  setDoc(doc(ciclosCollection(uid), ciclo.id), ciclo).catch((erro) => {
    console.error('[ciclo-treino-storage] Falha ao confirmar ciclo no servidor (já salvo no cache local):', erro);
  });
}

async function listarCiclos(uid: string): Promise<CicloTreino[]> {
  const snapshot = await getDocs(ciclosCollection(uid));
  const ciclos = snapshot.docs.map((documento) => documento.data() as CicloTreino);
  return ciclos.sort((a, b) => {
    if (a.criadoEm !== b.criadoEm) {
      return a.criadoEm < b.criadoEm ? -1 : 1;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/**
 * Distribui as 40 sessões esperadas do ciclo entre os treinos do lote da forma
 * mais equilibrada possível — os primeiros `resto` treinos (na ordem em que
 * aparecem no arquivo) recebem 1 sessão a mais que os demais.
 */
function calcularCotaPorTreino(treinoIds: string[]): Record<string, number> {
  const base = Math.floor(TOTAL_ESPERADO_CICLO / treinoIds.length);
  const resto = TOTAL_ESPERADO_CICLO % treinoIds.length;
  const cota: Record<string, number> = {};
  treinoIds.forEach((id, indice) => {
    cota[id] = base + (indice < resto ? 1 : 0);
  });
  return cota;
}

/** Cria e persiste um novo ciclo para o lote de treinos informado. */
export async function criarCiclo(uid: string, treinoIds: string[]): Promise<CicloTreino> {
  const ciclo: CicloTreino = {
    id: Crypto.randomUUID(),
    uid,
    treinoIds,
    cotaPorTreinoId: calcularCotaPorTreino(treinoIds),
    criadoEm: new Date().toISOString(),
  };
  setDocCiclo(uid, ciclo);
  return ciclo;
}

/** Último ciclo criado para a conta (o "ciclo atual"), ou `null` se nenhum. */
export async function obterCicloAtual(uid: string): Promise<CicloTreino | null> {
  const ciclos = await listarCiclos(uid);
  return ciclos.length > 0 ? ciclos[ciclos.length - 1] : null;
}

/** Progresso do ciclo, derivado das sessões finalizadas já persistidas — nunca em cache. */
export async function calcularProgressoCiclo(
  uid: string,
  ciclo: CicloTreino,
): Promise<{ totalFinalizado: number; porTreino: Record<string, number> }> {
  // 1 leitura da coleção inteira de sessões, não 1 por treino do ciclo
  // (spec 025, research.md Decisão 7).
  const sessoes = await listarSessoes(uid);
  const porTreino: Record<string, number> = {};
  let totalFinalizado = 0;
  for (const treinoId of ciclo.treinoIds) {
    const contagem = sessoes.filter(
      (sessao) => sessao.treinoId === treinoId && sessao.finalizadaEm !== null,
    ).length;
    porTreino[treinoId] = contagem;
    totalFinalizado += contagem;
  }
  return { totalFinalizado, porTreino };
}

/** Fração 0-1 para o `ProgressRing` — satura em 1 quando a cota já foi ultrapassada. */
export function cotaComoFracao(sessoesFinalizadas: number, cota: number): number {
  if (cota <= 0) return 0;
  return Math.min(1, sessoesFinalizadas / cota);
}
