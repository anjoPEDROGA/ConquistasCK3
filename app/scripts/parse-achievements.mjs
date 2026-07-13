import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const projectRoot = 'E:/ConquistasCK3/app'
const rawRoot = path.join(projectRoot, 'raw')
const dlcsRoot = path.join(rawRoot, 'dlcs')
const legacySourceFile = path.join(rawRoot, 'conteudo.txt')
const imagesRoot = path.join(projectRoot, 'public/assets/images')
const achievementsOut = path.join(projectRoot, 'src/data/achievements.generated.json')
const guidesOut = path.join(projectRoot, 'src/data/guides.generated.json')
const reportOut = path.join(projectRoot, 'src/data/parse-report.json')
const diagnosticsOut = path.join(projectRoot, 'src/data/parse-diagnostics.md')
const difficultyOverridesPath = path.join(projectRoot, 'src/data/difficulty-overrides.json')
const difficultyManualPath = path.join(projectRoot, 'src/data/difficulty-manual.txt')
const EXPECTED_DIFFICULTY_COUNTS = {
  'very-easy': 13,
  easy: 37,
  medium: 63,
  hard: 56,
  'very-hard': 19,
  unknown: 0,
}

const placeholderIcon = '/assets/images/placeholder-achievement.svg'
const verbose = process.argv.includes('--verbose')
const forceLegacy = process.argv.includes('--legacy')
const strictMode = process.argv.includes('--strict')

const DLC_SOURCE_FILES = {
  'base_game.txt': 'base-game',
  'northern_lords_clean.txt': 'northern-lords',
  'royal_court_clean.txt': 'royal-court',
  'fate_of_iberia_clean.txt': 'fate-of-iberia',
  'tours_and_tournaments_clean.txt': 'tours-and-tournaments',
  'legacy_of_persia_clean.txt': 'legacy-of-persia',
  'legends_of_the_dead_clean.txt': 'legends-of-the-dead',
  'roads_to_power_clean.txt': 'roads-to-power',
  'khans_of_the_steppe_clean.txt': 'khans-of-the-steppe',
  'all_under_heaven_clean.txt': 'all-under-heaven',
}

const DLC_ORDER = Object.values(DLC_SOURCE_FILES)

const difficultyMap = [
  { re: /\b(very easy|very-easy)\b/i, value: 'very-easy' },
  { re: /\b(vh|very hard|very-hard|muito dificil)\b/i, value: 'very-hard' },
  { re: /\b(h|hard|dificil)\b/i, value: 'hard' },
  { re: /\b(m|medium|medio|media)\b/i, value: 'medium' },
  { re: /\b(ve|e|easy|facil|muito facil)\b/i, value: 'easy' },
]

const tagKeywords = [
  ['religion', ['faith', 'religion', 'church', 'pope']],
  ['culture', ['culture', 'cultura', 'tradition', 'tradicao']],
  ['war', ['war', 'battle', 'army', 'raid', 'siege']],
  ['dynasty', ['dynasty', 'house', 'heir', 'bloodline']],
  ['kingdom', ['kingdom', 'realm', 'crown']],
  ['empire', ['empire', 'emperor']],
  ['iberia', ['iberia', 'iberian']],
  ['persia', ['persia', 'persian', 'iran']],
  ['steppe', ['steppe', 'khan', 'mongol', 'nomad']],
  ['viking', ['viking', 'norse', 'raider']],
  ['court', ['court', 'grandeur', 'artifact', 'guest']],
  ['tournament', ['tournament', 'joust', 'duel', 'knight']],
  ['plague', ['plague', 'disease']],
  ['legend', ['legend', 'local legend']],
  ['travel', ['travel', 'tour', 'journey']],
  ['africa', ['africa', 'african']],
  ['india', ['india', 'indian']],
  ['china', ['china', 'chinese', 'mandate of heaven']],
  ['byzantine', ['byzantine', 'roman', 'rome']],
  ['long-campaign', ['long campaign', 'ages', 'century']],
]

const normalize = (value) =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const clean = (value) => String(value).replace(/\s+/g, ' ').trim()
const slugify = (value) => normalize(value)
const normalizeDlcFilename = (filename) => DLC_SOURCE_FILES[filename.toLowerCase()] ?? null

const isNoiseLine = (line) => {
  const norm = normalize(line)
  return (
    !norm ||
    /^(list-of-achievements|references|referencias?|dicas-e-estrategias|difficulty|starting-conditions|requirements|hints-strategies|achievement-starting-conditions)$/i.test(norm) ||
    /(^|\t)(de|di|difficulty)(\t|$)/i.test(line) ||
    /^https?:\/\//i.test(line)
  )
}

const detectDifficulty = (text) => {
  for (const item of difficultyMap) {
    if (item.re.test(text)) return item.value
  }
  return null
}

const normalizeDifficulty = (value) => {
  if (
    value === 'very-easy' ||
    value === 'easy' ||
    value === 'medium' ||
    value === 'hard' ||
    value === 'very-hard' ||
    value === 'unknown'
  ) {
    return value
  }
  return 'unknown'
}

const normalizeManualText = (value) =>
  String(value)
    .normalize('NFKC')
    .replace(/[\uFEFF\u200B-\u200D\u2060]/g, '')
    .replace(/’/g, "'")
    .replace(/“|”/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/['`´]/g, '')

const normalizeManualDlc = (value) => {
  const normalized = normalizeManualText(value)
  if (normalized === 'legend-of-the-dead' || normalized === 'legends-of-the-dead') return 'legends-of-the-dead'
  if (normalized === 'all under heaven' || normalized === 'all-under-heaven') return 'all-under-heaven'
  return normalized.replace(/\s+/g, '-')
}

const readDifficultyManual = async () => {
  try {
    const raw = await readFile(difficultyManualPath, 'utf8')
    const lines = raw.split(/\r?\n/)
    const entries = []
    let currentDlc = null
    for (const rawLine of lines) {
      const line = normalizeManualText(rawLine)
      if (!line) continue
      if (line.startsWith('#')) {
        currentDlc = normalizeManualDlc(line.slice(1))
        continue
      }
      if (!currentDlc || !line.includes('|')) continue
      const [name, difficulty] = line.split('|').map((part) => normalizeManualText(part))
      if (!name || !difficulty) continue
      entries.push({ dlc: currentDlc, name, difficulty: normalizeDifficulty(difficulty) })
    }
    return entries
  } catch {
    return []
  }
}

const makeDifficultyKey = (dlc, name) => `${normalizeManualDlc(dlc)}::${normalizeManualText(name)}`

const selectTags = (text) => {
  const lower = text.toLowerCase()
  const tags = []
  for (const [tag, keywords] of tagKeywords) {
    if (keywords.some((k) => lower.includes(k))) tags.push(tag)
    if (tags.length >= 6) break
  }
  return tags
}

const titleLooksInvalid = (name) =>
  !name ||
  name.length > 80 ||
  /\t/.test(name) ||
  /^conquista/i.test(name) ||
  /^list of achievements$/i.test(name) ||
  /^https?:\/\//i.test(name) ||
  /achievement starting conditions/i.test(name)

const titleLooksNarrative = (name) =>
  /^(In \d{3,4}|Alternatively|Note|N\.B\.|This achievement|The achievement|The following|Within the|Start|Play|Declare|Wait|Create|Replace|Conquer|Move|Use|Take|Go|Kill|Hold|Make sure)\b/i.test(
    clean(name),
  )

const titleLooksRequirement = (name) =>
  /^(Capital is in|Is naked|Has neither:|Holy Roman Empire|Kingdom of |Empire of |County of |Duchy of |Owns or is liege|Completely controls|Playing as)\b/i.test(
    clean(name),
  ) || /\b(culture|religion|region|faith|county|duchy|kingdom|empire)$/i.test(clean(name))

const titleLooksTooLong = (name) => clean(name).length > 60
const looksLikeAchievementName = (line) => {
  const value = clean(line)
  if (!value) return false
  if (normalize(value).includes('heavenly kingdom')) return true
  if (value.startsWith('\t')) return false
  if (value.endsWith(':')) return false
  if (value.length < 3 || value.length > 60) return false
  if (/^\d/.test(value)) return false
  if (value.includes('http://') || value.includes('https://')) return false
  if (/^\-/.test(value) || /^•/.test(value)) return false
  if (titleLooksInvalid(value) || titleLooksNarrative(value) || titleLooksRequirement(value) || titleLooksTooLong(value)) return false
  return /[A-Za-z]/.test(value)
}

const looksLikeDescription = (line) => {
  const value = clean(line)
  if (!value) return false
  if (value.length > 180) return true
  if (/\t/.test(line)) return true
  if (
    /^(As |Have |Starting as |With |Finish |Pass through |Capture |Succeed |Orchestrate |Successfully |Participate |Visit |Obtain |Use |Reach |Hold |Murder |Marry |Increase |Suffer |Have one of |Have a max rank|As an? |As any one)/i.test(
      value,
    )
  ) {
    return true
  }
  return /^[A-Z][^:]{8,160}[.!?]?$/.test(value)
}

const isHeavenlyKingdomDescription = (name, description) =>
  normalize(name).includes('heavenly kingdom') &&
  /^Claim the Mandate of Heaven as the Head of Faith of a Christian faith$/i.test(clean(description))

const walkFiles = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true })
  const out = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walkFiles(full)))
    else out.push(full)
  }
  return out
}

const imageFiles = async () => {
  const files = []
  try {
    const walked = await walkFiles(imagesRoot)
    for (const file of walked) {
      if (/\.(png|jpg|jpeg|svg|webp|gif)$/i.test(file)) files.push(file)
    }
  } catch {
    return []
  }
  return files
}

const scoreImage = (achievementName, dlcId, filePath) => {
  const fileSlug = normalize(path.basename(filePath, path.extname(filePath)))
  const nameSlug = normalize(achievementName)
  let score = 0
  if (fileSlug === nameSlug) score += 100
  if (fileSlug.includes(nameSlug) || nameSlug.includes(fileSlug)) score += 45
  if (filePath.toLowerCase().includes('achievement')) score += 15
  if (filePath.toLowerCase().includes(dlcId.replace(/-/g, '_'))) score += 8
  if (filePath.toLowerCase().includes('map')) score -= 20
  if (filePath.toLowerCase().includes('logo_')) score -= 5
  const tokens = nameSlug.split('-').filter(Boolean)
  const fileTokens = fileSlug.split('-')
  for (const token of tokens) if (fileTokens.includes(token)) score += 5
  return score
}

const pickImage = (achievementName, dlcId, fileList) => {
  const iconCandidates = fileList
    .map((file) => ({ file, score: scoreImage(achievementName, dlcId, file) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
  return iconCandidates[0]?.score >= 18 ? `/assets/images/${path.relative(imagesRoot, iconCandidates[0].file).replace(/\\/g, '/')}` : placeholderIcon
}

const detectMaps = (text, fileList) => {
  if (!/map|maps/i.test(text)) return []
  return fileList
    .filter((file) => /map|maps/i.test(file))
    .slice(0, 3)
    .map((file) => `/assets/images/${path.relative(imagesRoot, file).replace(/\\/g, '/')}`)
}

const checklistFromText = (text, howTo) => {
  const items = [
    { id: 'confirm-achievement-requirements', label_en: 'Confirm achievement requirements', label_pt: 'Confirmar os requisitos da conquista' },
    { id: 'prepare-required-setup', label_en: 'Prepare the required character, title, faith, culture or region', label_pt: 'Preparar personagem, título, fé, cultura ou região exigida' },
    { id: 'execute-main-strategy', label_en: 'Execute the main strategy', label_pt: 'Executar a estratégia principal' },
    { id: 'unlock-achievement', label_en: 'Unlock the achievement in game', label_pt: 'Desbloquear a conquista no jogo' },
  ]

  const hints = `${text}\n${howTo}`
    .split(/[\n.;]+/)
    .map(clean)
    .filter((part) => part.length >= 20 && part.length <= 140)
    .filter((part) => !/^yes|^no|^sim|^nao|^very hard|^hard|^medium|^easy|^ve|^e|^m|^h|^vh/i.test(part))
    .filter((part) => !/achievement/i.test(part))
    .slice(0, 2)
    .map((part) => ({ id: slugify(part), label_en: part, label_pt: part }))

  return [...items, ...hints].slice(0, 6)
}

const structuredMatchers = {
  starting: [
    /^(playing as|starting as|as an?|as any one|with |is |in \d{3,4}|capital is in|has created|has married|has 10 children|has a child|has a lover|has a full set of)/i,
    /\b(culture|faith|religion|region|title|county|duchy|kingdom|empire)\b/i,
  ],
  requirements: [
    /^(has|have|hold|own|owns|completely controls|defeat|win|use|reach|obtain|create|found|murder|marry|increase|suffer|take part|participate|declare|start|play|replace|swear fealty|fabricate|convert|unlock|complete)/i,
    /\b(stress|hook|children|fame|devotion|dread|prestige|piety|legend|map|vassal|scheme)\b/i,
  ],
}

const classifyStructuredText = (text) => {
  const buckets = { starting: [], requirements: [], howTo: [] }
  const lines = text.split(/\r?\n/)
  for (const rawLine of lines) {
    const line = clean(rawLine)
    if (!line) continue
    const cells = rawLine.split('\t').map((cell) => clean(cell)).filter(Boolean)
    const parts = cells.length ? cells : [line]
    for (const part of parts) {
      if (/^(difficulty|starting conditions|requirements|hints & strategies)$/i.test(part)) continue
      const isProse = part.length > 180 || part.split(/\s+/).length > 32 || /\.\s+[A-Z]/.test(part)
      if (structuredMatchers.starting.some((re) => re.test(part))) {
        buckets.starting.push(part)
      } else if (structuredMatchers.requirements.some((re) => re.test(part)) || part.split(/\s+/).length <= 12 || !isProse) {
        buckets.requirements.push(part)
      } else {
        buckets.howTo.push(part)
      }
    }
  }

  const dedupeJoin = (items) => [...new Set(items)].join('\n\n').trim()
  return {
    startingConditions: dedupeJoin(buckets.starting),
    requirements: dedupeJoin(buckets.requirements),
    howTo: dedupeJoin(buckets.howTo),
  }
}

const parseAchievementText = (text, dlcId, fileList, warnings, rejectedBlocks, duplicates, seenIds, difficultyOverrides) => {
  const rawLines = text.split(/\r?\n/)
  const lines = rawLines.map((line) => line.replace(/\s+$/g, ''))
  const meaningful = lines.map(clean).filter(Boolean)
  if (!meaningful.length) return null

  const name = clean(meaningful[0])
  const description = clean(meaningful[1] ?? '')
  const body = meaningful.slice(2).join('\n')

  const forceHeavenlyKingdom = dlcId === 'all-under-heaven' && /The Heavenly Kingdom/i.test(text)
  if (!looksLikeAchievementName(name) || (!looksLikeDescription(description) && !forceHeavenlyKingdom)) {
    rejectedBlocks.push({ dlc: dlcId, reason: 'weak-title-description', preview: text.slice(0, 200) })
    return null
  }

  const structured = classifyStructuredText(meaningful.slice(2).join('\n'))

  const idBase = slugify(name)
  let id = idBase
  let counter = 2
  while (seenIds.has(id)) {
    duplicates.push({ originalId: idBase, duplicateId: `${idBase}-${counter}`, achievement: name })
    id = `${idBase}-${counter}`
    counter += 1
  }
  seenIds.add(id)

  const textForDifficulty = `${description}\n${body}`
  const overrideDifficulty = normalizeDifficulty(difficultyOverrides?.[id])
  const detectedDifficulty = normalizeDifficulty(detectDifficulty(textForDifficulty))
  const difficulty = overrideDifficulty !== 'unknown' ? overrideDifficulty : detectedDifficulty
  const usedOverride = overrideDifficulty !== 'unknown'
  const usedUnknown = !usedOverride && detectedDifficulty === 'unknown'
  if (usedUnknown) warnings.push({ type: 'difficulty_unknown', achievementId: id, message: 'Dificuldade nao encontrada; usando unknown.' })

  const starting = structured.startingConditions || ''
  const requirements = structured.requirements || ''
  const howTo = structured.howTo || body || description

  return {
    id,
    name_en: name,
    name_pt: '',
    dlc: dlcId,
    icon: pickImage(name, dlcId, fileList),
    difficulty,
    description_en: description,
    description_pt: '',
    requirements_en: requirements,
    requirements_pt: '',
    starting_conditions_en: starting,
    starting_conditions_pt: '',
    how_to_en: howTo,
    how_to_pt: '',
    tags: selectTags(text),
    checklist: checklistFromText(text, howTo),
    guide_id: undefined,
    maps: detectMaps(text, fileList),
    _difficultySource: usedOverride ? 'override' : usedUnknown ? 'unknown' : 'detected',
  }
}

const parseDlcFile = async (filePath, dlcId, fileList, warnings, rejectedBlocks, duplicates, seenIds, difficultyOverrides) => {
  const raw = await readFile(filePath, 'utf8')
  const paragraphs = raw
    .split(/\r?\n\s*\r?\n+/)
    .map((block) => block.trim())
    .filter(Boolean)

  const achievements = []
  for (const block of paragraphs) {
    const achievement = parseAchievementText(block, dlcId, fileList, warnings, rejectedBlocks, duplicates, seenIds, difficultyOverrides)
    if (achievement) achievements.push(achievement)
  }
  return achievements
}

const parseFromDlcFiles = async ({ fileList, warnings, rejectedBlocks, duplicates, seenIds, filesRead, difficultyOverrides }) => {
  const results = []
  const sourceFiles = []
  const entries = await readdir(dlcsRoot, { withFileTypes: true })
  const available = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.txt'))

  const mapped = available
    .map((entry) => ({ name: entry.name, dlc: normalizeDlcFilename(entry.name) }))
    .filter((entry) => entry.dlc)

  for (const entry of mapped.sort((a, b) => DLC_ORDER.indexOf(a.dlc) - DLC_ORDER.indexOf(b.dlc))) {
    const filePath = path.join(dlcsRoot, entry.name)
    const achievements = await parseDlcFile(filePath, entry.dlc, fileList, warnings, rejectedBlocks, duplicates, seenIds, difficultyOverrides)
    results.push(...achievements)
    sourceFiles.push(`raw/dlcs/${entry.name}`)
    filesRead.push({ file: `raw/dlcs/${entry.name}`, dlc: entry.dlc, achievements: achievements.length })
  }

  return { achievements: results, sourceFiles }
}

const parseFromLegacyConteudo = async ({ fileList, warnings, rejectedBlocks, duplicates, seenIds, filesRead, difficultyOverrides }) => {
  const raw = await readFile(legacySourceFile, 'utf8')
  const block = raw
    .split(/\r?\n\s*\r?\n+/)
    .map((part) => part.trim())
    .filter(Boolean)

  const achievements = []
  for (const part of block) {
    const achievement = parseAchievementText(part, 'base-game', fileList, warnings, rejectedBlocks, duplicates, seenIds, difficultyOverrides)
    if (achievement) achievements.push(achievement)
  }

  filesRead.push({ file: 'raw/conteudo.txt', dlc: 'base-game', achievements: achievements.length })
  return { achievements, sourceFiles: ['raw/conteudo.txt'] }
}

const buildGuide = (achievement, sourceText) => {
  const text = clean(sourceText.replace(new RegExp(`^${achievement.name_en}\\s*`, 'i'), ''))
  if (!/guide|guia|walkthrough|passo a passo|estrategia/i.test(text)) return null
  if (text.length < 300) return null
  const title = clean(achievement.name_en)
  if (!title || title.length > 80) return null
  if (achievement.id.startsWith('conquista-condicoes')) return null
  return {
    id: `${achievement.id}-guide`,
    achievement_id: achievement.id,
    title_pt: '',
    title_en: title,
    sections: [
      {
        title_pt: '',
        title_en: title,
        body_pt: '',
        body_en: text,
      },
    ],
    checklist: [],
  }
}

const sourceHasValidDlcFiles = async () => {
  try {
    const stats = await stat(dlcsRoot)
    if (!stats.isDirectory()) return false
    const files = await readdir(dlcsRoot)
    return files.some((file) => DLC_SOURCE_FILES[file.toLowerCase()])
  } catch {
    return false
  }
}

async function main() {
  const difficultyManualEntries = await readDifficultyManual()
  const fileList = await imageFiles()
  const warnings = []
  const rejectedBlocks = []
  const guideCandidatesRejected = []
  const duplicates = []
  const achievements = []
  const guides = []
  const filesRead = []
  const seenIds = new Set()
  let sourceMode = 'legacy-conteudo'
  let sourceFiles = ['raw/conteudo.txt']

  const useDlcFiles = !forceLegacy && (await sourceHasValidDlcFiles())
  if (useDlcFiles) {
    sourceMode = 'dlc-files'
    const parsed = await parseFromDlcFiles({ fileList, warnings, rejectedBlocks, duplicates, seenIds, filesRead })
    achievements.push(...parsed.achievements)
    sourceFiles = parsed.sourceFiles
  } else {
    const parsed = await parseFromLegacyConteudo({ fileList, warnings, rejectedBlocks, duplicates, seenIds, filesRead })
    achievements.push(...parsed.achievements)
    sourceFiles = parsed.sourceFiles
  }

  const filtered = []
  for (const achievement of achievements) {
    if (achievement.name_en.startsWith('http://') || achievement.name_en.startsWith('https://')) {
      rejectedBlocks.push({ dlc: achievement.dlc, reason: 'url-removed', preview: achievement.name_en })
      continue
    }
    if (titleLooksInvalid(achievement.name_en) || titleLooksNarrative(achievement.name_en) || titleLooksRequirement(achievement.name_en)) {
      rejectedBlocks.push({ dlc: achievement.dlc, reason: 'invalid-name', preview: achievement.name_en })
      continue
    }
    filtered.push({
      ...achievement,
      name_pt: '',
      description_pt: '',
      requirements_pt: '',
      starting_conditions_pt: '',
      how_to_pt: '',
    })
    const guide = buildGuide(achievement, `${achievement.name_en}\n${achievement.how_to_en}\n${achievement.description_en}`)
    if (guide) guides.push(guide)
  }

  const exactWayOfLife = normalize('Diplomat, August and Patriarch / Matriarch')
  const exactInternalRequirements = new Map(
    [
      ['Dynasty has 50 living members', 'internal-requirement'],
      ['All counties in the Iberia region is Christian', 'internal-requirement'],
      ['Obran Osh - Start', 'travel-route-guide-line'],
      ['Obran Osh - Taiga', 'travel-route-guide-line'],
    ].map(([name, reason]) => [normalize(name), reason]),
  )
  const finalAchievements = []
  for (const achievement of filtered) {
    const normalizedName = normalize(achievement.name_en)
    if (normalizedName === normalize('Completed a Raid Estate scheme')) {
      rejectedBlocks.push({ dlc: achievement.dlc, reason: 'internal-requirement-false-positive', preview: achievement.name_en })
      continue
    }
    if (normalizedName === exactWayOfLife) {
      rejectedBlocks.push({ dlc: achievement.dlc, reason: 'way-of-life-internal-list', preview: achievement.name_en })
      continue
    }
    if (exactInternalRequirements.has(normalizedName)) {
      rejectedBlocks.push({ dlc: achievement.dlc, reason: exactInternalRequirements.get(normalizedName), preview: achievement.name_en })
      continue
    }
    finalAchievements.push(achievement)
  }

  if (!finalAchievements.some((achievement) => normalize(achievement.name_en).includes('heavenly kingdom'))) {
    finalAchievements.push({
      id: slugify('The Heavenly Kingdom'),
      name_en: 'The Heavenly Kingdom',
      name_pt: '',
      dlc: 'all-under-heaven',
      icon: pickImage('The Heavenly Kingdom', 'all-under-heaven', fileList),
      difficulty: 'very-hard',
      description_en: 'Claim the Mandate of Heaven as the Head of Faith of a Christian faith',
      description_pt: '',
      requirements_en: 'Owns the Hegemony of China title',
      requirements_pt: '',
      starting_conditions_en: '',
      starting_conditions_pt: '',
      how_to_en:
        'Can be combined with Fishing in China achievement. Set the Rule Conquerors: Frequency to None or Vicayâla Chola will be a Conqueror and possibly block you from taking the optimal Holy Site. Playing as Hæsteinn, make your way towards India. Take a break after an Adventure CB on a Tribal Duchy on the eastern African coast which will allow you to Raid with the Capture Intent. Make as many prisoners as possible, execute them and undertake Pilgrimages until you have 4000 Piety. Continue and conquer the Holy site of Kerala of Nestorianism in the Raj of Chera Nadu. Then continue without any further Adventure CBs towards the border of China. Once you have the Claim the Mandate CB, convert to Nestorianism, then create a new Christian Faith with you as temporal Head of Faith (new Faiths can\'t be created while at war). Reset your perks to take the Apostate and Prophet Perks (Hæsteinn already has 7 Learning Perks because the game wants him to have Whole of Body) to reduce costs.',
      how_to_pt: '',
      tags: selectTags('The Heavenly Kingdom Claim the Mandate of Heaven'),
      checklist: checklistFromText('The Heavenly Kingdom', ''),
      guide_id: undefined,
      maps: [],
      _difficultySource: 'manual-fallback',
    })
  }

  const manualByKey = new Map()
  const manualEntriesByKey = new Map()
  for (const entry of difficultyManualEntries) {
    const key = makeDifficultyKey(entry.dlc, entry.name)
    if (!manualEntriesByKey.has(key)) manualEntriesByKey.set(key, [])
    manualEntriesByKey.get(key).push(entry)
  }

  const generatedByKey = new Map()
  for (const achievement of finalAchievements) {
    const key = makeDifficultyKey(achievement.dlc, achievement.name_en)
    if (!generatedByKey.has(key)) generatedByKey.set(key, [])
    generatedByKey.get(key).push(achievement)
  }

  const manualMissingFromGenerated = []
  const generatedMissingFromManual = []
  const difficultyOverrideDuplicates = []

  for (const [key, entries] of manualEntriesByKey.entries()) {
    const generatedMatches = generatedByKey.get(key) ?? []
    if (!generatedMatches.length) {
      for (const entry of entries) {
        manualMissingFromGenerated.push(entry)
      }
      continue
    }
    if (generatedMatches.length > 1 || entries.length > 1) {
      difficultyOverrideDuplicates.push({
        key,
        manualCount: entries.length,
        generatedCount: generatedMatches.length,
        manual: entries.map((entry) => ({ dlc: entry.dlc, name: entry.name, difficulty: entry.difficulty })),
        generated: generatedMatches.map((achievement) => ({ id: achievement.id, name_en: achievement.name_en, dlc: achievement.dlc })),
      })
    }
    const nextDifficulty = entries[0].difficulty
    for (const achievement of generatedMatches) {
      manualByKey.set(achievement.id, nextDifficulty)
    }
  }

  for (const [key, generatedMatches] of generatedByKey.entries()) {
    if (!manualEntriesByKey.has(key)) {
      for (const achievement of generatedMatches) {
        generatedMissingFromManual.push({ id: achievement.id, dlc: achievement.dlc, name_en: achievement.name_en })
      }
    }
  }

  for (const achievement of finalAchievements) {
    const difficulty = manualByKey.get(achievement.id) ?? 'unknown'
    achievement.difficulty = difficulty
  }

  const finalDuplicates = []
  const finalSeenIds = new Map()
  for (const achievement of finalAchievements) {
    if (finalSeenIds.has(achievement.id)) {
      finalDuplicates.push({
        originalId: finalSeenIds.get(achievement.id),
        duplicateId: achievement.id,
        achievement: achievement.name_en,
      })
    } else {
      finalSeenIds.set(achievement.id, achievement.name_en)
    }
  }
  duplicates.length = 0
  duplicates.push(...finalDuplicates)

  const byDlc = Object.fromEntries(DLC_ORDER.map((dlc) => [dlc, 0]))
  let withIcon = 0
  let withoutIcon = 0
  let withSamePtEnDescription = 0
  let difficultyOverrideCount = 0
  let difficultyUnknownCount = 0
  const difficultyCounts = { 'very-easy': 0, easy: 0, medium: 0, hard: 0, 'very-hard': 0, unknown: 0 }
  let suspiciousHeaderAchievements = 0
  let overlongNames = 0
  let overlongChecklistItems = 0
  let emptyDescriptions = 0

  for (const a of finalAchievements) {
    byDlc[a.dlc] = (byDlc[a.dlc] ?? 0) + 1
    if (a.icon && a.icon !== placeholderIcon) withIcon += 1
    else withoutIcon += 1
    if ((a.description_en || '') === (a.description_pt || '')) withSamePtEnDescription += 1
    const normalizedDifficulty = normalizeDifficulty(a.difficulty)
    difficultyCounts[normalizedDifficulty] += 1
    if (normalizedDifficulty === 'unknown') difficultyUnknownCount += 1
    if (!a.name_en || a.name_en.length > 80) overlongNames += 1
    if (!a.description_en) emptyDescriptions += 1
    if (/^conquista/i.test(a.name_en)) suspiciousHeaderAchievements += 1
    for (const item of a.checklist) if ((item.label_en || item.label_pt || '').length > 140) overlongChecklistItems += 1
  }

  const quality = {
    suspiciousHeaderAchievements,
    overlongNames,
    overlongChecklistItems,
    emptyDescriptions,
    unknownDlc: 0,
    samePtEnDescriptionRatio: finalAchievements.length ? withSamePtEnDescription / finalAchievements.length : 0,
  }

  const report = {
    generatedAt: new Date().toISOString(),
    sourceMode,
    sourceFiles,
    filesRead,
    totalAchievements: finalAchievements.length,
    totalGuides: guides.length,
    byDlc,
    withIcon,
    withoutIcon,
    withSamePtEnDescription,
    difficultyCounts,
    difficultyOverrideCount: difficultyManualEntries.length,
    difficultyUnknownCount,
    difficultyExpectedCounts: EXPECTED_DIFFICULTY_COUNTS,
    difficultyCountMismatches: Object.fromEntries(
      Object.entries(EXPECTED_DIFFICULTY_COUNTS).filter(([difficulty, expected]) => difficultyCounts[difficulty] !== expected).map(([difficulty, expected]) => [difficulty, { expected, actual: difficultyCounts[difficulty] }]),
    ),
    difficultyOverrideUnmatched: manualMissingFromGenerated,
    difficultyOverrideAmbiguous: difficultyOverrideDuplicates,
    difficultyManualMissingFromGenerated: manualMissingFromGenerated,
    difficultyGeneratedMissingFromManual: generatedMissingFromManual,
    rejectedBlocks,
    guideCandidatesRejected,
    duplicates,
    warnings,
    quality,
  }

  const diagnostics = [
    '# CK3 Achievement Parser Diagnostics',
    '',
    `- sourceMode: ${sourceMode}`,
    `- sourceFiles: ${sourceFiles.join(', ')}`,
    `- Total achievements: ${finalAchievements.length}`,
    `- Total guides: ${guides.length}`,
    `- With image: ${withIcon}`,
    `- Without image: ${withoutIcon}`,
    `- With same PT/EN description: ${withSamePtEnDescription}`,
    `- Difficulty counts: very-easy=${difficultyCounts['very-easy']}, easy=${difficultyCounts.easy}, medium=${difficultyCounts.medium}, hard=${difficultyCounts.hard}, very-hard=${difficultyCounts['very-hard']}, unknown=${difficultyCounts.unknown}`,
    `- Difficulty expected counts: very-easy=${EXPECTED_DIFFICULTY_COUNTS['very-easy']}, easy=${EXPECTED_DIFFICULTY_COUNTS.easy}, medium=${EXPECTED_DIFFICULTY_COUNTS.medium}, hard=${EXPECTED_DIFFICULTY_COUNTS.hard}, very-hard=${EXPECTED_DIFFICULTY_COUNTS['very-hard']}, unknown=${EXPECTED_DIFFICULTY_COUNTS.unknown}`,
    `- Difficulty actual counts: very-easy=${difficultyCounts['very-easy']}, easy=${difficultyCounts.easy}, medium=${difficultyCounts.medium}, hard=${difficultyCounts.hard}, very-hard=${difficultyCounts['very-hard']}, unknown=${difficultyCounts.unknown}`,
    `- Difficulty override count: ${difficultyManualEntries.length}`,
    `- Difficulty unknown count: ${difficultyUnknownCount}`,
    `- Difficulty manual unmatched: ${manualMissingFromGenerated.length}`,
    `- Difficulty generated missing from manual: ${generatedMissingFromManual.length}`,
    `- Difficulty ambiguous matches: ${difficultyOverrideDuplicates.length}`,
    ...(manualMissingFromGenerated.length
      ? ['- Manual missing from generated:', ...manualMissingFromGenerated.map((entry) => `  - ${entry.dlc}: ${entry.name} | ${entry.difficulty}`)]
      : []),
    ...(generatedMissingFromManual.length
      ? ['- Generated missing from manual:', ...generatedMissingFromManual.map((entry) => `  - ${entry.dlc}: ${entry.name_en} (${entry.id})`)]
      : []),
    '',
    '## Files Read',
    ...filesRead.map((entry) => `- ${entry.file} (${entry.dlc}): ${entry.achievements}`),
    '',
    '## By DLC',
    ...Object.entries(byDlc).map(([key, value]) => `- ${key}: ${value}`),
    '',
    '## Problems',
    `- Rejected blocks: ${rejectedBlocks.length}`,
    `- Guide candidates rejected: ${guideCandidatesRejected.length}`,
    `- Duplicates: ${duplicates.length}`,
    `- Warnings: ${warnings.length}`,
  ].join('\n')

  await mkdir(path.dirname(achievementsOut), { recursive: true })
  const cleanedAchievements = finalAchievements.map(({ _difficultySource, ...rest }) => rest)
  const difficultyOverridesOut = Object.fromEntries(finalAchievements.map((achievement) => [achievement.id, achievement.difficulty ?? 'unknown']))
  await writeFile(difficultyOverridesPath, JSON.stringify(difficultyOverridesOut, null, 2), 'utf8')
  await writeFile(achievementsOut, JSON.stringify(cleanedAchievements, null, 2), 'utf8')
  await writeFile(guidesOut, JSON.stringify(guides, null, 2), 'utf8')
  await writeFile(reportOut, JSON.stringify(report, null, 2), 'utf8')
  await writeFile(diagnosticsOut, diagnostics, 'utf8')

  console.log(`sourceMode: ${sourceMode}`)
  console.log(`sourceFiles: ${sourceFiles.join(', ')}`)
  for (const entry of filesRead) {
    console.log(`${entry.file} -> ${entry.achievements}`)
  }
  console.log(`Generated achievements: ${finalAchievements.length}`)
  console.log(`By DLC: ${Object.entries(byDlc).map(([key, value]) => `${key}=${value}`).join(', ')}`)
  console.log(`With image: ${withIcon}`)
  console.log(`Without image: ${withoutIcon}`)
  console.log(`Guides: ${guides.length}`)
  console.log(`Warnings: ${warnings.length}`)
  console.log(`Rejected blocks: ${rejectedBlocks.length}`)
  console.log(`Duplicates: ${duplicates.length}`)
  console.log(`Wrote: ${achievementsOut}`)
  console.log(`Wrote: ${guidesOut}`)
  console.log(`Wrote: ${reportOut}`)
  console.log(`Wrote: ${diagnosticsOut}`)

  if (strictMode) {
    const expectedFiles = Object.keys(DLC_SOURCE_FILES).length
    if (sourceMode !== 'dlc-files' || filesRead.length !== expectedFiles) {
      throw new Error(`Strict mode failed: expected ${expectedFiles} DLC files, got ${filesRead.length} in ${sourceMode}`)
    }
  }

  if (verbose) {
    console.log('\nVerbose samples:')
    console.log('Rejected block sample:', rejectedBlocks.slice(0, 3))
    console.log('Duplicate sample:', duplicates.slice(0, 3))
    for (const [dlc, count] of Object.entries(byDlc)) {
      const sample = finalAchievements.filter((achievement) => achievement.dlc === dlc).slice(0, 5).map((achievement) => achievement.name_en)
      console.log(`${dlc}: ${sample.join(' | ')}`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
