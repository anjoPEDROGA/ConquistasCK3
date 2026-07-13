import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import * as cheerio from 'cheerio'

const projectRoot = 'E:/ConquistasCK3/app'
const outRoot = path.join(projectRoot, 'raw/dlcs-structured')
const pageUrl = 'https://ck3.paradoxwikis.com/Achievement'
const browserExecutablePath = 'C:/Users/picad/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'

const DLC_HEADING_TO_FILE = new Map([
  ['Base game', 'base_game.json'],
  ['Northern Lords', 'northern_lords.json'],
  ['Royal Court', 'royal_court.json'],
  ['Fate of Iberia', 'fate_of_iberia.json'],
  ['Tours and Tournaments', 'tours_and_tournaments.json'],
  ['Legacy of Persia', 'legacy_of_persia.json'],
  ['Legend of the Dead', 'legends_of_the_dead.json'],
  ['Roads to Power', 'roads_to_power.json'],
  ['Khans of the Steppe', 'khans_of_the_steppe.json'],
  ['All Under Heaven', 'all_under_heaven.json'],
])

const normalize = (value) =>
  String(value)
    .replace(/\s+/g, ' ')
    .trim()

const textFromNode = (node) => {
  if (!node) return ''
  const type = node.type
  if (type === 'text') return node.data
  if (type === 'tag') {
    const name = node.name
    if (name === 'br') return '\n'
    if (name === 'img') return ''
    if (node.attribs?.class?.includes('mw-collapsible-toggle')) return ''
    const children = (node.children ?? []).map(textFromNode).join('')
    if (name === 'p' || name === 'li' || name === 'div') return `${children}\n`
    return children
  }
  return ''
}

const cellText = ($, cell) => {
  const root = $(cell)[0]
  if (!root) return ''
  return normalize(
    textFromNode(root)
      .replace(/\u00a0/g, ' ')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n\s*\n+/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n'),
  )
}

const cellTextWithParagraphs = ($, cell) => {
  const raw = cellText($, cell)
  return raw
    .split(/\n+/)
    .map((part) => normalize(part))
    .filter(Boolean)
    .join('\n\n')
}

const extractNameAndIcon = ($, cell) => {
  const link = $(cell).find('a.image').first()
  const href = link.attr('href') ?? ''
  const iconFile = href.startsWith('/File:') ? href.slice('/File:'.length) : ''
  const bold = $(cell).find('div[style*="font-weight: bold"]').first().text()
  const italic = $(cell).find('div[style*="font-style: italic"]').first().text()
  const titleText = normalize(bold || $(cell).text().split(/\n/)[0] || '')
  return {
    name: titleText,
    short_description: normalize(italic),
    icon_file: iconFile,
  }
}

const difficultyFromCell = (text) => {
  const normalized = normalize(text)
  if (normalized === 'VE') return 'VE'
  if (normalized === 'E') return 'E'
  if (normalized === 'M') return 'M'
  if (normalized === 'H') return 'H'
  if (normalized === 'VH') return 'VH'
  return ''
}

const getHtml = async () => {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true, executablePath: browserExecutablePath })
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 2200 } })
    await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 120000 })
    return await page.content()
  } finally {
    await browser.close()
  }
}

const main = async () => {
  const html = await getHtml()
  const $ = cheerio.load(html)
  const tables = []

  $('h3').each((_, heading) => {
    const title = normalize($(heading).text().replace(/\[editar.*$/, ''))
    const fileName = DLC_HEADING_TO_FILE.get(title)
    if (!fileName) return

    const table = $(heading).nextAll('table').first()
    if (!table.length) return

    const rows = []
    table.find('tr').slice(1).each((_, tr) => {
      const cells = $(tr).find('td')
      if (cells.length < 5) return
      const first = extractNameAndIcon($, cells.eq(0))
      rows.push({
        name: first.name,
        short_description: first.short_description,
        icon_file: first.icon_file,
        starting_conditions: cellText($, cells.eq(1)),
        requirements: cellText($, cells.eq(2)),
        hints: cellTextWithParagraphs($, cells.eq(3)),
        difficulty: difficultyFromCell(cellText($, cells.eq(4))),
      })
    })

    tables.push({ title, fileName, rows })
  })

  await mkdir(outRoot, { recursive: true })
  for (const table of tables) {
    const outPath = path.join(outRoot, table.fileName)
    await writeFile(outPath, JSON.stringify(table.rows, null, 2), 'utf8')
  }

  console.log(`Wrote ${tables.length} structured DLC files to ${outRoot}`)
  for (const table of tables) console.log(`${table.fileName}: ${table.rows.length}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
