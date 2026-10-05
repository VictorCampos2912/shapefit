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

  await setDoc(referencia, { ...dados, criadoEm });
}
