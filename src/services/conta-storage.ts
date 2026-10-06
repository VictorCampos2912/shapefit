import { doc, getDoc, getFirestore, setDoc } from '@react-native-firebase/firestore';

import type { DadosFisicos } from '@/types/perfil';

export async function obterDadosFisicos(uid: string): Promise<DadosFisicos | null> {
  const referencia = doc(getFirestore(), 'users', uid);
  const snapshot = await getDoc(referencia);
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.data() as DadosFisicos;
}

export async function salvarDadosFisicos(
  uid: string,
  dados: Omit<DadosFisicos, 'criadoEm'>,
): Promise<void> {
  const referencia = doc(getFirestore(), 'users', uid);
  const existente = await getDoc(referencia);
  const criadoEm = existente.exists() ? (existente.data() as DadosFisicos).criadoEm : new Date().toISOString();

  // Sem await de propósito: a Promise do setDoc só resolve com confirmação do
  // servidor, mesmo a escrita já estando aplicada no cache local offline
  // imediatamente — com await, ficaria pendurado até reconectar (quebra o
  // comportamento offline exigido por FR-011). Leituras seguintes (ex.:
  // obterDadosFisicos) já enxergam essa escrita via cache local, mesmo antes
  // do commit no servidor terminar.
  setDoc(referencia, { ...dados, criadoEm }).catch((erro) => {
    console.error('[conta-storage] Falha ao confirmar dados físicos no servidor (já salvos no cache local):', erro);
  });
}
