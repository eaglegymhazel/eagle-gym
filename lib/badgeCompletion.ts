export function getRequiredBadgeSkillCount(totalSkills: number): number {
  if (totalSkills <= 0) return 0
  return Math.max(1, totalSkills - 2)
}

export function hasCompletedBadgeSkills(
  completedSkills: number,
  totalSkills: number
): boolean {
  return (
    totalSkills > 0 &&
    completedSkills >= getRequiredBadgeSkillCount(totalSkills)
  )
}
