# Especificação MVP — App de Acompanhamento de Treino

## 1. Objetivo do MVP
Criar a versão mínima funcional de um app mobile para registrar treinos de academia,
rodando em Android (Redmi Note 12) e iOS (iPhone 16 Plus), servindo de base para
evoluções futuras (mídia dos exercícios, periodização automática, nutrição).

**Fora de escopo no MVP** (propositalmente adiado): vídeos de execução, periodização
automática, módulo de nutrição, sincronização em nuvem/multi-dispositivo, login de usuário.

## 2. Stack recomendada
- **Framework:** React Native com Expo (SDK gerenciado)
- **Linguagem:** TypeScript (ajuda muito quando a IA gera código — menos bugs silenciosos)
- **Armazenamento local:** SQLite (via `expo-sqlite`) ou, se quiser algo mais simples de
  início, `AsyncStorage` com JSON — trocar para SQLite quando o histórico crescer
- **Navegação:** `react-navigation` (padrão de mercado)
- **Testes nos dispositivos:** app Expo Go (Android e iOS), sem necessidade de build nativo
  nem conta de desenvolvedor Apple nesta fase

## 3. Ambiente de desenvolvimento — checklist inicial
1. Instalar Node.js (LTS)
2. Instalar Expo CLI: `npx create-expo-app@latest treino-app --template`
3. Instalar o app **Expo Go** no Redmi Note 12 (Play Store) e no iPhone 16 Plus (App Store)
4. Rodar `npx expo start` e escanear o QR code em cada aparelho para validar o setup

## 4. Modelo de dados (schema inicial)

### Arquivo de importação de treino (JSON)
```json
{
  "nome": "Treino A - Peito/Tríceps",
  "exercicios": [
    {
      "id": "supino-reto",
      "nome": "Supino reto",
      "series": 4,
      "reps_alvo": "8-10",
      "carga_sugerida_kg": 40,
      "descanso_seg": 90
    }
  ]
}
```

### Registro de execução (gerado pelo app, salvo localmente)
```json
{
  "data": "2026-08-14",
  "treino_nome": "Treino A - Peito/Tríceps",
  "execucoes": [
    {
      "exercicio_id": "supino-reto",
      "series_realizadas": [
        {"serie": 1, "reps": 10, "carga_kg": 40},
        {"serie": 2, "reps": 9, "carga_kg": 40}
      ]
    }
  ]
}
```

## 5. Telas do MVP (v1)
1. **Importar/Selecionar treino** — carregar arquivo JSON ou escolher entre treinos já salvos
2. **Execução do treino** — lista de exercícios do dia, com campos para registrar carga e reps
   por série
3. **Cronômetro de descanso** — inicia automaticamente ao concluir uma série, com notificação
   sonora/vibração ao terminar
4. **Histórico** — evolução de carga por exercício ao longo do tempo (lista simples ou gráfico
   básico)

## 6. Roadmap de evolução (pós-MVP)
- **v2:** imagens/GIFs ilustrativos dos exercícios (considerar bases abertas como wger ou
  ExerciseDB em vez de produzir mídia própria)
- **v3:** periodização (linear, ondulatória ou em blocos) — desenhar as regras de negócio
  com calma antes de implementar, é a parte mais complexa do produto
- **v4:** módulo de nutrição, idealmente integrado a uma base de dados de alimentos existente
  (ex: Open Food Facts) em vez de uma base própria
- **v5:** conta de usuário e sincronização em nuvem (só quando fizer sentido usar em mais de
  um aparelho ou não perder dados ao trocar de celular)

## 7. Princípio geral
Cada fase só começa depois que a anterior estiver sendo usada de verdade nos treinos reais.
Evita construir funcionalidades sofisticadas (como periodização automática) sobre uma base
de dados de treino que ainda não foi validada no uso do dia a dia.
