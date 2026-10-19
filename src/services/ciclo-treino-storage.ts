import { collection, doc, getDocs, getFirestore, setDoc, updateDoc } from '@react-native-firebase/firestore';
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
  // Ciclos criados antes desta spec (026) não têm `encerradoEm` persistido —
  // normaliza para `null` (ativo), mesmo raciocínio de `categoria`/`arquivadoEm`
  // em treino-storage.ts.
  const ciclos = snapshot.docs.map((documento) => {
    const ciclo = documento.data() as CicloTreino;
    return { ...ciclo, encerradoEm: ciclo.encerradoEm ?? null };
  });
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
    encerradoEm: null,
  };
  setDocCiclo(uid, ciclo);
  return ciclo;
}

/**
 * Último ciclo criado para a conta — e só esse — se ainda não foi
 * encerrado manualmente (o "ciclo atual"); `null` se não houver ciclo
 * nenhum ou se o último já estiver encerrado. Mesma assinatura e retorno
 * de antes; mudança só interna.
 *
 * NUNCA cai para um ciclo anterior: filtrar todos os ciclos com
 * `encerradoEm === null` e pegar o último desses (desenho anterior, bug
 * encontrado antes de implementar a US3) reabriria como "atual" um ciclo
 * antigo que já tinha chegado a 40 sessões mas nunca foi marcado como
 * encerrado (não existe encerramento automático ao bater 40 — "Encerrar
 * ciclo" é sempre manual) — no momento em que o ciclo mais novo fosse
 * encerrado, o mais antigo "ainda aberto" voltaria a ser considerado
 * atual. Correto: olhar só o último criado; se ele estiver encerrado, não
 * há ciclo atual, ponto final.
 */
export async function obterCicloAtual(uid: string): Promise<CicloTreino | null> {
  const ciclos = await listarCiclos(uid);
  if (ciclos.length === 0) {
    return null;
  }
  const ultimo = ciclos[ciclos.length - 1];
  return ultimo.encerradoEm === null ? ultimo : null;
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

/**
 * Encerra manualmente o ciclo atual (spec 026, FR-007/FR-008/FR-009) —
 * SEM leitura: o chamador já passa `cicloId` (já tem `cicloAtual.id` em
 * memória). `updateDoc` de um único campo (`encerradoEm`) — nenhuma
 * sessão é tocada. Síncrona, sem retorno; `.catch` só loga.
 */
export function encerrarCiclo(uid: string, cicloId: string): void {
  updateDoc(doc(ciclosCollection(uid), cicloId), { encerradoEm: new Date().toISOString() }).catch((erro) => {
    console.error('[ciclo-treino-storage] Falha ao confirmar encerramento no servidor (já salvo no cache local):', erro);
  });
}

/** Fração 0-1 para o `ProgressRing` — satura em 1 quando a cota já foi ultrapassada. */
export function cotaComoFracao(sessoesFinalizadas: number, cota: number): number {
  if (cota <= 0) return 0;
  return Math.min(1, sessoesFinalizadas / cota);
}
