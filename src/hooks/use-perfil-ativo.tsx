import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import * as perfilStorage from '@/services/perfil-storage';
import type { DefinirPerfilAtivoResultado, Perfil } from '@/types/perfil';

type DadosCriarPerfil = Omit<Perfil, 'id' | 'criadoEm'>;

type PerfilAtivoContextValue = {
  perfilAtivo: Perfil | null;
  perfis: Perfil[];
  carregando: boolean;
  /** true assim que um perfil é criado ou selecionado explicitamente nesta sessão do app */
  sessaoConfirmada: boolean;
  criarPerfil: (dados: DadosCriarPerfil) => Promise<Perfil>;
  selecionarPerfil: (perfilId: string) => Promise<DefinirPerfilAtivoResultado>;
};

const PerfilAtivoContext = createContext<PerfilAtivoContextValue | null>(null);

export function PerfilAtivoProvider({ children }: { children: ReactNode }) {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [perfilAtivoId, setPerfilAtivoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [sessaoConfirmada, setSessaoConfirmada] = useState(false);

  const recarregar = useCallback(async () => {
    const [listaPerfis, ativoId] = await Promise.all([
      perfilStorage.listarPerfis(),
      perfilStorage.obterPerfilAtivoId(),
    ]);
    setPerfis(listaPerfis);
    setPerfilAtivoId(ativoId);
  }, []);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setCarregando(true);
      await recarregar();
      if (ativo) {
        setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [recarregar]);

  const criarPerfil = useCallback(
    async (dados: DadosCriarPerfil) => {
      const perfil = await perfilStorage.criarPerfil(dados);
      await recarregar();
      setSessaoConfirmada(true);
      return perfil;
    },
    [recarregar],
  );

  const selecionarPerfil = useCallback(
    async (perfilId: string): Promise<DefinirPerfilAtivoResultado> => {
      const resultado = await perfilStorage.definirPerfilAtivo(perfilId);
      if (resultado.ok) {
        await recarregar();
        setSessaoConfirmada(true);
      }
      return resultado;
    },
    [recarregar],
  );

  const perfilAtivo = useMemo(
    () => perfis.find((perfil) => perfil.id === perfilAtivoId) ?? null,
    [perfis, perfilAtivoId],
  );

  const value = useMemo(
    () => ({ perfilAtivo, perfis, carregando, sessaoConfirmada, criarPerfil, selecionarPerfil }),
    [perfilAtivo, perfis, carregando, sessaoConfirmada, criarPerfil, selecionarPerfil],
  );

  return <PerfilAtivoContext.Provider value={value}>{children}</PerfilAtivoContext.Provider>;
}

export function usePerfilAtivo(): PerfilAtivoContextValue {
  const context = useContext(PerfilAtivoContext);
  if (!context) {
    throw new Error('usePerfilAtivo deve ser usado dentro de um PerfilAtivoProvider');
  }
  return context;
}
