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

  // getDoc só serve pra preservar o criadoEm de um cadastro já existente — mas
  // esta tela só aparece quando o documento ainda não existe (gate em
  // use-conta-autenticada.tsx), então se getDoc rejeitar (ex.: sem rede), não
  // há criadoEm antigo a preservar: usa a data atual como se fosse o primeiro
  // cadastro mesmo, sem travar o salvamento esperando a rede voltar.
  let criadoEm: string;
  try {
    const existente = await getDoc(referencia);
    criadoEm = existente.exists() ? (existente.data() as DadosFisicos).criadoEm : new Date().toISOString();
  } catch {
    criadoEm = new Date().toISOString();
  }

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
