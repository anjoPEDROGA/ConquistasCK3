import guides from '../data/guides.manual.json'
import type { AchievementGuide, AchievementGuideSection, ChecklistItem, Language } from '../types/achievement'

const guideList = guides as AchievementGuide[]

export const getGuideByAchievementId = (achievementId: string) =>
  guideList.find((guide) => guide.achievement_id === achievementId)

export const getGuideById = (guideId: string) => guideList.find((guide) => guide.id === guideId)

export const hasGuide = (achievementId: string) => Boolean(getGuideByAchievementId(achievementId))

export const getGuideText = (guide: AchievementGuide, language: Language) => ({
  title: language === 'pt' ? guide.title_pt?.trim() || guide.title_en : guide.title_en,
  summary: language === 'pt' ? guide.summary_pt?.trim() || guide.summary_en || '' : guide.summary_en || '',
})

export const getGuideSectionText = (section: AchievementGuideSection, language: Language) => ({
  title: language === 'pt' ? section.title_pt?.trim() || section.title_en : section.title_en,
  body: language === 'pt' ? section.body_pt?.trim() || section.body_en : section.body_en,
})

export const getGuideChecklistLabel = (item: ChecklistItem, language: Language) =>
  language === 'pt'
    ? item.label_pt?.trim() || item.label_en?.trim() || item.id
    : item.label_en?.trim() || item.label_pt?.trim() || item.id
