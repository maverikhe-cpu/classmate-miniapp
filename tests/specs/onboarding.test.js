const { getMiniProgram, sleep, log } = require('../helper')

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
    throw new Error(`Expected step badge "1/3", got "${badgeText}"`)
  }

  const title = await page.$('.step-title')
  const titleText = title ? await title.text() : ''
  if (!titleText.includes('身份验证')) {
    throw new Error(`Expected title "身份验证", got "${titleText}"`)
  }
}

async function testStep1FormElements(mp) {
  const page = await mp.currentPage()

  const input = await page.$('.form-input')
  if (!input) {
    throw new Error('Name input not found on step 1')
  }

  const verifyBtn = await page.$('.btn-verify')
  if (!verifyBtn) {
    throw new Error('Verify button not found on step 1')
  }

  const hint = await page.$('.verify-hint-text')
  if (!hint) {
    throw new Error('Verify hint not found on step 1')
  }

  const hintText = hint ? await hint.text() : ''
  if (!hintText.includes('通讯录')) {
    throw new Error(`Expected hint about 通讯录, got "${hintText}"`)
  }

  log(SUITE, 'Step 1 form elements present (input, verify button, hint)')
}

async function testStep1NameInputAndError(mp) {
  const page = await mp.currentPage()

  const input = await page.$('.form-input')
  await input.input('不存在的名字')
  await sleep(500)

  const verifyBtn = await page.$('.btn-verify')
  await verifyBtn.tap()
  await sleep(2000)

  const errorMsg = await page.$('.error-text')
  if (!errorMsg) {
    const pageData = await page.data()
    log(SUITE, `Page data errorMessage: ${pageData.errorMessage}`)
    throw new Error('Expected error message for invalid name')
  }

  const errorText = await errorMsg.text()
  log(SUITE, `Error displayed: "${errorText}"`)
}

async function testStep2Structure(mp) {
  const page = await mp.currentPage()

  const stepBadge = await page.$('.step-badge')
  const badgeText = stepBadge ? await stepBadge.text() : ''
  if (!badgeText.includes('2/3')) {
    throw new Error(`Expected step 2/3, got "${badgeText}"`)
  }

  const matchInfo = await page.$('.match-info')
  if (!matchInfo) {
    throw new Error('Match info not found on step 2')
  }

  const avatarChooser = await page.$('.avatar-chooser')
  if (!avatarChooser) {
    throw new Error('Avatar chooser not found on step 2')
  }

  const inputs = await page.$$('.form-input')
  const disabledInput = await page.$('.form-input[disabled]')
  if (!disabledInput) {
    log(SUITE, 'Warning: name input not marked disabled')
  }

  const nextBtn = await page.$('.btn-next')
  if (!nextBtn) {
    throw new Error('Next button not found on step 2')
  }

  log(SUITE, `Step 2 structure OK: ${inputs.length} inputs, avatar chooser, match info`)
}

async function testStep3ConfirmCard(mp) {
  const page = await mp.currentPage()

  const stepBadge = await page.$('.step-badge')
  const badgeText = stepBadge ? await stepBadge.text() : ''
  if (!badgeText.includes('3/3')) {
    throw new Error(`Expected step 3/3, got "${badgeText}"`)
  }

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

  const completeText = await completeBtn.text()
  if (!completeText.includes('进入同学圈')) {
    throw new Error(`Expected "进入同学圈", got "${completeText}"`)
  }

  log(SUITE, 'Step 3 confirm card renders correctly')
}

module.exports = {
  name: 'Onboarding',
  tests: [
    { name: 'Page loads with step 1 身份验证', fn: testOnboardingPageLoads },
    { name: 'Step 1 form elements present', fn: testStep1FormElements },
    { name: 'Invalid name shows error', fn: testStep1NameInputAndError },
    { name: 'Step 2 structure after bind (needs valid match)', fn: testStep2Structure },
    { name: 'Step 3 confirm card renders', fn: testStep3ConfirmCard }
  ]
}
