import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListProjectsHandler } from "../handlers/ListProjectsHandler.js";
import * as vault from "../vault.js";

// Mock the vault module
vi.mock("../vault.js", () => ({
  listProjects: vi.fn(),
}));

describe("ListProjectsHandler", () => {
  const basePath = "/tmp/vault";
  let handler: ListProjectsHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new ListProjectsHandler(basePath);
  });

  it("should have the correct tool name and description", () => {
    expect(handler.name).toBe("list_projects");
    expect(handler.description).toBe("List all projects in the vault");
  });

  it("should return a list of projects when they exist", async () => {
    const mockProjects = ["project1", "project2"];
    vi.mocked(vault.listProjects).mockResolvedValue(mockProjects);

    const result = await handler.execute({});

    expect(vault.listProjects).toHaveBeenCalledWith(basePath);
    expect(result.content[0]!.text).toContain("project1");
    expect(result.content[0]!.text).toContain("project2");
  });

  it("should return a helpful message when no projects are found", async () => {
    vi.mocked(vault.listProjects).mockResolvedValue([]);

    const result = await handler.execute({});

    expect(result.content[0]!.text).toBe("No projects found. Use create_project to add one.");
  });

  it("should validate empty input correctly", () => {
    expect(() => handler.validate({})).not.toThrow();
  });
});
