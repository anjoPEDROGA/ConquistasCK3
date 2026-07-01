import { readdir, stat, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const projectRoot = 'E:/ConquistasCK3/app'
const assetsRoot = path.join(projectRoot, 'public/assets/images')
const outputPath = path.join(projectRoot, 'scripts/asset-inventory.json')

const isImage = (file) => /\.(png|jpe?g|svg|webp|gif)$/i.test(file)

async function walk(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(fullPath, acc)
    } else if (isImage(entry.name)) {
      acc.push(fullPath)
    }
  }
  return acc
}

const classify = (filePath) => {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase()
  if (normalized.includes('/achievement') || normalized.includes('achievement')) return 'achievements'
  if (normalized.includes('/map') || normalized.includes('map')) return 'maps'
  if (normalized.includes('/logo_') || normalized.includes('/icon_') || normalized.includes('/icons-logos/')) return 'icons'
  return 'misc'
}

const topLevelFolder = (filePath) => {
  const relative = path.relative(assetsRoot, filePath)
  return relative.split(path.sep)[0] || 'root'
}

async function main() {
  const files = await walk(assetsRoot)
  const byExtension = {}
  const byTopLevelFolder = {}
  const grouped = { achievements: [], maps: [], icons: [], misc: [] }

  for (const file of files) {
    const ext = path.extname(file).toLowerCase() || '(none)'
    byExtension[ext] = (byExtension[ext] ?? 0) + 1

    const top = topLevelFolder(file)
    byTopLevelFolder[top] = (byTopLevelFolder[top] ?? 0) + 1

    grouped[classify(file)].push(path.relative(path.join(projectRoot, 'public'), file).replace(/\\/g, '/'))
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totalFiles: files.length,
    byExtension,
    byTopLevelFolder,
    likelyAchievementImages: grouped.achievements,
    likelyMapImages: grouped.maps,
    likelyIconImages: grouped.icons,
    warnings: [
      'Inventory is heuristic-based and may overclassify files.',
      'This report does not validate whether assets are used by the app.',
    ],
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8')
  console.log(`Inventory written to ${outputPath}`)
  console.log(`Files scanned: ${files.length}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
