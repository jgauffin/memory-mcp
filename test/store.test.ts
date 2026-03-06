import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { MemoryStore } from "../src/store";
import type { Memory } from "../src/store";

const FIXTURE_PATH = join(import.meta.dirname, "fixtures", "seed-memories.json");

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "relax-memory-test-"));
}

describe("MemoryStore", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("starts empty when no file exists", () => {
    const store = new MemoryStore(dir);
    expect(store.all()).toEqual([]);
  });

  it("loads from existing file", () => {
    copyFileSync(FIXTURE_PATH, join(dir, "memories.json"));
    const store = new MemoryStore(dir);
    expect(store.all()).toHaveLength(4);
  });

  it("adds and retrieves a memory", () => {
    const store = new MemoryStore(dir);
    const mem: Memory = {
      name: "port",
      category: "config",
      description: "Server port",
      value: "3000",
    };
    store.add(mem);
    expect(store.get("config", "port")).toEqual(mem);
  });

  it("overwrites on duplicate category+name", () => {
    const store = new MemoryStore(dir);
    store.add({
      name: "port",
      category: "config",
      description: "Server port",
      value: "3000",
    });
    store.add({
      name: "port",
      category: "config",
      description: "Server port (updated)",
      value: "8080",
    });
    expect(store.all()).toHaveLength(1);
    expect(store.get("config", "port")!.value).toBe("8080");
  });

  it("allows same name in different categories", () => {
    const store = new MemoryStore(dir);
    store.add({ name: "url", category: "prod", description: "Prod URL", value: "https://prod" });
    store.add({ name: "url", category: "dev", description: "Dev URL", value: "http://localhost" });
    expect(store.all()).toHaveLength(2);
    expect(store.get("prod", "url")!.value).toBe("https://prod");
    expect(store.get("dev", "url")!.value).toBe("http://localhost");
  });

  it("returns null for missing memory", () => {
    const store = new MemoryStore(dir);
    expect(store.get("nope", "nope")).toBeNull();
  });

  it("deletes a memory", () => {
    const store = new MemoryStore(dir);
    store.add({ name: "x", category: "c", description: "d", value: "v" });
    expect(store.delete("c", "x")).toBe(true);
    expect(store.get("c", "x")).toBeNull();
    expect(store.all()).toHaveLength(0);
  });

  it("returns false when deleting non-existent memory", () => {
    const store = new MemoryStore(dir);
    expect(store.delete("nope", "nope")).toBe(false);
  });

  it("persists to disk and survives reload", () => {
    const store = new MemoryStore(dir);
    store.add({ name: "key", category: "cat", description: "desc", value: "val" });

    // New instance reads from same file
    const store2 = new MemoryStore(dir);
    expect(store2.get("cat", "key")!.value).toBe("val");
  });

  it("writes valid JSON to disk", () => {
    const store = new MemoryStore(dir);
    store.add({ name: "a", category: "b", description: "c", value: "d" });
    const raw = readFileSync(join(dir, "memories.json"), "utf-8");
    const parsed = JSON.parse(raw) as Memory[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe("a");
  });

  describe("index", () => {
    beforeEach(() => {
      copyFileSync(FIXTURE_PATH, join(dir, "memories.json"));
    });

    it("groups by category", () => {
      const store = new MemoryStore(dir);
      const idx = store.index();
      expect(Object.keys(idx)).toEqual(
        expect.arrayContaining(["config", "design", "architecture"])
      );
      expect(idx["config"]).toHaveLength(2);
      expect(idx["design"]).toHaveLength(1);
    });

    it("excludes description by default", () => {
      const store = new MemoryStore(dir);
      const idx = store.index();
      expect(idx["config"][0].description).toBe("");
    });

    it("includes description when requested", () => {
      const store = new MemoryStore(dir);
      const idx = store.index(true);
      expect(idx["config"][0].description).not.toBe("");
    });

    it("returns empty object for empty store", () => {
      const store = new MemoryStore(makeTempDir());
      expect(store.index()).toEqual({});
    });
  });
});
