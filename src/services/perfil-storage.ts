import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import type { DefinirPerfilAtivoResultado, Perfil, PerfisState, SessaoRegistro } from '@/types/perfil';

const PERFIS_KEY = 'perfis';

const CAMPOS_OBRIGATORIOS = ['nome', 'pesoKg', 'alturaCm', 'idade', 'sexo', 'objetivo'] as const;

type DadosCriarPerfil = Omit<Perfil, 'id' | 'criadoEm'>;

async function getPerfisState(): Promise<PerfisState> {
  const raw = await AsyncStorage.getItem(PERFIS_KEY);
  if (!raw) {
    return { perfis: [], perfilAtivoId: null };
  }
  return JSON.parse(raw) as PerfisState;
}

async function setPerfisState(state: PerfisState): Promise<void> {
  await AsyncStorage.setItem(PERFIS_KEY, JSON.stringify(state));
}

export async function listarPerfis(): Promise<Perfil[]> {
  const state = await getPerfisState();
  return state.perfis;
}

export async function obterPerfilAtivoId(): Promise<string | null> {
  const state = await getPerfisState();
  return state.perfilAtivoId;
}

function camposFaltantes(dados: DadosCriarPerfil): string[] {
  return CAMPOS_OBRIGATORIOS.filter((campo) => {
    const valor = dados[campo];
    if (typeof valor === 'string') {
      return valor.trim().length === 0;
    }
    return valor === undefined || valor === null;
  });
}

export async function criarPerfil(dados: DadosCriarPerfil): Promise<Perfil> {
  const faltantes = camposFaltantes(dados);
  if (faltantes.length > 0) {
    throw new Error(`Campos obrigatórios não preenchidos: ${faltantes.join(', ')}`);
  }

  const novoPerfil: Perfil = {
    ...dados,
    nome: dados.nome.trim(),
    id: Crypto.randomUUID(),
    criadoEm: new Date().toISOString(),
  };

  const state = await getPerfisState();
  const novoState: PerfisState = {
    perfis: [...state.perfis, novoPerfil],
    perfilAtivoId: novoPerfil.id,
  };
  await setPerfisState(novoState);

  return novoPerfil;
}

export async function existeSessaoEmAndamento(perfilId: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(`sessoes:${perfilId}`);
  if (!raw) {
    return false;
  }
  const sessoes = JSON.parse(raw) as SessaoRegistro[];
  return sessoes.some((sessao) => sessao.finalizadaEm === null);
}

export async function definirPerfilAtivo(perfilId: string): Promise<DefinirPerfilAtivoResultado> {
  const state = await getPerfisState();

  if (state.perfilAtivoId) {
    const bloqueado = await existeSessaoEmAndamento(state.perfilAtivoId);
    if (bloqueado) {
      return { ok: false, motivo: 'sessao_em_andamento' };
    }
  }

  await setPerfisState({ ...state, perfilAtivoId: perfilId });
  return { ok: true };
}
