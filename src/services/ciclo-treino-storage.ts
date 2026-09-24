import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import { contarSessoesFinalizadas } from '@/services/sessao-treino-storage';
import type { CicloTreino } from '@/types/ciclo-treino';

const TOTAL_ESPERADO_CICLO = 40;

function ciclosKey(perfilId: string): string {
  return `ciclos:${perfilId}`;
}

async function getCiclos(perfilId: string): Promise<CicloTreino[]> {
  const raw = await AsyncStorage.getItem(ciclosKey(perfilId));
  if (!raw) {
    return [];
  }
  return JSON.parse(raw) as CicloTreino[];
}

async function setCiclos(perfilId: string, ciclos: CicloTreino[]): Promise<void> {
  await AsyncStorage.setItem(ciclosKey(perfilId), JSON.stringify(ciclos));
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

/** Cria e persiste um novo ciclo (append-only) para o lote de treinos informado. */
export async function criarCiclo(perfilId: string, treinoIds: string[]): Promise<CicloTreino> {
  const ciclo: CicloTreino = {
    id: Crypto.randomUUID(),
    perfilId,
    treinoIds,
    cotaPorTreinoId: calcularCotaPorTreino(treinoIds),
    criadoEm: new Date().toISOString(),
  };
  const ciclos = await getCiclos(perfilId);
  await setCiclos(perfilId, [...ciclos, ciclo]);
  return ciclo;
}

/** Último ciclo criado para o perfil (o "ciclo atual"), ou `null` se nenhum. */
export async function obterCicloAtual(perfilId: string): Promise<CicloTreino | null> {
  const ciclos = await getCiclos(perfilId);
  return ciclos.length > 0 ? ciclos[ciclos.length - 1] : null;
}

/** Progresso do ciclo, derivado das sessões finalizadas já persistidas — nunca em cache. */
export async function calcularProgressoCiclo(
  perfilId: string,
  ciclo: CicloTreino,
): Promise<{ totalFinalizado: number; porTreino: Record<string, number> }> {
  const porTreino: Record<string, number> = {};
  let totalFinalizado = 0;
  for (const treinoId of ciclo.treinoIds) {
    const contagem = await contarSessoesFinalizadas(perfilId, treinoId);
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
