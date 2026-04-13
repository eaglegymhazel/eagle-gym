import "server-only";

import { supabaseAdmin } from "@/lib/admin";

export type AdminBadgeSkill = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  completedAt: string | null;
};

export type AdminAssignedBadge = {
  assignmentId: string;
  badgeId: string;
  name: string;
  description: string | null;
  category: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  skills: AdminBadgeSkill[];
};

export type AdminBadgeDefinitionOption = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
};

type AssignmentRow = {
  id: string;
  child_id: string;
  badge_id: string;
  is_completed: boolean | null;
  completed_at: string | null;
};

type BadgeDefinitionRow = {
  id: string;
  name: string | null;
  description: string | null;
  category: string | null;
  is_active: boolean | null;
};

type BadgeSkillRow = {
  id: string;
  badge_id: string;
  name: string | null;
  description: string | null;
  sort_order: number | null;
};

type SkillProgressRow = {
  assignment_id: string;
  badge_skill_id: string;
  completed_at: string | null;
};

function sortSkills(a: AdminBadgeSkill, b: AdminBadgeSkill): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

export async function getAdminBadgeDataForChild(childId: string): Promise<{
  assignedBadges: AdminAssignedBadge[];
  availableBadges: AdminBadgeDefinitionOption[];
}> {
  const [{ data: assignmentData, error: assignmentError }, { data: definitionData, error: definitionError }] =
    await Promise.all([
      supabaseAdmin
        .from("child_badge_assignments")
        .select("id,child_id,badge_id,is_completed,completed_at")
        .eq("child_id", childId),
      supabaseAdmin
        .from("badge_definitions")
        .select("id,name,description,category,is_active")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true }),
    ]);

  if (assignmentError) throw new Error(assignmentError.message);
  if (definitionError) throw new Error(definitionError.message);

  const assignments = (assignmentData ?? []) as AssignmentRow[];
  const activeDefinitions = (definitionData ?? []) as BadgeDefinitionRow[];
  const assignedBadgeIds = [...new Set(assignments.map((assignment) => assignment.badge_id))];
  const assignmentIds = assignments.map((assignment) => assignment.id);

  let assignedDefinitions: BadgeDefinitionRow[] = [];
  if (assignedBadgeIds.length > 0) {
    const { data, error } = await supabaseAdmin
      .from("badge_definitions")
      .select("id,name,description,category,is_active")
      .in("id", assignedBadgeIds);

    if (error) throw new Error(error.message);
    assignedDefinitions = (data ?? []) as BadgeDefinitionRow[];
  }

  const definitionById = new Map<string, BadgeDefinitionRow>();
  [...activeDefinitions, ...assignedDefinitions].forEach((definition) => {
    definitionById.set(definition.id, definition);
  });

  let skills: BadgeSkillRow[] = [];
  if (assignedBadgeIds.length > 0) {
    const { data, error } = await supabaseAdmin
      .from("badge_skills")
      .select("id,badge_id,name,description,sort_order")
      .in("badge_id", assignedBadgeIds)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    skills = (data ?? []) as BadgeSkillRow[];
  }

  let progressRows: SkillProgressRow[] = [];
  if (assignmentIds.length > 0) {
    const { data, error } = await supabaseAdmin
      .from("child_badge_skill_progress")
      .select("assignment_id,badge_skill_id,completed_at")
      .in("assignment_id", assignmentIds);

    if (error) throw new Error(error.message);
    progressRows = (data ?? []) as SkillProgressRow[];
  }

  const skillsByBadgeId = new Map<string, BadgeSkillRow[]>();
  skills.forEach((skill) => {
    const existing = skillsByBadgeId.get(skill.badge_id) ?? [];
    existing.push(skill);
    skillsByBadgeId.set(skill.badge_id, existing);
  });

  const completedAtByAssignmentAndSkill = new Map<string, string | null>();
  progressRows.forEach((progress) => {
    completedAtByAssignmentAndSkill.set(
      `${progress.assignment_id}:${progress.badge_skill_id}`,
      progress.completed_at
    );
  });

  const assignedBadges = assignments
    .map((assignment) => {
      const definition = definitionById.get(assignment.badge_id);
      const badgeSkills = (skillsByBadgeId.get(assignment.badge_id) ?? []).map((skill) => ({
        id: skill.id,
        name: skill.name?.trim() || "Untitled skill",
        description: skill.description,
        sortOrder: skill.sort_order ?? 0,
        completedAt:
          completedAtByAssignmentAndSkill.get(`${assignment.id}:${skill.id}`) ?? null,
      }));

      return {
        assignmentId: assignment.id,
        badgeId: assignment.badge_id,
        name: definition?.name?.trim() || "Untitled badge",
        description: definition?.description ?? null,
        category: definition?.category ?? null,
        isCompleted: assignment.is_completed === true,
        completedAt: assignment.completed_at,
        skills: badgeSkills.sort(sortSkills),
      } satisfies AdminAssignedBadge;
    })
    .sort((a, b) => {
      const categoryCompare = (a.category ?? "").localeCompare(b.category ?? "", undefined, {
        sensitivity: "base",
      });
      if (categoryCompare !== 0) return categoryCompare;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

  const assignedSet = new Set(assignments.map((assignment) => assignment.badge_id));
  const availableBadges = activeDefinitions
    .filter((definition) => !assignedSet.has(definition.id))
    .map((definition) => ({
      id: definition.id,
      name: definition.name?.trim() || "Untitled badge",
      description: definition.description,
      category: definition.category,
    }));

  return { assignedBadges, availableBadges };
}

export async function getAssignedBadgesForChildren(
  childIds: string[]
): Promise<Record<string, AdminAssignedBadge[]>> {
  const uniqueChildIds = [...new Set(childIds.filter(Boolean))];
  if (uniqueChildIds.length === 0) return {};

  const entries = await Promise.all(
    uniqueChildIds.map(async (childId) => {
      const data = await getAdminBadgeDataForChild(childId);
      return [childId, data.assignedBadges] as const;
    })
  );

  return Object.fromEntries(entries);
}
