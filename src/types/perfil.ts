export type Sexo = 'Masculino' | 'Feminino';

export type ObjetivoTreino = 'Hipertrofia' | 'Emagrecimento' | 'Condicionamento' | 'Manutenção';

export type Perfil = {
  id: string;
  nome: string;
  pesoKg: number;
  alturaCm: number;
  idade: number;
  sexo: Sexo;
  objetivo: ObjetivoTreino;
  criadoEm: string;
};

export type PerfisState = {
  perfis: Perfil[];
  perfilAtivoId: string | null;
};

export type DefinirPerfilAtivoResultado = { ok: true } | { ok: false; motivo: 'sessao_em_andamento' };

export type SessaoRegistro = {
  perfilId: string;
  finalizadaEm: string | null;
};
