import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";
import { getAdminBadgeDataForChild } from "@/lib/server/badges";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonError("Supabase is not configured.", 500);
    }

    const cookieStore = request.cookies;
    const cookiesToPersist: Array<{
      name: string;
      value: string;
      options?: Parameters<typeof cookieStore.set>[2];
    }> = [];
    const applyCookies = (response: NextResponse) => {
      cookiesToPersist.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    };

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          cookies.forEach((cookie) => cookiesToPersist.push(cookie));
        },
      },
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return applyCookies(jsonError("Unauthorized", 401));
    }

    const body = (await request.json()) as { childId?: unknown; badgeId?: unknown };
    const childId = typeof body.childId === "string" ? body.childId.trim() : "";
    const badgeId = typeof body.badgeId === "string" ? body.badgeId.trim() : "";

    if (!childId || !badgeId) {
      return applyCookies(jsonError("childId and badgeId are required.", 400));
    }

    const [{ data: childData, error: childError }, { data: badgeData, error: badgeError }] =
      await Promise.all([
        supabaseAdmin.from("Children").select("id").eq("id", childId).maybeSingle(),
        supabaseAdmin
          .from("badge_definitions")
          .select("id,is_active")
          .eq("id", badgeId)
          .maybeSingle(),
      ]);

    if (childError) return applyCookies(jsonError(childError.message, 500));
    if (badgeError) return applyCookies(jsonError(badgeError.message, 500));
    if (!childData) return applyCookies(jsonError("Child not found.", 404));
    if (!badgeData || badgeData.is_active !== true) {
      return applyCookies(jsonError("Active badge not found.", 404));
    }

    const { error: insertError } = await supabaseAdmin
      .from("child_badge_assignments")
      .insert({ child_id: childId, badge_id: badgeId });

    if (insertError && insertError.code !== "23505") {
      return applyCookies(jsonError(insertError.message, 500));
    }

    const data = await getAdminBadgeDataForChild(childId);
    return applyCookies(NextResponse.json(data));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonError("Supabase is not configured.", 500);
    }

    const cookieStore = request.cookies;
    const cookiesToPersist: Array<{
      name: string;
      value: string;
      options?: Parameters<typeof cookieStore.set>[2];
    }> = [];
    const applyCookies = (response: NextResponse) => {
      cookiesToPersist.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    };

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          cookies.forEach((cookie) => cookiesToPersist.push(cookie));
        },
      },
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return applyCookies(jsonError("Unauthorized", 401));
    }

    const body = (await request.json()) as {
      assignmentId?: unknown;
      badgeSkillId?: unknown;
      completed?: unknown;
      dateAwarded?: unknown;
      datePaid?: unknown;
    };
    const assignmentId = typeof body.assignmentId === "string" ? body.assignmentId.trim() : "";
    const badgeSkillId = typeof body.badgeSkillId === "string" ? body.badgeSkillId.trim() : "";
    const hasSkillUpdate = badgeSkillId.length > 0 || typeof body.completed === "boolean";
    const hasAssignmentUpdate =
      Object.prototype.hasOwnProperty.call(body, "dateAwarded") ||
      Object.prototype.hasOwnProperty.call(body, "datePaid");

    if (!assignmentId) {
      return applyCookies(jsonError("assignmentId is required.", 400));
    }

    if (!hasSkillUpdate && !hasAssignmentUpdate) {
      return applyCookies(
        jsonError(
          "Provide either badgeSkillId/completed or one of dateAwarded/datePaid.",
          400
        )
      );
    }

    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from("child_badge_assignments")
      .select("id,child_id,badge_id,is_completed")
      .eq("id", assignmentId)
      .maybeSingle();

    if (assignmentError) return applyCookies(jsonError(assignmentError.message, 500));
    if (!assignment) return applyCookies(jsonError("Badge assignment not found.", 404));

    if (hasSkillUpdate) {
      if (!badgeSkillId || typeof body.completed !== "boolean") {
        return applyCookies(jsonError("badgeSkillId and completed are required.", 400));
      }

      const { data: skill, error: skillError } = await supabaseAdmin
        .from("badge_skills")
        .select("id,badge_id")
        .eq("id", badgeSkillId)
        .maybeSingle();

      if (skillError) return applyCookies(jsonError(skillError.message, 500));
      if (!skill || skill.badge_id !== assignment.badge_id) {
        return applyCookies(jsonError("Badge skill not found for this assignment.", 404));
      }

      if (body.completed === true) {
        const { error: insertError } = await supabaseAdmin
          .from("child_badge_skill_progress")
          .insert({ assignment_id: assignmentId, badge_skill_id: badgeSkillId });

        if (insertError && insertError.code !== "23505") {
          return applyCookies(jsonError(insertError.message, 500));
        }
      } else {
        const { error: deleteError } = await supabaseAdmin
          .from("child_badge_skill_progress")
          .delete()
          .eq("assignment_id", assignmentId)
          .eq("badge_skill_id", badgeSkillId);

        if (deleteError) return applyCookies(jsonError(deleteError.message, 500));
      }

      const [
        { count: totalSkills, error: totalError },
        { count: completedSkills, error: completedError },
      ] = await Promise.all([
        supabaseAdmin
          .from("badge_skills")
          .select("id", { count: "exact", head: true })
          .eq("badge_id", assignment.badge_id),
        supabaseAdmin
          .from("child_badge_skill_progress")
          .select("id", { count: "exact", head: true })
          .eq("assignment_id", assignmentId),
      ]);

      if (totalError) return applyCookies(jsonError(totalError.message, 500));
      if (completedError) return applyCookies(jsonError(completedError.message, 500));

      const isCompleted = (totalSkills ?? 0) > 0 && (completedSkills ?? 0) >= (totalSkills ?? 0);
      const { error: updateError } = await supabaseAdmin
        .from("child_badge_assignments")
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq("id", assignmentId);

      if (updateError) return applyCookies(jsonError(updateError.message, 500));
    }

    if (hasAssignmentUpdate) {
      if (assignment.is_completed !== true) {
        return applyCookies(
          jsonError(
            "Award and payment dates can only be updated after the badge is complete.",
            400
          )
        );
      }

      const assignmentPatch: { date_awarded?: string | null; date_paid?: string | null } = {};

      if (Object.prototype.hasOwnProperty.call(body, "dateAwarded")) {
        if (body.dateAwarded === null || body.dateAwarded === "") {
          assignmentPatch.date_awarded = null;
        } else if (typeof body.dateAwarded === "string") {
          const parsed = new Date(body.dateAwarded);
          if (Number.isNaN(parsed.getTime())) {
            return applyCookies(jsonError("dateAwarded must be a valid date or null.", 400));
          }
          assignmentPatch.date_awarded = parsed.toISOString();
        } else {
          return applyCookies(jsonError("dateAwarded must be a valid date or null.", 400));
        }
      }

      if (Object.prototype.hasOwnProperty.call(body, "datePaid")) {
        if (body.datePaid === null || body.datePaid === "") {
          assignmentPatch.date_paid = null;
        } else if (typeof body.datePaid === "string") {
          const parsed = new Date(body.datePaid);
          if (Number.isNaN(parsed.getTime())) {
            return applyCookies(jsonError("datePaid must be a valid date or null.", 400));
          }
          assignmentPatch.date_paid = parsed.toISOString();
        } else {
          return applyCookies(jsonError("datePaid must be a valid date or null.", 400));
        }
      }

      if (Object.keys(assignmentPatch).length === 0) {
        return applyCookies(jsonError("No assignment fields were provided to update.", 400));
      }

      const { error: assignmentUpdateError } = await supabaseAdmin
        .from("child_badge_assignments")
        .update(assignmentPatch)
        .eq("id", assignmentId);

      if (assignmentUpdateError) {
        return applyCookies(jsonError(assignmentUpdateError.message, 500));
      }
    }

    const data = await getAdminBadgeDataForChild(assignment.child_id);
    return applyCookies(NextResponse.json(data));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonError("Supabase is not configured.", 500);
    }

    const cookieStore = request.cookies;
    const cookiesToPersist: Array<{
      name: string;
      value: string;
      options?: Parameters<typeof cookieStore.set>[2];
    }> = [];
    const applyCookies = (response: NextResponse) => {
      cookiesToPersist.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    };

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          cookies.forEach((cookie) => cookiesToPersist.push(cookie));
        },
      },
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return applyCookies(jsonError("Unauthorized", 401));
    }

    const body = (await request.json()) as { assignmentId?: unknown };
    const assignmentId = typeof body.assignmentId === "string" ? body.assignmentId.trim() : "";

    if (!assignmentId) {
      return applyCookies(jsonError("assignmentId is required.", 400));
    }

    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from("child_badge_assignments")
      .select("id,child_id")
      .eq("id", assignmentId)
      .maybeSingle();

    if (assignmentError) return applyCookies(jsonError(assignmentError.message, 500));
    if (!assignment) return applyCookies(jsonError("Badge assignment not found.", 404));

    const { error: progressDeleteError } = await supabaseAdmin
      .from("child_badge_skill_progress")
      .delete()
      .eq("assignment_id", assignmentId);

    if (progressDeleteError) {
      return applyCookies(jsonError(progressDeleteError.message, 500));
    }

    const { error: assignmentDeleteError } = await supabaseAdmin
      .from("child_badge_assignments")
      .delete()
      .eq("id", assignmentId);

    if (assignmentDeleteError) {
      return applyCookies(jsonError(assignmentDeleteError.message, 500));
    }

    const data = await getAdminBadgeDataForChild(assignment.child_id);
    return applyCookies(NextResponse.json(data));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
