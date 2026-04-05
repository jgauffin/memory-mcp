# Relax! Memory MCP



---------------------------------

**Archived. Claude can now use multiple files for memories.**

-------------------------------

A persistent memory server for AI agents, built on the [Model Context Protocol](https://modelcontextprotocol.io/).

## Why this server?

Most AI agents lose context between sessions. Built-in memory features (like Claude Code's `MEMORY.md`) are plain files the agent must read and write manually — they have no structure, no categories, and no way to list or search entries without reading the entire file.

Relax! Memory MCP fixes this by giving agents **structured, persistent memory via tools**:

- **Categorised storage** — memories are grouped by category (e.g. `config`, `design`, `architecture`), so an agent can store and retrieve related facts without scanning everything.
- **Minimal token cost** — `list_memories` returns a lightweight hierarchical index. The agent only fetches full values when it needs them, keeping context windows small.
- **Upsert semantics** — storing a memory with the same `category + name` overwrites the previous value. No duplicates, no cleanup needed.
- **Instant persistence** — every write is flushed to a single JSON file on disk. Survives crashes, restarts, and agent re-connections.
- **Zero dependencies at runtime** — just Node.js and the MCP SDK. No database, no cloud service, no API key.
- **Multi-instance friendly** — use `--dir` and `--name` to run separate memory stores for different projects or agents from the same binary.

## Tools exposed

| Tool | Description |
|---|---|
| `add_memory` | Store or update a memory (category, name, description, value) |
| `get_memory` | Retrieve a specific memory by category and name |
| `delete_memory` | Delete a memory by category and name |
| `list_memories` | List all memories as a hierarchical index grouped by category |

## Installation

```bash
npm install
npm run build
```

This compiles TypeScript into `dist/` and makes `dist/index.js` the executable entry point.

## Configuration

Add the server to your MCP client config. Ommit `--dir` for currently running project.

### Claude Code (CLI)

```bash
claude mcp add --scope user memory -- node d:/installdir/dist/index.js --dir d:/my-project
```

### Claude Desktop / Claude Code (manual)

Add to your `claude_desktop_config.json` or `.claude.json`:

```json
{
  "mcpServers": {
    "memory": {
      "command": "node",
      "args": [
        "d:/src/AI/MCP/Memory/dist/index.js",
        "--name", "Project Memory",
        "--dir", "d:/my-project"
      ]
    }
  }
}
```

### CLI flags

| Flag | Default | Description |
|---|---|---|
| `--name` | `Memory MCP for current project` | Server name reported to the MCP client (set if you have a general server that all projects shpuld be able to access) |
| `--description` | `Persistent memory storage` | Server description |
| `--dir` | Current working directory | Directory where `memories.json` is stored |

## Running

Start the server directly (stdio transport):

```bash
node dist/index.js
```

Or with flags:

```bash
node dist/index.js --dir ./my-project --name "My Project Memory"
```

The server communicates over stdin/stdout using the MCP stdio transport. It is designed to be launched by an MCP client, not called directly from a browser or HTTP client.

## Debugging

### Run tests

```bash
npm test
```

Uses [Vitest](https://vitest.dev/). Tests create temporary directories and verify the full lifecycle: add, get, update, delete, persistence, and hierarchical indexing.

### Inspect the stored data

Memories are stored as plain JSON in `memories.json` inside the configured `--dir`:

```bash
cat memories.json
```

```json
[
  {
    "name": "tech-stack",
    "category": "architecture",
    "description": "Chosen technology stack",
    "value": "TypeScript, PostgreSQL, OpenLayers"
  }
]
```

### Debug with MCP Inspector

Use the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) to interactively call tools:

```bash
npx @modelcontextprotocol/inspector node dist/index.js -- --dir .
```

This opens a web UI where you can invoke `add_memory`, `list_memories`, etc. and see the raw JSON responses.

### Attach a Node debugger

```bash
node --inspect dist/index.js --dir .
```

Then open `chrome://inspect` in Chrome or attach from VS Code using a launch configuration:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Memory MCP",
  "program": "${workspaceFolder}/dist/index.js",
  "args": ["--dir", "."],
  "outFiles": ["${workspaceFolder}/dist/**/*.js"]
}
```

## License

MIT
