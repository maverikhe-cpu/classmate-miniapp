const { getMiniProgram, waitFor, sleep, log } = require('../helper')

const SUITE = 'Profile'

async function testProfilePageLoads(mp) {
  const page = await mp.switchTab('/pages/profile/profile')
  await sleep(2000)

  const profileName = await page.$('.profile-name')
  if (!profileName) {
    throw new Error('Profile page did not load properly')
  }

  const nameText = await profileName.text()
  log(SUITE, `Profile name: ${nameText}`)
}

async function testEditModalOpens(mp) {
  const page = await mp.currentPage()
  const editBtn = await page.$('.menu-item')

  if (!editBtn) {
    throw new Error('Edit profile menu item not found')
  }

  await editBtn.tap()
  await sleep(1000)

  const modal = await page.$('.modal-mask')
  if (!modal) {
    throw new Error('Edit modal did not open')
  }

  const modalTitle = await page.$('.modal-title')
  const titleText = modalTitle ? await modalTitle.text() : ''
  if (!titleText.includes('编辑资料')) {
    throw new Error(`Expected modal title "编辑资料", got "${titleText}"`)
  }

  log(SUITE, 'Edit modal opens correctly')
}

async function testEditModalFormFields(mp) {
  const page = await mp.currentPage()

  const formInputs = await page.$$('.form-input')
  if (formInputs.length < 2) {
    throw new Error(`Expected at least 2 form inputs, got ${formInputs.length}`)
  }

  const pickerValues = await page.$$('.picker-value')
  if (pickerValues.length < 2) {
    throw new Error(`Expected at least 2 pickers, got ${pickerValues.length}`)
  }

  log(SUITE, `Form has ${formInputs.length} inputs and ${pickerValues.length} pickers`)
}

async function testEditModalClose(mp) {
  const page = await mp.currentPage()
  const cancelBtn = await page.$('.btn-secondary')

  if (!cancelBtn) {
    throw new Error('Cancel button not found in modal')
  }

  await cancelBtn.tap()
  await sleep(500)

  const modal = await page.$('.modal-mask')
  if (modal) {
    throw new Error('Modal did not close after clicking cancel')
  }

  log(SUITE, 'Edit modal closes on cancel')
}

module.exports = {
  name: 'Profile',
  tests: [
    { name: 'Profile page loads', fn: testProfilePageLoads },
    { name: 'Edit modal opens', fn: testEditModalOpens },
    { name: 'Form fields render', fn: testEditModalFormFields },
    { name: 'Edit modal closes on cancel', fn: testEditModalClose }
  ]
}
