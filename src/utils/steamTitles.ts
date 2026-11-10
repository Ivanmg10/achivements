/** The anchor id of an achievement on the Steam game page (`#ach-<apiname>`); the apiname may hold any character. */
export function steamAchievementAnchor(apiname: string): string {
  return `ach-${apiname}`
}
