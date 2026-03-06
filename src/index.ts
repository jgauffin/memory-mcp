#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { MemoryStore } from "./store.js";

function parseArgs(args: string[]): {
  name: string;
  description: string;
  dir: string;
} {
  let name = "Relax! Memory MCP";
  let description = "Persistent memory storage";
  let dir = process.cwd();

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--name" && args[i + 1]) name = args[++i];
    else if (args[i] === "--description" && args[i + 1]) description = args[++i];
    else if (args[i] === "--dir" && args[i + 1]) dir = args[++i];
  }
  return { name, description, dir };
}

const config = parseArgs(process.argv.slice(2));
const store = new MemoryStore(config.dir);

const server = new McpServer({
  name: config.name,
  version: "1.0.0",
  description: config.description,
});

server.tool(
  "add_memory",
  "Store or update a memory. Overwrites if same category+name exists.",
  {
    name: z.string().describe("Memory name"),
    category: z.string().describe("Category to group under"),
    description: z.string().describe("Brief description of what this memory is"),
    value: z.string().describe("The memory content"),
  },
  async ({ name, category, description, value }) => {
    store.add({ name, category, description, value });
    return { content: [{ type: "text", text: `Stored "${category}/${name}"` }] };
  }
);

server.tool(
  "get_memory",
  "Retrieve a specific memory by category and name.",
  {
    category: z.string(),
    name: z.string(),
  },
  async ({ category, name }) => {
    const memory = store.get(category, name);
    if (!memory) {
      return {
        content: [{ type: "text", text: `Not found: "${category}/${name}"` }],
        isError: true,
      };
    }
    return { content: [{ type: "text", text: JSON.stringify(memory, null, 2) }] };
  }
);

server.tool(
  "delete_memory",
  "Delete a memory by category and name.",
  {
    category: z.string(),
    name: z.string(),
  },
  async ({ category, name }) => {
    const deleted = store.delete(category, name);
    return {
      content: [
        {
          type: "text",
          text: deleted
            ? `Deleted "${category}/${name}"`
            : `Not found: "${category}/${name}"`,
        },
      ],
      isError: !deleted,
    };
  }
);

server.tool(
  "list_memories",
  "List all memories as a hierarchical index grouped by category.",
  {
    include_description: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include description in the index"),
  },
  async ({ include_description }) => {
    const index = store.index(include_description);
    return {
      content: [{ type: "text", text: JSON.stringify(index, null, 2) }],
    };
  }
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
