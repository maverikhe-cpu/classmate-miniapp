const { getMiniProgram, sleep, log } = require('../helper')

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

  if (tabs.length < 4) {
    throw new Error(`Expected 4 tabs, got ${tabs.length}`)
  }

  await tabs[1].tap()
  await sleep(1000)

  const activeTab = await page.$('.tab-active')
  if (!activeTab) {
    throw new Error('No active tab found after switching')
  }

  log(SUITE, `Tab switching works, ${tabs.length} tabs available`)
}

async function testLocationFilter(mp) {
  const page = await mp.currentPage()

  const filterPills = await page.$$('.filter-pill')
  if (filterPills.length < 2) {
    throw new Error(`Expected at least 2 filter pills (country, city), got ${filterPills.length}`)
  }

  log(SUITE, `Location filter has ${filterPills.length} pills`)
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

async function testCreateActivityPageLoads(mp) {
  const page = await mp.reLaunch('/pages/create-activity/create-activity')
  await sleep(2000)

  const currentPath = page.path
  if (!currentPath.includes('create-activity')) {
    throw new Error(`Expected create-activity page, got ${currentPath}`)
  }

  const submitBtn = await page.$('.submit-btn')
  if (!submitBtn) {
    throw new Error('Submit button not found')
  }

  const btnText = await submitBtn.text()
  if (!btnText.includes('创建活动')) {
    throw new Error(`Expected "创建活动", got "${btnText}"`)
  }

  log(SUITE, 'Create activity page loads with submit button')
}

async function testCreateActivityFormFields(mp) {
  const page = await mp.currentPage()

  const labels = await page.$$('.form-label')
  const labelTexts = []
  for (const label of labels) {
    labelTexts.push(await label.text())
  }

  const required = ['活动名称', '开始时间', '结束时间', '活动地区', '活动详情']
  for (const r of required) {
    if (!labelTexts.some(t => t.includes(r))) {
      throw new Error(`Missing required form label: "${r}"`)
    }
  }

  const limitSwitch = await page.$('switch')
  if (!limitSwitch) {
    throw new Error('Member limit switch not found')
  }

  log(SUITE, `Create form has ${labels.length} labels, all required fields present`)
}

async function testCalendarPickerIntegration(mp) {
  const page = await mp.currentPage()

  const datetimeValues = await page.$$('.datetime-value')
  if (datetimeValues.length < 4) {
    throw new Error(`Expected at least 4 datetime-value elements, got ${datetimeValues.length}`)
  }

  await datetimeValues[0].tap()
  await sleep(1000)

  const calendar = await page.$('calendar-picker')
  if (!calendar) {
    throw new Error('Calendar picker did not appear after tapping date field')
  }

  log(SUITE, 'Calendar picker opens on date field tap')

  await datetimeValues[0].tap()
  await sleep(500)

  const calendarAfterClose = await page.$('calendar-picker')
  if (calendarAfterClose) {
    log(SUITE, 'Calendar toggled (still visible or re-opened)')
  } else {
    log(SUITE, 'Calendar closed on second tap')
  }
}

async function testActivityDetailPageLoads(mp) {
  const page = await mp.reLaunch('/pages/index/index')
  await sleep(2000)

  const activityCard = await page.$('activity-card')
  if (!activityCard) {
    log(SUITE, 'Skipping detail test — no activities in list')
    return
  }

  await activityCard.tap()
  await sleep(2000)

  const page2 = await mp.currentPage()
  if (!page2.path.includes('activity-detail')) {
    throw new Error(`Expected activity-detail page, got ${page2.path}`)
  }

  const title = await page2.$('.activity-title')
  if (!title) {
    throw new Error('Activity title not found on detail page')
  }

  const infoCard = await page2.$('.info-card')
  if (!infoCard) {
    throw new Error('Info card not found on detail page')
  }

  const shareBtn = await page2.$('.btn-share')
  if (!shareBtn) {
    throw new Error('Share button not found on detail page')
  }

  log(SUITE, 'Activity detail page loads with title, info card, share button')
}

module.exports = {
  name: 'Activity',
  tests: [
    { name: 'Activity list page loads', fn: testActivityListLoads },
    { name: 'Tab switching works', fn: testTabSwitching },
    { name: 'Location filter renders', fn: testLocationFilter },
    { name: 'FAB navigates to create activity', fn: testFabButton },
    { name: 'Create activity page loads', fn: testCreateActivityPageLoads },
    { name: 'Create form has all required fields', fn: testCreateActivityFormFields },
    { name: 'Calendar picker opens on date tap', fn: testCalendarPickerIntegration },
    { name: 'Activity detail page loads', fn: testActivityDetailPageLoads }
  ]
}
