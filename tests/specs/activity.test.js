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

async function testCategoryFilterRenders(mp) {
  const page = await mp.switchTab('/pages/index/index')
  await sleep(2000)

  const categoryFilter = await page.$('.category-filter')
  if (!categoryFilter) {
    throw new Error('Category filter scroll-view not found')
  }

  const categoryPills = await page.$$('.category-pill')
  if (categoryPills.length === 0) {
    throw new Error('No category pills rendered')
  }

  const firstPill = await page.$('.category-pill')
  const pillText = firstPill ? await firstPill.text() : ''
  if (!pillText.includes('全部')) {
    throw new Error(`Expected first pill "全部", got "${pillText}"`)
  }

  log(SUITE, `Category filter renders with ${categoryPills.length} pills`)
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

  const required = ['活动名称', '活动分类', '开始时间', '结束时间', '活动地区', '活动详情']
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

async function testCategorySelectorOnCreatePage(mp) {
  const page = await mp.reLaunch('/pages/create-activity/create-activity')
  await sleep(2000)

  const categoryTags = await page.$$('.category-tag')
  if (categoryTags.length === 0) {
    throw new Error('No category tags rendered on create page')
  }

  const firstTag = categoryTags[0]
  const tagText = await firstTag.text()
  log(SUITE, `Category tag found: "${tagText}", total ${categoryTags.length} tags`)

  await firstTag.tap()
  await sleep(500)

  const activeTags = await page.$$('.category-tag-active')
  if (activeTags.length !== 1) {
    throw new Error(`Expected 1 active tag after tap, got ${activeTags.length}`)
  }

  log(SUITE, 'Category tag toggles active state on tap')

  await firstTag.tap()
  await sleep(500)

  const activeTags2 = await page.$$('.category-tag-active')
  if (activeTags2.length !== 0) {
    throw new Error(`Expected 0 active tags after second tap, got ${activeTags2.length}`)
  }

  log(SUITE, 'Category tag toggles off on second tap')
}

async function testCalendarPickerIntegration(mp) {
  const page = await mp.reLaunch('/pages/create-activity/create-activity')
  await sleep(2000)

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

async function testPhotoAlbumSectionOnDetailPage(mp) {
  const page = await mp.reLaunch('/pages/index/index')
  await sleep(2000)

  const activityCard = await page.$('activity-card')
  if (!activityCard) {
    log(SUITE, 'Skipping photo album test — no activities in list')
    return
  }

  await activityCard.tap()
  await sleep(2000)

  const page2 = await mp.currentPage()
  if (!page2.path.includes('activity-detail')) {
    log(SUITE, 'Skipping photo album test — not on detail page')
    return
  }

  const sectionHeader = await page2.$('.section-header')
  const pageData = await page2.data()

  if (sectionHeader) {
    const sectionTitle = await page2.$('.section-header .section-title')
    const titleText = sectionTitle ? await sectionTitle.text() : ''
    if (titleText.includes('活动相册')) {
      log(SUITE, `Photo album section found: ${titleText}`)
    }
  } else if (pageData.isCreator || pageData.hasJoined) {
    throw new Error('Photo album section not found for member/creator')
  } else {
    log(SUITE, 'Photo album section not rendered (user is not a member)')
  }

  const uploadBtn = await page2.$('.upload-btn')
  if (pageData.isCreator || pageData.hasJoined) {
    if (!uploadBtn) {
      throw new Error('Upload button not found for member/creator')
    }
    log(SUITE, 'Upload button visible for member/creator')
  }

  const photoGrid = await page2.$('.photo-grid')
  const photoThumbs = await page2.$$('.photo-thumb')
  if (photoGrid) {
    log(SUITE, `Photo grid renders with ${photoThumbs.length} photos`)
  } else {
    log(SUITE, 'No photo grid (no photos uploaded yet)')
  }
}

async function testActivityCardCategoryTags(mp) {
  const page = await mp.reLaunch('/pages/index/index')
  await sleep(2000)

  const activityCards = await page.$$('activity-card')
  if (activityCards.length === 0) {
    log(SUITE, 'Skipping card category test — no activity cards')
    return
  }

  let foundCategoryTag = false
  for (const card of activityCards) {
    const categoryEl = await card.$('.card-category')
    if (categoryEl) {
      foundCategoryTag = true
      break
    }
  }

  if (foundCategoryTag) {
    log(SUITE, 'Activity card category tags render')
  } else {
    log(SUITE, 'No category tags on cards (activities may not have categories)')
  }
}

module.exports = {
  name: 'Activity',
  tests: [
    { name: 'Activity list page loads', fn: testActivityListLoads },
    { name: 'Tab switching works', fn: testTabSwitching },
    { name: 'Category filter renders', fn: testCategoryFilterRenders },
    { name: 'Location filter renders', fn: testLocationFilter },
    { name: 'FAB navigates to create activity', fn: testFabButton },
    { name: 'Create activity page loads', fn: testCreateActivityPageLoads },
    { name: 'Create form has all required fields including 分类', fn: testCreateActivityFormFields },
    { name: 'Category selector toggles on create page', fn: testCategorySelectorOnCreatePage },
    { name: 'Calendar picker opens on date tap', fn: testCalendarPickerIntegration },
    { name: 'Activity detail page loads', fn: testActivityDetailPageLoads },
    { name: 'Photo album section on detail page', fn: testPhotoAlbumSectionOnDetailPage },
    { name: 'Activity card category tags', fn: testActivityCardCategoryTags }
  ]
}
