import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signOut, type User } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

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
  /**
   * `true` quando a última tentativa de checar `obterDadosFisicos` falhou
   * (ex.: rede caiu). Enquanto `true`, o app NÃO fica numa tela em branco
   * indefinidamente — `_layout.tsx` mostra uma tela de erro com "Tentar
   * novamente" (`tentarNovamenteChecarDadosFisicos`) e "Sair da conta".
   */
  erroAoChecarDadosFisicos: boolean;
  entrarComGoogle: () => Promise<EntrarComGoogleResultado>;
  sairDaConta: () => Promise<void>;
  /**
   * Chamado por `conta/dados-fisicos.tsx` logo após `salvarDadosFisicos`
   * resolver (que agora não dá `await` no `setDoc`, research.md Decisão 8) —
   * atualização otimista: sem isso, `temDadosFisicos` só mudaria quando
   * `onAuthStateChanged` disparasse de novo (login/logout), não quando os
   * dados são salvos.
   */
  confirmarDadosFisicosSalvos: () => void;
  /** Refaz a checagem de `obterDadosFisicos` para a conta atual, após uma falha. */
  tentarNovamenteChecarDadosFisicos: () => void;
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
  const [erroAoChecarDadosFisicos, setErroAoChecarDadosFisicos] = useState(false);

  // Guarda de corrida: identifica qual uid cada checagem assíncrona de
  // obterDadosFisicos pertence. Se a conta mudar de novo (logout, troca de
  // conta) enquanto uma checagem anterior ainda está em voo, a resposta
  // tardia dessa checagem antiga é descartada em vez de sobrescrever o
  // estado da conta atual.
  const uidChecagemAtualRef = useRef<string | null>(null);

  // Extraído para ser reutilizável tanto pelo listener de onAuthStateChanged
  // quanto por tentarNovamenteChecarDadosFisicos (retry manual após falha).
  const checarDadosFisicos = useCallback(async (uid: string) => {
    try {
      const dados = await obterDadosFisicos(uid);
      if (uidChecagemAtualRef.current !== uid) {
        // Uma mudança de conta mais recente já substituiu esta checagem —
        // ignora a resposta tardia.
        return;
      }
      setTemDadosFisicos(dados !== null);
      setErroAoChecarDadosFisicos(false);
    } catch {
      // Falha ao checar (ex: rede cai no meio do login) — mantém
      // temDadosFisicos null, nunca trata como "sem dados" (evitaria
      // reexibir o formulário por engano ou arriscar duplicar o documento).
      // erroAoChecarDadosFisicos=true é o que tira o app de uma tela em
      // branco indefinida — _layout.tsx mostra "Tentar novamente"/"Sair da
      // conta" em vez de ficar preso em carregando=false + temDadosFisicos=null.
      if (uidChecagemAtualRef.current === uid) {
        setTemDadosFisicos(null);
        setErroAoChecarDadosFisicos(true);
      }
    } finally {
      if (uidChecagemAtualRef.current === uid) {
        setCarregando(false);
      }
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const cancelar = onAuthStateChanged(auth, (usuario) => {
      const conta = paraContaAutenticada(usuario);
      uidChecagemAtualRef.current = conta?.uid ?? null;
      setContaAutenticada(conta);
      // Reseta para null a cada mudança de auth (login, logout, troca de
      // conta), antes de re-checar — nunca mantém o valor da conta anterior.
      setTemDadosFisicos(null);
      setErroAoChecarDadosFisicos(false);

      if (!conta) {
        setCarregando(false);
        return;
      }

      checarDadosFisicos(conta.uid);
    });

    return cancelar;
  }, [checarDadosFisicos]);

  const tentarNovamenteChecarDadosFisicos = useCallback(() => {
    const uid = uidChecagemAtualRef.current;
    if (!uid) return;
    setCarregando(true);
    setErroAoChecarDadosFisicos(false);
    checarDadosFisicos(uid);
  }, [checarDadosFisicos]);

  const confirmarDadosFisicosSalvos = useCallback(() => {
    setTemDadosFisicos(true);
    setErroAoChecarDadosFisicos(false);
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
    // Os dois signOut são necessários: auth().signOut() só encerra a sessão
    // do Firebase; sem GoogleSignin.signOut() também, o SDK do Google mantém
    // a conta "lembrada" nativamente e o próximo entrarComGoogle() reloga
    // direto na mesma conta sem mostrar o seletor — "sair da conta" precisa
    // realmente devolver ao usuário a escolha de qual conta usar depois.
    await signOut(getAuth());
    await GoogleSignin.signOut();
  }, []);

  const value = useMemo(
    () => ({
      uid: contaAutenticada?.uid ?? null,
      contaAutenticada,
      carregando,
      temDadosFisicos,
      erroAoChecarDadosFisicos,
      entrarComGoogle,
      sairDaConta,
      confirmarDadosFisicosSalvos,
      tentarNovamenteChecarDadosFisicos,
    }),
    [
      contaAutenticada,
      carregando,
      temDadosFisicos,
      erroAoChecarDadosFisicos,
      entrarComGoogle,
      sairDaConta,
      confirmarDadosFisicosSalvos,
      tentarNovamenteChecarDadosFisicos,
    ],
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
