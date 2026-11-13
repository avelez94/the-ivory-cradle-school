import fs from 'node:fs'
import path from 'node:path'

// Renders docs/STAFF_GUIDE.md with a small Markdown subset (headings, lists, bold, links, paragraphs).
function inline(text: string) {
  const html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
  return { __html: html }
}

export default function GuidePage() {
  const md = fs.readFileSync(path.join(process.cwd(), 'docs', 'STAFF_GUIDE.md'), 'utf8')
  const blocks: React.ReactNode[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  const flush = () => {
    if (!list) return
    const items = list.items.map((it, i) => <li key={i} dangerouslySetInnerHTML={inline(it)} style={{ marginTop: 6 }} />)
    blocks.push(list.ordered ? <ol key={blocks.length} style={{ marginTop: 10 }}>{items}</ol> : <ul key={blocks.length} style={{ marginTop: 10 }}>{items}</ul>)
    list = null
  }
  for (const raw of md.split('\n')) {
    const line = raw.trimEnd()
    const ol = /^\d+\.\s+(.*)/.exec(line)
    const ul = /^[*]\s+(.*)/.exec(line)
    if (ol || ul) {
      const ordered = !!ol
      if (!list || list.ordered !== ordered) {
        flush()
        list = { ordered, items: [] }
      }
      list.items.push((ol ?? ul)![1])
      continue
    }
    flush()
    if (!line) continue
    if (line.startsWith('# ')) blocks.push(<h1 key={blocks.length}>{line.slice(2)}</h1>)
    else if (line.startsWith('## ')) blocks.push(<h2 key={blocks.length}>{line.slice(3)}</h2>)
    else if (line.startsWith('### ')) blocks.push(<h3 key={blocks.length} className="h-card" style={{ marginTop: 22, fontSize: '1.2rem' }}>{line.slice(4)}</h3>)
    else blocks.push(<p key={blocks.length} style={{ marginTop: 12 }} dangerouslySetInnerHTML={inline(line)} />)
  }
  flush()
  return <article style={{ maxWidth: 780 }}>{blocks}</article>
}
