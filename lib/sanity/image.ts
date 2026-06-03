import { createImageUrlBuilder } from "@sanity/image-url"
import { sanityClient } from "./client"

const builder = sanityClient ? createImageUrlBuilder(sanityClient) : null

export function urlForImage(source: unknown) {
  if (!builder) {
    return null
  }

  return builder.image(source as never)
}
