const { getMiniProgram, waitFor, waitForText, sleep, log } = require('../helper')

const SUITE = 'Onboarding'

async function testOnboardingPageLoads(mp) {
  const page = await mp.reLaunch('/pages/onboarding/onboarding')
  await sleep(3000)

  const currentPath = page.path
  log(SUITE, `Current page: ${currentPath}`)

  if (!currentPath.includes('onboarding')) {
    throw new Error(`Expected onboarding page, got ${currentPath}`)
  }

  const badge = await page.$('.step-badge')
  const badgeText = badge ? await badge.text() : ''

  if (!badgeText.includes('1/3')) {
    const pageData = await page.data()
    log(SUITE, `Page data step: ${JSON.stringify(pageData.step)}`)
    log(SUITE, `Page data keys: ${Object.keys(pageData).join(', ')}`)
    throw new Error(`Expected step badge "1/3", got "${badgeText}"`)
  }

  const title = await page.$('.step-title')
  const titleText = title ? await title.text() : ''
  if (!titleText.includes('找到我的档案')) {
    throw new Error(`Expected title "找到我的档案", got "${titleText}"`)
  }
}

async function testSearchClassmate(mp) {
  const page = await mp.currentPage()
  const searchInput = await page.$('.search-input')

  if (!searchInput) {
    throw new Error('Search input not found')
  }

  await searchInput.input('张')
  await sleep(1000)

  const listItems = await page.$$('.classmate-item')
  if (listItems.length === 0) {
    throw new Error('Expected search results for "张", got 0 items')
  }

  log(SUITE, `Search "张" returned ${listItems.length} results`)
}

async function testSelectClassmate(mp) {
  const page = await mp.currentPage()
  const firstItem = await page.$('.classmate-item:not(.item-bound)')

  if (!firstItem) {
    throw new Error('No unbound classmate found to select')
  }

  await firstItem.tap()
  await sleep(1500)

  const stepBadge = await page.$('.step-badge')
  const badgeText = stepBadge ? await stepBadge.text() : ''
  if (!badgeText.includes('2/3')) {
    throw new Error(`Expected step 2/3 after selecting classmate, got "${badgeText}"`)
  }
}

async function testProfileFormStep(mp) {
  const page = await mp.currentPage()

  const nameInput = await page.$('.form-input')
  if (!nameInput) {
    throw new Error('Name input not found on step 2')
  }

  const nameHint = await page.$('.avatar-hint')
  if (!nameHint) {
    throw new Error('Avatar chooser not found on step 2')
  }

  const nextBtn = await page.$('.btn-next')
  if (!nextBtn) {
    throw new Error('Next button not found on step 2')
  }

  await nextBtn.tap()
  await sleep(1000)

  const stepBadge = await page.$('.step-badge')
  const badgeText = stepBadge ? await stepBadge.text() : ''
  if (!badgeText.includes('3/3')) {
    throw new Error(`Expected step 3/3 after clicking next, got "${badgeText}"`)
  }
}

async function testConfirmStep(mp) {
  const page = await mp.currentPage()

  const confirmAvatar = await page.$('.confirm-avatar')
  if (!confirmAvatar) {
    throw new Error('Confirm avatar not found on step 3')
  }

  const confirmName = await page.$('.confirm-name')
  if (!confirmName) {
    throw new Error('Confirm name not found on step 3')
  }

  const completeBtn = await page.$('.btn-complete')
  if (!completeBtn) {
    throw new Error('Complete button not found on step 3')
  }
}

module.exports = {
  name: 'Onboarding',
  tests: [
    { name: 'Page loads with step 1', fn: testOnboardingPageLoads },
    { name: 'Search classmate by name', fn: testSearchClassmate },
    { name: 'Select classmate navigates to step 2', fn: testSelectClassmate },
    { name: 'Profile form step renders', fn: testProfileFormStep },
    { name: 'Confirm step renders', fn: testConfirmStep }
  ]
}
