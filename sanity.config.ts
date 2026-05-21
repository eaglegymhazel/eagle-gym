import { defineConfig } from "sanity"
import { structureTool } from "sanity/structure"
import { dataset, projectId, studioTitle } from "./lib/sanity/env"
import { schemaTypes } from "./sanity/schemaTypes"

export default defineConfig({
  name: "default",
  title: studioTitle,
  projectId: projectId || "missing-project-id",
  dataset: dataset || "production",
  basePath: "/studio",
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
})
