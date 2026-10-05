import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signOut, type User } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { obterDadosFisicos } from '@/services/conta-storage';

// Client ID OAuth "Web" do projeto Firebase (google-services.json, client_type 3)
// — não é segredo: é o identificador público que o Google Sign-In exige para
// emitir o idToken usado pelo Firebase Authentication.
const GOOGLE_WEB_CLIENT_ID = '129425812347-v9qsi7ht9qo5a4dfn1tvvcjbqlqmhk9d.apps.googleusercontent.com';

GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

export type ContaAutenticada = {
  uid: string;
  email: string | null;
  nomeExibicao: string | null;
};

export type EntrarComGoogleResultado = { ok: true } | { ok: false; motivo: string };

type ContaAutenticadaContextValue = {
  uid: string | null;
  contaAutenticada: ContaAutenticada | null;
  carregando: boolean;
  /** null enquanto ainda não sabemos (checando o Firestore); true/false depois de checar */
  temDadosFisicos: boolean | null;
  entrarComGoogle: () => Promise<EntrarComGoogleResultado>;
  sairDaConta: () => Promise<void>;
};

const ContaAutenticadaContext = createContext<ContaAutenticadaContextValue | null>(null);

function paraContaAutenticada(usuario: User | null): ContaAutenticada | null {
  if (!usuario) {
    return null;
  }
  return { uid: usuario.uid, email: usuario.email, nomeExibicao: usuario.displayName };
}

export function ContaAutenticadaProvider({ children }: { children: ReactNode }) {
  const [contaAutenticada, setContaAutenticada] = useState<ContaAutenticada | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [temDadosFisicos, setTemDadosFisicos] = useState<boolean | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const cancelar = onAuthStateChanged(auth, async (usuario) => {
      const conta = paraContaAutenticada(usuario);
      setContaAutenticada(conta);

      if (!conta) {
        setTemDadosFisicos(null);
        setCarregando(false);
        return;
      }

      setTemDadosFisicos(null);
      try {
        const dados = await obterDadosFisicos(conta.uid);
        setTemDadosFisicos(dados !== null);
      } catch {
        // Falha ao checar (ex: rede cai no meio do login) — mantém null, nunca
        // trata como "sem dados" (evitaria reexibir o formulário por engano
        // ou arriscar duplicar o documento). Quem consome este hook decide o
        // que mostrar enquanto temDadosFisicos continua null.
        setTemDadosFisicos(null);
      } finally {
        setCarregando(false);
      }
    });

    return cancelar;
  }, []);

  const entrarComGoogle = useCallback(async (): Promise<EntrarComGoogleResultado> => {
    try {
      await GoogleSignin.hasPlayServices();
      const resposta = await GoogleSignin.signIn();
      if (resposta.type !== 'success' || !resposta.data.idToken) {
        return { ok: false, motivo: 'Login cancelado.' };
      }
      const credencial = GoogleAuthProvider.credential(resposta.data.idToken);
      await signInWithCredential(getAuth(), credencial);
      return { ok: true };
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Não foi possível entrar com o Google.';
      return { ok: false, motivo: mensagem };
    }
  }, []);

  const sairDaConta = useCallback(async () => {
    await signOut(getAuth());
    await GoogleSignin.signOut();
  }, []);

  const value = useMemo(
    () => ({
      uid: contaAutenticada?.uid ?? null,
      contaAutenticada,
      carregando,
      temDadosFisicos,
      entrarComGoogle,
      sairDaConta,
    }),
    [contaAutenticada, carregando, temDadosFisicos, entrarComGoogle, sairDaConta],
  );

  return <ContaAutenticadaContext.Provider value={value}>{children}</ContaAutenticadaContext.Provider>;
}

export function useContaAutenticada(): ContaAutenticadaContextValue {
  const context = useContext(ContaAutenticadaContext);
  if (!context) {
    throw new Error('useContaAutenticada deve ser usado dentro de um ContaAutenticadaProvider');
  }
  return context;
}
