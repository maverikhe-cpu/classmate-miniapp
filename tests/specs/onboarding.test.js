const { getMiniProgram, sleep, log } = require('../helper')

const SUITE = 'Onboarding'

async function testWelcomePageLoads(mp) {
  const page = await mp.reLaunch('/pages/onboarding/onboarding')
  await sleep(3000)

  const currentPath = page.path
  if (!currentPath.includes('onboarding')) {
    throw new Error(`Expected onboarding page, got ${currentPath}`)
  }

  const welcomeTitle = await page.$('.welcome-title')
  if (!welcomeTitle) {
    throw new Error('Welcome title not found on step 1')
  }

  const titleText = await welcomeTitle.text()
  if (!titleText.includes('同学圈')) {
    throw new Error(`Expected welcome title "同学圈", got "${titleText}"`)
  }

  const featureCards = await page.$$('.feature-card')
  if (featureCards.length < 3) {
    throw new Error(`Expected 3 feature cards, got ${featureCards.length}`)
  }

  const startBtn = await page.$('.btn-start')
  if (!startBtn) {
    throw new Error('Start button not found on welcome page')
  }

  log(SUITE, `Welcome page loads with ${featureCards.length} feature cards`)
}

async function testVerifyStepLoads(mp) {
  const startBtn = await (await mp.currentPage()).$('.btn-start')
  if (startBtn) {
    await startBtn.tap()
    await sleep(1000)
  }

  const page = await mp.currentPage()
  const badge = await page.$('.step-badge')
  const badgeText = badge ? await badge.text() : ''
  if (!badgeText.includes('1/3')) {
    throw new Error(`Expected step badge "1/3", got "${badgeText}"`)
  }

  const title = await page.$('.step-title')
  const titleText = title ? await title.text() : ''
  if (!titleText.includes('身份验证')) {
    throw new Error(`Expected title "身份验证", got "${titleText}"`)
  }

  const input = await page.$('.form-input')
  if (!input) {
    throw new Error('Name input not found on verify step')
  }

  const verifyBtn = await page.$('.btn-verify')
  if (!verifyBtn) {
    throw new Error('Verify button not found on verify step')
  }

  const hint = await page.$('.form-hint')
  if (!hint) {
    throw new Error('Form hint not found on verify step')
  }

  log(SUITE, 'Verify step (1/3) loads correctly with form hint')
}

async function testInvalidNameShowsError(mp) {
  const page = await mp.reLaunch('/pages/onboarding/onboarding')
  await sleep(2000)

  const startBtn = await page.$('.btn-start')
  await startBtn.tap()
  await sleep(1500)

  const page2 = await mp.currentPage()
  const input = await page2.$('.form-input')
  await input.input('不存在的名字')
  await sleep(500)

  const verifyBtn = await page2.$('.btn-verify')
  await verifyBtn.tap()
  await sleep(3000)

  const pageData = await page2.data()
  const errorMsg = await page2.$('.error-text')
  if (!errorMsg) {
    log(SUITE, `errorMessage in data: "${pageData.errorMessage}"`)
    throw new Error('Expected error message for invalid name')
  }

  const errorText = await errorMsg.text()
  log(SUITE, `Error displayed: "${errorText}"`)
}

async function testProgressIndicatorRenders(mp) {
  const page = await mp.reLaunch('/pages/onboarding/onboarding')
  await sleep(2000)

  const startBtn = await page.$('.btn-start')
  await startBtn.tap()
  await sleep(1000)

  const page2 = await mp.currentPage()
  const dots = await page2.$$('.progress-dot')
  if (dots.length < 3) {
    throw new Error(`Expected 3 progress dots, got ${dots.length}`)
  }

  const lines = await page2.$$('.progress-line')
  if (lines.length < 2) {
    throw new Error(`Expected 2 progress lines, got ${lines.length}`)
  }

  log(SUITE, `Progress indicator renders with ${dots.length} dots, ${lines.length} lines`)
}

module.exports = {
  name: 'Onboarding',
  tests: [
    { name: 'Welcome page loads with feature cards', fn: testWelcomePageLoads },
    { name: 'Verify step (1/3) loads from welcome', fn: testVerifyStepLoads },
    { name: 'Invalid name shows error', fn: testInvalidNameShowsError },
    { name: 'Progress indicator renders', fn: testProgressIndicatorRenders }
  ]
}
