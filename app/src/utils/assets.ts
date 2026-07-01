const PLACEHOLDER = '/assets/images/placeholder-achievement.svg'

const normalizePath = (value: string) => {
  if (!value.trim()) return PLACEHOLDER
  if (value.startsWith('/')) return value
  return `/assets/${value.replace(/^\.\/+/, '').replace(/^assets\//, '')}`
}

export const getAchievementIconUrl = (icon?: string) => normalizePath(icon ?? '')

export const getDlcLogoUrl = (logo?: string) => normalizePath(logo ?? '')

export const getMapUrl = (map?: string) => normalizePath(map ?? '')

export const assetPlaceholderUrl = PLACEHOLDER
