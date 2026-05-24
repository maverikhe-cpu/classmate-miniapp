const automator = require('miniprogram-automator')
const { PROJECT_PATH, DEFAULT_TIMEOUT } = require('./config')

let _miniProgram = null

async function getMiniProgram() {
  if (_miniProgram) return _miniProgram

  _miniProgram = await automator.launch({
    cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
    projectPath: PROJECT_PATH
  })

  return _miniProgram
}

async function closeMiniProgram() {
  if (_miniProgram) {
    await _miniProgram.close()
    _miniProgram = null
  }
}

async function waitFor(page, selector, timeout = DEFAULT_TIMEOUT) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const element = await page.$(selector)
    if (element) return element
    await sleep(200)
  }
  throw new Error(`Timeout waiting for selector: ${selector}`)
}

async function waitForText(page, selector, text, timeout = DEFAULT_TIMEOUT) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const element = await page.$(selector)
    if (element) {
      const actualText = await element.text()
      if (actualText.includes(text)) return element
    }
    await sleep(200)
  }
  throw new Error(`Timeout waiting for text "${text}" in selector: ${selector}`)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function log(suite, message) {
  const timestamp = new Date().toLocaleTimeString()
  console.log(`[${timestamp}] [${suite}] ${message}`)
}

function formatResult(results) {
  const total = results.length
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const duration = results.reduce((sum, r) => sum + r.duration, 0)

  const lines = [
    '',
    '═══════════════════════════════════════',
    '           Test Results',
    '═══════════════════════════════════════',
    ''
  ]

  results.forEach(r => {
    const icon = r.status === 'pass' ? 'PASS' : 'FAIL'
    const time = `${r.duration}ms`
    lines.push(`  ${icon}  ${r.name} (${time})`)
    if (r.status === 'fail' && r.error) {
      lines.push(`       Error: ${r.error}`)
    }
  })

  lines.push('')
  lines.push('───────────────────────────────────────')
  lines.push(`  Total: ${total}  |  Pass: ${passed}  |  Fail: ${failed}  |  Time: ${duration}ms`)
  lines.push('═══════════════════════════════════════')
  lines.push('')

  return { output: lines.join('\n'), passed, failed, total, duration }
}

module.exports = {
  getMiniProgram,
  closeMiniProgram,
  waitFor,
  waitForText,
  sleep,
  log,
  formatResult
}
