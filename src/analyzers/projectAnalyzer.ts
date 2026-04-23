import { existsSync } from "fs";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { InitAnswers } from "../vault.js";

interface PackageJson {
  name?: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface CargoToml {
  package?: { description?: string };
}

const FRAMEWORK_MAP: Record<string, string> = {
  react: "React",
  next: "Next.js",
  vue: "Vue.js",
  nuxt: "Nuxt.js",
  svelte: "Svelte",
  express: "Express",
  fastify: "Fastify",
  "@nestjs/core": "NestJS",
  koa: "Koa",
  "@angular/core": "Angular",
  hono: "Hono",
  elysia: "Elysia",
};

const NOTABLE_LIBS: Record<string, string> = {
  zod: "Zod",
  prisma: "Prisma",
  "@modelcontextprotocol/sdk": "MCP SDK",
  drizzle: "Drizzle ORM",
  axios: "Axios",
  trpc: "tRPC",
  graphql: "GraphQL",
  "@anthropic-ai/sdk": "Anthropic SDK",
  openai: "OpenAI SDK",
};

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".git",
  ".next",
  ".nuxt",
  "coverage",
  "tmp",
  "temp",
]);

async function tryReadFile(path: string): Promise<string | null> {
  if (!existsSync(path)) return null;
  try {
    return await readFile(path, "utf-8");
  } catch {
    return null;
  }
}

async function detectFromPackageJson(
  workspaceRoot: string,
  answers: InitAnswers
): Promise<void> {
  const raw = await tryReadFile(join(workspaceRoot, "package.json"));
  if (!raw) return;

  let pkg: PackageJson;
  try {
    pkg = JSON.parse(raw) as PackageJson;
  } catch {
    return;
  }

  if (!answers.description && pkg.description) {
    answers.description = pkg.description;
  }

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const languages: string[] = [];

  const hasTypeScript =
    "typescript" in allDeps || existsSync(join(workspaceRoot, "tsconfig.json"));
  languages.push(hasTypeScript ? "TypeScript" : "JavaScript");

  const frameworks: string[] = [];
  const libs: string[] = [];

  for (const [dep, label] of Object.entries(FRAMEWORK_MAP)) {
    if (dep in allDeps) frameworks.push(label);
  }
  for (const [dep, label] of Object.entries(NOTABLE_LIBS)) {
    if (dep in allDeps) libs.push(label);
  }

  if (!answers.languages) {
    answers.languages = languages.join(", ");
  }

  const allFrameworks = [...frameworks, ...libs];
  if (!answers.frameworks && allFrameworks.length > 0) {
    answers.frameworks = allFrameworks.join(", ");
  }
}

async function detectFromReadme(workspaceRoot: string, answers: InitAnswers): Promise<void> {
  const raw = await tryReadFile(join(workspaceRoot, "README.md"));
  if (!raw) return;

  if (!answers.description) {
    // First non-empty line after the title heading
    const lines = raw.split("\n");
    let foundTitle = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!foundTitle && trimmed.startsWith("#")) {
        foundTitle = true;
        continue;
      }
      if (foundTitle && trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("!")) {
        answers.description = trimmed.replace(/\*\*/g, "").replace(/`/g, "").slice(0, 200);
        break;
      }
    }
  }
}

async function detectFromCargo(workspaceRoot: string, answers: InitAnswers): Promise<void> {
  const raw = await tryReadFile(join(workspaceRoot, "Cargo.toml"));
  if (!raw) return;

  if (!answers.languages) answers.languages = "Rust";

  if (!answers.description) {
    const match = raw.match(/^description\s*=\s*"(.+)"/m);
    if (match?.[1]) answers.description = match[1];
  }

  // Detect notable Cargo dependencies as frameworks
  if (!answers.frameworks) {
    const depSection = raw.match(/\[dependencies\]([\s\S]*?)(?:\[|$)/);
    if (depSection?.[1]) {
      const knownCrateFw: Record<string, string> = {
        axum: "Axum",
        actix: "Actix",
        rocket: "Rocket",
        tokio: "Tokio",
        serde: "Serde",
        sqlx: "sqlx",
        diesel: "Diesel",
      };
      const found: string[] = [];
      for (const [crate, label] of Object.entries(knownCrateFw)) {
        if (depSection[1].includes(crate)) found.push(label);
      }
      if (found.length > 0) answers.frameworks = found.join(", ");
    }
  }
}

async function detectFromPython(workspaceRoot: string, answers: InitAnswers): Promise<void> {
  const hasPyproject = existsSync(join(workspaceRoot, "pyproject.toml"));
  const hasRequirements = existsSync(join(workspaceRoot, "requirements.txt"));
  const hasSetupPy = existsSync(join(workspaceRoot, "setup.py"));

  if (!hasPyproject && !hasRequirements && !hasSetupPy) return;

  answers.languages = answers.languages ? `${answers.languages}, Python` : "Python";

  if (hasPyproject && !answers.frameworks) {
    const raw = await tryReadFile(join(workspaceRoot, "pyproject.toml"));
    if (raw) {
      const pyFw: Record<string, string> = {
        fastapi: "FastAPI",
        django: "Django",
        flask: "Flask",
        "starlette": "Starlette",
        pydantic: "Pydantic",
        sqlalchemy: "SQLAlchemy",
      };
      const found: string[] = [];
      for (const [pkg, label] of Object.entries(pyFw)) {
        if (raw.toLowerCase().includes(pkg)) found.push(label);
      }
      if (found.length > 0) answers.frameworks = found.join(", ");
    }
  }

  if (hasRequirements && !answers.frameworks) {
    const raw = await tryReadFile(join(workspaceRoot, "requirements.txt"));
    if (raw) {
      const pyFw: Record<string, string> = {
        fastapi: "FastAPI",
        django: "Django",
        flask: "Flask",
        pydantic: "Pydantic",
        sqlalchemy: "SQLAlchemy",
      };
      const found: string[] = [];
      for (const [pkg, label] of Object.entries(pyFw)) {
        if (raw.toLowerCase().includes(pkg)) found.push(label);
      }
      if (found.length > 0) answers.frameworks = found.join(", ");
    }
  }
}

async function detectFromGo(workspaceRoot: string, answers: InitAnswers): Promise<void> {
  const raw = await tryReadFile(join(workspaceRoot, "go.mod"));
  if (!raw) return;

  answers.languages = answers.languages ? `${answers.languages}, Go` : "Go";

  if (!answers.frameworks) {
    const goFw: Record<string, string> = {
      "github.com/gin-gonic/gin": "Gin",
      "github.com/labstack/echo": "Echo",
      "github.com/gofiber/fiber": "Fiber",
      "go.uber.org/zap": "Zap",
    };
    const found: string[] = [];
    for (const [mod, label] of Object.entries(goFw)) {
      if (raw.includes(mod)) found.push(label);
    }
    if (found.length > 0) answers.frameworks = found.join(", ");
  }
}

async function detectInfrastructure(workspaceRoot: string, answers: InitAnswers): Promise<void> {
  const infra: string[] = [];

  if (existsSync(join(workspaceRoot, "Dockerfile"))) infra.push("Docker");
  if (
    existsSync(join(workspaceRoot, "docker-compose.yml")) ||
    existsSync(join(workspaceRoot, "docker-compose.yaml"))
  )
    infra.push("Docker Compose");
  if (existsSync(join(workspaceRoot, ".github", "workflows"))) infra.push("GitHub Actions");
  if (existsSync(join(workspaceRoot, "terraform"))) infra.push("Terraform");
  if (existsSync(join(workspaceRoot, "k8s")) || existsSync(join(workspaceRoot, "kubernetes")))
    infra.push("Kubernetes");
  if (existsSync(join(workspaceRoot, ".gitlab-ci.yml"))) infra.push("GitLab CI");
  if (existsSync(join(workspaceRoot, "Pulumi.yaml"))) infra.push("Pulumi");

  if (!answers.infrastructure && infra.length > 0) {
    answers.infrastructure = infra.join(", ");
  }
}

async function detectComponents(workspaceRoot: string, answers: InitAnswers): Promise<void> {
  if (answers.components) return;
  try {
    const entries = await readdir(workspaceRoot, { withFileTypes: true });
    const dirs = entries
      .filter((e) => e.isDirectory() && !SKIP_DIRS.has(e.name) && !e.name.startsWith("."))
      .map((e) => e.name)
      .sort();

    if (dirs.length > 0 && dirs.length <= 15) {
      answers.components = dirs.join(", ");
    }
  } catch {
    // ignore
  }
}

export async function analyzeProject(workspaceRoot: string): Promise<InitAnswers> {
  const answers: InitAnswers = {};

  await detectFromReadme(workspaceRoot, answers);
  await detectFromPackageJson(workspaceRoot, answers);
  await detectFromCargo(workspaceRoot, answers);
  await detectFromPython(workspaceRoot, answers);
  await detectFromGo(workspaceRoot, answers);
  await detectInfrastructure(workspaceRoot, answers);
  await detectComponents(workspaceRoot, answers);

  return answers;
}
