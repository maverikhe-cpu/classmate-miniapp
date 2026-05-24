const { getMiniProgram, waitFor, sleep, log } = require('../helper')

const SUITE = 'Activity'

async function testActivityListLoads(mp) {
  const page = await mp.switchTab('/pages/index/index')
  await sleep(2000)

  const tabs = await page.$('.tabs')
  if (!tabs) {
    throw new Error('Activity list page did not load properly')
  }

  log(SUITE, 'Activity list page loaded')
}

async function testTabSwitching(mp) {
  const page = await mp.currentPage()
  const tabs = await page.$$('.tab')

  if (tabs.length < 2) {
    throw new Error(`Expected at least 2 tabs, got ${tabs.length}`)
  }

  await tabs[1].tap()
  await sleep(1000)

  const activeTab = await page.$('.tab-active')
  if (!activeTab) {
    throw new Error('No active tab found after switching')
  }

  log(SUITE, `Tab switching works, ${tabs.length} tabs available`)
}

async function testFabButton(mp) {
  const page = await mp.currentPage()
  const fab = await page.$('.fab')

  if (!fab) {
    throw new Error('FAB create button not found')
  }

  await fab.tap()
  await sleep(2000)

  const page2 = await mp.currentPage()
  const currentPath = page2.path
  if (currentPath.includes('create-activity') || currentPath.includes('onboarding')) {
    log(SUITE, `FAB tap navigated to ${currentPath}`)
  } else {
    throw new Error(`Expected navigate to create-activity or onboarding, got ${currentPath}`)
  }
}

module.exports = {
  name: 'Activity',
  tests: [
    { name: 'Activity list page loads', fn: testActivityListLoads },
    { name: 'Tab switching works', fn: testTabSwitching },
    { name: 'FAB navigates to create activity', fn: testFabButton }
  ]
}
