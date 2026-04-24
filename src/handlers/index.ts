import { ListProjectsHandler } from "./ListProjectsHandler.js";
import { CreateProjectHandler } from "./CreateProjectHandler.js";
import { DeleteProjectHandler } from "./DeleteProjectHandler.js";
import { ListFilesHandler } from "./ListFilesHandler.js";
import { ReadMemoryHandler } from "./ReadMemoryHandler.js";
import { WriteMemoryHandler } from "./WriteMemoryHandler.js";
import { AppendMemoryHandler } from "./AppendMemoryHandler.js";
import { DeleteMemoryHandler } from "./DeleteMemoryHandler.js";
import { SearchMemoryHandler } from "./SearchMemoryHandler.js";
import { InitProjectMemoryHandler } from "./InitProjectMemoryHandler.js";
import { LoadProjectContextHandler } from "./LoadProjectContextHandler.js";
import { HealthCheckHandler } from "./HealthCheckHandler.js";
import { GetVaultConfigHandler } from "./GetVaultConfigHandler.js";
import { UpdateProjectMemoryHandler } from "./UpdateProjectMemoryHandler.js";
import { UnregisterSubProjectHandler } from "./UnregisterSubProjectHandler.js";
import { BaseToolHandler } from "./base.js";
import { z } from "zod";

export function createHandlers(basePath: string): BaseToolHandler<z.ZodTypeAny>[] {
  return [
    new ListProjectsHandler(basePath),
    new CreateProjectHandler(basePath),
    new DeleteProjectHandler(basePath),
    new ListFilesHandler(basePath),
    new ReadMemoryHandler(basePath),
    new WriteMemoryHandler(basePath),
    new AppendMemoryHandler(basePath),
    new DeleteMemoryHandler(basePath),
    new SearchMemoryHandler(basePath),
    new InitProjectMemoryHandler(basePath),
    new LoadProjectContextHandler(basePath),
    new HealthCheckHandler(basePath),
    new GetVaultConfigHandler(basePath),
    new UpdateProjectMemoryHandler(basePath),
    new UnregisterSubProjectHandler(basePath),
  ];
}
