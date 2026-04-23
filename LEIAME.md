# Lumina AI Vault

[![npm version](https://img.shields.io/npm/v/lumina-ai-vault.svg)](https://www.npmjs.com/package/lumina-ai-vault)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-orange.svg)](https://modelcontextprotocol.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUINDO.md)

📄 English version: see [README.md](README.md)

O **Lumina AI Vault** é um servidor [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) de alta performance que atua como uma **memória persistente e estruturada** para assistentes de IA durante o desenvolvimento de software. Ele permite que modelos de IA mantenham memória de longo prazo dos objetivos do projeto, decisões arquiteturais, stack técnica e progresso ao longo de múltiplas sessões.

## 🚀 Recursos

- **Organização por Projetos** — gerencie múltiplos vaults de desenvolvimento de forma independente.
- **Caminhos Customizados** — armazene a memória em qualquer lugar do sistema; suporta os atalhos `~`, `$HOME` e `HOME`.
- **Auto-Localização via `.aivault.json`** — arquivo de configuração gerado automaticamente na raiz do projeto, permitindo que a IA identifique o vault correto sem configuração manual a cada sessão.
- **Memória Estruturada** — templates Markdown padronizados para Memória, Arquitetura, Stack, Decisões, Progresso e Próximos Passos.
- **Escritas Atômicas** — padrão de escrita-e-renomeação que evita corrupção de arquivos.
- **Busca com Contexto** — busca estilo grep com linhas de contexto configuráveis.
- **Monitoramento de Saúde** — ferramenta de auditoria que identifica documentação incompleta.
- **Observabilidade** — logging em tempo real via `stderr` sem quebrar o protocolo MCP.
- **Validação Robusta** — validação rigorosa de schemas de entrada com [Zod](https://zod.dev/).

## 🛠️ Ferramentas

| Ferramenta | Descrição |
|---|---|
| `list_projects` | Lista todos os projetos gerenciados no vault |
| `create_project` | Cria um novo projeto com arquivos de memória padrão |
| `delete_project` | Remove um projeto do vault |
| `list_files` | Lista os arquivos de memória de um projeto |
| `init_project_memory` | Inicialização guiada da base de conhecimento de um novo projeto |
| `read_memory` | Lê um arquivo de memória |
| `write_memory` | Sobrescreve um arquivo de memória |
| `append_memory` | Adiciona entradas a um arquivo sem sobrescrever |
| `delete_memory` | Remove um arquivo de memória customizado |
| `search_memory` | Busca em todo o vault com suporte a linhas de contexto |
| `load_project_context` | Consolida o estado completo de um projeto em um único bloco de contexto |
| `health_check` | Audita a completude da memória de um projeto |

## ⚙️ Caminhos Customizados e Auto-Localização

### Configuração do Caminho do Vault

Por padrão, os dados são armazenados em `~/.lumina-aivault/knowledge`. Você pode sobrescrever isso de três formas:

| Método | Como |
|---|---|
| Sobrescrita global | Defina a variável de ambiente `AIVAULT_BASE_PATH` |
| Sobrescrita por ferramenta | Passe o parâmetro opcional `path` para qualquer ferramenta |
| Atalhos de caminho | Use `~`, `$HOME` ou `HOME` no início de qualquer caminho |

### Configuração Local (`.aivault.json`)

Ao usar `init_project_memory` com o argumento `workspace_root`, o servidor cria um arquivo `.aivault.json` na raiz do seu projeto:

```json
{
  "project": "nebula-engine",
  "path": "HOME/.lumina-aivault/knowledge"
}
```

Esse arquivo permite que a IA identifique automaticamente o nome do projeto e o caminho do vault em todas as sessões futuras — sem necessidade de configuração manual.

## 📦 Instalação

### Opção 1 — Executar diretamente com npx (recomendada, sem instalação)

```bash
npx lumina-ai-vault
```

### Opção 2 — Instalação global

```bash
npm install -g lumina-ai-vault
```

Após a instalação, o binário `lumina-aivault` estará disponível globalmente.

### Opção 3 — A partir do código-fonte

```bash
git clone https://github.com/kaduvelasco/lumina-ai-vault.git
cd lumina-ai-vault
npm install
npm run build
```

O servidor compilado estará em `dist/index.js`.

## 🔧 Configuração por Cliente

### Claude Code CLI

**Via linha de comando (recomendado):**

```bash
# Usando npx (sem instalação prévia)
claude mcp add lumina-aivault npx -- -y lumina-ai-vault

# Usando instalação global
claude mcp add lumina-aivault lumina-aivault

# Usando build do código-fonte
claude mcp add lumina-aivault node -- /caminho/absoluto/para/lumina-ai-vault/dist/index.js
```

**Via arquivo de configuração** — adicione em `.claude/settings.json` (nível de projeto) ou `~/.claude/settings.json` (nível de usuário):

```json
{
  "mcpServers": {
    "lumina-aivault": {
      "command": "npx",
      "args": ["-y", "lumina-ai-vault"]
    }
  }
}
```

> Para verificar se o servidor está ativo: `claude mcp list`

---

### Gemini CLI

Edite `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "lumina-aivault": {
      "command": "npx",
      "args": ["-y", "lumina-ai-vault"]
    }
  }
}
```

> Reinicie o Gemini CLI após editar o arquivo para que as alterações entrem em vigor.

---

### Codex CLI

Edite `~/.codex/config.yaml`:

```yaml
mcp_servers:
  lumina-aivault:
    command: npx
    args:
      - "-y"
      - lumina-ai-vault
```

Para definir um caminho de vault customizado via variável de ambiente:

```yaml
mcp_servers:
  lumina-aivault:
    command: npx
    args:
      - "-y"
      - lumina-ai-vault
    env:
      AIVAULT_BASE_PATH: "/seu/caminho/customizado"
```

---

### OpenCode CLI

Edite `~/.config/opencode/config.json`:

```json
{
  "mcp": {
    "servers": {
      "lumina-aivault": {
        "type": "local",
        "command": "npx",
        "args": ["-y", "lumina-ai-vault"]
      }
    }
  }
}
```

---

### OpenCode Desktop

Abra **Settings → MCP Servers** na interface do OpenCode Desktop e adicione um novo servidor:

| Campo | Valor |
|---|---|
| Name | `lumina-aivault` |
| Type | `stdio` |
| Command | `npx` |
| Arguments | `-y lumina-ai-vault` |

Alternativamente, edite o arquivo de configuração diretamente — mesmo formato do OpenCode CLI acima.

---

### Windsurf

Edite `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "lumina-aivault": {
      "command": "npx",
      "args": ["-y", "lumina-ai-vault"]
    }
  }
}
```

Você também pode configurar pela interface do Windsurf: **Settings → MCP → Add Server**.

---

### Definindo um Caminho de Vault Customizado

Todos os clientes suportam o repasse de variáveis de ambiente para o servidor. Use `AIVAULT_BASE_PATH` para alterar o local de armazenamento padrão:

```json
{
  "mcpServers": {
    "lumina-aivault": {
      "command": "npx",
      "args": ["-y", "lumina-ai-vault"],
      "env": {
        "AIVAULT_BASE_PATH": "/home/usuario/meus-vaults"
      }
    }
  }
}
```

## 💡 Exemplos de Prompts

Os prompts abaixo foram projetados para funcionar diretamente com as ferramentas expostas pelo Lumina AI Vault. Cole-os em qualquer assistente de IA configurado com o servidor.

---

### Iniciando um Novo Projeto

> Inicialize o vault de memória para um novo projeto. Use `init_project_memory` com os seguintes detalhes: nome do projeto é "nebula-engine", é uma API REST construída com Node.js e PostgreSQL, o objetivo é fornecer um pipeline de dados em tempo real para dispositivos IoT, e a raiz do workspace é `/home/usuario/projetos/nebula-engine`.

---

### Retomando o Trabalho Após uma Pausa

> Voltei a trabalhar no projeto "nebula-engine". Use `load_project_context` para carregar o contexto completo do vault e então resuma: qual foi a última tarefa concluída, quais são os próximos passos e há alguma decisão arquitetural em aberto?

---

### Registrando uma Decisão Arquitetural

> Acabamos de decidir substituir o padrão de polling REST por WebSockets para atualizações em tempo real dos dispositivos. Use `append_memory` para registrar essa decisão em `decisions.md` do projeto "nebula-engine". Inclua: o que foi decidido, o motivo (menor latência, redução de carga no servidor) e quais alternativas foram rejeitadas (SSE — problemas de compatibilidade com browsers).

---

### Atualizando o Progresso

> Acabei de implementar o middleware de autenticação de dispositivos com JWT. Use `append_memory` para registrar isso em `progress.md` do projeto "nebula-engine" com a data de hoje, o que foi feito e os arquivos alterados: `src/middleware/auth.ts` e `src/routes/devices.ts`.

---

### Buscando Decisões Passadas

> Busque no vault "nebula-engine" pela palavra-chave "PostgreSQL" usando 4 linhas de contexto. Quero entender quais decisões de schema tomamos em torno da tabela `device_events`.

---

### Atualizando a Documentação de Arquitetura

> Use `write_memory` para atualizar o arquivo `architecture.md` do projeto "nebula-engine" com a seguinte estrutura: o sistema tem três camadas — API Gateway (Express), Lógica de Negócio (services) e Camada de Dados (PostgreSQL + Redis para cache). Inclua uma breve descrição da responsabilidade de cada camada.

---

### Executando uma Verificação de Saúde

> Use `health_check` no projeto "nebula-engine" para auditar a completude da documentação. Liste os arquivos que estão ausentes ou vazios e sugira qual conteúdo cada um deveria ter.

---

### Listando e Alternando Entre Projetos

> Use `list_projects` para mostrar todos os projetos no vault e depois carregue o contexto de "lumina-web" usando `load_project_context`. Compare os próximos passos dos dois projetos e me diga qual tem trabalho pendente mais urgente.

---

### Adicionando Itens aos Próximos Passos

> Use `append_memory` para adicionar três novos itens ao arquivo `next_steps.md` do projeto "nebula-engine": (1) implementar rate limiting nos endpoints de dispositivos, (2) adicionar testes de integração para os handlers WebSocket, (3) documentar o processo de deploy na wiki.

---

### Documentando a Stack Técnica

> Use `write_memory` para atualizar o `stack.md` do projeto "nebula-engine" com a seguinte stack: Node.js 20 + TypeScript, Express 5, PostgreSQL 16, Redis 7, Docker + Docker Compose para desenvolvimento local, GitHub Actions para CI/CD.

## 🤝 Contribuindo

Contribuições são bem-vindas! Leia [CONTRIBUINDO.md](CONTRIBUINDO.md) para as diretrizes.

## 📄 Licença

Este projeto está licenciado sob a Licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

---

Feito com ❤️ e IA por [Kadu Velasco](https://github.com/kaduvelasco)
