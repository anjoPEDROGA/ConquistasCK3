import type { DLCInfo } from '../types/achievement'

export const dlcLabels: Record<string, DLCInfo> = {
  'base-game': { id: 'base-game', name: 'Base Game', logo: '/assets/images/11 icons-logos/Logo_Crusader_Kings_3.png' },
  'northern-lords': { id: 'northern-lords', name: 'Northern Lords', logo: '/assets/images/11 icons-logos/Logo_Northern_Lords.png' },
  'royal-court': { id: 'royal-court', name: 'Royal Court', logo: '/assets/images/11 icons-logos/Logo_Royal_Court.png' },
  'fate-of-iberia': { id: 'fate-of-iberia', name: 'Fate of Iberia', logo: '/assets/images/11 icons-logos/Logo_Fate_of_Iberia.png' },
  'tours-and-tournaments': { id: 'tours-and-tournaments', name: 'Tours and Tournaments', logo: '/assets/images/11 icons-logos/Logo_Tours_and_Tournaments.png' },
  'legacy-of-persia': { id: 'legacy-of-persia', name: 'Legacy of Persia', logo: '/assets/images/11 icons-logos/Logo_Legacy_of_Persia.png' },
  'legends-of-the-dead': { id: 'legends-of-the-dead', name: 'Legends of the Dead', logo: '/assets/images/11 icons-logos/Logo_Legends_of_the_Dead.png' },
  'roads-to-power': { id: 'roads-to-power', name: 'Roads to Power', logo: '/assets/images/11 icons-logos/Logo_Roads_to_Power.png' },
  'khans-of-the-steppe': { id: 'khans-of-the-steppe', name: 'Khans of the Steppe', logo: '/assets/images/11 icons-logos/Logo_Khans_of_the_Steppe.png' },
  'all-under-heaven': { id: 'all-under-heaven', name: 'All Under Heaven', logo: '/assets/images/11 icons-logos/Logo_All_Under_Heaven.png' },
}

export const getDlcInfoList = (dlcIds: string[]) =>
  dlcIds.map((id) => dlcLabels[id] ?? { id, name: id, logo: undefined })

export const getDlcDisplayName = (id: string) => dlcLabels[id]?.name ?? id
