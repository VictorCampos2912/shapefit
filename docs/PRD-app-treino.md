# PRD — App de Acompanhamento de Treino e Nutrição

**Versão:** 1.0 (MVP)
**Autor:** \[seu nome]
**Data:** 2026-08-14
**Status:** Rascunho para desenvolvimento via SDD

\---

## 1\. Visão geral

Aplicativo mobile pessoal para acompanhar desempenho na academia: registrar cargas,
repetições e descanso durante o treino, com evolução futura para periodização baseada em
boas práticas de treinamento físico e integração nutricional. Uso multiplataforma
(Android e iOS) no aparelho do próprio usuário.

## 2\. Problema a resolver

Hoje o acompanhamento de treino é feito de forma manual/dispersa (papel, planilha, apps
genéricos que não se encaixam no fluxo real de treino). Falta uma ferramenta que:

* Permita importar um treino pré-planejado e executá-lo guiado
* Registre carga e repetições por série, de forma rápida, durante o treino
* Cronometre o descanso automaticamente
* Mostre evolução de carga ao longo do tempo
* (Futuro) Integre nutrição e periodização de forma inteligente

## 3\. Usuário-alvo

Usuário e familiares (o próprio desenvolvedor/solicitante), praticante de
musculação com conhecimento técnico sobre treino, usando:

* Redmi Note 12 (Android)
* iPhone 16 Plus (iOS)



## 4\. Objetivos do MVP

* **O1:** Permitir importar um treino estruturado (JSON) e visualizá-lo por dia/sessão
* **O2:** Executar o treino registrando carga e reps por série, com poucos toques
* **O3:** Cronometrar o descanso automaticamente entre séries
* **O4:** Consultar histórico simples de evolução de carga por exercício
* **O5:** Funcionar de forma estável nos dois aparelhos-alvo via Expo Go

## 5\. Não-objetivos (explicitamente fora do MVP)

* Vídeos ou imagens ilustrativas de execução dos exercícios
* Periodização automática (linear, ondulatória, blocos)
* Módulo de nutrição



## 6\. Requisitos funcionais

|ID|Requisito|Prioridade|
|-|-|-|
|RF01|Importar arquivo JSON com estrutura de treino (nome, exercícios, séries, reps, descanso)|Alta|
|RF02|Listar treinos importados/salvos|Alta|
|RF03|Tela de execução: exibir exercício atual, série atual, campos para carga (kg) e reps|Alta|
|RF04|Avançar para próxima série/exercício ao concluir registro|Alta|
|RF05|Iniciar cronômetro de descanso automaticamente ao concluir uma série|Alta|
|RF06|Notificar (som/vibração) ao fim do descanso|Média|
|RF07|Salvar sessão de treino concluída localmente|Alta|
|RF08|Tela de histórico: evolução de carga por exercício ao longo do tempo|Média|
|RF09|Editar/corrigir um registro de série já feito na sessão atual|Baixa|

## 7\. Requisitos não funcionais

* **RNF01:** Rodar via Expo Go em Android 12+ (Redmi Note 12) e iOS 17+ (iPhone 16 Plus)
* **RNF02:** Funcionar offline (dados salvos localmente, sem dependência de internet)
* **RNF03:** Interações principais (registrar série) devem levar no máximo 2 toques
* **RNF04:** Código em TypeScript, organizado para permitir evolução incremental (v2, v3...)

## 8\. Modelo de dados

### Treino importado (entrada)

```json
{
  "nome": "Treino A - Peito/Tríceps",
  "exercicios": \[
    {
      "id": "supino-reto",
      "nome": "Supino reto",
      "series": 4,
      "reps\_alvo": "8-10",
      "carga\_sugerida\_kg": 40,
      "descanso\_seg": 90
    }
  ]
}
```

### Sessão executada (saída, persistida localmente)

```json
{
  "data": "2026-08-14",
  "treino\_nome": "Treino A - Peito/Tríceps",
  "execucoes": \[
    {
      "exercicio\_id": "supino-reto",
      "series\_realizadas": \[
        {"serie": 1, "reps": 10, "carga\_kg": 40},
        {"serie": 2, "reps": 9, "carga\_kg": 40}
      ]
    }
  ]
}
```

## 9\. Stack técnica

* React Native + Expo (SDK gerenciado)
* TypeScript
* Armazenamento local: `AsyncStorage` no MVP (migrar para `expo-sqlite` quando o volume
de dados justificar)
* Navegação: `react-navigation`
* Testes em dispositivo real via Expo Go (sem build nativo nesta fase)

## 10\. Telas do MVP

1. Importar/selecionar treino
2. Execução do treino (exercício + série + registro de carga/reps)
3. Cronômetro de descanso
4. Histórico de evolução por exercício

## 11\. Métricas de sucesso do MVP

* O usuário consegue importar um treino e completar uma sessão inteira sem travar ou
perder dados
* O app é usado em pelo menos 3 sessões de treino reais consecutivas
* Tempo de registro por série não atrapalha o ritmo do treino

## 12\. Roadmap pós-MVP

* **v2:** imagens/GIFs ilustrativos por exercício (base aberta, ex: wger, ExerciseDB)
* **v3:** periodização (regras de negócio definidas antes da implementação)
* **v4:** módulo de nutrição (integração com base de alimentos existente, ex: Open Food Facts)
* **v5:** conta de usuário e sincronização em nuvem

## 13\. Riscos e restrições conhecidos

* Sem conta Apple Developer paga, distribuição fica limitada ao Expo Go / builds internos
(não há publicação na App Store nesta fase)
* Cronômetro em background pode ter comportamento diferente entre Android e iOS —
validar cedo nos dois aparelhos
* Escopo de periodização é o maior risco de complexidade do produto; mantido fora do MVP
de propósito

