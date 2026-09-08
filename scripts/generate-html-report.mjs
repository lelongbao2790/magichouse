#!/usr/bin/env node
/**
 * Converts a JUnit XML file into a self-contained single-file HTML test report.
 * Usage: node scripts/generate-html-report.mjs <xml-path> <html-path> <title>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const [,, xmlPath, htmlPath, title = 'Test Report'] = process.argv
if (!xmlPath || !htmlPath) {
  process.stderr.write('Usage: node scripts/generate-html-report.mjs <xml> <html> [title]\n')
  process.exit(1)
}

const xml = readFileSync(xmlPath, 'utf8')

// ── aggregate stats ──────────────────────────────────────────────────────────
function readAttr(tag, name) {
  return (tag.match(new RegExp(`${name}="([^"]*)"`) ) || [])[1] ?? '0'
}
const rootTag = (xml.match(/<testsuites[^>]*>/) || xml.match(/<testsuite[^>]*>/) || [''])[0]
const total    = parseInt(readAttr(rootTag, 'tests'))    || 0
const failures = parseInt(readAttr(rootTag, 'failures')) + parseInt(readAttr(rootTag, 'errors') || '0')
const skipped  = parseInt(readAttr(rootTag, 'skipped'))  || 0
const passed   = total - failures - skipped
const duration = parseFloat(readAttr(rootTag, 'time') || '0').toFixed(3)

// ── individual test cases ────────────────────────────────────────────────────
function decode(s) {
  return (s || '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
}

const cases = []
const parts = xml.split(/(?=<testcase[\s>])/)
for (const chunk of parts) {
  if (!chunk.trimStart().startsWith('<testcase')) continue
  const attrEnd   = chunk.indexOf('>')
  const attrsStr  = chunk.slice(0, attrEnd + 1)
  const body      = chunk.slice(attrEnd + 1, chunk.indexOf('</testcase>'))
  const name      = decode(readAttr(attrsStr, 'name'))
  const classname = decode(readAttr(attrsStr, 'classname'))
  const dur       = parseFloat(readAttr(attrsStr, 'time') || '0')
  const isFail    = /<failure|<error/.test(body)
  const isSkip    = /<skipped/.test(body)
  cases.push({ name, classname, dur, status: isFail ? 'FAIL' : isSkip ? 'SKIP' : 'PASS' })
}

// ── HTML ─────────────────────────────────────────────────────────────────────
const passRate    = total > 0 ? Math.round((passed / total) * 100) : 0
const headerColor = failures > 0 ? '#991b1b,#dc2626' : '#14532d,#16a34a'
const now         = new Date().toISOString().replace('T',' ').slice(0,19) + ' UTC'

const badge = (s) => ({
  PASS: '<span style="background:#16a34a;color:#fff;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600">PASS</span>',
  FAIL: '<span style="background:#dc2626;color:#fff;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600">FAIL</span>',
  SKIP: '<span style="background:#ca8a04;color:#fff;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600">SKIP</span>',
}[s])

const rowBg = (s) => ({ PASS: '#f0fdf4', FAIL: '#fef2f2', SKIP: '#fefce8' }[s])

const rows = cases.map((c, i) => `
  <tr style="background:${rowBg(c.status)};border-bottom:1px solid #f1f5f9">
    <td style="padding:8px 14px;font-size:12px;color:#94a3b8;white-space:nowrap">${i + 1}</td>
    <td style="padding:8px 14px;font-family:ui-monospace,monospace;font-size:13px">${c.name}</td>
    <td style="padding:8px 14px;font-size:11px;color:#64748b;white-space:nowrap">${c.classname.split(' > ').pop() || c.classname}</td>
    <td style="padding:8px 14px;text-align:center">${badge(c.status)}</td>
    <td style="padding:8px 14px;text-align:right;font-size:12px;color:#94a3b8;white-space:nowrap">${c.dur.toFixed(3)}s</td>
  </tr>`).join('')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#f1f5f9;color:#0f172a}
  .header{background:linear-gradient(135deg,${headerColor});color:#fff;padding:28px 40px}
  .header h1{margin:0 0 4px;font-size:22px;font-weight:700;letter-spacing:-.3px}
  .header p{margin:0;font-size:13px;opacity:.75}
  .stats{display:flex;gap:12px;padding:20px 40px;background:#fff;border-bottom:1px solid #e2e8f0;flex-wrap:wrap}
  .stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 22px;text-align:center;min-width:100px}
  .stat-n{font-size:30px;font-weight:700;line-height:1}
  .stat-l{font-size:11px;color:#64748b;margin-top:3px;text-transform:uppercase;letter-spacing:.5px}
  .content{padding:20px 40px}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)}
  thead tr{background:#f8fafc;border-bottom:2px solid #e2e8f0}
  th{padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.5px}
  .footer{padding:14px 40px;text-align:center;font-size:11px;color:#94a3b8}
</style>
</head>
<body>
<div class="header">
  <h1>${title}</h1>
  <p>Generated ${now}</p>
</div>
<div class="stats">
  <div class="stat"><div class="stat-n">${total}</div><div class="stat-l">Total</div></div>
  <div class="stat"><div class="stat-n" style="color:#16a34a">${passed}</div><div class="stat-l">Passed</div></div>
  <div class="stat"><div class="stat-n" style="color:#dc2626">${failures}</div><div class="stat-l">Failed</div></div>
  <div class="stat"><div class="stat-n" style="color:#ca8a04">${skipped}</div><div class="stat-l">Skipped</div></div>
  <div class="stat"><div class="stat-n" style="color:${failures > 0 ? '#dc2626' : '#16a34a'}">${passRate}%</div><div class="stat-l">Pass Rate</div></div>
  <div class="stat"><div class="stat-n">${duration}s</div><div class="stat-l">Duration</div></div>
</div>
<div class="content">
  <table>
    <thead><tr>
      <th>#</th><th>Test Case</th><th>Suite</th>
      <th style="text-align:center">Status</th><th style="text-align:right">Duration</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>
<div class="footer">magichouse · ${title} · ${total} test cases</div>
</body>
</html>`

mkdirSync(dirname(htmlPath), { recursive: true })
writeFileSync(htmlPath, html, 'utf8')
console.log(`Report → ${htmlPath}  (${total} total · ${passed} passed · ${failures} failed)`)
