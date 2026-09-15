# Prompt inicial — Desenvolvimento via GitHub Spec Kit + Claude Code (VS Code)

> Este prompt assume que você já rodou `specify init` no seu projeto (ver seção de
> instalação abaixo) e está com o Claude Code aberto no VS Code, na pasta do projeto.

---

## 0. Instalação do Spec Kit (rodar uma vez, no terminal do VS Code)

```bash
# 1. Instalar o uv (gerenciador de pacotes Python), se ainda não tiver
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Instalar a CLI do Spec Kit
uv tool install specify-cli

# 3. Confirmar instalação
specify --help
```

Dentro da pasta onde você já iniciou o projeto Expo (`treino-app`):

```bash
specify init . --integration claude
```

Isso adiciona a estrutura do Spec Kit (pasta `.specify/`) e os comandos de barra
(`/speckit.*`) ao Claude Code, sem alterar nada do projeto Expo já existente.

## 1. Estabelecer os princípios do projeto

No chat do Claude Code, rode:

```
/speckit.constitution Projeto de app mobile React Native + Expo para acompanhamento de
treino de academia, com suporte a múltiplos perfis locais (sem login) no mesmo aparelho.
Princípios: TypeScript em todo o código, priorizar simplicidade sobre funcionalidades
avançadas no MVP, testar sempre nos dois dispositivos-alvo (Android e iOS) antes de
considerar uma etapa concluída, não introduzir dependências além das listadas no PRD sem
justificativa explícita. Todo dado de treino, sessão e histórico deve ser segregado por
perfil ativo (perfil_id), nunca compartilhado entre perfis.
```

## 2. Criar a spec do primeiro requisito (RF10 — perfil, agora é o pré-requisito)

Cole o conteúdo do `PRD-app-treino.md` (v1.1) e do `criterios-aceite.md` no contexto do
Claude Code (ou referencie os arquivos, se estiverem na pasta `/docs` do projeto) e rode:

```
/speckit.specify Baseado no PRD anexo (v1.1), criar a especificação do requisito RF10:
criar e selecionar perfil local, com todos os campos obrigatórios (nome, peso, altura,
idade, sexo, objetivo), suporte a múltiplos perfis no mesmo aparelho, sem login ou senha.
A troca de perfil ativo deve ser bloqueada enquanto houver uma sessão de treino em
andamento. Usar os critérios de aceite do RF10 no documento criterios-aceite.md anexo. Não
implementar código ainda — apenas descrever o comportamento esperado.
```

## 3. Gerar o plano técnico

Depois de revisar e aprovar a spec gerada:

```
/speckit.plan Usar React Native com Expo (SDK gerenciado), TypeScript, e AsyncStorage para
persistir os perfis localmente, com chaves prefixadas por perfil_id (ex: treinos:<id>,
sessoes:<id>) para toda a segregação de dados por perfil daqui em diante. Seguir a
estrutura de navegação com react-navigation, com a tela de perfil como primeira tela do
app.
```

## 4. Gerar as tarefas

```
/speckit.tasks
```

O Spec Kit vai quebrar o plano em tarefas sequenciadas e rastreáveis até o requisito de
origem (RF01).

## 5. Implementar

```
/speckit.implement
```

## Regras de trabalho (aplicam-se a todas as etapas acima)

- **Um requisito funcional por vez**, seguindo esta ordem (definida no PRD v1.1 e no
  criterios-aceite.md): **RF10 → RF01 → RF02 → RF03 → RF04 → RF05 → RF06 → RF07 → RF08 →
  RF09**. Não avance para o próximo requisito sem concluir e validar o anterior.
- **Respeite os não-objetivos do PRD** (seção 5) — não introduza periodização automática,
  vídeos, nutrição, login/autenticação real ou sincronização em nuvem nesta fase.
- **A partir do RF10, todo requisito que manipula treino, sessão ou histórico deve
  considerar o perfil ativo** — não implemente nenhuma tela ou lógica que misture dados de
  perfis diferentes.
- Sempre que uma decisão técnica não estiver especificada no PRD ou no
  criterios-aceite.md (ex: as duas pendências listadas no fim do criterios-aceite.md), pare
  antes do `/speckit.plan` e me pergunte, em vez de decidir sozinho.
- Depois do `/speckit.implement`, teste manualmente no Expo Go nos dois aparelhos (Redmi
  Note 12 e iPhone 16 Plus) antes de considerar o requisito como concluído — use o
  checklist de ambiente e o checklist de critérios de aceite do requisito.

## Repetir para os próximos requisitos

Para o próximo requisito (após RF10, será o RF01), repita a partir do passo 2
(`/speckit.specify`), trocando a descrição do requisito pela correspondente no PRD e nos
critérios de aceite.
