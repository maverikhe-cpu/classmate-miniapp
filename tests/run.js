const { getMiniProgram, closeMiniProgram, formatResult, log } = require('./helper')

const specs = {
  activity: () => require('./specs/activity.test'),
  album: () => require('./specs/album.test'),
  profile: () => require('./specs/profile.test'),
  contacts: () => require('./specs/contacts.test'),
  onboarding: () => require('./specs/onboarding.test')
}

const filter = process.argv[2] || null
const allResults = []

async function runSuite(suite) {
  const results = []
  log('Runner', `Running suite: ${suite.name}`)

  for (const test of suite.tests) {
    const start = Date.now()
    try {
      const mp = await getMiniProgram()
      await test.fn(mp)
      const duration = Date.now() - start
      results.push({ name: `${suite.name} > ${test.name}`, status: 'pass', duration })
      log(suite.name, `PASS ${test.name} (${duration}ms)`)
    } catch (err) {
      const duration = Date.now() - start
      results.push({ name: `${suite.name} > ${test.name}`, status: 'fail', duration, error: err.message })
      log(suite.name, `FAIL ${test.name}: ${err.message}`)
    }
  }

  return results
}

async function main() {
  console.log('')
  console.log('  Starting E2E Tests...')
  console.log(`  Filter: ${filter || 'all suites'}`)
  console.log('')

  const suiteKeys = filter
    ? Object.keys(specs).filter(k => k === filter)
    : Object.keys(specs)

  if (suiteKeys.length === 0) {
    console.log(`  No test suite found for "${filter}"`)
    process.exit(1)
  }

  try {
    const mp = await getMiniProgram()
    log('Runner', 'Connected to WeChat DevTools')
  } catch (err) {
    console.log('')
    console.log('  ERROR: Could not connect to WeChat Developer Tools')
    console.log(`  ${err.message}`)
    console.log('')
    console.log('  Make sure:')
    console.log('  1. WeChat DevTools is open with the project loaded')
    console.log('  2. Settings > Security > Service Port is enabled')
    console.log('')
    process.exit(1)
  }

  for (const key of suiteKeys) {
    const suite = specs[key]()
    const results = await runSuite(suite)
    allResults.push(...results)
  }

  await closeMiniProgram()

  const report = formatResult(allResults)
  console.log(report.output)

  process.exit(report.failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
