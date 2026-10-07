import { hasCompletedBadgeSkills } from "./badgeCompletion"
import type { AdminAssignedBadge, AdminBadgeDefinitionOption } from "./server/badges"

export type { AdminAssignedBadge, AdminBadgeDefinitionOption }

export type BadgeMutationResult = {
  childId: string
  assignedBadge?: AdminAssignedBadge
  deletedAssignmentId?: string
  availableBadge?: AdminBadgeDefinitionOption | null
}

export function mergeAssignedBadge(current: AdminAssignedBadge[], result: BadgeMutationResult) {
  if (result.deletedAssignmentId) return current.filter(badge => badge.assignmentId !== result.deletedAssignmentId)
  const saved = result.assignedBadge
  if (!saved) throw new Error("The badge save response was incomplete. Please refresh before trying again.")
  return [...current.filter(badge => badge.assignmentId !== saved.assignmentId), saved].sort((a, b) =>
    (a.category ?? "").localeCompare(b.category ?? "", undefined, { sensitivity: "base" }) ||
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  )
}

export function optimisticSkillChange(current: AdminAssignedBadge[], assignmentId: string, skillId: string, completed: boolean) {
  return current.map(badge => {
    if (badge.assignmentId !== assignmentId) return badge
    const skills = badge.skills.map(skill => skill.id === skillId
      ? { ...skill, completedAt: completed ? skill.completedAt ?? new Date().toISOString() : null }
      : skill)
    return { ...badge, skills, isCompleted: hasCompletedBadgeSkills(skills.filter(skill => skill.completedAt).length, skills.length) }
  })
}
