# Lumina AI Vault

[![npm version](https://img.shields.io/npm/v/lumina-ai-vault.svg)](https://www.npmjs.com/package/lumina-ai-vault)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-orange.svg)](https://modelcontextprotocol.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUINDO.md)

[Read this file in English](README.md)

O **Lumina AI Vault v2.0.0** é um servidor de alta performance para o Model Context Protocol (MCP), projetado para atuar como uma **memória persistente e estruturada** para assistentes de IA durante o desenvolvimento de software. Ele permite que modelos de IA mantenham uma "memória de longo prazo" dos objetivos do projeto, decisões arquiteturais e progresso ao longo de múltiplas sessões.

## 🚀 Principais Recursos

- **Organização por Projetos**: Gerencie múltiplos "cofres" de desenvolvimento de forma independente.
- **Memória Estruturada**: Templates padronizados em `.md` para Memória, Arquitetura, Stack, Decisões, Progresso e Próximos Passos.
- **Escritas Atômicas**: Proteção de integridade de dados usando o padrão de escrita temporária seguida de renomeação para evitar corrupção de arquivos.
- **Busca com Contexto**: Busca poderosa com linhas de contexto configuráveis (estilo grep) para ajudar a IA a entender entradas históricas.
- **Monitoramento de Saúde**: Ferramentas integradas para verificar a integridade do vault e identificar documentação ausente.
- **Observabilidade para o Desenvolvedor**: Logging em tempo real via `stderr` para depuração sem quebrar o protocolo MCP.
- **Validação Robusta**: Validação rigorosa de esquemas de entrada alimentada por **Zod**.

## 🛠️ Ferramentas

O servidor disponibiliza as seguintes ferramentas para o assistente de IA:

- `init_project_memory`: Inicialização guiada da base de conhecimento de um novo projeto.
- `list_projects`: Visualiza todos os projetos gerenciados no vault.
- `create_project`: Cria um novo vault com arquivos de memória padrão.
- `read_memory` / `write_memory`: E/S básica para arquivos de memória.
- `append_memory`: Adiciona entradas a logs (como decisões ou progresso) sem sobrescrever.
- `search_memory`: Busca em todo o vault com suporte a linhas de contexto.
- `check_project_health`: Audita a completude da memória de um projeto.
- `load_project_context`: Consolida todo o estado de um projeto em um único bloco de contexto.

## 💡 Exemplos de Prompts

Você pode usar estes prompts para ajudar seu assistente de IA a interagir com o Vault:

### Inicializando um Projeto
> "Estou começando um novo projeto chamado 'nebula-engine'. Use a ferramenta `init_project_memory` para configurar a documentação inicial. Eu fornecerei os detalhes conforme você fizer as perguntas."

### Registrando uma Decisão
> "Acabamos de decidir mudar de REST para gRPC para a comunicação interna. Use `append_memory` para registrar isso em `decisions.md` do projeto 'nebula-engine', explicando que a mudança é para reduzir a latência."

### Recuperação Contextual
> "Preciso trabalhar na camada de banco de dados. Busque no vault 'nebula-engine' por 'PostgreSQL' usando 3 linhas de contexto para me lembrar das nossas decisões de esquema."

### Retomando o Contexto
> "Voltei a trabalhar no projeto 'lumina-web'. Por favor, use `load_project_context` para atualizar sua memória sobre o estado atual e os próximos passos."

## 📦 Primeiros Passos

### Instalação

```bash
npm install
npm run build
```

### Configuração

Para usar o Lumina AI Vault, você precisa adicioná-lo à configuração do seu cliente MCP. Abaixo estão exemplos para as ferramentas mais populares.

#### Claude Desktop
Adicione isto ao seu `claude_desktop_config.json`:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "lumina-aivault": {
      "command": "node",
      "args": ["/caminho/absoluto/para/lumina-ai-vault/dist/index.js"]
    }
  }
}
```

#### Claude Code CLI
O Claude Code CLI detecta automaticamente servidores MCP configurados no Claude Desktop. Você também pode configurá-lo diretamente via CLI:

```bash
claude mcp add lumina-aivault node /caminho/absoluto/para/lumina-ai-vault/dist/index.js
```

#### Gemini Code Assist
Configure o servidor MCP através das configurações da extensão Gemini Code Assist em sua IDE (VS Code, IntelliJ) apontando para o executável.

#### Windsurf
Adicione ao seu `~/.codeium/windsurf.json` ou através da interface de configuração MCP do Windsurf:

```json
{
  "mcpServers": {
    "lumina-aivault": {
      "command": "node",
      "args": ["/caminho/absoluto/para/lumina-ai-vault/dist/index.js"]
    }
  }
}
```

#### OpenCode (CLI & Desktop)
O OpenCode permite configurar servidores MCP através do seu painel de configurações ou através do arquivo de configuração da CLI:

```json
{
  "servers": {
    "lumina-aivault": {
      "command": "node",
      "args": ["/caminho/absoluto/para/lumina-ai-vault/dist/index.js"]
    }
  }
}
```

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Feito com ❤️ e IA por [Kadu Velasco](https://github.com/kaduvelasco)
