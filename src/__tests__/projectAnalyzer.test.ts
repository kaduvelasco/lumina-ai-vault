import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeProject } from "../analyzers/projectAnalyzer.js";
import * as fs from "fs";
import * as fsp from "fs/promises";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
}));

const mockExists = vi.mocked(fs.existsSync);
const mockReadFile = vi.mocked(fsp.readFile);
const mockReaddir = vi.mocked(fsp.readdir);

describe("analyzeProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExists.mockReturnValue(false);
    mockReaddir.mockResolvedValue([]);
  });

  it("should return empty answers when no project files exist", async () => {
    const result = await analyzeProject("/empty");
    expect(result).toEqual({});
  });

  it("should detect TypeScript from tsconfig.json and package.json", async () => {
    mockExists.mockImplementation((p: fs.PathLike) => {
      const path = p.toString();
      return path.endsWith("package.json") || path.endsWith("tsconfig.json");
    });
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        description: "A TypeScript project",
        dependencies: { zod: "^4.0.0" },
        devDependencies: {},
      })
    );

    const result = await analyzeProject("/my-project");

    expect(result.languages).toContain("TypeScript");
    expect(result.description).toBe("A TypeScript project");
    expect(result.frameworks).toContain("Zod");
  });

  it("should detect React from package.json dependencies", async () => {
    mockExists.mockImplementation((p: fs.PathLike) =>
      p.toString().endsWith("package.json")
    );
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        dependencies: { react: "^18.0.0" },
        devDependencies: {},
      })
    );

    const result = await analyzeProject("/react-app");

    expect(result.frameworks).toContain("React");
    expect(result.languages).toContain("JavaScript");
  });

  it("should detect Rust from Cargo.toml", async () => {
    mockExists.mockImplementation((p: fs.PathLike) =>
      p.toString().endsWith("Cargo.toml")
    );
    mockReadFile.mockResolvedValue(
      '[package]\nname = "my-crate"\ndescription = "A Rust lib"\n\n[dependencies]\ntokio = "1.0"'
    );

    const result = await analyzeProject("/rust-project");

    expect(result.languages).toBe("Rust");
    expect(result.description).toBe("A Rust lib");
    expect(result.frameworks).toContain("Tokio");
  });

  it("should detect Docker infrastructure", async () => {
    mockExists.mockImplementation((p: fs.PathLike) =>
      p.toString().endsWith("Dockerfile") || p.toString().endsWith("docker-compose.yml")
    );

    const result = await analyzeProject("/dockerized");

    expect(result.infrastructure).toContain("Docker");
    expect(result.infrastructure).toContain("Docker Compose");
  });

  it("should detect components from top-level directories", async () => {
    mockReaddir.mockResolvedValue([
      { isDirectory: () => true, name: "src" },
      { isDirectory: () => true, name: "tests" },
      { isDirectory: () => false, name: "README.md" },
      { isDirectory: () => true, name: "node_modules" },
    ] as unknown as Awaited<ReturnType<typeof fsp.readdir>>);

    const result = await analyzeProject("/my-project");

    expect(result.components).toContain("src");
    expect(result.components).toContain("tests");
    expect(result.components).not.toContain("node_modules");
  });

  it("should extract description from README.md", async () => {
    mockExists.mockImplementation((p: fs.PathLike) =>
      p.toString().endsWith("README.md")
    );
    mockReadFile.mockResolvedValue("# My App\n\nA tool for managing things.\n\n## Usage\n");

    const result = await analyzeProject("/readme-project");

    expect(result.description).toBe("A tool for managing things.");
  });
});
