import { defineCliConfig } from "sanity/cli"
import { dataset, projectId } from "./lib/sanity/env"

export default defineCliConfig({
  api: {
    projectId: projectId || "missing-project-id",
    dataset: dataset || "production",
  },
})
