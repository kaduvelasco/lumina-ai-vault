# Lumina AI Vault

Um AI Knowledge Vault — um servidor MCP que gerencia Project Memory Files para dar a agentes de IA memória persistente entre sessões.

Agentes de IA esquecem tudo quando uma sessão termina. O Lumina AI Vault armazena o conhecimento do projeto em arquivos Markdown estruturados que qualquer agente pode ler e atualizar — mantendo o contexto vivo entre sessões, entre ferramentas e entre membros da equipe.

## Como funciona

O vault organiza o conhecimento em projetos. Cada projeto contém um conjunto de Project Memory Files — arquivos Markdown padrão cobrindo memória, arquitetura, stack, decisões, progresso e próximos passos. Um agente compatível com MCP pode ler, escrever, buscar e inicializar esses arquivos através de um conjunto de ferramentas dedicadas.

```
~/.lumina-aivault/knowledge/
├── meu-projeto/
│   ├── memory.md
│   ├── architecture.md
│   ├── stack.md
│   ├── decisions.md
│   ├── progress.md
│   └── next_steps.md
└── outro-projeto/
    └── ...
```

Os arquivos são Markdown puro — versionáveis com git, legíveis por humanos e editáveis por qualquer ferramenta de IA.

---

## Requisitos

- Node.js 18 ou superior

---

## Instalação

### Via npx (sem instalação)

```bash
npx lumina-ai-vault
```

### Instalação global

```bash
npm install -g lumina-ai-vault
lumina-aivault
```

### A partir do código-fonte

```bash
git clone https://github.com/kadu-velasco/lumina-ai-vault.git
cd lumina-ai-vault
npm install
npm run build
node dist/index.js
```

---

## Configuração

O caminho base do vault pode ser definido de três formas, em ordem de prioridade:

| Método | Exemplo |
|---|---|
| Argumento CLI | `lumina-aivault /caminho/do/vault` |
| Variável de ambiente | `AIVAULT_BASE_PATH=/caminho/do/vault lumina-aivault` |
| Padrão | `~/.lumina-aivault/knowledge` |

---

## Conectando a um cliente MCP

### Claude Code

Adicione o servidor às configurações MCP do Claude Code:

```json
{
  "mcpServers": {
    "lumina-aivault": {
      "command": "npx",
      "args": ["lumina-ai-vault"]
    }
  }
}
```

Para usar um caminho de vault personalizado:

```json
{
  "mcpServers": {
    "lumina-aivault": {
      "command": "npx",
      "args": ["lumina-ai-vault", "/caminho/do/seu/vault"]
    }
  }
}
```

### Outros clientes MCP

O servidor se comunica via stdio e é compatível com qualquer cliente que suporte o Model Context Protocol.

---

## Ferramentas disponíveis

### `init_project_memory`

Inicializa os arquivos de memória de um projeto do zero. O agente faz ao usuário um conjunto de perguntas guiadas antes de chamar esta ferramenta e usa as respostas para preencher todos os arquivos padrão.

**Acionado por:** *"Inicie a memória para o projeto X"*

---

### `create_project`

Cria um novo projeto com todos os arquivos de memória padrão pré-preenchidos com templates em branco. Use `"global"` como nome do projeto para conhecimento compartilhado entre projetos.

---

### `delete_project`

Exclui permanentemente um projeto e todos os seus arquivos de memória. Requer `confirm: true` para executar — o agente deve perguntar ao usuário explicitamente antes de chamar esta ferramenta. Esta ação é irreversível.

---

### `list_projects`

Lista todos os projetos atualmente no vault.

---

### `list_files`

Lista todos os arquivos `.md` dentro de um projeto específico.

---

### `read_memory`

Lê o conteúdo de um arquivo de memória de um projeto.

---

### `write_memory`

Sobrescreve o conteúdo completo de um arquivo de memória.

---

### `append_memory`

Acrescenta conteúdo a um arquivo de memória sem alterar o conteúdo existente. Indicado para arquivos de log como `decisions.md` e `progress.md`.

---

### `delete_memory`

Deleta um arquivo de memória customizado de um projeto. Os arquivos padrão (`memory.md`, `architecture.md`, `stack.md`, `decisions.md`, `progress.md`, `next_steps.md`) são protegidos e não podem ser deletados — use `write_memory` para limpar o conteúdo deles.

---

### `search_memory`

Busca uma string de texto em todos os arquivos de memória do vault, ou dentro de um projeto específico. Retorna as linhas correspondentes com referências de arquivo e número de linha. Aceita um parâmetro opcional `limit` (padrão: 100).

---

### `load_project_context`

Carrega todos os arquivos de memória de um projeto e os concatena em um único bloco de contexto. Arquivos que ainda contêm apenas o template em branco são omitidos. Use no início de uma sessão para restaurar o contexto completo do projeto.

**Acionado por:** *"Carregue o contexto do projeto X"*

---

## Estrutura dos arquivos de memória

Cada projeto contém seis arquivos padrão:

### `memory.md`
Resumo geral do projeto. Cobre nome, descrição, objetivo, fase atual, componentes principais e notas importantes.

### `architecture.md`
Visão geral da arquitetura do sistema, componentes principais, fluxo de dados e integrações externas.

### `stack.md`
Stack tecnológica: linguagens, frameworks, bibliotecas, infraestrutura e ferramentas de desenvolvimento.

### `decisions.md`
Log append-only de decisões técnicas. Cada entrada registra a decisão, o motivo, as alternativas consideradas e o impacto.

Formato sugerido de entrada:
```markdown
## YYYY-MM-DD — Título da decisão
**Decisão:** ...
**Motivo:** ...
**Alternativas:** ...
**Impacto:** ...
```

### `progress.md`
Log append-only de desenvolvimento. Cada entrada é datada e registra o que foi feito, alterado, corrigido e quaisquer notas relevantes.

Formato sugerido de entrada:
```markdown
## YYYY-MM-DD
- **Feito:** ...
- **Alterado:** ...
- **Corrigido:** ...
- **Notas:** ...
```

### `next_steps.md`
Trabalho planejado organizado por horizonte de tempo: tarefas imediatas, curto prazo, longo prazo e ideias para o futuro.

---

## Fluxo de trabalho recomendado

**Início de sessão**
```
Carregue o contexto do projeto meu-projeto
```

**Fim de sessão**
```
Atualize a memória do projeto meu-projeto
```

**Iniciando um novo projeto**
```
Inicie a memória para o projeto meu-projeto
```

---

## Licença

MIT
