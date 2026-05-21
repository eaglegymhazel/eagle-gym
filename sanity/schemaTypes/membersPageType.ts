import { defineArrayMember, defineField, defineType } from "sanity"

export const membersPageType = defineType({
  name: "membersPage",
  title: "Members Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Page title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "intro",
      title: "Intro",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "Tab label",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "title",
              title: "Section title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "intro",
              title: "Section intro",
              type: "text",
              rows: 3,
            }),
            defineField({
              name: "focusItems",
              title: "Focus items",
              type: "array",
              of: [defineArrayMember({ type: "string" })],
            }),
            defineField({
              name: "practiceSteps",
              title: "Practice steps",
              type: "array",
              of: [defineArrayMember({ type: "string" })],
            }),
            defineField({
              name: "image",
              title: "Section image",
              type: "image",
              options: { hotspot: true },
              fields: [
                defineField({
                  name: "alt",
                  title: "Alt text",
                  type: "string",
                }),
              ],
            }),
          ],
          preview: {
            select: {
              title: "title",
              subtitle: "label",
              media: "image",
            },
          },
        }),
      ],
    }),
  ],
})
