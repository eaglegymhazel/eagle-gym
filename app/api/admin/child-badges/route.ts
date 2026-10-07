import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/admin"
import { createAuthRouteClient } from "@/lib/server/authRouteClient"
import { getAdminBadgeDataForChild } from "@/lib/server/badges"
import type { BadgeMutationResult } from "@/lib/badgeMutation"

// Supabase eu-west-2: keep this database-heavy function in London.
export const preferredRegion = "lhr1"

const id = z.string().trim().uuid()
const date = z.union([
  z.string().max(80).refine(value => value === "" || !Number.isNaN(new Date(value).getTime()), "Enter a valid tracking date.")
    .transform(value => value === "" ? null : new Date(value).toISOString()),
  z.null(),
])
const assign = z.object({ childId: id, badgeId: id }).strict()
const remove = z.object({ assignmentId: id }).strict()
const skill = z.object({ assignmentId: id, badgeSkillId: id, completed: z.boolean() }).strict()
const complete = z.object({ assignmentId: id, markAllSkillsComplete: z.literal(true) }).strict()
const tracking = z.object({
  assignmentId: id, dateAwarded: date.optional(), datePaid: date.optional(), dateGiven: date.optional(),
}).strict().refine(value => value.dateAwarded !== undefined || value.datePaid !== undefined || value.dateGiven !== undefined,
  "Provide at least one tracking date.")

async function handle(request: NextRequest, method: "POST" | "PATCH" | "DELETE") {
  const started = performance.now()
  let authDuration = 0
  let badgeDuration = 0
  try {
    const { supabase, applyCookies } = createAuthRouteClient(request)
    const respond = (body: unknown, status = 200) => {
      const response = NextResponse.json(body, { status, headers: {
        "Cache-Control": "no-store",
        "Server-Timing": `auth;dur=${authDuration.toFixed(1)},badge;dur=${badgeDuration.toFixed(1)}`,
      } })
      return applyCookies(response)
    }
    const { data, error: authError } = await supabase.auth.getUser()
    authDuration = performance.now() - started
    if (authError || !data.user) return respond({ error: "Unauthorized" }, 401)
    const origin = request.headers.get("origin")
    if (origin && origin !== request.nextUrl.origin) return respond({ error: "Invalid request origin." }, 403)

    const body = await request.json().catch(() => null)
    const parsed = (method === "POST" ? assign : method === "DELETE" ? remove : z.union([skill, complete, tracking])).safeParse(body)
    if (!parsed.success) return respond({ error: "Invalid badge request. Check the selected badge, skill and dates." }, 400)
    const payload = parsed.data
    const action = method === "POST" ? "assign" : method === "DELETE" ? "delete"
      : "badgeSkillId" in payload ? "skill" : "markAllSkillsComplete" in payload ? "complete" : "tracking"

    const saveStarted = performance.now()
    // This service-only RPC verifies the Auth ID, checks the admin role and
    // performs validation, mutation and a narrow response in one transaction.
    const { data: result, error } = await supabaseAdmin.rpc("admin_mutate_child_badge", {
      p_auth_user_id: data.user.id, p_action: action, p_payload: payload,
    })
    badgeDuration = performance.now() - saveStarted
    if (error) {
      const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404
        : ["22023", "22P02", "22007", "22008"].includes(error.code ?? "") ? 400
        : error.code === "PGRST202" ? 503 : 500
      return respond({ error: status === 403 ? "Forbidden" : status === 404 || status === 400 ? error.message
        : "The badge could not be saved. Please try again." }, status)
    }
    if (!result) return respond({ error: "The badge save could not be checked. Please refresh." }, 500)
    const mutation = result as BadgeMutationResult
    if (request.headers.get("x-badge-response") === "single") return respond(mutation)

    // Compatibility with already-open browser tabs running the previous UI.
    const legacyData = await getAdminBadgeDataForChild(mutation.childId)
    return respond(legacyData)
  } catch {
    return NextResponse.json({ error: "The badge could not be saved. Please try again." }, {
      status: 500, headers: { "Cache-Control": "no-store" },
    })
  }
}

export const POST = (request: NextRequest) => handle(request, "POST")
export const PATCH = (request: NextRequest) => handle(request, "PATCH")
export const DELETE = (request: NextRequest) => handle(request, "DELETE")
