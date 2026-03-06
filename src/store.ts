import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface Memory {
  name: string;
  category: string;
  description: string;
  value: string;
}

export interface HierarchicalIndex {
  [category: string]: {
    name: string;
    description: string;
  }[];
}

export class MemoryStore {
  private readonly filePath: string;
  private memories: Memory[];

  constructor(dir: string, filename = "memories.json") {
    this.filePath = join(dir, filename);
    this.memories = this.load();
  }

  private load(): Memory[] {
    if (!existsSync(this.filePath)) return [];
    const raw = readFileSync(this.filePath, "utf-8");
    return JSON.parse(raw) as Memory[];
  }

  private save(): void {
    writeFileSync(this.filePath, JSON.stringify(this.memories, null, 2), "utf-8");
  }

  add(memory: Memory): void {
    const existing = this.memories.findIndex(
      (m) => m.name === memory.name && m.category === memory.category
    );
    if (existing !== -1) {
      this.memories[existing] = memory;
    } else {
      this.memories.push(memory);
    }
    this.save();
  }

  get(category: string, name: string): Memory | null {
    return (
      this.memories.find((m) => m.category === category && m.name === name) ??
      null
    );
  }

  delete(category: string, name: string): boolean {
    const before = this.memories.length;
    this.memories = this.memories.filter(
      (m) => !(m.category === category && m.name === name)
    );
    if (this.memories.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  /** Hierarchical index grouped by category. */
  index(includeDescription = false): HierarchicalIndex {
    const result: HierarchicalIndex = {};
    for (const m of this.memories) {
      if (!result[m.category]) result[m.category] = [];
      result[m.category].push({
        name: m.name,
        description: includeDescription ? m.description : "",
      });
    }
    return result;
  }

  /** All memories, mainly for testing. */
  all(): readonly Memory[] {
    return this.memories;
  }
}
